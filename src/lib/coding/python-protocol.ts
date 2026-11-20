/**
 * What the page and the Python worker say to each other, and the Pyodide
 * release. Its own module so the worker (./python.worker.ts) does not import
 * the page side (./run-python.ts), which creates that worker.
 */

import type { RunResult } from './harness';
import type { PythonRunRequest } from './python-run';

/**
 * Pyodide release the worker loads (and the `pyodide` dev dependency the tests
 * use, pinned to the same). The 0.29 line: from 314 on, Pyodide refuses classic
 * workers ("Classic web workers are not supported"), and Turbopack only builds
 * classic ones (see ./run-in-worker.ts).
 */
export const PYODIDE_VERSION = '0.29.5';
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** Budget to download and start the interpreter, ms: the first time it comes from the network. */
export const PYTHON_LOAD_TIMEOUT_MS = 90_000;
/** Wall-clock budget of one Python run once the interpreter is up, ms. Python is slower than JS on the same tests. */
export const PYTHON_RUN_TIMEOUT_MS = 10_000;

export type PythonWorkerMessage =
  | { type: 'ready' }
  | { type: 'load-error'; message: string }
  | { type: 'result'; id: number; result: RunResult };

export interface PythonRunMessage {
  type: 'run';
  id: number;
  req: PythonRunRequest;
}

