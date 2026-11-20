/**
 * Proof that a lesson's coding problems hold together, run before seeding
 * (scripts/verify-coding.ts, and seed-lesson.ts when the lesson has a coding
 * round):
 * - the reference solution passes the example tests and the hidden tests;
 * - the mock's starter and every exercise starter compile and fail at least
 *   one test, so the tests check something and no starter gives it away.
 *
 * The runner is injected: Node passes one that runs each check in a worker
 * thread with a timeout (a guided starter with a TODO inside a loop can spin
 * forever), the unit tests pass `runCode` directly.
 */

import { allTestsOf, type CodingConfig, type CodingProblem } from './format';
import type { RunResult } from './harness';
import type { RunRequest } from './transpile';

export type Runner = (req: RunRequest) => Promise<RunResult>;

export interface ProblemReport {
  id: string;
  problems: string[];
  solution: { passed: number; total: number };
}

const passed = (r: RunResult) => r.tests.filter((t) => t.pass && !t.own).length;
const total = (r: RunResult) => r.tests.filter((t) => !t.own).length;

function describeFailure(r: RunResult): string {
  if (r.compileError) return `${r.compileError.file} does not compile: ${r.compileError.message}${r.compileError.line ? ` (line ${r.compileError.line})` : ''}`;
  if (r.runtimeError) return r.runtimeError;
  const failed = r.tests.filter((t) => !t.pass && !t.own);
  return failed.map((t) => `"${t.name}": ${t.error}`).join('; ');
}

export async function verifyProblem(problem: CodingProblem, run: Runner): Promise<ProblemReport> {
  const issues: string[] = [];
  const exportNames = problem.exports;
  const allTests = allTestsOf(problem);

  const examples = await run({ code: problem.solution.code, tests: problem.example_tests, exportNames });
  if (!examples.ok || total(examples) === 0 || passed(examples) !== total(examples)) {
    issues.push(`solution fails the example tests: ${describeFailure(examples) || 'no tests registered'}`);
  }
  const hidden = await run({ code: problem.solution.code, tests: problem.tests, exportNames });
  if (!hidden.ok || total(hidden) === 0 || passed(hidden) !== total(hidden)) {
    issues.push(`solution fails the hidden tests: ${describeFailure(hidden) || 'no tests registered'}`);
  }

  const starters = [
    { label: 'starter', code: problem.starter },
    ...problem.exercises.map((e) => ({ label: `exercise ${e.id}`, code: e.starter })),
  ];
  for (const s of starters) {
    const r = await run({ code: s.code, tests: allTests, exportNames });
    if (r.compileError) {
      issues.push(`${s.label} does not compile: ${r.compileError.message}`);
    } else if (r.runtimeError?.startsWith('In the tests:')) {
      issues.push(`the tests do not load: ${r.runtimeError}`);
    } else if (r.ok && total(r) > 0 && passed(r) === total(r)) {
      issues.push(`${s.label} already passes every test: the tests check nothing it lacks`);
    }
  }

  return { id: problem.id, problems: issues, solution: { passed: passed(hidden) + passed(examples), total: total(hidden) + total(examples) } };
}

export async function verifyCodingConfig(config: CodingConfig, run: Runner): Promise<{ ok: boolean; reports: ProblemReport[] }> {
  const reports: ProblemReport[] = [];
  for (const p of config.problems) reports.push(await verifyProblem(p, run));
  return { ok: reports.every((r) => r.problems.length === 0), reports };
}
