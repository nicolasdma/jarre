import { describe, it, expect } from 'vitest';
import {
  deriveFromRubric,
  scoreToRating,
  rubricTotalToRating,
} from '@/lib/review-scoring';
import {
  RUBRIC_FLOOR_PERCENT,
  RUBRIC_MAX_TOTAL,
} from '@/lib/constants';

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
