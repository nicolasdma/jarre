import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { ReviewEvaluationSchema } from '@/lib/llm/schemas';
import { buildReviewEvaluationPrompt, getReviewSystemPrompt } from '@/lib/llm/review-prompts';
import { calculateNextReview, scoreToRating } from '@/lib/spaced-repetition';
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

    // Fetch current review_schedule state
    const { data: schedule, error: sError } = await supabase
      .from('review_schedule')
      .select('ease_factor, interval_days, repetition_count, streak, correct_count, incorrect_count')
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .single();

    if (sError || !schedule) {
      console.error('[Review/Submit] Schedule not found for question:', questionId);
      return NextResponse.json({ error: 'Review schedule not found' }, { status: 404 });
    }

    // Apply SM-2 algorithm
    const result = calculateNextReview(
      {
        easeFactor: schedule.ease_factor,
        intervalDays: schedule.interval_days,
        repetitionCount: schedule.repetition_count,
        streak: schedule.streak,
        correctCount: schedule.correct_count,
        incorrectCount: schedule.incorrect_count,
      },
      rating
    );

    // Update review_schedule
    const { error: updateError } = await supabase
      .from('review_schedule')
      .update({
        ease_factor: result.easeFactor,
        interval_days: result.intervalDays,
        repetition_count: result.repetitionCount,
        streak: result.streak,
        correct_count: result.correctCount,
        incorrect_count: result.incorrectCount,
        next_review_at: result.nextReviewAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        last_rating: rating,
      })
      .eq('user_id', user.id)
      .eq('question_id', questionId);

    if (updateError) {
      console.error('[Review/Submit] Error updating schedule:', updateError);
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
    });
  } catch (error) {
    console.error('[Review/Submit] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate review answer' },
      { status: 500 }
    );
  }
}
