import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { ReviewEvaluationSchema, RubricEvaluationSchema } from '@/lib/llm/schemas';
import {
  buildReviewEvaluationPrompt,
  getReviewSystemPrompt,
  buildRubricReviewPrompt,
  getRubricSystemPrompt,
  getDomainForPhase,
} from '@/lib/llm/review-prompts';
import { calculateNextReview, scoreToRating, deriveFromRubric } from '@/lib/spaced-repetition';
import { canAdvanceFromMicroTests, MICRO_TEST_THRESHOLD, buildMasteryHistoryRecord } from '@/lib/mastery';
import { getRubricForQuestionType } from '@/lib/llm/rubrics';
import type { SupportedLanguage } from '@/lib/llm/prompts';
import type { QuestionBankType } from '@/types';

/**
 * POST /api/review/submit
 * Evaluates user answer via DeepSeek with rubric-based multi-dimensional scoring.
 * Falls back to legacy v1 prompt if rubric parse fails.
 *
 * Body: { questionId: string, userAnswer: string }
 * Returns: { score, feedback, isCorrect, expectedAnswer, rating, nextReviewAt, intervalDays,
 *            dimensionScores?, reasoning?, masteryAdvanced? }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, userAnswer, confidence } = body;

    if (!questionId || !userAnswer?.trim()) {
      return NextResponse.json({ error: 'Missing questionId or userAnswer' }, { status: 400 });
    }

    // Validate optional confidence (1-3)
    const confidenceLevel: number | null =
      confidence != null && [1, 2, 3].includes(confidence) ? confidence : null;

    // Get user language
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .single();

    const language = (profile?.language || 'es') as SupportedLanguage;

    // Fetch the question with type and concept name for rubric selection
    const { data: question, error: qError } = await supabase
      .from('question_bank')
      .select('id, question_text, expected_answer, concept_id, type, concepts!concept_id(name, phase)')
      .eq('id', questionId)
      .single();

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Supabase join: concepts is object (single FK) but TS may infer array
    const conceptsData = question.concepts as unknown as
      | { name: string; phase: number }
      | { name: string; phase: number }[]
      | null;
    const conceptObj = Array.isArray(conceptsData) ? conceptsData[0] : conceptsData;
    const conceptName = conceptObj?.name || question.concept_id;
    const conceptPhase = conceptObj?.phase ?? 1;
    const questionType = question.type as QuestionBankType;

    // Try rubric-based evaluation (v2), fall back to legacy (v1) on parse failure
    let score: number;
    let feedback: string;
    let isCorrect: boolean;
    let rating: ReturnType<typeof scoreToRating>;
    let dimensionScores: Record<string, number> | undefined;
    let reasoning: string | undefined;
    let tokensUsed: number;

    const rubric = getRubricForQuestionType(questionType);
    const rubricPrompt = buildRubricReviewPrompt({
      conceptName,
      questionText: question.question_text,
      expectedAnswer: question.expected_answer,
      userAnswer,
      rubric,
      language,
    });

    const { content: rubricContent, tokensUsed: rubricTokens } = await callDeepSeek({
      messages: [
        { role: 'system', content: getRubricSystemPrompt({ language, domain: getDomainForPhase(conceptPhase, language) }) },
        { role: 'user', content: rubricPrompt },
      ],
      temperature: 0,
      maxTokens: 500,
      responseFormat: 'json',
    });
    tokensUsed = rubricTokens;

    try {
      const rubricResult = parseJsonResponse(rubricContent, RubricEvaluationSchema);
      const derived = deriveFromRubric(rubricResult.scores);

      score = derived.normalizedScore;
      feedback = rubricResult.feedback;
      isCorrect = derived.isCorrect;
      rating = derived.rating;
      dimensionScores = rubricResult.scores;
      reasoning = rubricResult.reasoning;

      console.log(
        `[Review/Submit] Rubric eval: question=${questionId}, type=${questionType}, ` +
        `scores=${JSON.stringify(rubricResult.scores)}, total=${derived.total}, rating=${rating}`
      );
    } catch (rubricParseError) {
      // Fallback to legacy v1 prompt
      console.warn(
        '[Review/Submit] Rubric parse failed, falling back to legacy prompt:',
        rubricParseError
      );

      const legacyPrompt = buildReviewEvaluationPrompt({
        questionText: question.question_text,
        expectedAnswer: question.expected_answer,
        userAnswer,
        language,
      });

      const { content: legacyContent, tokensUsed: legacyTokens } = await callDeepSeek({
        messages: [
          { role: 'system', content: getReviewSystemPrompt(language) },
          { role: 'user', content: legacyPrompt },
        ],
        temperature: 0.1,
        maxTokens: 300,
        responseFormat: 'json',
      });

      const legacyResult = parseJsonResponse(legacyContent, ReviewEvaluationSchema);
      tokensUsed += legacyTokens;

      score = legacyResult.score;
      feedback = legacyResult.feedback;
      isCorrect = legacyResult.isCorrect;
      rating = scoreToRating(legacyResult.score);
    }

    // Fetch or create review_schedule state
    const { data: schedule } = await supabase
      .from('review_schedule')
      .select('ease_factor, interval_days, repetition_count, streak, correct_count, incorrect_count')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .single();

    // Default state for questions not yet in review_schedule
    const currentState = schedule || {
      ease_factor: 2.5,
      interval_days: 0,
      repetition_count: 0,
      streak: 0,
      correct_count: 0,
      incorrect_count: 0,
    };

    // Apply SM-2 algorithm
    const result = calculateNextReview(
      {
        easeFactor: currentState.ease_factor,
        intervalDays: currentState.interval_days,
        repetitionCount: currentState.repetition_count,
        streak: currentState.streak,
        correctCount: currentState.correct_count,
        incorrectCount: currentState.incorrect_count,
      },
      rating
    );

    // Upsert review_schedule (create if not exists, update if exists)
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      question_id: questionId,
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetition_count: result.repetitionCount,
      streak: result.streak,
      correct_count: result.correctCount,
      incorrect_count: result.incorrectCount,
      next_review_at: result.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      last_rating: rating,
    };
    if (confidenceLevel !== null) {
      upsertData.confidence_level = confidenceLevel;
    }

    const { error: upsertError } = await supabase
      .from('review_schedule')
      .upsert(upsertData, { onConflict: 'user_id,question_id' });

    if (upsertError) {
      console.error('[Review/Submit] Error upserting schedule:', upsertError);
    }

    // Check micro-test mastery advancement (0->1) if answer was correct
    let masteryAdvanced = false;
    if (isCorrect) {
      // Count correct answers for this concept across all questions
      const { count: correctCount } = await supabase
        .from('review_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('correct_count', 1)
        .in(
          'question_id',
          (
            await supabase
              .from('question_bank')
              .select('id')
              .eq('concept_id', question.concept_id)
          ).data?.map((q) => q.id) || []
        );

      const totalCorrect = correctCount || 0;

      // Check current mastery level
      const { data: progress } = await supabase
        .from('concept_progress')
        .select('mastery_level')
        .eq('user_id', user.id)
        .eq('concept_id', question.concept_id)
        .single();

      const currentLevel = progress ? parseInt(progress.mastery_level, 10) : 0;

      if (canAdvanceFromMicroTests(currentLevel, totalCorrect)) {
        // Advance to level 1
        const { error: advanceError } = await supabase
          .from('concept_progress')
          .upsert(
            {
              user_id: user.id,
              concept_id: question.concept_id,
              mastery_level: '1',
            },
            { onConflict: 'user_id,concept_id' }
          );

        if (!advanceError) {
          masteryAdvanced = true;

          // Record mastery history
          await supabase.from('mastery_history').insert(
            buildMasteryHistoryRecord({
              userId: user.id,
              conceptId: question.concept_id,
              oldLevel: currentLevel,
              newLevel: 1,
              triggerType: 'micro_test',
              triggerId: questionId,
            })
          );

          console.log(
            `[Review/Submit] Mastery advanced: ${question.concept_id} 0->1 (${totalCorrect}/${MICRO_TEST_THRESHOLD} correct micro-tests)`
          );
        }
      }
    }

    console.log(
      `[Review/Submit] Question ${questionId}: score=${score}, rating=${rating}, interval=${result.intervalDays}d, tokens=${tokensUsed}`
    );

    return NextResponse.json({
      score,
      feedback,
      isCorrect,
      expectedAnswer: question.expected_answer,
      rating,
      nextReviewAt: result.nextReviewAt.toISOString(),
      intervalDays: result.intervalDays,
      masteryAdvanced,
      dimensionScores,
      reasoning,
    });
  } catch (error) {
    console.error('[Review/Submit] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate review answer' },
      { status: 500 }
    );
  }
}
