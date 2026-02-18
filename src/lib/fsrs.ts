/**
 * Jarre - FSRS Spaced Repetition Engine
 *
 * Wrapper over ts-fsrs (Free Spaced Repetition Scheduler).
 * FSRS is 20-30% more efficient than SM-2 at optimal scheduling.
 *
 * Rating mapping:
 * - Again (1): Complete failure, reset
 * - Hard (2): Recalled with significant difficulty
 * - Good (3): Recalled with some effort
 * - Easy (4): Recalled effortlessly
 */

import {
  createEmptyCard,
  fsrs,
  Rating,
  type Card as FSRSCard,
  type Grade,
  type RecordLogItem,
} from 'ts-fsrs';
import { FSRS_DESIRED_RETENTION } from '@/lib/constants';
import type { ReviewRating } from '@/types';

// ============================================================================
// FSRS Instance (singleton)
// ============================================================================

const scheduler = fsrs({
  request_retention: FSRS_DESIRED_RETENTION,
  maximum_interval: 180,
});

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Schedule a card review using FSRS algorithm.
 * Returns the new card state and the scheduled log.
 */
export function scheduleFSRS(
  card: FSRSCard,
  rating: Grade,
  now: Date = new Date()
): RecordLogItem {
  const result = scheduler.repeat(card, now);
  return result[rating];
}

/**
 * Create a new empty FSRS card (for first-time reviews).
 */
export function createNewFSRSCard(now: Date = new Date()): FSRSCard {
  return createEmptyCard(now);
}

/**
 * Get all scheduling options for a card (for preview in rating bar).
 * Returns an object with Again/Hard/Good/Easy results.
 */
export function previewSchedule(
  card: FSRSCard,
  now: Date = new Date()
): Record<'again' | 'hard' | 'good' | 'easy', RecordLogItem> {
  const result = scheduler.repeat(card, now);
  return {
    again: result[Rating.Again],
    hard: result[Rating.Hard],
    good: result[Rating.Good],
    easy: result[Rating.Easy],
  };
}

// ============================================================================
// Rating Conversion
// ============================================================================

/**
 * Map a numeric score (0-100) to an FSRS Rating.
 *
 * - score >= 90 → Easy (4)
 * - score >= 70 → Good (3)
 * - score >= 50 → Hard (2)
 * - score < 50  → Again (1)
 */
export function scoreToFSRSRating(score: number): Grade {
  if (score >= 90) return Rating.Easy;
  if (score >= 70) return Rating.Good;
  if (score >= 50) return Rating.Hard;
  return Rating.Again;
}

/**
 * Map ReviewRating to FSRS Grade.
 */
export function reviewRatingToFSRSGrade(rating: ReviewRating): Grade {
  switch (rating) {
    case 'easy': return Rating.Easy;
    case 'good': return Rating.Good;
    case 'hard': return Rating.Hard;
    case 'wrong': return Rating.Again;
  }
}

/**
 * Map FSRS Grade to ReviewRating.
 */
export function fsrsGradeToReviewRating(grade: Grade): ReviewRating {
  switch (grade) {
    case Rating.Easy: return 'easy';
    case Rating.Good: return 'good';
    case Rating.Hard: return 'hard';
    case Rating.Again: return 'wrong';
    default: return 'wrong';
  }
}

// ============================================================================
// Lazy Migration from SM-2
// ============================================================================

interface SM2Row {
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  streak: number;
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at: string | null;
}

/**
 * Convert existing SM-2 state to an approximate FSRS card.
 * Used for lazy migration — called once per card on first FSRS review.
 *
 * Mapping heuristics:
 * - stability ≈ interval_days (how long memory lasts)
 * - difficulty ≈ inverse of ease_factor (normalized 0-10)
 * - state: 0=New, 2=Review (if has reviews)
 * - reps/lapses from SM-2 counters
 */
export function migrateFromSM2(row: SM2Row): FSRSCard {
  const card = createEmptyCard(
    row.last_reviewed_at ? new Date(row.last_reviewed_at) : new Date()
  );

  if (row.repetition_count === 0) {
    return card;
  }

  // Map ease_factor (1.3–2.5) to difficulty (1–10, inverse)
  // ease 2.5 → diff ~1, ease 1.3 → diff ~10
  const normalizedEase = (row.ease_factor - 1.3) / (2.5 - 1.3); // 0-1
  const difficulty = Math.max(1, Math.min(10, 10 - normalizedEase * 9));

  return {
    ...card,
    stability: Math.max(1, row.interval_days),
    difficulty,
    state: 2, // Review state
    reps: row.repetition_count,
    lapses: row.incorrect_count,
    last_review: row.last_reviewed_at ? new Date(row.last_reviewed_at) : undefined,
  };
}

/**
 * Extract FSRS card state from review_schedule DB row.
 * Returns null if FSRS columns are not populated (needs migration).
 */
export function extractFSRSCard(row: {
  fsrs_stability: number | null;
  fsrs_difficulty: number | null;
  fsrs_state: number | null;
  fsrs_reps: number | null;
  fsrs_lapses: number | null;
  fsrs_last_review: string | null;
  next_review_at: string;
}): FSRSCard | null {
  if (row.fsrs_stability == null) return null;

  return {
    due: new Date(row.next_review_at),
    stability: row.fsrs_stability,
    difficulty: row.fsrs_difficulty ?? 5,
    state: (row.fsrs_state ?? 0) as 0 | 1 | 2 | 3,
    reps: row.fsrs_reps ?? 0,
    lapses: row.fsrs_lapses ?? 0,
    last_review: row.fsrs_last_review ? new Date(row.fsrs_last_review) : undefined,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
  };
}

// ============================================================================
// DB Serialization Helpers
// ============================================================================

/**
 * Convert FSRS card state to DB columns for upsert.
 */
export function fsrsCardToDbColumns(card: FSRSCard): Record<string, unknown> {
  return {
    fsrs_stability: card.stability,
    fsrs_difficulty: card.difficulty,
    fsrs_state: card.state,
    fsrs_reps: card.reps,
    fsrs_lapses: card.lapses,
    fsrs_last_review: card.last_review instanceof Date
      ? card.last_review.toISOString()
      : card.last_review ?? null,
  };
}

/**
 * Calculate interval in days between now and next due date.
 */
export function intervalDaysFromDue(due: Date, now: Date = new Date()): number {
  const diffMs = due.getTime() - now.getTime();
  return Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));
}
