import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { parseMasteryLevel } from '@/lib/db/helpers';
import { createLogger } from '@/lib/logger';

const log = createLogger('Review/Enroll');

/**
 * POST /api/review/enroll
 * Retroactively enrolls concept_cards into review_schedule
 * for all concepts where the user has mastery >= 1.
 * Safe to call multiple times (skips already enrolled cards).
 */
export const POST = withAuth(async (_request, { supabase, user }) => {
  try {
    // Get all concepts with mastery >= 1
    const { data: progressRows } = await supabase
      .from(TABLES.conceptProgress)
      .select('concept_id, level')
      .eq('user_id', user.id);

    const unlockedConceptIds = (progressRows || [])
      .filter(row => parseMasteryLevel(row.level) >= 1)
      .map(row => row.concept_id);

    if (unlockedConceptIds.length === 0) {
      return NextResponse.json({ enrolled: 0, message: 'No unlocked concepts' });
    }

    // Get all active concept cards for unlocked concepts
    const { data: cards } = await supabase
      .from(TABLES.conceptCards)
      .select('id, concept_id')
      .in('concept_id', unlockedConceptIds)
      .eq('is_active', true);

    if (!cards || cards.length === 0) {
      return NextResponse.json({ enrolled: 0, message: 'No concept cards to enroll' });
    }

    // Get already enrolled card IDs
    const { data: existing } = await supabase
      .from(TABLES.reviewSchedule)
      .select('card_id')
      .eq('user_id', user.id)
      .not('card_id', 'is', null);

    const enrolledIds = new Set((existing || []).map(e => e.card_id));
    const now = new Date().toISOString();

    const newEntries = cards
      .filter(c => !enrolledIds.has(c.id))
      .map(c => ({
        user_id: user.id,
        card_id: c.id,
        ease_factor: 2.5,
        interval_days: 0,
        repetition_count: 0,
        streak: 0,
        correct_count: 0,
        incorrect_count: 0,
        next_review_at: now,
        fsrs_state: 0,
        fsrs_reps: 0,
        fsrs_lapses: 0,
      }));

    if (newEntries.length === 0) {
      return NextResponse.json({ enrolled: 0, message: 'All cards already enrolled' });
    }

    // Insert in batches of 50
    let totalEnrolled = 0;
    for (let i = 0; i < newEntries.length; i += 50) {
      const batch = newEntries.slice(i, i + 50);
      const { error } = await supabase
        .from(TABLES.reviewSchedule)
        .insert(batch);

      if (error) {
        log.error(`Error enrolling batch ${i / 50 + 1}:`, error);
      } else {
        totalEnrolled += batch.length;
      }
    }

    log.info(`Retroactively enrolled ${totalEnrolled} concept cards for ${unlockedConceptIds.length} concepts`);

    return NextResponse.json({
      enrolled: totalEnrolled,
      concepts: unlockedConceptIds.length,
      message: `Enrolled ${totalEnrolled} concept cards`,
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to enroll cards' },
      { status: 500 }
    );
  }
});
