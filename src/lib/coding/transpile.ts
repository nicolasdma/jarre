/**
 * TypeScript → CommonJS for the coding harness, with Sucrase: it only strips
 * types and rewrites imports (no type checking), which is what an editor run
 * needs and is small and fast enough to load in a Web Worker. The real
 * interview is judged on logic and talk, not on type errors.
 */

import { transform } from 'sucrase';
import { runHarness, type HarnessInput, type RunResult } from './harness';

export interface TranspileError {
  message: string;
  line?: number;
  column?: number;
}

export function transpileTs(code: string): { js: string } | { error: TranspileError } {
  try {
    const { code: js } = transform(code, { transforms: ['typescript', 'imports'], disableESTransforms: true });
    return { js };
  } catch (e) {
    const err = e as Error & { loc?: { line: number; column: number } };
    const message = (err.message || 'Syntax error').replace(/\s*\(\d+:\d+\)\s*$/, '');
    return { error: { message, line: err.loc?.line, column: err.loc?.column } };
  }
}

/** Every test file transpiled, or the first error. Undefined when there are no tests. */
export function transpileTests(tests: string | string[] | undefined): { js: string[] } | { error: TranspileError } | undefined {
  if (!tests) return undefined;
  const js: string[] = [];
  for (const file of typeof tests === 'string' ? [tests] : tests) {
    const t = transpileTs(file);
    if ('error' in t) return t;
    js.push(t.js);
  }
  return { js };
}

export interface RunRequest {
  /** The candidate's TypeScript file. */
  code: string;
  /** TypeScript tests importing './solution', one file or several (each in its own scope); absent: just run the file. */
  tests?: string | string[];
  exportNames?: string[];
  testTimeoutMs?: number;
}

/** Transpile both files and run them in this realm. The worker and the verifier both call this. */
export async function runCode(req: RunRequest): Promise<RunResult> {
  const started = Date.now();
  const solution = transpileTs(req.code);
  if ('error' in solution) {
    return { ok: false, compileError: { file: 'solution', ...solution.error }, logs: [], tests: [], ms: Date.now() - started };
  }
  const tests = transpileTests(req.tests);
  if (tests && 'error' in tests) {
    return { ok: false, compileError: { file: 'tests', ...tests.error }, logs: [], tests: [], ms: Date.now() - started };
  }
  const testsJs = tests?.js;
  const input: HarnessInput = {
    solutionJs: solution.js,
    testsJs,
    exportNames: req.exportNames,
    testTimeoutMs: req.testTimeoutMs,
  };
  return runHarness(input);
}
