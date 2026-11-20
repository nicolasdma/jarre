/**
 * A Node worker_threads thread behind the Web Worker shape the runners use
 * (postMessage, terminate, onmessage, onerror), so the timeout tests stop a
 * real thread stuck in a real infinite loop.
 */

import { Worker } from 'node:worker_threads';

export interface NodeWorkerLike<In, Out> {
  postMessage(message: In): void;
  terminate(): void;
  onmessage: ((event: { data: Out }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
  /** Resolves with the exit code when the thread stops (terminate included). */
  exited: Promise<number>;
}

/** `source` is CommonJS run with `eval: true`; `workerData` reaches it as require('node:worker_threads').workerData. */
export function nodeWorker<In, Out>(source: string, workerData?: unknown): NodeWorkerLike<In, Out> {
  const thread = new Worker(source, { eval: true, workerData });
  const like: NodeWorkerLike<In, Out> = {
    onmessage: null,
    onerror: null,
    postMessage: (m) => thread.postMessage(m),
    terminate: () => void thread.terminate(),
    exited: new Promise((resolve) => thread.once('exit', resolve)),
  };
  thread.on('message', (data: Out) => like.onmessage?.({ data }));
  thread.on('error', (err: Error) => like.onerror?.({ message: err.message }));
  return like;
}
