import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { getUserLanguage } from '@/lib/db/queries/user';
import { extractConceptData, parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import { createLogger } from '@/lib/logger';
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
import { awardXP } from '@/lib/xp';
import { XP_REWARDS } from '@/lib/constants';
import { logTokenUsage } from '@/lib/db/token-usage';
import type { QuestionBankType, ReviewRating } from '@/types';
import type { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const log = createLogger('Review/Submit');

/**
 * POST /api/review/submit
 * Evaluates user answer. Two paths:
 * - MC/TF: deterministic grading (no LLM call), instant feedback
 * - Open: rubric-based DeepSeek evaluation with legacy fallback
 *
 * Body: { questionId: string, userAnswer?: string, selectedAnswer?: string, confidence?: number }
 * Returns: { score, feedback, isCorrect, expectedAnswer, rating, nextReviewAt, intervalDays,
 *            dimensionScores?, reasoning?, masteryAdvanced? }
 */
export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { questionId, userAnswer, selectedAnswer, confidence } = body;

    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
    }

    // Validate optional confidence (1-3)
    const confidenceLevel: number | null =
      confidence != null && [1, 2, 3].includes(confidence) ? confidence : null;

    // Fetch the question with format + grading fields
    const { data: question, error: qError } = await supabase
      .from(TABLES.questionBank)
      .select('id, question_text, expected_answer, concept_id, type, format, correct_answer, explanation, options, concepts!concept_id(name, phase)')
      .eq('id', questionId)
      .single();

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const conceptData = extractConceptData(question.concepts);
    const conceptName = conceptData?.name || question.concept_id;
    const conceptPhase = conceptData?.phase ?? 1;
    const questionType = question.type as QuestionBankType;
    const format = (question.format as string) || 'open';

    // ========================================================================
    // MC/TF: Deterministic grading — no DeepSeek call
    // ========================================================================
    if (format === 'mc' || format === 'tf') {
      if (!selectedAnswer) {
        return NextResponse.json({ error: 'Missing selectedAnswer for MC/TF question' }, { status: 400 });
      }

      const isCorrect = selectedAnswer === question.correct_answer;
      const rating: ReviewRating = isCorrect ? 'easy' : 'wrong';
      const score = isCorrect ? 100 : 0;
      const feedback = question.explanation || '';

      // SM-2 update
      const smResult = await applySM2AndMastery({
        supabase,
        userId: user.id,
        questionId,
        conceptId: question.concept_id,
        rating,
        isCorrect,
        confidenceLevel,
      });

      log.info(
        `MC/TF: question=${questionId}, format=${format}, correct=${isCorrect}, interval=${smResult.intervalDays}d`
      );

      // Award XP (fire-and-forget)
      let xpResult = null;
      if (isCorrect) {
        xpResult = await awardXP(supabase, user.id, XP_REWARDS.REVIEW_CORRECT, 'review_correct', questionId);
        if (smResult.masteryAdvanced) {
          await awardXP(supabase, user.id, XP_REWARDS.MASTERY_ADVANCE, 'mastery_advance', question.concept_id);
        }
      }

      return NextResponse.json({
        score,
        feedback,
        isCorrect,
        expectedAnswer: question.correct_answer,
        rating,
        nextReviewAt: smResult.nextReviewAt,
        intervalDays: smResult.intervalDays,
        masteryAdvanced: smResult.masteryAdvanced,
        xp: xpResult,
      });
    }

    // ========================================================================
    // Open: DeepSeek rubric evaluation (existing flow)
    // ========================================================================
    if (!userAnswer?.trim()) {
      return NextResponse.json({ error: 'Missing userAnswer for open question' }, { status: 400 });
    }

    // Get user language
    const language = await getUserLanguage(supabase, user.id);

    let score: number;
    let feedback: string;
    let isCorrect: boolean;
    let rating: ReviewRating;
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

      log.info(
        `Rubric eval: question=${questionId}, type=${questionType}, ` +
        `scores=${JSON.stringify(rubricResult.scores)}, total=${derived.total}, rating=${rating}`
      );
    } catch (rubricParseError) {
      log.warn('Rubric parse failed, falling back to legacy prompt:', rubricParseError);

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

    // SM-2 update + mastery check
    const smResult = await applySM2AndMastery({
      supabase,
      userId: user.id,
      questionId,
      conceptId: question.concept_id,
      rating,
      isCorrect,
      confidenceLevel,
    });

    logTokenUsage({ userId: user.id, category: 'review', tokens: tokensUsed });

    log.info(
      `Open: question=${questionId}, score=${score}, rating=${rating}, interval=${smResult.intervalDays}d, tokens=${tokensUsed}`
    );

    // Award XP (fire-and-forget)
    let xpResult = null;
    if (isCorrect) {
      xpResult = await awardXP(supabase, user.id, XP_REWARDS.REVIEW_CORRECT_OPEN, 'review_correct_open', questionId);
      if (smResult.masteryAdvanced) {
        await awardXP(supabase, user.id, XP_REWARDS.MASTERY_ADVANCE, 'mastery_advance', question.concept_id);
      }
    }

    return NextResponse.json({
      score,
      feedback,
      isCorrect,
      expectedAnswer: question.expected_answer,
      rating,
      nextReviewAt: smResult.nextReviewAt,
      intervalDays: smResult.intervalDays,
      masteryAdvanced: smResult.masteryAdvanced,
      dimensionScores,
      reasoning,
      xp: xpResult,
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate review answer' },
      { status: 500 }
    );
  }
});

