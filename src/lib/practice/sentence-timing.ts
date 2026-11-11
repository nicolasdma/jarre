/**
 * Where each sentence of a drill sits in its recording, so "Frase por frase"
 * can play one sentence and stop cleanly in the pause after it.
 *
 * The recordings have no word timings. Splitting the audio in proportion to
 * the text lands mid-word (a 64 s answer drifts by seconds), so the pauses are
 * found in the audio itself and each sentence boundary is snapped to the pause
 * that best fits: near where the text says it should be, and long (a sentence
 * end is a longer pause than a comma). Runs once per drill in the browser and
 * is cached (use-sentence-spans.ts). Pure: no DOM, no Web Audio.
 */

import { splitSentences } from './scoring';

/** Sentences shorter than this many words ride with the next one: "Sure." alone is not worth a turn. */
const MIN_WORDS = 4;

/** The drill's sentences for practice: short ones merged into the next (or the previous, at the end). */
export function practiceSentences(text: string): string[] {
  const parts = splitSentences(text).map((s) => s.text);
  const out: string[] = [];
  let carry = '';
  for (const part of parts) {
    const joined = carry ? `${carry} ${part}` : part;
    if (joined.split(/\s+/).length < MIN_WORDS) carry = joined;
    else {
      out.push(joined);
      carry = '';
    }
  }
  if (carry) {
    if (out.length) out[out.length - 1] = `${out[out.length - 1]} ${carry}`;
    else out.push(carry);
  }
  return out;
}

export interface Pause {
  /** Seconds. */
  start: number;
  end: number;
}

export interface AudioPauses {
  duration: number;
  /** First and last moment with voice. */
  speechStart: number;
  speechEnd: number;
  /** Silent stretches between speechStart and speechEnd, in order. */
  pauses: Pause[];
}

export interface PauseOptions {
  frameMs?: number;
  /** Silence: frames this many dB under the loud frames (95th percentile). */
  thresholdDb?: number;
  minPauseMs?: number;
}

/** Silent stretches of a mono signal, by frame energy relative to its loud frames. */
export function detectPauses(samples: Float32Array, sampleRate: number, opts: PauseOptions = {}): AudioPauses {
  const frameMs = opts.frameMs ?? 10;
  const thresholdDb = opts.thresholdDb ?? -30;
  const minPause = (opts.minPauseMs ?? 150) / 1000;
  const frame = Math.max(1, Math.round((sampleRate * frameMs) / 1000));
  const frames = Math.floor(samples.length / frame);
  const duration = samples.length / sampleRate;
  const rms = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) sum += samples[i] * samples[i];
    rms[f] = Math.sqrt(sum / frame);
  }
  const sorted = Array.from(rms).sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const threshold = loud * 10 ** (thresholdDb / 20);
  const voiced = (f: number) => rms[f] > threshold;

  let first = 0;
  while (first < frames && !voiced(first)) first++;
  let last = frames - 1;
  while (last > first && !voiced(last)) last--;
  const sec = (f: number) => (f * frame) / sampleRate;
  if (first >= frames) return { duration, speechStart: 0, speechEnd: duration, pauses: [] };

  const pauses: Pause[] = [];
  for (let f = first; f <= last; ) {
    if (voiced(f)) {
      f++;
      continue;
    }
    const from = f;
    while (f <= last && !voiced(f)) f++;
    if (sec(f) - sec(from) >= minPause) pauses.push({ start: sec(from), end: sec(f) });
  }
  return { duration, speechStart: sec(first), speechEnd: sec(last + 1), pauses };
}

export interface SentenceSpan {
  /** Seconds in the recording. */
  start: number;
  end: number;
}

export interface SentencePlacement {
  spans: SentenceSpan[];
  /** False when the audio had too few pauses and the spans are only proportional. */
  snapped: boolean;
}

/** How far into a pause a sentence keeps playing, and how early the next one starts. */
const TAIL_PAD = 0.12;
const HEAD_PAD = 0.06;

/**
 * Snap the n-1 sentence boundaries to n-1 distinct pauses, in order,
 * minimizing distance to the text-proportional estimate while rewarding long
 * pauses (dynamic programming over the pauses).
 */
export function placeSentences(sentences: readonly string[], audio: AudioPauses): SentencePlacement {
  const n = sentences.length;
  const { speechStart, speechEnd, duration, pauses } = audio;
  const lengths = sentences.map((s) => Math.max(1, s.length));
  const total = lengths.reduce((a, b) => a + b, 0);
  const span = Math.max(0.001, speechEnd - speechStart);
  const expected: number[] = [];
  let acc = 0;
  for (let k = 0; k < n - 1; k++) {
    acc += lengths[k];
    expected.push(speechStart + (acc / total) * span);
  }

  const proportional = (): SentencePlacement => {
    const cuts = [speechStart, ...expected, speechEnd];
    return {
      spans: sentences.map((_, i) => ({ start: Math.max(0, cuts[i] - (i === 0 ? HEAD_PAD : 0)), end: Math.min(duration, cuts[i + 1] + (i === n - 1 ? TAIL_PAD : 0)) })),
      snapped: false,
    };
  };
  if (n <= 1) return { spans: [{ start: Math.max(0, speechStart - HEAD_PAD), end: Math.min(duration, speechEnd + TAIL_PAD) }], snapped: true };
  const m = pauses.length;
  if (m < n - 1) return proportional();

  const sigma = Math.max(0.5, (span / n) * 0.35);
  const cost = (k: number, g: number) => {
    const p = pauses[g];
    const mid = (p.start + p.end) / 2;
    const d = (mid - expected[k]) / sigma;
    return d * d - 2.5 * Math.min(p.end - p.start, 1.2);
  };

  // best[k][g]: cheapest way to put boundary k on pause g (boundaries 0..k all placed).
  const best: number[][] = Array.from({ length: n - 1 }, () => new Array<number>(m).fill(Infinity));
  const from: number[][] = Array.from({ length: n - 1 }, () => new Array<number>(m).fill(-1));
  for (let g = 0; g < m; g++) best[0][g] = cost(0, g);
  for (let k = 1; k < n - 1; k++) {
    let runMin = Infinity;
    let runArg = -1;
    for (let g = 0; g < m; g++) {
      // Previous boundary on any pause before g.
      if (g - 1 >= 0 && best[k - 1][g - 1] < runMin) {
        runMin = best[k - 1][g - 1];
        runArg = g - 1;
      }
      if (runArg >= 0) {
        best[k][g] = runMin + cost(k, g);
        from[k][g] = runArg;
      }
    }
  }
  let g = -1;
  let min = Infinity;
  for (let x = 0; x < m; x++) {
    if (best[n - 2][x] < min) {
      min = best[n - 2][x];
      g = x;
    }
  }
  if (g < 0) return proportional();
  const chosen: Pause[] = new Array(n - 1);
  for (let k = n - 2; k >= 0; k--) {
    chosen[k] = pauses[g];
    g = from[k][g];
  }

  const spans: SentenceSpan[] = sentences.map((_, i) => {
    const before = i > 0 ? chosen[i - 1] : null;
    const after = i < n - 1 ? chosen[i] : null;
    const start = before ? Math.max(before.end - HEAD_PAD, (before.start + before.end) / 2) : Math.max(0, speechStart - HEAD_PAD);
    const end = after ? Math.min(after.start + TAIL_PAD, (after.start + after.end) / 2) : Math.min(duration, speechEnd + TAIL_PAD);
    return { start, end };
  });
  return { spans, snapped: true };
}
