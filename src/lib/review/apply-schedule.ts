import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import {
  scheduleFSRS,
  createNewFSRSCard,
  migrateFromSM2,
  extractFSRSCard,
  fsrsCardToDbColumns,
  intervalDaysFromDue,
  reviewRatingToFSRSGrade,
} from '@/lib/fsrs';
import { canAdvanceFromMicroTests, MICRO_TEST_THRESHOLD, buildMasteryHistoryRecord } from '@/lib/mastery';
import type { ReviewRating } from '@/types';
import type { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const log = createLogger('Review/Schedule');

// ============================================================================
// Unified FSRS Schedule + Mastery
// ============================================================================

export interface ApplyScheduleParams {
  supabase: SupabaseClient;
  userId: string;
  itemType: 'question' | 'card';
  /** question_id (for questions) or card_id (for cards) */
  itemId: string;
  conceptId: string;
  rating: ReviewRating;
  isCorrect: boolean;
  /** Only relevant for questions */
  confidenceLevel?: number | null;
}

export interface ScheduleResult {
  nextReviewAt: string;
  intervalDays: number;
  masteryAdvanced: boolean;
}

interface ScheduleRow {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  streak: number;
  correct_count: number;
  incorrect_count: number;
  fsrs_stability: number | null;
  fsrs_difficulty: number | null;
  fsrs_state: number | null;
  fsrs_reps: number | null;
  fsrs_lapses: number | null;
  fsrs_last_review: string | null;
  next_review_at: string;
  last_reviewed_at: string | null;
}

export async function applyScheduleAndMastery({
  supabase,
  userId,
  itemType,
  itemId,
  conceptId,
  rating,
  isCorrect,
  confidenceLevel,
}: ApplyScheduleParams): Promise<ScheduleResult> {
  const now = new Date();
  const isQuestion = itemType === 'question';
  const idColumn = isQuestion ? 'question_id' : 'card_id';

  // Fetch existing schedule row
  // Questions need SM-2 columns for lazy migration; cards only need FSRS columns
  const selectColumns = isQuestion
    ? 'ease_factor, interval_days, repetition_count, streak, correct_count, incorrect_count, ' +
      'fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_reps, fsrs_lapses, fsrs_last_review, ' +
      'next_review_at, last_reviewed_at'
    : 'fsrs_stability, fsrs_difficulty, fsrs_state, fsrs_reps, fsrs_lapses, fsrs_last_review, ' +
      'next_review_at, streak, correct_count, incorrect_count, repetition_count, ' +
      'ease_factor, interval_days, last_reviewed_at';

  const { data: rawSchedule } = await supabase
    .from(TABLES.reviewSchedule)
    .select(selectColumns)
    .eq('user_id', userId)
    .eq(idColumn, itemId)
    .single();

  const schedule = rawSchedule as unknown as ScheduleRow | null;

  // Get or create FSRS card
  let fsrsCard = schedule ? extractFSRSCard({
    ...schedule,
    next_review_at: schedule.next_review_at ?? now.toISOString(),
  }) : null;

  // Lazy migration: only for questions with SM-2 state but no FSRS state
  if (!fsrsCard && isQuestion && schedule && schedule.repetition_count > 0) {
    fsrsCard = migrateFromSM2({
      ease_factor: schedule.ease_factor,
      interval_days: schedule.interval_days,
      repetition_count: schedule.repetition_count,
      streak: schedule.streak,
      correct_count: schedule.correct_count,
      incorrect_count: schedule.incorrect_count,
      last_reviewed_at: schedule.last_reviewed_at,
    });
    log.info(`Lazy migrated SM-2 → FSRS for ${idColumn}=${itemId}`);
  }

  // If still no card (first ever review), create new
  if (!fsrsCard) {
    fsrsCard = createNewFSRSCard(now);
  }

  // Schedule with FSRS
  const grade = reviewRatingToFSRSGrade(rating);
  const result = scheduleFSRS(fsrsCard, grade, now);
  const newCard = result.card;
  const intervalDays = intervalDaysFromDue(newCard.due, now);

  // Update streak/counts
  const currentStreak = schedule?.streak ?? 0;
  const currentCorrect = schedule?.correct_count ?? 0;
  const currentIncorrect = schedule?.incorrect_count ?? 0;

  const newStreak = rating === 'wrong' ? 0 : currentStreak + 1;
  const newCorrect = isCorrect ? currentCorrect + 1 : currentCorrect;
  const newIncorrect = isCorrect ? currentIncorrect : currentIncorrect + 1;

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    [idColumn]: itemId,
    ease_factor: schedule?.ease_factor ?? 2.5,
    interval_days: intervalDays,
    repetition_count: (schedule?.repetition_count ?? 0) + 1,
    streak: newStreak,
    correct_count: newCorrect,
    incorrect_count: newIncorrect,
    ...fsrsCardToDbColumns(newCard),
    next_review_at: newCard.due.toISOString(),
    last_reviewed_at: now.toISOString(),
    last_rating: rating,
  };

  if (isQuestion && confidenceLevel != null) {
    upsertData.confidence_level = confidenceLevel;
  }

  const { error: upsertError } = await supabase
    .from(TABLES.reviewSchedule)
    .upsert(upsertData, { onConflict: `user_id,${idColumn}` });

  if (upsertError) {
    log.error(`Error upserting ${idColumn} schedule:`, upsertError);
  }

  // Mastery advancement: only for questions (micro-test 0→1 path)
  let masteryAdvanced = false;
  if (isQuestion && isCorrect) {
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
      .select('level')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    const currentLevel = parseMasteryLevel(progress?.level);

    if (canAdvanceFromMicroTests(currentLevel, totalCorrect)) {
      const { error: advanceError } = await supabase
        .from(TABLES.conceptProgress)
        .upsert(
          {
            user_id: userId,
            concept_id: conceptId,
            level: serializeMasteryLevel(1),
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
            triggerId: itemId,
          })
        );

        await enrollConceptCards(supabase, userId, conceptId);

        log.info(
          `Mastery advanced: ${conceptId} 0->1 (${totalCorrect}/${MICRO_TEST_THRESHOLD} correct micro-tests)`
        );
      }
    }
  }

  return {
    nextReviewAt: newCard.due.toISOString(),
    intervalDays,
    masteryAdvanced,
  };
}

// ============================================================================
// Auto-enrollment: create review_schedule entries for concept_cards
// ============================================================================

/**
 * Enroll all active concept_cards for a concept into review_schedule.
 * Called when a user reaches mastery >= 1 for a concept.
 * Skips cards that are already enrolled.
 */
export async function enrollConceptCards(
  supabase: SupabaseClient,
  userId: string,
  conceptId: string
) {
  const { data: cards } = await supabase
    .from(TABLES.conceptCards)
    .select('id')
    .eq('concept_id', conceptId)
    .eq('is_active', true);

  if (!cards || cards.length === 0) return;

  const { data: existing } = await supabase
    .from(TABLES.reviewSchedule)
    .select('card_id')
    .eq('user_id', userId)
    .in('card_id', cards.map(c => c.id));

  const enrolledIds = new Set((existing || []).map(e => e.card_id));
  const now = new Date().toISOString();

  const newEntries = cards
    .filter(c => !enrolledIds.has(c.id))
    .map(c => ({
      user_id: userId,
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

  if (newEntries.length === 0) return;

  const { error } = await supabase
    .from(TABLES.reviewSchedule)
    .insert(newEntries);

  if (error) {
    log.error(`Error enrolling concept cards for ${conceptId}:`, error);
  } else {
    log.info(`Enrolled ${newEntries.length} concept cards for ${conceptId}`);
  }
}
