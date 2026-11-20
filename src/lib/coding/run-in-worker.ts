/**
 * Main-thread side of the code runner: one fresh Web Worker per run, killed
 * when it runs past its budget (an infinite loop, a promise that never
 * settles). The page never evaluates the candidate's code itself.
 */

import type { RunResult } from './harness';
import type { RunRequest } from './transpile';

/** Wall-clock budget of one run, ms: transpile, the file, every test. */
export const RUN_TIMEOUT_MS = 6000;

/** The part of the Worker API a run uses; the tests pass a Node worker_threads adapter. */
export interface RunWorkerLike {
  postMessage(message: RunRequest): void;
  terminate(): void;
  onmessage: ((event: { data: RunResult }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
}

function createRunnerWorker(): RunWorkerLike {
  // A classic worker: Turbopack bootstraps workers with importScripts, which module workers do not support.
  return new Worker(new URL('./runner.worker.ts', import.meta.url)) as unknown as RunWorkerLike;
}

export function runInWorker(req: RunRequest, timeoutMs = RUN_TIMEOUT_MS, create: () => RunWorkerLike = createRunnerWorker): Promise<RunResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    let worker: RunWorkerLike;
    try {
      worker = create();
    } catch (e) {
      resolve({ ok: false, runtimeError: `Could not start the runner: ${(e as Error).message}`, logs: [], tests: [], ms: 0 });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        timedOut: true,
        runtimeError: `Stopped after ${Math.round(timeoutMs / 1000)} s: an infinite loop, or a promise that never settles?`,
        logs: [],
        tests: [],
        ms: Date.now() - started,
      });
    }, timeoutMs);
    worker.onmessage = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };
    worker.onerror = (event) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, runtimeError: event.message || 'The runner crashed', logs: [], tests: [], ms: Date.now() - started });
    };
    worker.postMessage(req);
  });
}
