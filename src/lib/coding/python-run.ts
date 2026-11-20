/**
 * Runs a candidate's Python file on a loaded Pyodide, the way the TypeScript
 * runner (./transpile.ts) runs a TypeScript one: the file executes in a fresh
 * namespace, `print` goes to the output, and the lesson's tests (TypeScript,
 * `import { twoSum } from './solution'`) run unchanged against it. The
 * functions and classes the tests import are bridged from Python: arguments
 * go in as Python lists and dicts, results come back as JS arrays and objects.
 *
 * A name the tests import is looked up as written (`twoSum`), in snake_case
 * (`two_sum`), and as a method of a LeetCode-style `class Solution`. A class
 * the tests construct (`new LRUCache(2)`) becomes a JS object whose methods
 * call the Python instance's.
 *
 * Pure with respect to where it runs: the Web Worker
 * (./python.worker.ts) passes the Pyodide it loaded from the CDN, the tests
 * (./__tests__/python-run.test.ts) the one from the `pyodide` package.
 * Infinite loops are not this module's job: the main thread terminates the
 * worker (./run-python.ts).
 */

import { MAX_LOG_LINES, runHarness, type RunResult } from './harness';
import { transpileTests } from './transpile';

/** The part of Pyodide's API this module uses. */
export interface PyodideLike {
  runPython(code: string, options?: { globals?: unknown; filename?: string }): unknown;
  globals: { get(name: string): unknown };
  toPy(value: unknown): unknown;
  setStdout(options: { batched: (line: string) => void }): void;
  setStderr(options: { batched: (line: string) => void }): void;
}

export interface PythonRunRequest {
  /** The candidate's Python file. */
  code: string;
  /** TypeScript tests importing './solution', one file or several; absent: just run the file. */
  tests?: string | string[];
  /** Names the tests import. */
  exportNames?: string[];
  testTimeoutMs?: number;
}

/** The file name tracebacks show for the candidate's code. */
export const PY_FILENAME = 'solution.py';

/** Python helpers the bridge calls. Run once per Pyodide, in their own namespace. */
const BRIDGE_PY = `
import re as _re

def _snake(name):
    return _re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()

def find(ns, name):
    for key in (name, _snake(name)):
        obj = ns.get(key)
        if obj is not None and callable(obj):
            return ['class' if isinstance(obj, type) else 'function', obj]
    sol = ns.get('Solution')
    if isinstance(sol, type) and name != 'Solution':
        inst = sol()
        for key in (name, _snake(name)):
            fn = getattr(inst, key, None)
            if callable(fn):
                return ['function', fn]
    return None

def call(fn, args):
    return fn(*args)

def method(obj, name, args):
    fn = getattr(obj, name, None)
    if fn is None:
        fn = getattr(obj, _snake(name))
    return fn(*args)
`;

interface PyProxyLike {
  toJs(options?: Record<string, unknown>): unknown;
  destroy(): void;
}

type PyFn = (...args: unknown[]) => unknown;

interface Bridge {
  find: PyFn;
  call: PyFn;
  method: PyFn;
}

const bridges = new WeakMap<PyodideLike, Bridge>();

function bridgeOf(py: PyodideLike): Bridge {
  const hit = bridges.get(py);
  if (hit) return hit;
  const ns = (py.globals.get('dict') as PyFn)() as { get(name: string): unknown };
  py.runPython(BRIDGE_PY, { globals: ns });
  const bridge = { find: ns.get('find') as PyFn, call: ns.get('call') as PyFn, method: ns.get('method') as PyFn };
  bridges.set(py, bridge);
  return bridge;
}

const isProxy = (v: unknown): v is PyProxyLike =>
  (typeof v === 'object' || typeof v === 'function') && v !== null && typeof (v as PyProxyLike).toJs === 'function';

/** A Python value as plain JS: lists and tuples become arrays, dicts objects, sets Sets. */
function toPlain(v: unknown): unknown {
  if (!isProxy(v)) return v;
  try {
    return v.toJs({ dict_converter: Object.fromEntries, create_pyproxies: false });
  } catch {
    return String(v);
  } finally {
    v.destroy();
  }
}

/** What a Python exception says, in one line: "IndexError: list index out of range (line 4)". */
export function describePythonError(message: string): { name: string; text: string; line?: number } {
  const lines = message.split('\n').map((l) => l.trimEnd());
  let line: number | undefined;
  const fileRe = new RegExp(`File "${PY_FILENAME.replace('.', '\\.')}", line (\\d+)`);
  for (const l of lines) {
    const m = fileRe.exec(l);
    if (m) line = Number(m[1]);
  }
  const last = [...lines].reverse().find((l) => l.trim()) ?? 'Error';
  const colon = last.indexOf(': ');
  const name = colon > 0 && /^[\w.]+$/.test(last.slice(0, colon)) ? last.slice(0, colon) : last.trim();
  const text = colon > 0 && name !== last.trim() ? last.slice(colon + 2) : '';
  return { name, text, line };
}

