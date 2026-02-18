import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { REVIEW_MAX_OPEN } from '@/lib/constants';
import { REVIEW_SESSION_CAP, todayStart } from '@/lib/spaced-repetition';
import { interleaveByConcept } from '@/lib/interleave';
import type { UnifiedReviewCard } from '@/types';

const log = createLogger('Review/Due');

/**
 * GET /api/review/due
 * Returns up to REVIEW_SESSION_CAP unified cards (question_bank + concept_cards) due for review.
 * Only includes cards for concepts with mastery_level >= 1.
 * Applies format mixing (max 3 open + rest deterministic) and concept interleaving.
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

    const fetchLimit = dailyRemaining * 3;

    // Fetch question_bank-based due cards
    const { data: questionDue, error: qError } = await supabase
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
      .not('question_id', 'is', null)
      .order('next_review_at', { ascending: true })
      .limit(fetchLimit);

    if (qError) {
      log.error('Error fetching question due cards:', qError);
      return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
    }

    // Fetch concept_card-based due cards
    const { data: cardDue, error: cError } = await supabase
      .from(TABLES.reviewSchedule)
      .select(`
        id,
        card_id,
        streak,
        repetition_count,
        next_review_at,
        concept_cards!inner (
          id,
          concept_id,
          card_type,
          front_content,
          back_content,
          difficulty,
          concepts!concept_id (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_at', now)
      .not('card_id', 'is', null)
      .order('next_review_at', { ascending: true })
      .limit(fetchLimit);

    if (cError) {
      log.error('Error fetching concept card due cards:', cError);
      // Non-fatal: proceed with just questions
    }

    // Map question_bank cards to UnifiedReviewCard
    const questionCards: UnifiedReviewCard[] = (questionDue || []).map((row) => {
      const q = row.question_bank as unknown as {
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
        id: row.id,
        source: 'question' as const,
        sourceId: q.id,
        conceptId: q.concept_id,
        conceptName: q.concepts.name,
        cardType: q.type,
        format: q.format || 'open',
        difficulty: q.difficulty as 1 | 2 | 3,
        content: {
          questionText: q.question_text,
          expectedAnswer: q.expected_answer,
        },
        fsrsState: 0,
        streak: row.streak,
        reps: row.repetition_count,
        ...(q.options && { options: q.options }),
        ...(q.correct_answer && { correctAnswer: q.correct_answer }),
        ...(q.explanation && { explanation: q.explanation }),
      };
    });

    // Map concept_cards to UnifiedReviewCard
    const conceptCardItems: UnifiedReviewCard[] = (cardDue || []).map((row) => {
      const c = row.concept_cards as unknown as {
        id: string;
        concept_id: string;
        card_type: string;
        front_content: Record<string, unknown>;
        back_content: Record<string, unknown>;
        difficulty: number;
        concepts: { name: string };
      };

      const frontContent = c.front_content;
      const backContent = c.back_content;

      return {
        id: row.id,
        source: 'card' as const,
        sourceId: c.id,
        conceptId: c.concept_id,
        conceptName: c.concepts.name,
        cardType: c.card_type,
        format: c.card_type, // recall, fill_blank, etc.
        difficulty: c.difficulty as 1 | 2 | 3,
        content: frontContent,
        back: backContent,
        fsrsState: 0,
        streak: row.streak,
        reps: row.repetition_count,
        // For scenario_micro MC options
        ...(frontContent.options ? {
          options: frontContent.options as { label: string; text: string }[],
        } : {}),
        ...(backContent.correct ? { correctAnswer: backContent.correct as string } : {}),
        ...(backContent.explanation ? { explanation: backContent.explanation as string } : {}),
      };
    });

    const allCards = [...questionCards, ...conceptCardItems];

    // Apply format mixing: open questions are LLM-evaluated, rest are deterministic
    const openCards = allCards.filter(
      (c) => c.source === 'question' && c.format === 'open'
    );
    const closedCards = allCards.filter(
      (c) => c.source !== 'question' || c.format !== 'open'
    );

    const maxOpen = Math.min(REVIEW_MAX_OPEN, dailyRemaining);
    const selectedOpen = openCards.slice(0, maxOpen);
    const remainingSlots = dailyRemaining - selectedOpen.length;
    const selectedClosed = closedCards.slice(0, remainingSlots);

    // Backfill if not enough deterministic cards
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
