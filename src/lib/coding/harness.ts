/**
 * The test harness the candidate's code runs in: a tiny Jest-like `test` and
 * `expect`, console capture and a two-module loader (`./solution` and the
 * tests). Pure JavaScript with no DOM and no Node APIs, so the same code runs
 * in the browser's Web Worker (src/lib/coding/runner.worker.ts) and in Node
 * (scripts/verify-coding.ts): a reference solution that passes here passes
 * there.
 *
 * Input is already transpiled to CommonJS (src/lib/coding/transpile.ts).
 * Infinite loops are not this module's job: the worker is terminated from the
 * main thread when it runs out of time.
 */

export interface TestOutcome {
  name: string;
  pass: boolean;
  /** Assertion or runtime error, one or two lines. */
  error?: string;
  ms: number;
  /** Registered in the candidate's own file (not the lesson's tests). */
  own?: boolean;
}

export interface RunResult {
  /** The code compiled and the module ran without throwing at the top level. */
  ok: boolean;
  compileError?: { file: 'solution' | 'tests'; message: string; line?: number; column?: number };
  runtimeError?: string;
  logs: string[];
  tests: TestOutcome[];
  timedOut?: boolean;
  ms: number;
}

export interface HarnessInput {
  /** The candidate's file, CommonJS. */
  solutionJs: string;
  /** The tests, CommonJS, importing './solution'. Absent: only run the file. */
  testsJs?: string;
  /** Names the tests import: copied onto `exports` when the file forgot `export`. */
  exportNames?: string[];
  /** Per-test limit for async tests, ms. */
  testTimeoutMs?: number;
}

const MAX_LOG_LINES = 200;
const MAX_VALUE_CHARS = 240;

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatValue(value: unknown, seen = new Set<unknown>()): string {
  const out = formatInner(value, seen);
  return out.length > MAX_VALUE_CHARS ? `${out.slice(0, MAX_VALUE_CHARS)}…` : out;
}

function formatInner(value: unknown, seen: Set<unknown>): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) return String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  try {
    if (Array.isArray(value)) return `[${value.map((v) => formatInner(v, seen)).join(', ')}]`;
    if (value instanceof Map) return `Map(${value.size}) {${[...value].map(([k, v]) => `${formatInner(k, seen)} => ${formatInner(v, seen)}`).join(', ')}}`;
    if (value instanceof Set) return `Set(${value.size}) {${[...value].map((v) => formatInner(v, seen)).join(', ')}}`;
    if (value instanceof Date) return `Date(${isNaN(value.getTime()) ? 'Invalid' : value.toISOString()})`;
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    const entries = Object.entries(value as Record<string, unknown>);
    const name = (value as object).constructor && (value as object).constructor !== Object ? `${(value as object).constructor.name} ` : '';
    return `${name}{${entries.map(([k, v]) => `${k}: ${formatInner(v, seen)}`).join(', ')}}`;
  } finally {
    seen.delete(value);
  }
}

function formatLogArgs(args: unknown[]): string {
  return args.map((a) => (typeof a === 'string' ? a : formatValue(a))).join(' ');
}

// ---------------------------------------------------------------------------
// Equality
// ---------------------------------------------------------------------------

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    return true;
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  }
  const ka = Object.keys(a as object).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
  const kb = Object.keys(b as object).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

// ---------------------------------------------------------------------------
// expect
// ---------------------------------------------------------------------------

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

type Matchers = Record<string, (...args: unknown[]) => void>;

