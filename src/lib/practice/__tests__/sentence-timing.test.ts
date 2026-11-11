import { describe, expect, it } from 'vitest';
import { detectPauses, placeSentences, practiceSentences } from '../sentence-timing';

const RATE = 8000;

/** Speech-like bursts (a tone) separated by silences: [voice s, pause s, voice s, …]. */
function signal(parts: number[], lead = 0.3, tail = 0.4): Float32Array {
  const total = lead + parts.reduce((a, b) => a + b, 0) + tail;
  const out = new Float32Array(Math.round(total * RATE));
  let t = lead;
  parts.forEach((len, i) => {
    if (i % 2 === 0) {
      for (let k = Math.round(t * RATE); k < Math.round((t + len) * RATE); k++) out[k] = 0.4 * Math.sin((2 * Math.PI * 220 * k) / RATE);
    }
    t += len;
  });
  // A noise floor, as a real recording has.
  for (let k = 0; k < out.length; k++) out[k] += (((k * 7919) % 13) / 13 - 0.5) * 0.002;
  return out;
}

describe('practiceSentences', () => {
  it('rides short sentences with the next one', () => {
    expect(practiceSentences('Sure. It is five weekly milestones. Week one is the base.')).toEqual([
      'Sure. It is five weekly milestones.',
      'Week one is the base.',
    ]);
    expect(practiceSentences('We start now and ship weekly. Thanks.')).toEqual(['We start now and ship weekly. Thanks.']);
    expect(practiceSentences('I need a few things from your side: 1. Access to the repo. 2. The sandbox keys by week three.')).toEqual([
      'I need a few things from your side: 1. Access to the repo.',
      '2. The sandbox keys by week three.',
    ]);
  });
});

describe('detectPauses', () => {
  it('finds the silences between voiced stretches, not the lead and tail', () => {
    const a = detectPauses(signal([2, 0.8, 1, 0.2, 2]), RATE);
    expect(a.speechStart).toBeCloseTo(0.3, 1);
    expect(a.speechEnd).toBeCloseTo(0.3 + 6, 1);
    expect(a.pauses).toHaveLength(2);
    expect(a.pauses[0].start).toBeCloseTo(2.3, 1);
    expect(a.pauses[0].end).toBeCloseTo(3.1, 1);
  });
});

describe('placeSentences', () => {
  it('snaps each boundary to the long pause near it, not to a comma pause', () => {
    // Sentence A (3 s with a short comma pause), long pause, sentence B (3 s), long pause, sentence C.
    const audio = detectPauses(signal([1.4, 0.25, 1.4, 0.8, 3, 0.75, 3]), RATE);
    const sentences = ['Week one is the base, with the schema.', 'Week two is the protection layer.', 'Week three is the creator side.'];
    const { spans, snapped } = placeSentences(sentences, audio);
    expect(snapped).toBe(true);
    // The cut after A falls in the 0.8 s pause (3.35–4.15), never in the comma pause (1.7–1.95).
    expect(spans[0].end).toBeGreaterThan(3.3);
    expect(spans[0].end).toBeLessThan(3.8);
    expect(spans[1].start).toBeGreaterThan(3.7);
    expect(spans[1].start).toBeLessThan(4.15);
    expect(spans[1].end).toBeGreaterThan(7.1);
    expect(spans[2].start).toBeLessThan(7.9);
    expect(spans[2].end).toBeGreaterThan(10.85);
  });

  it('falls back to proportional spans when the audio has too few pauses', () => {
    const audio = detectPauses(signal([6]), RATE);
    const { spans, snapped } = placeSentences(['One two three four.', 'Five six seven eight.'], audio);
    expect(snapped).toBe(false);
    expect(spans[0].end).toBeCloseTo(spans[1].start, 5);
  });
});
