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

export interface RunRequest {
  /** The candidate's TypeScript file. */
  code: string;
  /** TypeScript tests importing './solution'; absent: just run the file. */
  tests?: string;
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
  let testsJs: string | undefined;
  if (req.tests) {
    const tests = transpileTs(req.tests);
    if ('error' in tests) {
      return { ok: false, compileError: { file: 'tests', ...tests.error }, logs: [], tests: [], ms: Date.now() - started };
    }
    testsJs = tests.js;
  }
  const input: HarnessInput = {
    solutionJs: solution.js,
    testsJs,
    exportNames: req.exportNames,
    testTimeoutMs: req.testTimeoutMs,
  };
  return runHarness(input);
}
