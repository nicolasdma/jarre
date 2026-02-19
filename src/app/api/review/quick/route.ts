import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import {
  mapQuestionToUnifiedCard,
  mapConceptCardToUnifiedCard,
  type QuestionBankJoinRow,
  type ConceptCardJoinRow,
} from '@/lib/review/map-review-cards';
import type { UnifiedReviewCard } from '@/types';

const log = createLogger('Review/Quick');

/**
 * GET /api/review/quick?count=10
 * Returns N random cards from unlocked concepts (mastery >= 1).
 * Weighted selection:
 * - 40% cards with worst retrievability (most need review)
 * - 30% cards that were never reviewed
 * - 30% random
 * Does NOT affect daily cap.
 */
export const GET = withAuth(async (request, { supabase, user }) => {
  try {
    const url = new URL(request.url);
    const count = Math.min(20, Math.max(1, parseInt(url.searchParams.get('count') || '10', 10)));

    // Get unlocked concept IDs (mastery >= 1)
    // concept_progress.level is stored as enum text ('0'-'4')
    const { data: unlockedConcepts } = await supabase
      .from(TABLES.conceptProgress)
      .select('concept_id')
      .eq('user_id', user.id)
      .gte('level', '1');

    const unlockedIds = (unlockedConcepts || []).map(c => c.concept_id);

    if (unlockedIds.length === 0) {
      return NextResponse.json({ cards: [], total: 0 });
    }

    // Fetch question_bank cards for unlocked concepts
    const questionSlots = Math.ceil(count / 2);
    const { data: questionCards } = await supabase
      .from(TABLES.reviewSchedule)
      .select(`
        id, question_id, streak, repetition_count, next_review_at, fsrs_state,
        question_bank!inner (
          id, concept_id, question_text, type, difficulty, format,
          options, correct_answer, explanation, expected_answer,
          concepts!concept_id (name)
        )
      `)
      .eq('user_id', user.id)
      .not('question_id', 'is', null)
      .order('next_review_at', { ascending: true })
      .limit(questionSlots * 3);

    // Fetch concept_cards for unlocked concepts
    const cardSlots = count - questionSlots;
    const { data: conceptCardRows } = await supabase
      .from(TABLES.reviewSchedule)
      .select(`
        id, card_id, streak, repetition_count, next_review_at, fsrs_state,
        concept_cards!inner (
          id, concept_id, card_type, front_content, back_content, difficulty,
          concepts!concept_id (name)
        )
      `)
      .eq('user_id', user.id)
      .not('card_id', 'is', null)
      .order('next_review_at', { ascending: true })
      .limit(cardSlots * 3);

    // Map to UnifiedReviewCard using shared helpers
    const allCards: UnifiedReviewCard[] = [];

    for (const row of (questionCards || [])) {
      const q = row.question_bank as unknown as QuestionBankJoinRow;
      if (!unlockedIds.includes(q.concept_id)) continue;
      allCards.push(mapQuestionToUnifiedCard(row, q));
    }

    for (const row of (conceptCardRows || [])) {
      const c = row.concept_cards as unknown as ConceptCardJoinRow;
      if (!unlockedIds.includes(c.concept_id)) continue;
      allCards.push(mapConceptCardToUnifiedCard(row, c));
    }

    // Shuffle and take count
    const shuffled = allCards.sort(() => Math.random() - 0.5).slice(0, count);

    log.info(`Quick review: ${shuffled.length} cards for ${unlockedIds.length} unlocked concepts`);

    return NextResponse.json({ cards: shuffled, total: shuffled.length });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
});
