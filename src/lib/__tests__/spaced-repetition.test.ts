import { describe, it, expect } from 'vitest';
import {
  deriveFromRubric,
  calculateNextReview,
  scoreToRating,
  rubricTotalToRating,
  type ReviewState,
} from '@/lib/spaced-repetition';
import {
  SM2_MIN_EASE,
  SM2_MAX_EASE,
  SM2_MAX_INTERVAL_DAYS,
  RUBRIC_FLOOR_PERCENT,
  RUBRIC_MAX_TOTAL,
} from '@/lib/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<ReviewState> = {}): ReviewState {
  return {
    easeFactor: 2.5,
    intervalDays: 10,
    repetitionCount: 1,
    streak: 1,
    correctCount: 1,
    incorrectCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveFromRubric
// ---------------------------------------------------------------------------

describe('deriveFromRubric', () => {
  it('returns total 0 and normalizedScore 20 for all-zero scores', () => {
    const result = deriveFromRubric({ d1: 0, d2: 0, d3: 0 });
    expect(result.total).toBe(0);
    expect(result.normalizedScore).toBe(RUBRIC_FLOOR_PERCENT);
  });

  it('returns total 6 and normalizedScore 100 for all-max scores', () => {
    const result = deriveFromRubric({ d1: 2, d2: 2, d3: 2 });
    expect(result.total).toBe(RUBRIC_MAX_TOTAL);
    expect(result.normalizedScore).toBe(100);
  });

  it('handles mixed scores correctly', () => {
    // total = 3, normalizedScore = 20 + (3/6)*80 = 20 + 40 = 60
    const result = deriveFromRubric({ d1: 1, d2: 1, d3: 1 });
    expect(result.total).toBe(3);
    expect(result.normalizedScore).toBe(60);
    expect(result.isCorrect).toBe(true);
    expect(result.rating).toBe('hard');
  });
});

// ---------------------------------------------------------------------------
// calculateNextReview
// ---------------------------------------------------------------------------

describe('calculateNextReview', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('wrong: resets interval to 1, ease -0.2, streak 0', () => {
    const state = makeState({ easeFactor: 2.5, intervalDays: 10, streak: 3 });
    const result = calculateNextReview(state, 'wrong', now);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBe(2.3);
    expect(result.streak).toBe(0);
    expect(result.incorrectCount).toBe(1);
  });

  it('hard: interval * ease, ease -0.15', () => {
    const state = makeState({ easeFactor: 2.5, intervalDays: 10, streak: 1 });
    const result = calculateNextReview(state, 'hard', now);
    expect(result.intervalDays).toBe(Math.round(10 * 2.5)); // 25
    expect(result.easeFactor).toBe(2.35);
    expect(result.streak).toBe(2);
    expect(result.correctCount).toBe(2);
  });

  it('easy: interval * ease, ease +0.1', () => {
    const state = makeState({ easeFactor: 2.0, intervalDays: 10, streak: 1 });
    const result = calculateNextReview(state, 'easy', now);
    expect(result.intervalDays).toBe(Math.round(10 * 2.0)); // 20
    expect(result.easeFactor).toBe(2.1);
    expect(result.streak).toBe(2);
    expect(result.correctCount).toBe(2);
  });

  it('ease floor at SM2_MIN_EASE (1.3)', () => {
    const state = makeState({ easeFactor: SM2_MIN_EASE, intervalDays: 5 });
    const result = calculateNextReview(state, 'wrong', now);
    expect(result.easeFactor).toBe(SM2_MIN_EASE);
  });

  it('ease ceiling at SM2_MAX_EASE (2.5)', () => {
    const state = makeState({ easeFactor: SM2_MAX_EASE, intervalDays: 5 });
    const result = calculateNextReview(state, 'easy', now);
    expect(result.easeFactor).toBe(SM2_MAX_EASE);
  });

  it('interval capped at SM2_MAX_INTERVAL_DAYS (180)', () => {
    const state = makeState({ easeFactor: 2.5, intervalDays: 100 });
    const result = calculateNextReview(state, 'easy', now);
    // 100 * 2.5 = 250, capped to 180
    expect(result.intervalDays).toBe(SM2_MAX_INTERVAL_DAYS);
  });
});

// ---------------------------------------------------------------------------
// scoreToRating
// ---------------------------------------------------------------------------

describe('scoreToRating', () => {
  it('score 49 → wrong', () => {
    expect(scoreToRating(49)).toBe('wrong');
  });

  it('score 50 → hard', () => {
    expect(scoreToRating(50)).toBe('hard');
  });

  it('score 79 → hard', () => {
    expect(scoreToRating(79)).toBe('hard');
  });

  it('score 80 → easy', () => {
    expect(scoreToRating(80)).toBe('easy');
  });
});

// ---------------------------------------------------------------------------
// rubricTotalToRating
// ---------------------------------------------------------------------------

describe('rubricTotalToRating', () => {
  it('total 2 → wrong', () => {
    expect(rubricTotalToRating(2)).toBe('wrong');
  });

  it('total 3 → hard', () => {
    expect(rubricTotalToRating(3)).toBe('hard');
  });

  it('total 4 → hard', () => {
    expect(rubricTotalToRating(4)).toBe('hard');
  });

  it('total 5 → easy', () => {
    expect(rubricTotalToRating(5)).toBe('easy');
  });
});
