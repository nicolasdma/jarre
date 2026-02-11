/**
 * Jarre - Simplified SM-2 Spaced Repetition Engine
 *
 * Implements a simplified SuperMemo 2 algorithm for scheduling reviews.
 *
 * Rating effects:
 * - wrong: reset interval to 1 day, ease -0.2 (min 1.3), streak = 0
 * - hard:  interval * ease, ease -0.15 (min 1.3), streak +1
 * - easy:  interval * ease, ease +0.1 (max 2.5), streak +1
 *
 * With "easy" at max ease (2.5):
 * 1d → 3d → 8d → 20d → 50d → 125d → cap 180d
 */

import type { ReviewRating } from '@/types';
import {
  SM2_MIN_EASE,
  SM2_MAX_EASE,
  SM2_MAX_INTERVAL_DAYS,
  REVIEW_SESSION_CAP as SESSION_CAP_CONST,
  SCORE_RATING_BOUNDARIES,
  RUBRIC_RATING_BOUNDARIES,
  RUBRIC_FLOOR_PERCENT,
  RUBRIC_MAX_TOTAL,
} from '@/lib/constants';

const MIN_EASE = SM2_MIN_EASE;
const MAX_EASE = SM2_MAX_EASE;
const MAX_INTERVAL_DAYS = SM2_MAX_INTERVAL_DAYS;
const SESSION_CAP = SESSION_CAP_CONST;

export interface ReviewState {
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  streak: number;
  correctCount: number;
  incorrectCount: number;
}

export interface ReviewResult {
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  streak: number;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: Date;
}

/**
 * Calculate the next review state based on the current state and rating.
 * Pure function - no side effects.
 */
export function calculateNextReview(
  current: ReviewState,
  rating: ReviewRating,
  now: Date = new Date()
): ReviewResult {
  let { easeFactor, intervalDays, repetitionCount, streak, correctCount, incorrectCount } = current;

  switch (rating) {
    case 'wrong':
      intervalDays = 1;
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
      streak = 0;
      incorrectCount += 1;
      break;

    case 'hard':
      intervalDays = intervalDays === 0
        ? 1
        : Math.min(MAX_INTERVAL_DAYS, Math.round(intervalDays * easeFactor));
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
      streak += 1;
      correctCount += 1;
      break;

    case 'easy':
      intervalDays = intervalDays === 0
        ? 1
        : Math.min(MAX_INTERVAL_DAYS, Math.round(intervalDays * easeFactor));
      easeFactor = Math.min(MAX_EASE, easeFactor + 0.1);
      streak += 1;
      correctCount += 1;
      break;
  }

  repetitionCount += 1;

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    easeFactor,
    intervalDays,
    repetitionCount,
    streak,
    correctCount,
    incorrectCount,
    nextReviewAt,
  };
}

/**
 * Derive a ReviewRating from a numeric score (0-100).
 *
 * Score mapping:
 * - score >= 80 → easy
 * - score 50-79 → hard
 * - score < 50  → wrong
 */
export function scoreToRating(score: number): ReviewRating {
  if (score >= SCORE_RATING_BOUNDARIES.easy) return 'easy';
  if (score >= SCORE_RATING_BOUNDARIES.hard) return 'hard';
  return 'wrong';
}

/**
 * Derive a ReviewRating from rubric dimension total (0-6).
 *
 * Score mapping:
 * - total >= 5 → easy  (83-100% — excellent)
 * - total >= 3 → hard  (50-67% — partial understanding)
 * - total < 3  → wrong (0-33% — major gaps)
 */
export function rubricTotalToRating(total: number): ReviewRating {
  if (total >= RUBRIC_RATING_BOUNDARIES.easy) return 'easy';
  if (total >= RUBRIC_RATING_BOUNDARIES.hard) return 'hard';
  return 'wrong';
}

/**
 * Derive backward-compatible fields from rubric dimension scores.
 *
 * Normalization: 20% floor + 80% scaled range.
 * This maps total 0→20%, 3→60%, 6→100%.
 * A "correct but shallow" answer (all 1s = 3/6) gets ~60%, not 50%.
 */
export function deriveFromRubric(scores: Record<string, number>): {
  total: number;
  normalizedScore: number; // 0-100 for backward compat
  isCorrect: boolean;
  rating: ReviewRating;
} {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    total,
    normalizedScore: Math.round(RUBRIC_FLOOR_PERCENT + (total / RUBRIC_MAX_TOTAL) * (100 - RUBRIC_FLOOR_PERCENT)),
    isCorrect: total >= RUBRIC_RATING_BOUNDARIES.hard,
    rating: rubricTotalToRating(total),
  };
}

/**
 * Maximum number of cards per review session (= daily cap).
 */
export const REVIEW_SESSION_CAP = SESSION_CAP;

/**
 * Start of today in ISO string (UTC midnight).
 * Used to count how many cards were reviewed today.
 */
export function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
