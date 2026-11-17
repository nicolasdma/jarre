/**
 * Web Worker that runs the candidate's code (src/lib/coding/run-in-worker.ts
 * starts one per run and terminates it on timeout). Nothing here touches the
 * page: no DOM, no storage, no network beyond what any worker could do, and
 * the main thread kills it when time is up, so an infinite loop costs one
 * worker, not the tab.
 */

import { runCode, type RunRequest } from './transpile';

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const result = await runCode(event.data);
  (self as unknown as Worker).postMessage(result);
};
