import { describe, expect, it } from 'vitest';
import { buildCodingMockSession } from '../mock-session';
import { CodingConfigSchema } from '../format';

/**
 * The coding mock must open like a real round: a greeting, a line of framing in
 * the interviewer's tone, then the problem presented in their own words with the
 * first example on screen. Never the cold "Walk me through how you would solve
 * Two Sum, and the complexity of your solution" the owner hit (2026-11-17).
 */
const config = CodingConfigSchema.parse({
  context: 'A 30-minute live coding round at senior bar.',
  interviewer: { name: 'Sam', role: 'a staff engineer running the coding round', tone: 'friendly, informal, a bit of small talk' },
  problems: [
    {
      id: 'two-sum',
      title: 'Two Sum',
      difficulty: 'easy',
      pattern: 'Hash map',
      statement: 'Given an array of integers and a target, return the indices of the two numbers that add up to the target.',
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' }],
      constraints: ['2 <= nums.length <= 10^4'],
      clarifications: [{ topic: 'duplicates', answer: 'Values can repeat and can be negative; the array is not sorted.' }],
      exports: ['twoSum'],
      starter: 'export function twoSum(nums: number[], target: number): [number, number] {\n  // TODO\n}',
      example_tests: "test('example', () => {})",
      tests: "test('hidden', () => {})",
      hints: ['What have you tried so far?', 'What could you store to avoid the nested loop?'],
      follow_ups: ['Can you do it in a single pass?', "What if the array doesn't fit in memory?"],
      senior_signals: ['names the brute force cost before optimizing'],
      pitfalls: ['returns the values instead of the indices'],
      solution: { approach: 'Hash map from value to index, one pass.', time: 'O(n)', space: 'O(n)', code: 'export function twoSum() { return [0, 1]; }' },
      complexity: {
        time: { answer: 'O(n)', options: ['O(n)', 'O(n^2)'], why: 'one pass' },
        space: { answer: 'O(n)', options: ['O(n)', 'O(1)'], why: 'the map holds up to n entries' },
        say: 'O of n time / and O of n space.',
      },
    },
  ],
});
const problem = config.problems[0];

describe('coding mock session: a realistic opening, not a cold problem dump', () => {
  it('opens with a greeting + framing, then presents the problem and the first example on screen', () => {
    const { instruction, opener, language } = buildCodingMockSession({ config, problem, minutes: 30 });
    expect(language).toBe('en');
    expect(opener).toBe("Hi, I'm ready.");
    // Arc step 1: open like a real call.
    expect(instruction).toContain('Open like a real call, not a cold problem dump');
    expect(instruction).toContain('a real greeting as Sam');
    expect(instruction).toContain('one line of framing that fits your tone');
    expect(instruction).toContain('give the first example, and mention it is on their screen too');
  });

  it('forbids the canned cold open by name (the problem title and the complexity-up-front ask)', () => {
    const { instruction } = buildCodingMockSession({ config, problem, minutes: 30 });
    expect(instruction).toContain('Never open by asking them to "walk me through how you would solve Two Sum"');
    expect(instruction).toContain('never ask for the complexity up front');
    // First turn repeats the guard.
    expect(instruction).toContain('Never open by asking them to walk you through a solution or to give the complexity');
    // The old one-line cold open is gone.
    expect(instruction).not.toContain('Greet them in one sentence as Sam and present the problem.');
    expect(instruction).not.toContain('1. Open: one sentence of greeting');
  });

  it('keeps the full arc after the open: clarify, approach, code, test, complexity, follow-ups, close', () => {
    const { instruction } = buildCodingMockSession({ config, problem, minutes: 30 });
    expect(instruction).toContain('Clarifying:');
    expect(instruction).toContain('Approach:');
    expect(instruction).toContain('Coding:');
    // Chapter 1 of the lesson announces these; the interviewer listens and may cut in with them.
    expect(instruction).toContain('"Why are you doing it that way?"');
    expect(instruction).toContain('"What do you mean by ...?"');
    expect(instruction).toContain('"Can you say that more simply?"');
    // Not understood is asked again, never guessed and never treated as silence.
    expect(instruction).toContain('"Sorry, could you say that again?"');
    expect(instruction).toContain('never carry on as if they had said nothing');
    expect(instruction).toContain('never ask them to explain something they just explained');
    expect(instruction).toContain('Testing:');
    expect(instruction).toContain("ask \"What's the time and space complexity?\"");
    expect(instruction).toContain('senior follow-ups');
    expect(instruction).toContain('interview complete');
  });

  it('presents the problem from the lesson data, not an invented one', () => {
    const { instruction } = buildCodingMockSession({ config, problem, minutes: 30 });
    expect(instruction).toContain(problem.statement);
    expect(instruction).toContain('nums = [2,7,11,15], target = 9 → [0,1]');
    expect(instruction).toContain('Values can repeat and can be negative');
    // Hints never leak into the prompt (they arrive one rung at a time at runtime).
    for (const hint of problem.hints) expect(instruction).not.toContain(hint);
  });

  it('varies the framing by the interviewer tone (the tone is in the prompt)', () => {
    const brisk = CodingConfigSchema.parse({
      ...config,
      interviewer: { name: 'Morgan', role: 'a terse senior engineer', tone: 'short, dry, straight to the point' },
    });
    const { instruction } = buildCodingMockSession({ config: brisk, problem: brisk.problems[0], minutes: 20 });
    expect(instruction).toContain('Tone: short, dry, straight to the point');
    expect(instruction).toContain('a brisk one keeps it to a sentence');
    expect(instruction).toContain('about 20 minutes'); // framing carries the real budget
  });
});
