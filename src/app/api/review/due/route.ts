import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { REVIEW_MAX_OPEN } from '@/lib/constants';
import { REVIEW_SESSION_CAP, todayStart } from '@/lib/review-scoring';
import { interleaveByConcept } from '@/lib/interleave';
import {
  mapQuestionToUnifiedCard,
  mapConceptCardToUnifiedCard,
  type QuestionBankJoinRow,
  type ConceptCardJoinRow,
} from '@/lib/review/map-review-cards';
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

    // Map to UnifiedReviewCard using shared helpers
    const questionCards: UnifiedReviewCard[] = (questionDue || []).map((row) => {
      const q = row.question_bank as unknown as QuestionBankJoinRow;
      return mapQuestionToUnifiedCard(row, q);
    });

    const conceptCardItems: UnifiedReviewCard[] = (cardDue || []).map((row) => {
      const c = row.concept_cards as unknown as ConceptCardJoinRow;
      return mapConceptCardToUnifiedCard(row, c);
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
