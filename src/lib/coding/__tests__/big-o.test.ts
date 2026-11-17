import { describe, expect, it } from 'vitest';
import { canonicalBigO, readSpokenBigO, sameBigO } from '../big-o';

const OPTS = {
  time: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
  space: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
  brute: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2^n)'],
};

describe('canonicalBigO', () => {
  it('reads the usual written forms the same', () => {
    expect(canonicalBigO('O(n log n)')).toBe('nlogn');
    expect(canonicalBigO('O(n²)')).toBe('n^2');
    expect(canonicalBigO('O(r · c)')).toBe('rc');
    expect(canonicalBigO('O(rows × cols)')).toBe('rc');
    expect(canonicalBigO('O(1)')).toBe('1');
    expect(sameBigO('O(n·k)', 'O(n k)')).toBe(true);
    expect(sameBigO('O(n)', 'O(n²)')).toBe(false);
  });
});

describe('readSpokenBigO', () => {
  it('reads the model sentence: time, space and the brute force', () => {
    const said =
      "It's O of n time, because I go through the array once, and each lookup in the map is constant on average. Space is O of n, for the map. The brute force was O of n squared, the map removes the inner loop.";
    expect(readSpokenBigO(said, OPTS)).toEqual({ time: 'O(n)', space: 'O(n)', brute: 'O(n²)' });
  });

  it('reads words for the shapes: linear, constant, logarithmic, n log n', () => {
    expect(readSpokenBigO('linear time and constant space', OPTS)).toEqual({ time: 'O(n)', space: 'O(1)' });
    expect(readSpokenBigO('logarithmic time, constant space', OPTS)).toEqual({ time: 'O(log n)', space: 'O(1)' });
    expect(readSpokenBigO('the sort makes it n log n time and O of n space', OPTS)).toEqual({ time: 'O(n log n)', space: 'O(n)' });
  });

  it('an unlabeled answer fills time first, then space', () => {
    expect(readSpokenBigO('O of n squared, O of one', OPTS)).toEqual({ time: 'O(n²)', space: 'O(1)' });
  });

  it('a bare n or 1 is not an answer without "O of"', () => {
    expect(readSpokenBigO('where n is the length of the array, one pass', OPTS)).toEqual({});
  });

  it('the brute force sentence does not leak into the answer', () => {
    const said = 'The brute force is O of n squared time and constant space. With the map it is O of n time and O of n space.';
    expect(readSpokenBigO(said, OPTS)).toEqual({ brute: 'O(n²)', time: 'O(n)', space: 'O(n)' });
  });

  it('reads two-letter sizes like rows times columns', () => {
    const grid = { time: ['O(r·c)', 'O(n)', 'O(n²)'], space: ['O(1)', 'O(r·c)'] };
    expect(readSpokenBigO('O of rows times columns time, and O of rows times columns space', grid)).toEqual({ time: 'O(r·c)', space: 'O(r·c)' });
  });

  it('what the recognizer writes as symbols still reads', () => {
    expect(readSpokenBigO('O(n) time and O(1) space', OPTS)).toEqual({ time: 'O(n)', space: 'O(1)' });
  });

  it('a slower alternative said as a conditional is the brute force', () => {
    const said = "It's O of n time: one pass over the string. Space is O of n. Removing pairs again and again would be O of n squared.";
    expect(readSpokenBigO(said, OPTS)).toEqual({ time: 'O(n)', space: 'O(n)', brute: 'O(n²)' });
    expect(readSpokenBigO('Space is O of one: just three indexes. It is O of log n time.', OPTS)).toEqual({ space: 'O(1)', time: 'O(log n)' });
  });

  it('reads min, plus and exponential options', () => {
    const window = { time: ['O(n)', 'O(n²)'], space: ['O(1)', 'O(n)', 'O(min(n, k))'] };
    expect(readSpokenBigO('O of n time. Space is O of min of n and k, where k is the alphabet.', window)).toEqual({ time: 'O(n)', space: 'O(min(n, k))' });
    const units = { time: ['O(s + a)', 'O(s + a log a)', 'O(s · a)'], space: ['O(a)', 'O(s)'] };
    expect(readSpokenBigO("it's O of s plus a log a time, and space is O of a", units)).toEqual({ time: 'O(s + a log a)', space: 'O(a)' });
    const coins = { time: ['O(amount · coins)'], space: ['O(amount)'], brute: ['O(amount · coins)', 'O(coins^amount)'] };
    expect(readSpokenBigO("O of amount times coins time. Plain recursion tries every combination, and that's exponential.", coins)).toEqual({ time: 'O(amount · coins)', brute: 'O(coins^amount)' });
  });
});
