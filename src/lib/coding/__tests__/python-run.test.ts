/**
 * The Python runner against a real Pyodide (the `pyodide` dev dependency, the
 * same version the worker loads from the CDN), offline: the package carries
 * the interpreter and the standard library.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import { describePythonError, runPythonCode, type PyodideLike } from '../python-run';

let py: PyodideLike;

beforeAll(async () => {
  py = (await loadPyodide()) as unknown as PyodideLike;
}, 60_000);

const TWO_SUM_TESTS = `import { twoSum } from './solution';
const sorted = (p: number[]) => [...p].sort((a, b) => a - b);
test('example 1', () => { expect(sorted(twoSum([2, 7, 11, 15], 9))).toEqual([0, 1]); });
test('example 2', () => { expect(sorted(twoSum([3, 2, 4], 6))).toEqual([1, 2]); });`;

describe('runPythonCode', () => {
  it('runs a Python function against the TypeScript tests', async () => {
    const code = `from typing import List

def twoSum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return [-1, -1]
`;
    const r = await runPythonCode(py, { code, tests: TWO_SUM_TESTS, exportNames: ['twoSum'] });
    expect(r.ok).toBe(true);
    expect(r.tests.map((t) => t.pass)).toEqual([true, true]);
  });

  it('accepts snake_case and a LeetCode-style class Solution, and returns tuples as arrays', async () => {
    const snake = `def two_sum(nums, target):
    return (0, 1) if nums[0] + nums[1] == target else (1, 2)
`;
    const r1 = await runPythonCode(py, { code: snake, tests: TWO_SUM_TESTS, exportNames: ['twoSum'] });
    expect(r1.tests.map((t) => t.pass)).toEqual([true, true]);

    const cls = `class Solution:
    def twoSum(self, nums, target):
        index = {n: i for i, n in enumerate(nums)}
        for i, n in enumerate(nums):
            j = index.get(target - n)
            if j is not None and j != i:
                return [i, j]
`;
    const r2 = await runPythonCode(py, { code: cls, tests: TWO_SUM_TESTS, exportNames: ['twoSum'] });
    expect(r2.tests.map((t) => t.pass)).toEqual([true, true]);
  });

  it('bridges a class the tests construct', async () => {
    const code = `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.items = OrderedDict()

    def get(self, key):
        if key not in self.items:
            return -1
        self.items.move_to_end(key)
        return self.items[key]

    def put(self, key, value):
        self.items[key] = value
        self.items.move_to_end(key)
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)
`;
    const tests = `import { LRUCache } from './solution';
test('classic', () => {
  const c = new LRUCache(2);
  c.put(1, 1); c.put(2, 2);
  expect(c.get(1)).toBe(1);
  c.put(3, 3);
  expect(c.get(2)).toBe(-1);
});`;
    const r = await runPythonCode(py, { code, tests, exportNames: ['LRUCache'] });
    expect(r.tests).toMatchObject([{ name: 'classic', pass: true }]);
  });

  it('captures print, in order with the tests', async () => {
    const code = `print("loaded")
def twoSum(nums, target):
    print("called with", nums, target)
    return [0, 1]
`;
    const r = await runPythonCode(py, { code, tests: TWO_SUM_TESTS, exportNames: ['twoSum'] });
    expect(r.logs[0]).toBe('loaded');
    expect(r.logs[1]).toBe('called with [2, 7, 11, 15] 9');
    expect(r.tests[1].pass).toBe(false);
  });

  it('just runs the file when there are no tests, with __name__ == "__main__"', async () => {
    const r = await runPythonCode(py, { code: 'if __name__ == "__main__":\n    print(sum(range(5)))\n' });
    expect(r).toMatchObject({ ok: true, logs: ['10'], tests: [] });
  });

  it('reports a syntax error as a compile error with its line', async () => {
    const r = await runPythonCode(py, { code: 'def f(:\n    pass\n' });
    expect(r.ok).toBe(false);
    expect(r.compileError).toMatchObject({ file: 'solution', line: 1 });
    expect(r.compileError?.message).toMatch(/^SyntaxError/);
  });

  it('reports an exception inside a test with the Python error and the line', async () => {
    const code = 'def twoSum(nums, target):\n    return nums[99]\n';
    const r = await runPythonCode(py, { code, tests: TWO_SUM_TESTS, exportNames: ['twoSum'] });
    expect(r.tests[0].pass).toBe(false);
    expect(r.tests[0].error).toBe('IndexError: list index out of range (line 2)');
  });

  it('says which name is missing', async () => {
    const r = await runPythonCode(py, { code: 'def other():\n    pass\n', tests: TWO_SUM_TESTS, exportNames: ['twoSum'] });
    expect(r.tests[0].error).toMatch(/^NameError: define twoSum/);
  });

  it('starts every run from a clean namespace', async () => {
    await runPythonCode(py, { code: 'leftover = 1\n' });
    const r = await runPythonCode(py, { code: 'print(leftover)\n' });
    expect(r.runtimeError).toMatch(/^NameError/);
  });
});

describe('describePythonError', () => {
  it('keeps the exception and the candidate line, not Pyodide frames', () => {
    const msg =
      'Traceback (most recent call last):\n  File "/lib/python314.zip/_pyodide/_base.py", line 528, in eval_code\n  File "solution.py", line 14, in boom\n    return x[10]\nIndexError: list index out of range\n';
    expect(describePythonError(msg)).toEqual({ name: 'IndexError', text: 'list index out of range', line: 14 });
  });
});
