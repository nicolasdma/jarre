import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { REVIEW_MAX_OPEN } from '@/lib/constants';
import { REVIEW_SESSION_CAP, todayStart } from '@/lib/spaced-repetition';
import { interleaveByConcept } from '@/lib/interleave';
import type { ReviewCard, QuestionBankType } from '@/types';

const log = createLogger('Review/Due');

/**
 * GET /api/review/due
 * Returns up to REVIEW_SESSION_CAP cards that are due for review.
 * Applies format mixing (max 3 open + rest MC/TF) and concept interleaving.
 */
export const GET = withAuth(async (_request, { supabase, user }) => {
  try {
    const now = new Date().toISOString();

    // Daily cap: check how many cards were already reviewed today
    const { count: reviewedToday } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_reviewed_at', todayStart());

    const dailyRemaining = Math.max(0, REVIEW_SESSION_CAP - (reviewedToday || 0));

    if (dailyRemaining === 0) {
      return NextResponse.json({ cards: [], total: 0 });
    }

    // Fetch more than dailyRemaining so we can apply format mixing
    const fetchLimit = dailyRemaining * 3;

    const { data: dueCards, error } = await supabase
      .from(TABLES.reviewSchedule)
      .select(`
        id,
        question_id,
        streak,
        repetition_count,
        next_review_at,
        question_bank!inner (
          id,
          concept_id,
          question_text,
          type,
          difficulty,
          format,
          options,
          correct_answer,
          explanation,
          expected_answer,
          concepts!concept_id (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })
      .limit(fetchLimit);

    if (error) {
      log.error('Error fetching due cards:', error);
      return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
    }

    // Map to ReviewCard format
    const allCards: ReviewCard[] = (dueCards || []).map((card) => {
      const question = card.question_bank as unknown as {
        id: string;
        concept_id: string;
        question_text: string;
        type: string;
        difficulty: number;
        format: string;
        options: { label: string; text: string }[] | null;
        correct_answer: string | null;
        explanation: string | null;
        expected_answer: string | null;
        concepts: { name: string };
      };

      return {
        questionId: question.id,
        conceptId: question.concept_id,
        conceptName: question.concepts.name,
        questionText: question.question_text,
        type: question.type as QuestionBankType,
        format: question.format as 'open' | 'mc' | 'tf',
        difficulty: question.difficulty as 1 | 2 | 3,
        streak: card.streak,
        repetitionCount: card.repetition_count,
        ...(question.options && { options: question.options }),
        ...(question.correct_answer && { correctAnswer: question.correct_answer }),
        ...(question.explanation && { explanation: question.explanation }),
      };
    });

    // Apply format mixing: max REVIEW_MAX_OPEN open + fill rest with MC/TF
    const openCards = allCards.filter((c) => c.format === 'open');
    const closedCards = allCards.filter((c) => c.format === 'mc' || c.format === 'tf');

    const maxOpen = Math.min(REVIEW_MAX_OPEN, dailyRemaining);
    const selectedOpen = openCards.slice(0, maxOpen);
    const remainingSlots = dailyRemaining - selectedOpen.length;
    const selectedClosed = closedCards.slice(0, remainingSlots);

    // If not enough MC/TF, backfill with more open
    let mixed = [...selectedOpen, ...selectedClosed];
    if (mixed.length < dailyRemaining) {
      const additionalOpen = openCards.slice(maxOpen, maxOpen + (dailyRemaining - mixed.length));
      mixed = [...mixed, ...additionalOpen];
    }

    // Apply concept interleaving
    const cards = interleaveByConcept(mixed);

    return NextResponse.json({ cards, total: cards.length });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
});
