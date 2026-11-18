/**
 * The picture of a voice note: deterministic bars from a seed (not a
 * measurement of the audio). Pure.
 */

/** Bar heights (0.2–1) from a seed string: same text, same picture. */
export function waveformBars(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ i;
    const r = ((h >>> 0) % 1000) / 1000;
    // A soft envelope so it reads as speech (louder in the middle).
    const env = 0.55 + 0.45 * Math.sin((Math.PI * (i + 0.5)) / count);
    out.push(Math.max(0.2, Math.min(1, r * env + 0.15)));
  }
  return out;
}
