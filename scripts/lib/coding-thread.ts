/** One coding run in a worker thread, for scripts/verify-coding.ts (killed on timeout by the caller). */
import { parentPort } from 'node:worker_threads';
import { runCode, type RunRequest } from '../../src/lib/coding/transpile';

parentPort?.on('message', async (req: RunRequest) => {
  parentPort?.postMessage(await runCode(req));
});
