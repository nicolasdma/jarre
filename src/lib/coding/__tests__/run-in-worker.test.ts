import { describe, expect, it } from 'vitest';
import type { RunResult } from '../harness';
import { runInWorker, type RunWorkerLike } from '../run-in-worker';
import type { RunRequest } from '../transpile';
import { nodeWorker, type NodeWorkerLike } from './node-worker';

/** A thread that runs the request's code as-is and answers like the real runner. */
const EVAL_RUNNER = `
const { parentPort } = require('node:worker_threads');
parentPort.on('message', (req) => {
  const logs = [];
  new Function('console', req.code)({ log: (...a) => logs.push(a.join(' ')) });
  parentPort.postMessage({ ok: true, logs, tests: [], ms: 0 });
});`;

describe('runInWorker', () => {
  it('stops an infinite loop at the timeout and kills its thread', async () => {
    let worker: NodeWorkerLike<RunRequest, RunResult> | null = null;
    const create = () => (worker = nodeWorker<RunRequest, RunResult>(EVAL_RUNNER)) as RunWorkerLike;
    const t0 = Date.now();
    const result = await runInWorker({ code: 'while (true) {}' }, 300, create);
    expect(result).toMatchObject({ ok: false, timedOut: true });
    expect(result.runtimeError).toMatch(/infinite loop/);
    expect(Date.now() - t0).toBeLessThan(3000);
    await expect(worker!.exited).resolves.toBeTypeOf('number');
  });

  it('returns what a run that finishes printed, and ends its thread', async () => {
    let worker: NodeWorkerLike<RunRequest, RunResult> | null = null;
    const create = () => (worker = nodeWorker<RunRequest, RunResult>(EVAL_RUNNER)) as RunWorkerLike;
    const result = await runInWorker({ code: 'console.log("hi", 1 + 1)' }, 5000, create);
    expect(result).toMatchObject({ ok: true, logs: ['hi 2'], tests: [] });
    await expect(worker!.exited).resolves.toBeTypeOf('number');
  });

  it('reports a runner that cannot start', async () => {
    const result = await runInWorker({ code: '' }, 1000, () => {
      throw new Error('no workers here');
    });
    expect(result.runtimeError).toBe('Could not start the runner: no workers here');
  });
});
