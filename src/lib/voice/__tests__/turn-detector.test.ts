import { describe, expect, it } from 'vitest';
import { PREROLL_CHUNKS, TURN_END_QUIET_MS, TURN_END_TYPING_MS, TurnDetector, type TurnOutput } from '../turn-detector';

const T0 = 1_000_000;
const chunk = (tag: number) => new Int16Array([tag]);
const kinds = (out: TurnOutput[]) => out.map((o) => o.type);

/** Feed chunks 100 ms apart; `voiced(i)` and `key(i)` say what happens at chunk i. Returns every output with its time. */
function run(d: TurnDetector, from: number, n: number, voiced: (i: number) => boolean, lastKeyAt: (now: number) => number | null) {
  const out: { at: number; o: TurnOutput }[] = [];
  let now = from;
  for (let i = 0; i < n; i++) {
    now += 100;
    for (const o of d.feed({ chunk: chunk(i), voiced: voiced(i), now, lastKeyAt: lastKeyAt(now) })) out.push({ at: now, o });
  }
  return { out, now };
}

describe('TurnDetector', () => {
  it('sends nothing while nobody talks', () => {
    const d = new TurnDetector();
    expect(run(d, T0, 50, () => false, () => null).out).toEqual([]);
    expect(d.open).toBe(false);
  });

  it('opens the turn with the chunks from before the voice was detected, so the first word is not lost', () => {
    const d = new TurnDetector();
    run(d, T0, 10, () => false, () => null);
    const out = d.feed({ chunk: chunk(99), voiced: true, now: T0 + 1100, lastKeyAt: null });
    expect(kinds(out)).toEqual(['start', ...new Array(PREROLL_CHUNKS).fill('audio')]);
    expect((out[out.length - 1] as { chunk: Int16Array }).chunk[0]).toBe(99);
    expect(d.open).toBe(true);
  });

  it('a direct question, hands off the keyboard: the turn ends 0.9 s after the last word', () => {
    const d = new TurnDetector();
    const { out } = run(d, T0, 40, (i) => i < 20, () => null);
    const end = out.find((x) => x.o.type === 'end');
    // The last voiced chunk is i = 19, at T0 + 2000.
    expect(end?.at).toBe(T0 + 2000 + TURN_END_QUIET_MS);
    expect(out.filter((x) => x.o.type === 'end')).toHaveLength(1);
  });

  it('thinking aloud while typing: pauses of 1.2, 2.0 and 2.8 s do not end the turn', () => {
    const d = new TurnDetector();
    // 2 s of voice, 1.2 s pause, 2 s, 2.0 s pause, 2 s, 2.8 s pause, 2 s: keys all along.
    const plan = [20, 12, 20, 20, 20, 28, 20];
    const voicedAt: boolean[] = plan.flatMap((n, k) => new Array(n).fill(k % 2 === 0));
    const { out, now } = run(d, T0, voicedAt.length, (i) => voicedAt[i], (t) => t - 300);
    expect(out.filter((x) => x.o.type === 'start')).toHaveLength(1);
    expect(out.some((x) => x.o.type === 'end')).toBe(false);
    // They stop typing and say nothing more: the keys age out and the turn ends.
    const after = run(d, now, 50, () => false, () => now);
    const end = after.out.find((x) => x.o.type === 'end');
    expect(end).toBeDefined();
    expect(end!.at - now).toBeLessThanOrEqual(TURN_END_TYPING_MS);
  });

  it('typing in silence after a sentence ends the turn at the long window, not never', () => {
    const d = new TurnDetector();
    const { out } = run(d, T0, 80, (i) => i < 10, (t) => t - 100);
    expect(out.find((x) => x.o.type === 'end')?.at).toBe(T0 + 1000 + TURN_END_TYPING_MS);
  });

  it('every chunk of an open turn is sent, and nothing after it closes', () => {
    const d = new TurnDetector();
    const { out } = run(d, T0, 60, (i) => i >= 10 && i < 20, () => null);
    const audio = out.filter((x) => x.o.type === 'audio').length;
    // Preroll (6, the detecting chunk included) + the 9 voiced after it + 9 until the end.
    expect(audio).toBe(PREROLL_CHUNKS + 9 + TURN_END_QUIET_MS / 100);
    expect(kinds(out.map((x) => x.o)).slice(-1)).toEqual(['end']);
  });

  it('closes an open turn on reset', () => {
    const d = new TurnDetector();
    d.feed({ chunk: chunk(1), voiced: true, now: T0, lastKeyAt: null });
    expect(kinds(d.reset())).toEqual(['end']);
    expect(kinds(d.reset())).toEqual([]);
  });
});
