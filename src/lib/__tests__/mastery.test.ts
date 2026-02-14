import { describe, it, expect } from 'vitest';
import {
  canAdvanceToLevel1,
  canAdvanceToLevel3,
  computeNewLevelFromEvaluation,
  canAdvanceFromMicroTests,
} from '@/lib/mastery';

// ---------------------------------------------------------------------------
// canAdvanceToLevel1
// ---------------------------------------------------------------------------

describe('canAdvanceToLevel1', () => {
  it('level 0 + score 59 → false', () => {
    expect(canAdvanceToLevel1(0, 59)).toBe(false);
  });

  it('level 0 + score 60 → true', () => {
    expect(canAdvanceToLevel1(0, 60)).toBe(true);
  });

  it('level 1 + score 100 → false (already past)', () => {
    expect(canAdvanceToLevel1(1, 100)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// canAdvanceToLevel3
// ---------------------------------------------------------------------------

describe('canAdvanceToLevel3', () => {
  it('level 2 + tradeoff + score 80 → true', () => {
    expect(canAdvanceToLevel3(2, 'tradeoff', 80)).toBe(true);
  });

  it('level 2 + tradeoff + score 79 → false', () => {
    expect(canAdvanceToLevel3(2, 'tradeoff', 79)).toBe(false);
  });

  it('level 2 + explanation + score 90 → false (wrong type)', () => {
    expect(canAdvanceToLevel3(2, 'explanation', 90)).toBe(false);
  });

  it('level 1 + tradeoff + score 90 → false (wrong level)', () => {
    expect(canAdvanceToLevel3(1, 'tradeoff', 90)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeNewLevelFromEvaluation
// ---------------------------------------------------------------------------

describe('computeNewLevelFromEvaluation', () => {
  it('level 0 + any type + score 60 → 1', () => {
    expect(computeNewLevelFromEvaluation(0, 'explanation', 60)).toBe(1);
  });

  it('level 0 + any type + score 59 → 0', () => {
    expect(computeNewLevelFromEvaluation(0, 'explanation', 59)).toBe(0);
  });

  it('level 2 + error_detection + score 80 → 3', () => {
    expect(computeNewLevelFromEvaluation(2, 'error_detection', 80)).toBe(3);
  });

  it('level 2 + error_detection + score 79 → 2', () => {
    expect(computeNewLevelFromEvaluation(2, 'error_detection', 79)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// canAdvanceFromMicroTests
// ---------------------------------------------------------------------------

describe('canAdvanceFromMicroTests', () => {
  it('level 0 + count 2 → false', () => {
    expect(canAdvanceFromMicroTests(0, 2)).toBe(false);
  });

  it('level 0 + count 3 → true', () => {
    expect(canAdvanceFromMicroTests(0, 3)).toBe(true);
  });

  it('level 1 + count 5 → false (already past)', () => {
    expect(canAdvanceFromMicroTests(1, 5)).toBe(false);
  });
});
