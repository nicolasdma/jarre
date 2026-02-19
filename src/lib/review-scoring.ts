/**
 * Jarre - Review Scoring & Rating Utilities
 *
 * Converts numeric scores (0-100, rubric totals) into ReviewRating values
 * used by the FSRS scheduling engine (fsrs.ts / apply-schedule.ts).
 *
 * Also exports review session caps and date helpers.
 */

import type { ReviewRating } from '@/types';
import {
  REVIEW_SESSION_CAP as SESSION_CAP_CONST,
  SCORE_RATING_BOUNDARIES,
  RUBRIC_RATING_BOUNDARIES,
  RUBRIC_FLOOR_PERCENT,
  RUBRIC_MAX_TOTAL,
} from '@/lib/constants';

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
 * Derive a ReviewRating from a numeric score with 4-level granularity (FSRS-compatible).
 *
 * Score mapping:
 * - score >= 90 → easy
 * - score >= 70 → good
 * - score >= 50 → hard
 * - score < 50  → wrong
 */
export function scoreToRating4(score: number): ReviewRating {
  if (score >= 90) return 'easy';
  if (score >= 70) return 'good';
  if (score >= 50) return 'hard';
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
export const REVIEW_SESSION_CAP = SESSION_CAP_CONST;

/**
 * Start of today in ISO string (UTC midnight).
 * Used to count how many cards were reviewed today.
 */
export function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
