import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { ReviewEvaluationSchema } from '@/lib/llm/schemas';
import { buildReviewEvaluationPrompt, getReviewSystemPrompt } from '@/lib/llm/review-prompts';
import { calculateNextReview, scoreToRating } from '@/lib/spaced-repetition';
import { canAdvanceFromMicroTests, MICRO_TEST_THRESHOLD, buildMasteryHistoryRecord } from '@/lib/mastery';
import type { SupportedLanguage } from '@/lib/llm/prompts';

/**
 * POST /api/review/submit
 * Evaluates user answer via DeepSeek, applies SM-2, updates review_schedule.
 *
 * Body: { questionId: string, userAnswer: string }
 * Returns: { score, feedback, isCorrect, expectedAnswer, rating, nextReviewAt, intervalDays }
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
    const { questionId, userAnswer } = body;

    if (!questionId || !userAnswer?.trim()) {
      return NextResponse.json({ error: 'Missing questionId or userAnswer' }, { status: 400 });
    }

    // Get user language
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .single();

    const language = (profile?.language || 'es') as SupportedLanguage;

    // Fetch the question from question_bank
    const { data: question, error: qError } = await supabase
      .from('question_bank')
      .select('id, question_text, expected_answer, concept_id')
      .eq('id', questionId)
      .single();

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Call DeepSeek to evaluate the answer
    const prompt = buildReviewEvaluationPrompt({
      questionText: question.question_text,
      expectedAnswer: question.expected_answer,
      userAnswer,
      language,
    });

    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: getReviewSystemPrompt(language) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      maxTokens: 300,
      responseFormat: 'json',
    });

    const evaluation = parseJsonResponse(content, ReviewEvaluationSchema);
    const rating = scoreToRating(evaluation.score);

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
    const { error: upsertError } = await supabase
      .from('review_schedule')
      .upsert({
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
      }, { onConflict: 'user_id,question_id' });

    if (upsertError) {
      console.error('[Review/Submit] Error upserting schedule:', upsertError);
    }

    // Check micro-test mastery advancement (0→1) if answer was correct
    let masteryAdvanced = false;
    if (evaluation.isCorrect) {
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
            `[Review/Submit] Mastery advanced: ${question.concept_id} 0→1 (${totalCorrect}/${MICRO_TEST_THRESHOLD} correct micro-tests)`
          );
        }
      }
    }

    console.log(
      `[Review/Submit] Question ${questionId}: score=${evaluation.score}, rating=${rating}, interval=${result.intervalDays}d, tokens=${tokensUsed}`
    );

    return NextResponse.json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      isCorrect: evaluation.isCorrect,
      expectedAnswer: question.expected_answer,
      rating,
      nextReviewAt: result.nextReviewAt.toISOString(),
      intervalDays: result.intervalDays,
      masteryAdvanced,
    });
  } catch (error) {
    console.error('[Review/Submit] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate review answer' },
      { status: 500 }
    );
  }
}