// ============================================================================
// Shared SM-2 + Mastery Logic (extracted to avoid duplication between paths)
// ============================================================================

interface SM2Params {
  supabase: SupabaseClient;
  userId: string;
  questionId: string;
  conceptId: string;
  rating: ReviewRating;
  isCorrect: boolean;
  confidenceLevel: number | null;
}

async function applySM2AndMastery({
  supabase,
  userId,
  questionId,
  conceptId,
  rating,
  isCorrect,
  confidenceLevel,
}: SM2Params) {
  // Fetch or create review_schedule state
  const { data: schedule } = await supabase
    .from(TABLES.reviewSchedule)
    .select('ease_factor, interval_days, repetition_count, streak, correct_count, incorrect_count')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single();

  const currentState = schedule || {
    ease_factor: 2.5,
    interval_days: 0,
    repetition_count: 0,
    streak: 0,
    correct_count: 0,
    incorrect_count: 0,
  };

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

  const upsertData: Record<string, unknown> = {
    user_id: userId,
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
    .from(TABLES.reviewSchedule)
    .upsert(upsertData, { onConflict: 'user_id,question_id' });

  if (upsertError) {
    log.error('Error upserting schedule:', upsertError);
  }

  // Check micro-test mastery advancement (0->1) if answer was correct
  let masteryAdvanced = false;
  if (isCorrect) {
    const { count: correctCount } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('correct_count', 1)
      .in(
        'question_id',
        (
          await supabase
            .from(TABLES.questionBank)
            .select('id')
            .eq('concept_id', conceptId)
        ).data?.map((q) => q.id) || []
      );

    const totalCorrect = correctCount || 0;

    const { data: progress } = await supabase
      .from(TABLES.conceptProgress)
      .select('mastery_level')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    const currentLevel = parseMasteryLevel(progress?.mastery_level);

    if (canAdvanceFromMicroTests(currentLevel, totalCorrect)) {
      const { error: advanceError } = await supabase
        .from(TABLES.conceptProgress)
        .upsert(
          {
            user_id: userId,
            concept_id: conceptId,
            mastery_level: serializeMasteryLevel(1),
          },
          { onConflict: 'user_id,concept_id' }
        );

      if (!advanceError) {
        masteryAdvanced = true;

        await supabase.from(TABLES.masteryHistory).insert(
          buildMasteryHistoryRecord({
            userId,
            conceptId,
            oldLevel: currentLevel,
            newLevel: 1,
            triggerType: 'micro_test',
            triggerId: questionId,
          })
        );

        log.info(
          `Mastery advanced: ${conceptId} 0->1 (${totalCorrect}/${MICRO_TEST_THRESHOLD} correct micro-tests)`
        );
      }
    }
  }

  return {
    nextReviewAt: result.nextReviewAt.toISOString(),
    intervalDays: result.intervalDays,
    masteryAdvanced,
  };
}
