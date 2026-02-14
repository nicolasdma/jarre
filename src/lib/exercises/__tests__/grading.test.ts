import { describe, it, expect } from 'vitest';
import { gradeSequence, gradeLabel, gradeConnect } from '@/lib/exercises/grading';

// ---------------------------------------------------------------------------
// gradeSequence
// ---------------------------------------------------------------------------

describe('gradeSequence', () => {
  it('perfect order → 100', () => {
    expect(gradeSequence(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(100);
  });

  it('fully reversed → 0', () => {
    expect(gradeSequence(['c', 'b', 'a'], ['a', 'b', 'c'])).toBe(0);
  });

  it('one swap → 67', () => {
    // ['b','a','c'] vs ['a','b','c']: 1 inversion out of 3 max
    // round((1 - 1/3) * 100) = 67
    expect(gradeSequence(['b', 'a', 'c'], ['a', 'b', 'c'])).toBe(67);
  });

  it('single item → 100', () => {
    expect(gradeSequence(['a'], ['a'])).toBe(100);
  });

  it('length mismatch → 0', () => {
    expect(gradeSequence(['a', 'b'], ['a', 'b', 'c'])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// gradeLabel
// ---------------------------------------------------------------------------

describe('gradeLabel', () => {
  it('all correct → 100', () => {
    const placements = { z1: 'A', z2: 'B' };
    const zones = [
      { id: 'z1', correctLabel: 'A' },
      { id: 'z2', correctLabel: 'B' },
    ];
    expect(gradeLabel(placements, zones)).toBe(100);
  });

  it('none correct → 0', () => {
    const placements = { z1: 'B', z2: 'A' };
    const zones = [
      { id: 'z1', correctLabel: 'A' },
      { id: 'z2', correctLabel: 'B' },
    ];
    expect(gradeLabel(placements, zones)).toBe(0);
  });

  it('partial: 1 of 2 correct → 50', () => {
    const placements = { z1: 'A', z2: 'X' };
    const zones = [
      { id: 'z1', correctLabel: 'A' },
      { id: 'z2', correctLabel: 'B' },
    ];
    expect(gradeLabel(placements, zones)).toBe(50);
  });

  it('empty zones → 0', () => {
    expect(gradeLabel({}, [])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// gradeConnect
// ---------------------------------------------------------------------------

describe('gradeConnect', () => {
  it('perfect match → 100', () => {
    const user: [string, string][] = [['a', 'b'], ['c', 'd']];
    const correct: [string, string][] = [['a', 'b'], ['c', 'd']];
    expect(gradeConnect(user, correct)).toBe(100);
  });

  it('bidirectional: user [b,a] matches correct [a,b] → 100', () => {
    const user: [string, string][] = [['b', 'a']];
    const correct: [string, string][] = [['a', 'b']];
    expect(gradeConnect(user, correct)).toBe(100);
  });

  it('extra connections penalize', () => {
    // 2 correct + 1 extra. correctCount=2, extraCount=1, penalized = 2 - 0.5 = 1.5
    // score = round(1.5 / 2 * 100) = 75
    const user: [string, string][] = [['a', 'b'], ['c', 'd'], ['e', 'f']];
    const correct: [string, string][] = [['a', 'b'], ['c', 'd']];
    expect(gradeConnect(user, correct)).toBe(75);
  });

  it('no correct connections → 0', () => {
    const user: [string, string][] = [['x', 'y']];
    const correct: [string, string][] = [['a', 'b']];
    expect(gradeConnect(user, correct)).toBe(0);
  });

  it('empty correct → 0', () => {
    const user: [string, string][] = [['a', 'b']];
    const correct: [string, string][] = [];
    expect(gradeConnect(user, correct)).toBe(0);
  });
});