function makeMatchers(actual: unknown, negate: boolean): Matchers {
  const check = (pass: boolean, message: string, negMessage: string) => {
    if (pass === negate) throw new AssertionError(negate ? negMessage : message);
  };
  const a = () => formatValue(actual);
  return {
    toBe: (expected) => check(Object.is(actual, expected), `expected ${formatValue(expected)}, got ${a()}`, `expected not ${formatValue(expected)}`),
    toEqual: (expected) => check(deepEqual(actual, expected), `expected ${formatValue(expected)}, got ${a()}`, `expected not to equal ${formatValue(expected)}`),
    toStrictEqual: (expected) => check(deepEqual(actual, expected), `expected ${formatValue(expected)}, got ${a()}`, `expected not to equal ${formatValue(expected)}`),
    toBeTruthy: () => check(Boolean(actual), `expected a truthy value, got ${a()}`, `expected a falsy value, got ${a()}`),
    toBeFalsy: () => check(!actual, `expected a falsy value, got ${a()}`, `expected a truthy value, got ${a()}`),
    toBeNull: () => check(actual === null, `expected null, got ${a()}`, 'expected not null'),
    toBeUndefined: () => check(actual === undefined, `expected undefined, got ${a()}`, 'expected a defined value'),
    toBeDefined: () => check(actual !== undefined, 'expected a defined value, got undefined', `expected undefined, got ${a()}`),
    toBeGreaterThan: (n) => check((actual as number) > (n as number), `expected > ${formatValue(n)}, got ${a()}`, `expected <= ${formatValue(n)}, got ${a()}`),
    toBeGreaterThanOrEqual: (n) => check((actual as number) >= (n as number), `expected >= ${formatValue(n)}, got ${a()}`, `expected < ${formatValue(n)}, got ${a()}`),
    toBeLessThan: (n) => check((actual as number) < (n as number), `expected < ${formatValue(n)}, got ${a()}`, `expected >= ${formatValue(n)}, got ${a()}`),
    toBeLessThanOrEqual: (n) => check((actual as number) <= (n as number), `expected <= ${formatValue(n)}, got ${a()}`, `expected > ${formatValue(n)}, got ${a()}`),
    toBeCloseTo: (n, digits = 2) =>
      check(
        Math.abs((actual as number) - (n as number)) < Math.pow(10, -(digits as number)) / 2,
        `expected close to ${formatValue(n)}, got ${a()}`,
        `expected not close to ${formatValue(n)}`,
      ),
    toContain: (item) => {
      const has = typeof actual === 'string' ? actual.includes(item as string) : Array.isArray(actual) && actual.some((x) => Object.is(x, item) || deepEqual(x, item));
      check(has, `expected ${a()} to contain ${formatValue(item)}`, `expected ${a()} not to contain ${formatValue(item)}`);
    },
    toHaveLength: (n) => {
      const len = (actual as { length?: number } | null)?.length;
      check(len === n, `expected length ${formatValue(n)}, got ${formatValue(len)}`, `expected length other than ${formatValue(n)}`);
    },
    toMatch: (re) => {
      const pass = typeof actual === 'string' && (re instanceof RegExp ? re.test(actual) : actual.includes(String(re)));
      check(pass, `expected ${a()} to match ${String(re)}`, `expected ${a()} not to match ${String(re)}`);
    },
    toThrow: (expected) => {
      if (typeof actual !== 'function') throw new AssertionError('toThrow needs a function: expect(() => fn()).toThrow()');
      let thrown: unknown = null;
      let didThrow = false;
      try {
        (actual as () => unknown)();
      } catch (e) {
        didThrow = true;
        thrown = e;
      }
      const msg = thrown instanceof Error ? thrown.message : String(thrown);
      const matches = !didThrow
        ? false
        : expected === undefined
          ? true
          : expected instanceof RegExp
            ? expected.test(msg)
            : msg.includes(String(expected));
      check(matches, didThrow ? `expected to throw ${formatValue(expected)}, threw "${msg}"` : 'expected the function to throw', `expected not to throw, threw "${msg}"`);
    },
  };
}

type Expectation = Matchers & {
  not: Matchers;
  resolves: Record<string, (...args: unknown[]) => Promise<void>>;
  rejects: Record<string, (...args: unknown[]) => Promise<void>>;
};