class PythonException extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

/** Rethrow a Pyodide error as the Python exception it carries, without Pyodide's frames. */
function asPythonException(e: unknown): unknown {
  if (!(e instanceof Error) || (e.name !== 'PythonError' && !e.message.startsWith('Traceback'))) return e;
  const d = describePythonError(e.message);
  return new PythonException(d.name, `${d.text}${d.line ? ` (line ${d.line})` : ''}`);
}

const COMPILE_ERRORS = new Set(['SyntaxError', 'IndentationError', 'TabError']);

/** Run the file, then the tests against it. Never throws: every failure ends up in the result. */
export async function runPythonCode(py: PyodideLike, req: PythonRunRequest): Promise<RunResult> {
  const started = Date.now();
  const logs: string[] = [];
  const push = (prefix: string) => (line: string) => {
    if (logs.length < MAX_LOG_LINES) logs.push(`${prefix}${line}`);
    else if (logs.length === MAX_LOG_LINES) logs.push('… (more output cut)');
  };
  py.setStdout({ batched: push('') });
  py.setStderr({ batched: push('error: ') });

  const tests = transpileTests(req.tests);
  if (tests && 'error' in tests) return { ok: false, compileError: { file: 'tests', ...tests.error }, logs, tests: [], ms: Date.now() - started };
  const testsJs = tests?.js;

  const bridge = bridgeOf(py);
  const ns = (py.globals.get('dict') as PyFn)() as PyProxyLike & { set(k: string, v: unknown): void };
  ns.set('__name__', '__main__');
  try {
    try {
      py.runPython(req.code, { globals: ns, filename: PY_FILENAME });
    } catch (e) {
      const d = describePythonError((e as Error).message ?? String(e));
      if (COMPILE_ERRORS.has(d.name)) {
        return { ok: false, compileError: { file: 'solution', message: `${d.name}: ${d.text}`, line: d.line }, logs, tests: [], ms: Date.now() - started };
      }
      return { ok: false, runtimeError: `${d.name}${d.text ? `: ${d.text}` : ''}${d.line ? ` (line ${d.line})` : ''}`, logs, tests: [], ms: Date.now() - started };
    }

    if (!testsJs) return { ok: true, logs, tests: [], ms: Date.now() - started };

    const solutionExports: Record<string, unknown> = {};
    for (const name of req.exportNames ?? []) {
      const found = toPlainPair(bridge.find(ns, name));
      solutionExports[name] = found ? wrap(py, bridge, found.kind, found.obj) : missing(name);
    }
    return await runHarness({ solutionJs: '', testsJs, solutionExports, logs, testTimeoutMs: req.testTimeoutMs });
  } finally {
    ns.destroy();
  }
}

/** `find` returns a Python list [kind, obj]: keep the object as a live proxy. */
function toPlainPair(v: unknown): { kind: 'class' | 'function'; obj: PyFn } | null {
  if (!isProxy(v)) return null;
  const pair = v as unknown as { get(i: number): unknown } & PyProxyLike;
  const kind = pair.get(0) as 'class' | 'function';
  const obj = pair.get(1) as PyFn;
  pair.destroy();
  return { kind, obj };
}

function missing(name: string): PyFn {
  return () => {
    throw new PythonException('NameError', `define ${name} in your file (a function, or a method of class Solution)`);
  };
}

function withArgs<T>(py: PyodideLike, args: unknown[], fn: (pyArgs: unknown) => T): T {
  const pyArgs = py.toPy(args);
  try {
    return fn(pyArgs);
  } catch (e) {
    throw asPythonException(e);
  } finally {
    if (isProxy(pyArgs)) pyArgs.destroy();
  }
}

function wrap(py: PyodideLike, bridge: Bridge, kind: 'class' | 'function', obj: PyFn): unknown {
  if (kind === 'function') {
    return (...args: unknown[]) => withArgs(py, args, (a) => toPlain(bridge.call(obj, a)));
  }
  // A class: `new Cls(...)` in the tests gets an object whose methods call the Python instance's.
  return function PythonClass(...args: unknown[]) {
    const instance = withArgs(py, args, (a) => bridge.call(obj, a));
    return new Proxy(
      {},
      {
        get: (_t, prop) => {
          // Never a thenable: `await instance` and the harness's promise check must not call into Python.
          if (typeof prop !== 'string' || prop === 'then') return undefined;
          return (...margs: unknown[]) => withArgs(py, margs, (a) => toPlain(bridge.method(instance, prop, a)));
        },
      },
    );
  };
}
