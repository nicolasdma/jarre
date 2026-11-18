/**
 * The trace never lies. For every registered generator and every example (plus
 * its extra inputs):
 * 1. the generator returns what the REAL solution returns on the same input;
 * 2. the lines its steps point at, in order, are a subsequence of the lines the
 *    real solution executes (instrumented with the TypeScript compiler), so a
 *    step never highlights a line the code would not be on at that moment;
 * 3. every anchor resolves, every step has a caption, the registry fingerprint
 *    matches the code, and the JS view maps every traced line.
 */

import { describe, expect, it } from 'vitest';
import { TRACE_INDEX, findTrace } from '../registry';
import { buildTrace, clone, type TraceDef } from '../trace';
import { codeFingerprint } from '../fingerprint';
import { codeViews } from '../js-lines';
import { collapse, loadReal, subsequenceBreak } from './run-real';

function callReal(def: TraceDef, mod: Record<string, unknown>, args: unknown[]): unknown {
  if (def.callReal) return def.callReal(mod, ...args);
  const fn = Object.values(mod).find((v) => typeof v === 'function') as ((...a: unknown[]) => unknown) | undefined;
  if (!fn) throw new Error(`${def.id}: the solution exports no function`);
  return fn(...args);
}

function settle(fn: () => unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

describe('code-trace registry', () => {
  it('has unique ids and fingerprints', () => {
    const ids = TRACE_INDEX.map((e) => e.id);
    const fps = TRACE_INDEX.map((e) => e.fp);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(fps).size).toBe(fps.length);
  });

  it('finds a trace by its code and nothing for other code', () => {
    expect(findTrace('const x = 1;')).toBeNull();
  });
});

describe.each(TRACE_INDEX.map((e) => [e.id, e] as const))('trace %s', (id, entry) => {
  it('matches its registry fingerprint and loads', async () => {
    const def = (await entry.load()).default as TraceDef;
    expect(def.id).toBe(id);
    expect(entry.fp, `fingerprint for ${id} should be ${codeFingerprint(def.code)}`).toBe(codeFingerprint(def.code));
    expect(findTrace(def.code)?.id).toBe(id);
    expect(def.examples.length).toBeGreaterThan(0);
  });

  it('ends where the real solution ends, through lines the real solution runs', async () => {
    const def = (await entry.load()).default as TraceDef;
    const real = loadReal(def.code);
    const norm = def.normalize ?? ((r: unknown) => r);
    const views = codeViews(def.code);
    const inputs = [...def.examples.map((e) => e.args), ...(def.extraInputs?.() ?? [])];

    for (const args of inputs) {
      const label = JSON.stringify(args).slice(0, 120);
      real.reset();
      const expected = settle(() => norm(callReal(def, real.exports, clone(args))));
      const executed = collapse(real.hits);

      const built = settle(() => buildTrace(def, args));
      if (!expected.ok) {
        // The real solution throws on this input: the generator must throw too.
        expect(built.ok, `${id} ${label}: the real solution throws "${expected.error}"`).toBe(false);
        continue;
      }
      expect(built.ok, `${id} ${label}: ${built.ok ? '' : built.error}`).toBe(true);
      if (!built.ok) continue;
      const trace = built.value as ReturnType<typeof buildTrace>;
      expect(norm(trace.result), `${id} ${label}: result`).toEqual(expected.value);

      const steps = trace.steps.filter((s) => !s.intro);
      expect(steps.length, `${id} ${label}: steps`).toBeGreaterThan(0);
      for (const s of trace.steps) expect(s.caption.trim().length, `${id}: empty caption`).toBeGreaterThan(0);

      const traced = collapse(steps.map((s) => s.line as number));
      const at = subsequenceBreak(traced, executed);
      expect(
        at,
        `${id} ${label}: step line ${traced[at]} (#${at}) is not reachable in the real run.\n traced: ${traced.join(',')}\n real: ${executed.slice(0, 400).join(',')}`,
      ).toBe(-1);

      for (const s of trace.steps) {
        if (s.line !== null) expect(views.tsToJs(s.line)).toBeGreaterThan(0);
      }
    }
  });
});
