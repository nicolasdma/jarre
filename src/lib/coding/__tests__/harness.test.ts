import { describe, expect, it } from 'vitest';
import { runCode, transpileTs } from '../transpile';
import { deepEqual, formatValue } from '../harness';

describe('transpileTs', () => {
  it('strips types and turns imports into require', () => {
    const r = transpileTs("import { a } from './solution';\nconst x: number = a;");
    expect('js' in r && r.js).toContain("require('./solution')");
  });

  it('reports a syntax error with its line', () => {
    const r = transpileTs('const x = ;\n');
    expect('error' in r && r.error.line).toBe(1);
  });
});

describe('runCode', () => {
  const tests = "import { sum } from './solution';\ntest('adds', () => { expect(sum([1, 2])).toBe(3); });\ntest('empty', () => { expect(sum([])).toBe(0); });";

  it('runs the tests against the solution', async () => {
    const r = await runCode({ code: 'export function sum(a: number[]) { return a.reduce((s, n) => s + n, 0); }', tests });
    expect(r.ok).toBe(true);
    expect(r.tests.map((t) => t.pass)).toEqual([true, true]);
  });

  it('names the failing assertion', async () => {
    const r = await runCode({ code: 'export function sum(a: number[]) { return 1; }', tests });
    expect(r.tests[0]).toMatchObject({ pass: false, error: 'expected 3, got 1' });
  });

  it('finds a function the candidate forgot to export', async () => {
    const r = await runCode({ code: 'function sum(a: number[]) { return a.reduce((s, n) => s + n, 0); }', tests, exportNames: ['sum'] });
    expect(r.tests.every((t) => t.pass)).toBe(true);
  });

  it('captures console output and the candidate\'s own tests', async () => {
    const r = await runCode({ code: "console.log('hi', [1, 2], new Map([[1, 'a']]));\ntest('mine', () => expect(1).toBe(2));" });
    expect(r.logs).toEqual(['hi [1, 2] Map(1) {1 => "a"}']);
    expect(r.tests[0]).toMatchObject({ name: 'mine', pass: false, own: true });
  });

  it('reports a runtime error at the top level', async () => {
    const r = await runCode({ code: 'const a: any = null; a.b;' });
    expect(r.ok).toBe(false);
    expect(r.runtimeError).toMatch(/TypeError/);
  });

  it('awaits async tests and times out a hung one', async () => {
    const code = 'export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));';
    const t = "import { wait } from './solution';\ntest('fast', async () => { await wait(5); });\ntest('hung', () => new Promise(() => {}));";
    const r = await runCode({ code, tests: t, testTimeoutMs: 50 });
    expect(r.tests.map((x) => x.pass)).toEqual([true, false]);
    expect(r.tests[1].error).toMatch(/did not finish/);
  });

  it('supports not, toThrow and rejects', async () => {
    const code = 'export const boom = () => { throw new Error("no answer"); };\nexport const later = async () => { throw new Error("late"); };';
    const t = "import { boom, later } from './solution';\ntest('throws', () => { expect(boom).toThrow('no answer'); expect(1).not.toBe(2); });\ntest('rejects', async () => { await expect(later()).rejects.toThrow('late'); });";
    const r = await runCode({ code, tests: t });
    expect(r.tests.every((x) => x.pass)).toBe(true);
  });

  it('only lets the tests import ./solution', async () => {
    const r = await runCode({ code: 'export const a = 1;', tests: "import fs from 'fs';\ntest('x', () => { expect(fs).toBeDefined(); });" });
    expect(r.ok).toBe(false);
    expect(r.runtimeError).toMatch(/only '.\/solution'/);
  });
});

describe('deepEqual and formatValue', () => {
  it('compares maps, sets, arrays and plain objects', () => {
    expect(deepEqual(new Map([[1, [2]]]), new Map([[1, [2]]]))).toBe(true);
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
  });

  it('formats nested values and cuts long ones', () => {
    expect(formatValue({ a: [1, 'x'] })).toBe('{a: [1, "x"]}');
    expect(formatValue(Array.from({ length: 500 }, (_, i) => i)).endsWith('…')).toBe(true);
  });
});
