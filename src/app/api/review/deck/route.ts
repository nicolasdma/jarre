import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { parseMasteryLevel } from '@/lib/db/helpers';

const log = createLogger('Review/Deck');

interface DeckConcept {
  conceptId: string;
  conceptName: string;
  phase: number;
  masteryLevel: number;
  isUnlocked: boolean;
  totalCards: number;
  dueCards: number;
  nextDueAt: string | null;
}

/**
 * GET /api/review/deck
 * Returns deck overview: per-concept card counts, due status, and unlock state.
 */
export const GET = withAuth(async (_request, { supabase, user }) => {
  try {
    const now = new Date().toISOString();

    // Get all concepts with their phases
    const { data: concepts, error: conceptError } = await supabase
      .from(TABLES.concepts)
      .select('id, name, phase')
      .order('phase', { ascending: true });

    if (conceptError) {
      log.error('Error fetching concepts:', conceptError);
      return NextResponse.json({ error: 'Failed to fetch concepts' }, { status: 500 });
    }

    // Get user's mastery levels
    const { data: progressRows } = await supabase
      .from(TABLES.conceptProgress)
      .select('concept_id, level')
      .eq('user_id', user.id);

    const masteryMap = new Map<string, number>();
    for (const row of (progressRows || [])) {
      masteryMap.set(row.concept_id, parseMasteryLevel(row.level));
    }

    // Count total cards per concept (both question_bank + concept_cards in review_schedule)
    // We need to do two queries: one for question_bank and one for concept_cards
    const { data: questionSchedules } = await supabase
      .from(TABLES.reviewSchedule)
      .select('question_id, next_review_at, question_bank!inner(concept_id)')
      .eq('user_id', user.id)
      .not('question_id', 'is', null);

    const { data: cardSchedules } = await supabase
      .from(TABLES.reviewSchedule)
      .select('card_id, next_review_at, concept_cards!inner(concept_id)')
      .eq('user_id', user.id)
      .not('card_id', 'is', null);

    // Build per-concept counts
    const conceptStats = new Map<string, { total: number; due: number; nextDue: string | null }>();

    for (const row of (questionSchedules || [])) {
      const conceptId = (row.question_bank as any).concept_id;
      const stats = conceptStats.get(conceptId) || { total: 0, due: 0, nextDue: null };
      stats.total++;
      if (row.next_review_at && row.next_review_at <= now) {
        stats.due++;
      }
      if (row.next_review_at && (!stats.nextDue || row.next_review_at < stats.nextDue)) {
        stats.nextDue = row.next_review_at;
      }
      conceptStats.set(conceptId, stats);
    }

    for (const row of (cardSchedules || [])) {
      const conceptId = (row.concept_cards as any).concept_id;
      const stats = conceptStats.get(conceptId) || { total: 0, due: 0, nextDue: null };
      stats.total++;
      if (row.next_review_at && row.next_review_at <= now) {
        stats.due++;
      }
      if (row.next_review_at && (!stats.nextDue || row.next_review_at < stats.nextDue)) {
        stats.nextDue = row.next_review_at;
      }
      conceptStats.set(conceptId, stats);
    }

    // Build response
    const deck: DeckConcept[] = (concepts || []).map(c => {
      const mastery = masteryMap.get(c.id) ?? 0;
      const stats = conceptStats.get(c.id) || { total: 0, due: 0, nextDue: null };
      return {
        conceptId: c.id,
        conceptName: c.name,
        phase: c.phase,
        masteryLevel: mastery,
        isUnlocked: mastery >= 1,
        totalCards: stats.total,
        dueCards: stats.due,
        nextDueAt: stats.nextDue,
      };
    });

    // Global stats
    const totalUnlocked = deck.filter(d => d.isUnlocked).length;
    const totalDue = deck.reduce((sum, d) => sum + d.dueCards, 0);
    const totalCards = deck.reduce((sum, d) => sum + d.totalCards, 0);

    return NextResponse.json({
      deck,
      stats: { totalUnlocked, totalDue, totalCards, totalConcepts: deck.length },
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
});
