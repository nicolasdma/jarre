import { describe, expect, it } from 'vitest';
import { runCode } from '../transpile';
import { verifyProblem } from '../verify';
import { SUM_PROBLEM } from './fixture';

describe('verifyProblem', () => {
  it('passes a consistent problem', async () => {
    const r = await verifyProblem(SUM_PROBLEM, runCode);
    expect(r.problems).toEqual([]);
    expect(r.solution).toEqual({ passed: 3, total: 3 });
  });

  it('flags a reference solution that fails a test', async () => {
    const broken = { ...SUM_PROBLEM, solution: { ...SUM_PROBLEM.solution, code: 'export function sum(n: number[]) { return n.length ? n.reduce((a, b) => a + b) : 1; }' } };
    const r = await verifyProblem(broken, runCode);
    expect(r.problems.join(' ')).toMatch(/solution fails the hidden tests: "empty"/);
  });

  it('flags a starter that already passes every test', async () => {
    const leaky = { ...SUM_PROBLEM, starter: SUM_PROBLEM.solution.code };
    const r = await verifyProblem(leaky, runCode);
    expect(r.problems).toEqual(['starter already passes every test: the tests check nothing it lacks']);
  });

  it('flags a starter that does not compile', async () => {
    const r = await verifyProblem({ ...SUM_PROBLEM, starter: 'export function sum( {' }, runCode);
    expect(r.problems[0]).toMatch(/^starter does not compile/);
  });

  it('runs the examples and the hidden tests in their own scopes: both may declare the same helper', async () => {
    const helper = "const sorted = (a: number[]) => [...a].sort((x, y) => x - y);\n";
    const both = { ...SUM_PROBLEM, example_tests: helper + SUM_PROBLEM.example_tests, tests: helper + SUM_PROBLEM.tests };
    const r = await verifyProblem(both, runCode);
    expect(r.problems).toEqual([]);
    const all = await runCode({ code: SUM_PROBLEM.solution.code, tests: [both.example_tests, both.tests], exportNames: ['sum'] });
    expect(all.tests.map((t) => t.pass)).toEqual([true, true, true]);
  });
});
