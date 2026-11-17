import { describe, expect, it } from 'vitest';
import { drillGrade, gradeFromPercent } from '../drill-grade';
import type { DrillBest } from '@/components/practice/best-scores';

const at = '2026-11-17T00:00:00.000Z';
const recall = (last: 'got' | 'partial' | 'missed') =>
  ({ last, at, due: at, tries: 1, got: last === 'got' ? 1 : 0, card: {} }) as unknown as NonNullable<DrillBest['recall']>;

describe('gradeFromPercent', () => {
  it('maps a score around the pass bar (85)', () => {
    expect([100, 95, 94, 85, 84, 70, 69, 50, 49, 0].map(gradeFromPercent)).toEqual([5, 5, 4, 4, 3, 3, 2, 2, 1, 1]);
  });
});

describe('drillGrade', () => {
  it('a drill never practiced is pending', () => {
    expect(drillGrade(undefined)).toEqual({ done: false, grade: null });
    expect(drillGrade({})).toEqual({ done: false, grade: null });
  });

  it('takes the best judged attempt across modes', () => {
    expect(drillGrade({ repeat: { score: 72, at }, sentences: { score: 90, at } })).toEqual({ done: true, grade: 4 });
    expect(drillGrade({ copy: { score: 40, at }, recall: recall('got') })).toEqual({ done: true, grade: 5 });
    expect(drillGrade({ recall: recall('partial') })).toEqual({ done: true, grade: 3 });
  });

  it('practiced where nothing could be judged is done without a grade', () => {
    expect(drillGrade({ shadowed: 2 })).toEqual({ done: true, grade: null });
  });
});
