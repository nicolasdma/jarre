/**
 * Main-thread side of the Python runner. Unlike the TypeScript runner
 * (./run-in-worker.ts: one throwaway worker per run), Python needs Pyodide,
 * several MB from the CDN and a second or two to start, so one worker stays
 * loaded and runs each request in a fresh namespace (./python-run.ts). A run
 * that goes past its budget (an infinite loop) gets the worker terminated,
 * and a fresh one starts loading at once for the next run. The page never
 * evaluates the candidate's code itself.
 *
 * Protocol with ./python.worker.ts:
 *   worker → page  { type: 'ready' } | { type: 'load-error', message } | { type: 'result', id, result }
 *   page → worker  { type: 'run', id, req }
 */

import type { RunResult } from './harness';
import type { PythonRunRequest } from './python-run';
import { PYTHON_LOAD_TIMEOUT_MS, PYTHON_RUN_TIMEOUT_MS, type PythonRunMessage, type PythonWorkerMessage } from './python-protocol';

export { PYODIDE_VERSION, PYTHON_LOAD_TIMEOUT_MS, PYTHON_RUN_TIMEOUT_MS } from './python-protocol';

/** The part of the Worker API the runner uses; tests pass a Node worker_threads adapter. */
export interface WorkerLike {
  postMessage(message: PythonRunMessage): void;
  terminate(): void;
  onmessage: ((event: { data: PythonWorkerMessage }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
}

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'error';

function createBrowserWorker(): WorkerLike {
  // A classic worker, like runner.worker.ts: Turbopack bootstraps workers with importScripts.
  return new Worker(new URL('./python.worker.ts', import.meta.url)) as unknown as WorkerLike;
}

const failed = (message: string, started: number, extra: Partial<RunResult> = {}): RunResult => ({
  ok: false,
  runtimeError: message,
  logs: [],
  tests: [],
  ms: Date.now() - started,
  ...extra,
});

export class PythonRunner {
  private worker: WorkerLike | null = null;
  private loading: Promise<WorkerLike> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private seq = 0;
  /** Stops a load in progress (dispose while loading). */
  private abortLoad: (() => void) | null = null;
  private listeners = new Set<(s: PythonStatus) => void>();
  status: PythonStatus = 'idle';

  constructor(
    private readonly create: () => WorkerLike = createBrowserWorker,
    private readonly loadTimeoutMs = PYTHON_LOAD_TIMEOUT_MS,
  ) {}

  subscribe(listener: (s: PythonStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(s: PythonStatus) {
    this.status = s;
    for (const l of this.listeners) l(s);
  }

  /** Start loading the interpreter now, so the first run does not wait for it. Never rejects. */
  warm(): Promise<void> {
    return this.ensure().then(
      () => undefined,
      () => undefined,
    );
  }

  private ensure(): Promise<WorkerLike> {
    if (this.loading) return this.loading;
    this.setStatus('loading');
    this.loading = new Promise<WorkerLike>((resolve, reject) => {
      let w: WorkerLike | null = null;
      const fail = (message: string) => {
        clearTimeout(timer);
        this.abortLoad = null;
        w?.terminate();
        this.worker = null;
        this.loading = null;
        this.setStatus('error');
        reject(new Error(message));
      };
      const timer = setTimeout(() => fail(`Python did not load in ${Math.round(this.loadTimeoutMs / 1000)} s`), this.loadTimeoutMs);
      try {
        w = this.create();
      } catch (e) {
        fail(`Could not start the Python runner: ${(e as Error).message}`);
        return;
      }
      const worker = w;
      this.abortLoad = () => fail('Python runner stopped');
      worker.onmessage = (event) => {
        if (event.data.type === 'ready') {
          clearTimeout(timer);
          this.abortLoad = null;
          this.worker = worker;
          this.setStatus('ready');
          resolve(worker);
        } else if (event.data.type === 'load-error') {
          fail(event.data.message);
        }
      };
      worker.onerror = (event) => fail(event.message || 'The Python runner crashed while loading');
    });
    return this.loading;
  }

  /** Run one request; requests queue, one at a time. Never rejects. */
  run(req: PythonRunRequest, timeoutMs = PYTHON_RUN_TIMEOUT_MS): Promise<RunResult> {
    const next = this.queue.then(() => this.runNow(req, timeoutMs));
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async runNow(req: PythonRunRequest, timeoutMs: number): Promise<RunResult> {
    const started = Date.now();
    let worker: WorkerLike;
    try {
      worker = await this.ensure();
    } catch (e) {
      return failed(`Python could not load: ${(e as Error).message}. Check the connection and run again.`, started);
    }
    const id = ++this.seq;
    return new Promise<RunResult>((resolve) => {
      const timer = setTimeout(() => {
        this.kill(worker);
        resolve(failed(`Stopped after ${Math.round(timeoutMs / 1000)} s: an infinite loop?`, started, { timedOut: true }));
        // A fresh interpreter for the next run.
        void this.warm();
      }, timeoutMs);
      worker.onmessage = (event) => {
        if (event.data.type === 'result' && event.data.id === id) {
          clearTimeout(timer);
          resolve(event.data.result);
        }
      };
      worker.onerror = (event) => {
        clearTimeout(timer);
        this.kill(worker);
        resolve(failed(event.message || 'The Python runner crashed', started));
      };
      worker.postMessage({ type: 'run', id, req });
    });
  }

  private kill(worker: WorkerLike) {
    worker.terminate();
    if (this.worker === worker) {
      this.worker = null;
      this.loading = null;
      this.setStatus('idle');
    }
  }

  /** Stop the interpreter (leaving the page that needed it). */
  dispose() {
    this.abortLoad?.();
    if (this.worker) this.kill(this.worker);
    this.setStatus('idle');
  }
}

let shared: PythonRunner | null = null;

/** The page's Python runner, created on first use. */
export function pythonRunner(): PythonRunner {
  shared ??= new PythonRunner();
  return shared;
}
