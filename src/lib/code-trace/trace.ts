/**
 * Authoring a trace generator.
 *
 * A generator is a small, instrumented re-implementation of the lesson's
 * reference solution: it does the same work, and at each line worth seeing it
 * calls `t.step(anchor, caption, viz)`. The anchor is a piece of text that
 * appears on exactly one line of the solution (`'const complement'`), so steps
 * name lines by what they say, not by a number that drifts when the code is
 * reformatted. `resolveAnchor` throws on a missing or ambiguous anchor, and the
 * tests build every example of every generator, so a bad anchor never ships.
 *
 * Design (one idea per step, the line highlighted, the state as a picture, a
 * caption in plain words, learner-paced): see src/components/code-trace/code-trace.tsx.
 */

import type { BuiltTrace, TraceStep, Viz } from './types';

/** The most steps a single trace keeps; a generator that goes past it is cut (the result is still computed). */
export const MAX_STEPS = 600;

export interface TraceExample<A extends unknown[]> {
  /** Short label for the example picker, e.g. `nums = [2, 7, 11, 15], target = 9`. */
  label: string;
  args: A;
}

export interface TraceDef<A extends unknown[] = unknown[], R = unknown> {
  /** The lesson's problem id (interview.coding.problems[].id). */
  id: string;
  title: string;
  pattern: string;
  /** The reference solution, verbatim as the lesson shows it (TypeScript). */
  code: string;
  /** The inputs to trace, the lesson's examples first. */
  examples: TraceExample<A>[];
  /** The instrumented re-implementation. Returns what the solution returns. */
  run: (t: Tracer, ...args: A) => R;
  /**
   * How the tests call the real solution (the module compiled from `code`) on
   * the same arguments. Defaults to calling the first exported function.
   */
  callReal?: (mod: Record<string, unknown>, ...args: A) => unknown;
  /** Turn a result into something comparable (sort groups, list → array…). Applied to both sides. */
  normalize?: (result: unknown) => unknown;
  /** Extra inputs the tests also check (edge cases, random), never shown. */
  extraInputs?: () => A[];
}

/** Strip a trailing `// comment` so an anchor never matches inside one. */
function codePart(line: string): string {
  const i = line.indexOf('//');
  return i === -1 ? line : line.slice(0, i);
}

/**
 * Resolve an anchor to the 1-based line that contains it. Throws when it
 * matches zero or several lines. Two identical lines (the same statement in
 * two methods) are told apart with a `#n` suffix: `'this.cache.set(key, value)#2'`
 * is the second line that says it.
 */
export function resolveAnchor(code: string, anchor: string): number {
  const nth = /#(\d+)$/.exec(anchor);
  const text = nth ? anchor.slice(0, nth.index) : anchor;
  const lines = code.split('\n');
  const hits: number[] = [];
  lines.forEach((l, i) => {
    if (codePart(l).includes(text)) hits.push(i + 1);
  });
  if (nth) {
    const n = Number(nth[1]);
    if (n >= 1 && n <= hits.length) return hits[n - 1];
    throw new Error(`trace anchor "${anchor}": only ${hits.length} match(es)`);
  }
  if (hits.length === 1) return hits[0];
  if (hits.length === 0) throw new Error(`trace anchor not found: "${anchor}"`);
  throw new Error(`trace anchor is ambiguous (lines ${hits.join(', ')}): "${anchor}"`);
}

export class Tracer {
  readonly steps: TraceStep[] = [];
  private readonly lineCache = new Map<string, number>();

  constructor(private readonly code: string) {}

  private line(anchor: string): number {
    let n = this.lineCache.get(anchor);
    if (n === undefined) {
      n = resolveAnchor(this.code, anchor);
      this.lineCache.set(anchor, n);
    }
    return n;
  }

  /** A step at an executed line. */
  step(anchor: string, caption: string, viz: Viz[]): void {
    const line = this.line(anchor);
    if (this.steps.length < MAX_STEPS) this.steps.push({ line, caption, viz: clone(viz) });
  }

  /** A scene-setting step before the call runs: no line, or a top-level declaration. */
  intro(anchor: string | null, caption: string, viz: Viz[]): void {
    const line = anchor === null ? null : this.line(anchor);
    if (this.steps.length < MAX_STEPS) this.steps.push({ line, caption, viz: clone(viz), intro: true });
  }
}

/** Deep copy of plain data, so a snapshot never changes after it is taken. */
export function clone<T>(v: T): T {
  return structuredClone(v);
}

/** Run a generator on one example. */
export function buildTrace<A extends unknown[], R>(def: TraceDef<A, R>, args: A): BuiltTrace {
  const t = new Tracer(def.code);
  const result = def.run(t, ...(clone(args) as A));
  return { steps: t.steps, result };
}
