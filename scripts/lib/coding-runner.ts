/**
 * Node runner for the coding harness: each run in its own worker thread,
 * terminated after `timeoutMs`, so a starter whose TODO sits inside a loop
 * fails as "timed out" instead of hanging the verifier. Same harness and
 * transpiler as the browser's Web Worker (src/lib/coding/transpile.ts).
 */
import { Worker } from 'node:worker_threads';
import { join } from 'node:path';
import type { RunResult } from '../../src/lib/coding/harness';
import type { RunRequest } from '../../src/lib/coding/transpile';

const THREAD = join(__dirname, 'coding-thread.ts');

export function runInThread(req: RunRequest, timeoutMs = 8000): Promise<RunResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const worker = new Worker(THREAD, { execArgv: ['--require', 'tsx/cjs'] });
    const done = (r: RunResult) => {
      clearTimeout(timer);
      void worker.terminate();
      resolve(r);
    };
    const timer = setTimeout(
      () => done({ ok: false, timedOut: true, runtimeError: `timed out after ${timeoutMs} ms`, logs: [], tests: [], ms: Date.now() - started }),
      timeoutMs,
    );
    worker.on('message', (r: RunResult) => done(r));
    worker.on('error', (e) => done({ ok: false, runtimeError: e.message, logs: [], tests: [], ms: Date.now() - started }));
    worker.postMessage(req);
  });
}
