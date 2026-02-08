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

const MIN_EASE = 1.3;
const MAX_EASE = 2.5;
const MAX_INTERVAL_DAYS = 180;
const SESSION_CAP = 20;

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
  if (score >= 80) return 'easy';
  if (score >= 50) return 'hard';
  return 'wrong';
}

/**
 * Maximum number of cards per review session.
 */
export const REVIEW_SESSION_CAP = SESSION_CAP;
