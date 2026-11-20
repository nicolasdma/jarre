/**
 * The page side of the Python runner against real threads running a real
 * Pyodide (the `pyodide` dev dependency): an infinite Python loop is stopped
 * at the budget, its thread killed, and the next run gets a fresh interpreter.
 */

import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import type { PythonRunMessage, PythonWorkerMessage } from '../python-protocol';
import { PythonRunner, type PythonStatus, type WorkerLike } from '../run-python';
import { nodeWorker, type NodeWorkerLike } from './node-worker';

const PYODIDE_CJS = createRequire(import.meta.url).resolve('pyodide');

/** Loads Pyodide, says ready, runs each request's code and answers with what it printed. */
const PYODIDE_THREAD = `
const { parentPort, workerData } = require('node:worker_threads');
const { loadPyodide } = require(workerData);
loadPyodide().then((py) => {
  parentPort.postMessage({ type: 'ready' });
  parentPort.on('message', (m) => {
    const logs = [];
    py.setStdout({ batched: (s) => logs.push(s) });
    py.runPython(m.req.code, { globals: py.globals.get('dict')() });
    parentPort.postMessage({ type: 'result', id: m.id, result: { ok: true, logs, tests: [], ms: 0 } });
  });
});`;

describe('PythonRunner', () => {
  it('stops an infinite Python loop, kills the thread and reloads for the next run', async () => {
    const threads: NodeWorkerLike<PythonRunMessage, PythonWorkerMessage>[] = [];
    const runner = new PythonRunner(() => {
      const t = nodeWorker<PythonRunMessage, PythonWorkerMessage>(PYODIDE_THREAD, PYODIDE_CJS);
      threads.push(t);
      return t as WorkerLike;
    });
    const seen: PythonStatus[] = [];
    runner.subscribe((s) => seen.push(s));

    const stuck = await runner.run({ code: 'while True:\n    pass\n' }, 1000);
    expect(stuck).toMatchObject({ ok: false, timedOut: true });
    expect(stuck.runtimeError).toMatch(/infinite loop/);
    await expect(threads[0].exited).resolves.toBeTypeOf('number');

    const next = await runner.run({ code: 'print("back")\n' }, 10_000);
    expect(next).toMatchObject({ ok: true, logs: ['back'] });
    expect(threads).toHaveLength(2);
    expect(seen).toEqual(['loading', 'ready', 'idle', 'loading', 'ready']);
    runner.dispose();
    await expect(threads[1].exited).resolves.toBeTypeOf('number');
  }, 60_000);

  it('says when Python could not load, and tries again on the next run', async () => {
    let created = 0;
    const runner = new PythonRunner(() => {
      created += 1;
      const w: WorkerLike = {
        onmessage: null,
        onerror: null,
        terminate: () => {},
        postMessage: () => {},
      };
      queueMicrotask(() => w.onmessage?.({ data: { type: 'load-error', message: 'offline' } }));
      return w;
    });
    const r = await runner.run({ code: 'print(1)' });
    expect(r.runtimeError).toBe('Python could not load: offline. Check the connection and run again.');
    expect(runner.status).toBe('error');
    await runner.run({ code: 'print(1)' });
    expect(created).toBe(2);
  });

  it('gives up loading after its budget', async () => {
    const runner = new PythonRunner(
      () => ({ onmessage: null, onerror: null, terminate: () => {}, postMessage: () => {} }),
      50,
    );
    const r = await runner.run({ code: 'print(1)' });
    expect(r.runtimeError).toMatch(/did not load in 0 s/);
  });
});
