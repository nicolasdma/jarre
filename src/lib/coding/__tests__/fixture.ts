import type { CodingProblem } from '../format';

/** A tiny problem for the tests: sum of an array. */
export const SUM_PROBLEM: CodingProblem = {
  id: 'sum',
  title: 'Sum',
  difficulty: 'easy',
  pattern: 'Loop',
  minutes: 10,
  statement: 'Return the sum of the numbers.',
  examples: [{ input: '[1, 2, 3]', output: '6' }],
  constraints: [],
  clarifications: [{ topic: 'empty', answer: 'Return 0.' }],
  exports: ['sum'],
  starter: 'export function sum(nums: number[]): number {\n  return -1;\n}\n',
  example_tests: "import { sum } from './solution';\ntest('example', () => { expect(sum([1, 2, 3])).toBe(6); });\n",
  tests: "import { sum } from './solution';\ntest('empty', () => { expect(sum([])).toBe(0); });\ntest('negatives', () => { expect(sum([-1, 1])).toBe(0); });\n",
  hints: ['What is the sum of nothing?', 'Use a loop with an accumulator.'],
  follow_ups: ['What if the numbers overflow?'],
  senior_signals: ['asks about the empty case'],
  pitfalls: ['starting the accumulator at 1'],
  solution: {
    approach: 'One pass with an accumulator.',
    time: 'O(n)',
    space: 'O(1)',
    code: 'export function sum(nums: number[]): number {\n  let total = 0;\n  for (const n of nums) total += n;\n  return total;\n}\n',
  },
  exercises: [
    { id: 'sum-guided', level: 'guided', title: 'Sum guided', instructions: 'Fill the loop.', starter: 'export function sum(nums: number[]): number {\n  let total = 0;\n  // TODO\n  return total;\n}\n' },
  ],
};
