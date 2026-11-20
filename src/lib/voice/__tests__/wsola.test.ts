import { describe, expect, it } from 'vitest';
import { StreamingWsola, stretchWhole } from '../wsola';

const RATE = 24000;

/** A voiced sound: a 110 Hz fundamental with harmonics and a slow syllable-like envelope. */
function voice(seconds: number, f0 = 110): Float32Array {
  const out = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const env = 0.55 + 0.45 * Math.sin(2 * Math.PI * 3 * t);
    out[i] = env * (0.5 * Math.sin(2 * Math.PI * f0 * t) + 0.25 * Math.sin(2 * Math.PI * 2 * f0 * t) + 0.12 * Math.sin(2 * Math.PI * 3 * f0 * t));
  }
  return out;
}

/** The pitch period, in samples: the lag of the best autocorrelation between 60 and 400 Hz. */
function period(x: Float32Array): number {
  const from = Math.floor(x.length / 3);
  const n = 4096;
  let best = 0;
  let bestScore = -Infinity;
  for (let lag = RATE / 400; lag <= RATE / 60; lag++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += x[from + i] * x[from + i + lag];
    if (s > bestScore) {
      bestScore = s;
      best = lag;
    }
  }
  return best;
}

const rms = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);

describe('StreamingWsola', () => {
  const input = voice(3);

  it.each([0.7, 0.8, 0.9])('at %s the voice lasts longer by that tempo', (tempo) => {
    const out = stretchWhole(input, tempo);
    expect(out.length).toBe(Math.floor(input.length / tempo));
  });

  it.each([0.7, 0.8, 0.9])('at %s the pitch does not move (a playbackRate would lower it)', (tempo) => {
    const out = stretchWhole(input, tempo);
    const before = period(input);
    expect(Math.abs(period(out) - before)).toBeLessThanOrEqual(2);
    // What a resampling to the same length would give: a period longer by 1 / tempo.
    expect(Math.abs(before / tempo - before)).toBeGreaterThan(20);
  });

  it('keeps the level and adds no clipping', () => {
    const out = stretchWhole(input, 0.8);
    expect(rms(out) / rms(input)).toBeGreaterThan(0.9);
    expect(rms(out) / rms(input)).toBeLessThan(1.1);
    expect(out.every((v) => Math.abs(v) <= 1)).toBe(true);
  });

  it('gives the same samples whatever the size of the chunks it is fed', () => {
    const whole = stretchWhole(input, 0.9);
    const w = new StreamingWsola(0.9);
    const parts: Float32Array[] = [];
    // Gemini's chunks are not a fixed size.
    const sizes = [960, 4800, 333, 11520, 2400, 7];
    for (let at = 0, k = 0; at < input.length; k++) {
      const size = sizes[k % sizes.length];
      parts.push(w.push(input.subarray(at, at + size)));
      at += size;
    }
    parts.push(w.flush());
    const out = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
    expect(out.length).toBe(whole.length);
    expect(Array.from(out)).toEqual(Array.from(whole));
  });

  it('lags the input by a few tens of milliseconds, not by the reply', () => {
    const w = new StreamingWsola(0.9);
    const out = w.push(input.subarray(0, RATE));
    // One second in: all but about 40 ms of its stretched audio is already out.
    expect(RATE / 0.9 - out.length).toBeLessThan(0.06 * RATE);
  });

  it('starts clean after a flush or a reset (the next reply, or a cut one)', () => {
    const w = new StreamingWsola(0.8);
    const first = [w.push(input), w.flush()];
    w.push(input.subarray(0, 5000));
    w.reset();
    const second = [w.push(input), w.flush()];
    expect(second.map((p) => p.length)).toEqual(first.map((p) => p.length));
    expect(Array.from(second[0])).toEqual(Array.from(first[0]));
  });

  it('an empty reply flushes to nothing', () => {
    expect(new StreamingWsola(0.9).flush().length).toBe(0);
  });
});