function expect(actual: unknown): Expectation {
  const base = makeMatchers(actual, false) as Expectation;
  base.not = makeMatchers(actual, true);
  const asyncOf = (settle: () => Promise<unknown>) =>
    new Proxy({} as Record<string, (...args: unknown[]) => Promise<void>>, {
      get: (_t, name: string) => async (...args: unknown[]) => {
        const value = await settle();
        (makeMatchers(value, false)[name] as (...a: unknown[]) => void)(...args);
      },
    });
  base.resolves = asyncOf(() => Promise.resolve(actual));
  base.rejects = asyncOf(async () => {
    try {
      await actual;
    } catch (e) {
      return () => {
        throw e;
      };
    }
    throw new AssertionError('expected the promise to reject');
  });
  return base;
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

interface Registered {
  name: string;
  fn: () => unknown;
  own: boolean;
}

function errorLine(e: unknown): string {
  if (e instanceof AssertionError) return e.message;
  if (e instanceof Error) return `${e.name}: ${e.message}`;
  return `Thrown: ${formatValue(e)}`;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} did not finish in ${ms} ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Run the candidate's file, then the tests against it. Never throws: every
 * failure ends up in the result.
 */
export async function runHarness(input: HarnessInput): Promise<RunResult> {
  const started = Date.now();
  const logs: string[] = [];
  const push = (prefix: string) => (...args: unknown[]) => {
    if (logs.length < MAX_LOG_LINES) logs.push(`${prefix}${formatLogArgs(args)}`);
    else if (logs.length === MAX_LOG_LINES) logs.push('… (more output cut)');
  };
  const consoleProxy = {
    log: push(''),
    info: push(''),
    debug: push(''),
    warn: push('warn: '),
    error: push('error: '),
    table: push(''),
  };

  const registered: Registered[] = [];
  let ownPhase = true;
  const test = (name: string, fn: () => unknown) => {
    registered.push({ name: String(name), fn, own: ownPhase });
  };
  const describe = (_name: string, fn: () => void) => fn();

  const solutionExports: Record<string, unknown> = {};
  const evaluate = (js: string, exportsObj: Record<string, unknown>) => {
    const mod = { exports: exportsObj };
    const requireFn = (path: string) => {
      if (path === './solution' || path === './solution.ts' || path === 'solution') return solutionExports;
      throw new Error(`Cannot import "${path}": only './solution' is available here`);
    };
    const fn = new Function('exports', 'require', 'module', 'console', 'test', 'it', 'describe', 'expect', js);
    fn(exportsObj, requireFn, mod, consoleProxy, test, test, describe, expect);
    return mod.exports;
  };

  const exportsFallback = (input.exportNames ?? [])
    .map((n) => `\n;try { if (typeof ${n} !== 'undefined' && !(${JSON.stringify(n)} in exports)) exports[${JSON.stringify(n)}] = ${n}; } catch (e) {}`)
    .join('');

  try {
    evaluate(`${input.solutionJs}${exportsFallback}`, solutionExports);
  } catch (e) {
    return { ok: false, runtimeError: errorLine(e), logs, tests: [], ms: Date.now() - started };
  }

  if (input.testsJs) {
    ownPhase = false;
    try {
      evaluate(input.testsJs, {});
    } catch (e) {
      return { ok: false, runtimeError: `In the tests: ${errorLine(e)}`, logs, tests: [], ms: Date.now() - started };
    }
  }

  const outcomes: TestOutcome[] = [];
  for (const t of registered) {
    const t0 = Date.now();
    try {
      const value = t.fn();
      if (value && typeof (value as Promise<unknown>).then === 'function') {
        await withTimeout(Promise.resolve(value), input.testTimeoutMs ?? 2000, 'The test');
      }
      outcomes.push({ name: t.name, pass: true, ms: Date.now() - t0, ...(t.own ? { own: true } : {}) });
    } catch (e) {
      outcomes.push({ name: t.name, pass: false, error: errorLine(e), ms: Date.now() - t0, ...(t.own ? { own: true } : {}) });
    }
  }

  return { ok: true, logs, tests: outcomes, ms: Date.now() - started };
}
