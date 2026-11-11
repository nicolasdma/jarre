import { describe, expect, it } from 'vitest';
import {
  accuracyPercent,
  alignWords,
  copyFeedback,
  normalizeWords,
  splitSentences,
  wordsPerMinute,
} from '../scoring';

const strict = { caseInsensitive: false, ignorePunctuation: false };
const lenient = { caseInsensitive: true, ignorePunctuation: true };

describe('copyFeedback', () => {
  it('marks typed chars correct or wrong and the rest pending', () => {
    const f = copyFeedback('Hi there', 'Hi thx', strict);
    expect(f.states).toEqual(['correct', 'correct', 'correct', 'correct', 'correct', 'wrong', 'pending', 'pending']);
    expect(f.correct).toBe(5);
    expect(f.complete).toBe(false);
  });

  it('scores an exact copy as 100%', () => {
    const f = copyFeedback("I'm in Colombia.", "I'm in Colombia.", strict);
    expect(f.complete).toBe(true);
    expect(accuracyPercent(f)).toBe(100);
  });

  it('honors case-insensitive and ignore-punctuation', () => {
    expect(accuracyPercent(copyFeedback('Hi, Nathalie.', 'hi nathalie', strict))).toBeLessThan(100);
    const f = copyFeedback('Hi, Nathalie.', 'hi nathalie', lenient);
    expect(f.complete).toBe(true);
    expect(accuracyPercent(f)).toBe(100);
    // Skipped punctuation is neutral, not wrong.
    expect(f.states[2]).toBe('neutral');
  });

  it('folds accents and collapses whitespace', () => {
    const f = copyFeedback('Córdoba,  Argentina', 'Cordoba, Argentina', strict);
    expect(accuracyPercent(f)).toBe(100);
  });

  it('counts extra typed chars against accuracy', () => {
    const f = copyFeedback('abc', 'abcdef', strict);
    expect(f.extra).toBe(3);
    expect(accuracyPercent(f)).toBe(50);
  });
});

describe('wordsPerMinute', () => {
  it('uses 5 chars per word', () => {
    expect(wordsPerMinute(250, 60_000)).toBe(50);
    expect(wordsPerMinute(10, 0)).toBe(0);
  });
});

describe('alignWords', () => {
  it('marks said, missed and extra words', () => {
    const a = alignWords('I have been writing code for six years.', 'I have writing code for 6 years um');
    expect(a.marks.filter((m) => m.state === 'missed').map((m) => m.word)).toEqual(['been']);
    expect(a.marks.filter((m) => m.state === 'extra').map((m) => m.word)).toEqual(['um']);
    expect(a.said).toBe(7);
    expect(a.total).toBe(8);
    expect(a.score).toBe(88);
  });

  it('is case and punctuation blind', () => {
    expect(alignWords('Hi Nathalie, nice to meet you.', 'hi nathalie nice to meet you').score).toBe(100);
  });
});

describe('normalizeWords', () => {
  it('turns number words and thousands separators into digits', () => {
    expect(normalizeWords('ten thousand users, 10,000 users')).toEqual(['10', '1000', 'users', '10000', 'users']);
  });
});

describe('splitSentences', () => {
  it('splits on sentence ends with proportional timing', () => {
    const s = splitSentences('Hi there. How are you? Fine!');
    expect(s.map((x) => x.text)).toEqual(['Hi there.', 'How are you?', 'Fine!']);
    expect(s[0].start).toBe(0);
    expect(s[2].end).toBe(1);
    expect(s[1].start).toBeCloseTo(9 / 26);
  });

  it('does not split inside decimals or abbreviations followed by lowercase', () => {
    expect(splitSentences('It costs 4.5 dollars, e.g. cheap.').length).toBe(1);
  });
});
