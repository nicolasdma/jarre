/**
 * One entry point for a run in the pad's language: TypeScript and JavaScript
 * in a throwaway worker (./run-in-worker.ts), Python on the page's Pyodide
 * worker (./run-python.ts). Either way the code never runs on the page and
 * never on a server.
 */

import type { RunResult } from './harness';
import type { CodeLanguage } from './languages';
import { runInWorker } from './run-in-worker';
import { pythonRunner } from './run-python';
import type { RunRequest } from './transpile';

export function runInLanguage(language: CodeLanguage, req: RunRequest): Promise<RunResult> {
  return language === 'python' ? pythonRunner().run(req) : runInWorker(req);
}
