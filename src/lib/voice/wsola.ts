/**
 * Jarre - Changes how fast a voice plays without moving its pitch, on the
 * stream Gemini Live sends (24 kHz PCM), so an interviewer can speak slower
 * for someone listening in a second language (src/lib/voice/speech-pace.ts).
 *
 * Why here and not a `playbackRate`: a rate change is a resampling, it lowers
 * the pitch with the speed and the voice becomes another voice. And why not a
 * stretcher in the audio graph: the voice is not a live input. Gemini sends
 * its audio faster than real time and the page schedules each chunk ahead of
 * the playhead (`playAudioChunk` in use-voice-session.ts), so the samples are
 * already in hand: each chunk is stretched before it is scheduled, and every
 * clock that reads the playback (the echo flag of the microphone, the
 * "speaking" state, the end of the call) reads the stretched length.
 *
 * The algorithm is WSOLA, ported from the owner's landing
 * (avatar-landing/src/lib/voiceFx/orionTempo.ts, measured there on the same
 * kind of stream): Hann windows at 50 % overlap, each next window searched
 * within +-TOL of its target for the best cross-correlation with the natural
 * continuation of the previous one. 512 samples at 24 kHz (21 ms); the search
 * range (+-5.3 ms) covers a whole pitch period of a low male voice. Streaming:
 * a window is placed when its search range is in hand, and the output is final
 * up to the start of the newest window (about 40 ms behind the input). The
 * search runs coarse (every 2nd lag on every 2nd sample) and refines +-2
 * around the best.
 */

const WIN = 512;
const HOP_OUT = WIN / 2;
const TOL = 128;

const HANN = (() => {
  const w = new Float32Array(WIN);
  for (let i = 0; i < WIN; i += 1) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (WIN - 1));
  return w;
})();

/** Raw correlation of a[ai..ai+WIN) with a[bi..bi+WIN), every `step`-th sample. */
function corr(a: Float32Array, ai: number, bi: number, step: number): number {
  let sum = 0;
  for (let i = 0; i < WIN; i += step) sum += a[ai + i] * a[bi + i];
  return sum;
}

export class StreamingWsola {
  /** Speed of the output against the input: 0.9 plays 10 % slower, 1.06 faster. */
  readonly tempo: number;
  private readonly hopIn: number;
  /** Input still needed, from absolute sample `base`. */
  private input = new Float32Array(0);
  private base = 0;
  private inputLength = 0;
  /** Overlap-add accumulator from absolute output sample `outBase`. */
  private acc = new Float32Array(WIN * 2);
  private norm = new Float32Array(WIN * 2);
  private outBase = 0;
  private frame = 0;
  private prev = 0;

  constructor(tempo: number) {
    this.tempo = tempo;
    this.hopIn = HOP_OUT * tempo;
  }

  private append(samples: Float32Array): void {
    const keepFrom = Math.max(0, Math.min(this.prev, Math.floor(this.frame * this.hopIn) - TOL) - this.base);
    const kept = this.input.subarray(keepFrom, this.inputLength - this.base);
    const next = new Float32Array(kept.length + samples.length);
    next.set(kept);
    next.set(samples, kept.length);
    this.input = next;
    this.base += keepFrom;
    this.inputLength += samples.length;
  }

  private ensureAcc(upTo: number): void {
    const need = upTo - this.outBase;
    if (need <= this.acc.length) return;
    const size = Math.max(need, this.acc.length * 2);
    const acc = new Float32Array(size);
    const norm = new Float32Array(size);
    acc.set(this.acc);
    norm.set(this.norm);
    this.acc = acc;
    this.norm = norm;
  }

  /** Places every window whose search range is in hand. */
  private run(end: number): void {
    const x = this.input;
    for (;;) {
      const k = this.frame;
      const target = Math.floor(k * this.hopIn);
      if (target + WIN + TOL > end) return;
      let best = 0;
      if (k > 0) {
        const nat = this.prev + HOP_OUT;
        if (nat + WIN > end) return;
        const lo = Math.max(0, target - TOL);
        const hi = Math.min(end - WIN, target + TOL);
        let bestScore = -Infinity;
        for (let c = lo; c <= hi; c += 2) {
          const s = corr(x, c - this.base, nat - this.base, 2);
          if (s > bestScore) {
            bestScore = s;
            best = c;
          }
        }
        const from = Math.max(lo, best - 2);
        const to = Math.min(hi, best + 2);
        bestScore = -Infinity;
        for (let c = from; c <= to; c += 1) {
          const s = corr(x, c - this.base, nat - this.base, 1);
          if (s > bestScore) {
            bestScore = s;
            best = c;
          }
        }
      }
      const o = k * HOP_OUT;
      this.ensureAcc(o + WIN);
      const at = o - this.outBase;
      const src = best - this.base;
      for (let i = 0; i < WIN; i += 1) {
        this.acc[at + i] += x[src + i] * HANN[i];
        this.norm[at + i] += HANN[i];
      }
      this.prev = best;
      this.frame += 1;
    }
  }

  /** Output final up to `upTo` (absolute), removed from the accumulator. */
  private take(upTo: number): Float32Array {
    const n = Math.max(0, upTo - this.outBase);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i += 1) out[i] = this.acc[i] / Math.max(this.norm[i], 1e-3);
    this.acc.copyWithin(0, n);
    this.acc.fill(0, this.acc.length - n);
    this.norm.copyWithin(0, n);
    this.norm.fill(0, this.norm.length - n);
    this.outBase += n;
    return out;
  }

  /** Feeds a chunk; returns the output that is final now. */
  push(samples: Float32Array): Float32Array {
    this.append(samples);
    this.run(this.inputLength);
    return this.take(this.frame * HOP_OUT);
  }

  /** The rest of the stream (the end of a reply): what the last windows hold, cut to the input's length / tempo. */
  flush(): Float32Array {
    const total = Math.floor(this.inputLength / this.tempo);
    if (total <= this.outBase) {
      this.reset();
      return new Float32Array(0);
    }
    // Silence past the end lets the last windows be placed.
    const pad = WIN + TOL + HOP_OUT;
    this.append(new Float32Array(pad));
    this.inputLength -= pad;
    this.run(this.base + this.input.length);
    const out = this.take(Math.min(total, this.frame * HOP_OUT));
    this.reset();
    return out;
  }

  /** Drops what is pending (the reply was cut). */
  reset(): void {
    this.input = new Float32Array(0);
    this.base = 0;
    this.inputLength = 0;
    this.acc.fill(0);
    this.norm.fill(0);
    this.outBase = 0;
    this.frame = 0;
    this.prev = 0;
  }
}

/** A whole clip at once (tests, measurements). */
export function stretchWhole(samples: Float32Array, tempo: number): Float32Array {
  const w = new StreamingWsola(tempo);
  const head = w.push(samples);
  const tail = w.flush();
  const out = new Float32Array(head.length + tail.length);
  out.set(head);
  out.set(tail, head.length);
  return out;
}
