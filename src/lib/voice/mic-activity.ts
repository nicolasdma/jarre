/**
 * Jarre - What the microphone is actually delivering, measured on the PCM the
 * session sends to Gemini Live (the same samples, so it cannot disagree with
 * what the model receives).
 *
 * Two questions the session could not answer before 2026-11-20 (session
 * 522c1b71: 1893 chunks sent, no input transcription in 150 s, and nothing
 * told whether the mic was silent or the model deaf):
 *
 * - Is there any signal at all? A muted track, or a device another app holds,
 *   yields digital silence: `no-signal`.
 * - The learner said something, went quiet, and no input transcription came
 *   back: `unheard`. Measured from the END of what they said, never from its
 *   start: a healthy gemini-3.8-live session transcribes a long utterance only
 *   when the server closes the turn or every 20 s or so. In
 *   scripts/probe-live-long-utterance.ts (2026-11-20,
 *   docs/research/voice-probe/long-utterance-2026-11-20-before.json) 40 s of
 *   continuous speech got its first fragment at 21 s, and 48 s of speech with
 *   1.5 s pauses got it at 51 s, 3.1 s after the last word. The rule this
 *   replaces ("voice for 15 s and nothing transcribed") fired at 15.3 s in
 *   both, and in every one of the owner's sessions of that evening longer than
 *   a minute (43ac6d19, 1b65bd70 three times, 56a3b178): the page replaced a
 *   session that was hearing him, mid-thought.
 *
 * It also gives the page a local "the learner is talking now" clock
 * (`lastVoiceAt`): input transcription arrives seconds late (10.9 s into a
 * 12.9 s utterance in scripts/probe-coding-mock-audio.ts), too late to decide
 * whether this is a quiet moment.
 */

/**
 * Peak amplitude (of 32768) at or under which a chunk is digital silence.
 * Exactly zero: Chrome's noise suppression brings a quiet room down to an RMS
 * of 2 (measured through its fake microphone, 2026-11-20), and that is a
 * working microphone.
 */
export const NO_SIGNAL_PEAK = 0;
/** RMS (of 32768) under which a chunk is never voice: about -36 dBFS. */
export const VOICE_RMS = 500;
/**
 * Voice is also this many times louder than the room: the browser's gain
 * control lifts a steady hiss or a fan above any fixed level (seen with
 * Chrome's fake microphone on 2026-11-20), and speech stands out of it.
 */
export const VOICE_OVER_FLOOR = 3;
/** Voice-level audio must hold this long to count: a key click or a knock is shorter. */
export const VOICE_SUSTAIN_MS = 300;
/** Digital silence for this long is a microphone that delivers nothing. */
export const NO_SIGNAL_AFTER_MS = 8000;
/** Voice for at least this long in what the learner just said... */
export const UNHEARD_VOICE_MS = 4000;
/** ...the end-of-speech window the session runs with, when the caller does not say... */
export const DEFAULT_END_OF_SPEECH_MS = 2500;
/**
 * ...and this long past that window with no sound on the mic and nothing
 * transcribed: the model is not hearing. A healthy session's transcription
 * came 0.6 to 0.7 s after the window in the probe above; the rest is slack,
 * because replacing a session that hears costs the learner what they said.
 */
export const UNHEARD_QUIET_MARGIN_MS = 8000;
/** Voice-level audio this close after a key press may be the keyboard: it is no proof the learner spoke. */
export const TYPING_NEAR_MS = 400;

export interface MicChunkContext {
  /** Captured while the tutor's voice plays: signal, not the learner talking. */
  echo?: boolean;
  /** False when the chunk did not go to the model (the socket is being replaced): what was said then cannot be transcribed. */
  sent?: boolean;
  /** Last key pressed in an editor the learner types in while talking (Date.now clock), or null. */
  lastKeyAt?: number | null;
}

export type MicHealth = 'ok' | 'no-signal' | 'unheard';

export class MicActivity {
  /** Last time a chunk carried voice-level audio, or null. */
  lastVoiceAt: number | null = null;
  private startedAt: number | null = null;
  private lastSignalAt: number | null = null;
  /** The room's level: follows a quieter chunk at once and creeps up (0.5 % per chunk: it doubles in about 14 s) under steady noise. */
  private floor: number | null = null;
  private loudRunMs = 0;
  /** Voice in what the learner said since the last transcription, and when its last chunk came. */
  private pendingVoiceMs = 0;
  private pendingLastAt: number | null = null;
  /** Last chunk at voice level, sustained or not, or captured while the tutor spoke: the quiet is counted from here. */
  private lastLoudAt: number | null = null;
  /** `unheard` holds until something is transcribed. */
  private deaf = false;
  private peak = 0;
  private voiceMs = 0;
  private noSignalMs = 0;
  private unheardCount = 0;
  /** How long after the last sound nothing transcribed means nothing heard. */
  readonly quietMs: number;

  /** `endOfSpeechMs`: the silence that ends the learner's turn in this session (live-models.ts, TURN_TAKING). */
  constructor(opts: { endOfSpeechMs?: number } = {}) {
    this.quietMs = (opts.endOfSpeechMs ?? DEFAULT_END_OF_SPEECH_MS) + UNHEARD_QUIET_MARGIN_MS;
  }

  /** Capture started: from here, no chunks at all is also no signal. */
  start(now: number): void {
    this.startedAt ??= now;
  }

  /**
   * One chunk of what the mic captured. Returns whether this chunk is the
   * learner's voice (the tutor's echo and a short knock are not).
   */
  feed(samples: Int16Array, sampleRate: number, now: number, context: MicChunkContext = {}): boolean {
    if (!samples.length) return false;
    const { echo = false, sent = true, lastKeyAt = null } = context;
    this.startedAt ??= now;
    let peak = 0;
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i];
      const a = v < 0 ? -v : v;
      if (a > peak) peak = a;
      sum += v * v;
    }
    const ms = (samples.length / sampleRate) * 1000;
    if (peak > this.peak) this.peak = peak;
    if (peak > NO_SIGNAL_PEAK) this.lastSignalAt = now;
    else this.noSignalMs += ms;
    const rms = Math.sqrt(sum / samples.length);
    const floor = this.floor === null ? rms : Math.min(rms, this.floor * 1.005 + 1);
    this.floor = floor;
    const loud = rms >= Math.max(VOICE_RMS, floor * VOICE_OVER_FLOOR);

    this.settle(now);
    // The tutor talking is not the learner's quiet, with headphones or without.
    if (loud || echo) this.lastLoudAt = now;
    if (echo || !loud) {
      this.loudRunMs = 0;
      return false;
    }
    this.loudRunMs += ms;
    if (this.loudRunMs < VOICE_SUSTAIN_MS) return false;
    this.lastVoiceAt = now;
    this.voiceMs += ms;
    if (sent) {
      // Sound over the keyboard keeps the utterance open, and proves nothing by itself.
      const typing = lastKeyAt !== null && now >= lastKeyAt && now - lastKeyAt < TYPING_NEAR_MS;
      if (!typing) this.pendingVoiceMs += ms;
      if (this.pendingVoiceMs > 0) this.pendingLastAt = now;
    }
    return true;
  }

  /**
   * The quiet after what the learner said has run its course: enough voice
   * and nothing transcribed is a session that does not hear; less was a cough
   * or a chair, and is forgotten.
   */
  private settle(now: number): void {
    if (this.deaf || this.pendingLastAt === null) return;
    if (now - Math.max(this.pendingLastAt, this.lastLoudAt ?? 0) < this.quietMs) return;
    if (this.pendingVoiceMs >= UNHEARD_VOICE_MS) {
      this.deaf = true;
      this.unheardCount += 1;
    } else {
      this.pendingVoiceMs = 0;
      this.pendingLastAt = null;
    }
  }

  /**
   * The server transcribed something the learner said (or the session was
   * replaced and what was said before is gone): the count starts again.
   */
  heard(): void {
    this.pendingVoiceMs = 0;
    this.pendingLastAt = null;
    this.deaf = false;
  }

  health(now: number): MicHealth {
    if (this.startedAt === null) return 'ok';
    if (now - (this.lastSignalAt ?? this.startedAt) >= NO_SIGNAL_AFTER_MS) return 'no-signal';
    this.settle(now);
    return this.deaf ? 'unheard' : 'ok';
  }

  /** Numbers for the session's diagnostics (voice_sessions.client_diag). */
  facts(): MicFacts {
    return { micPeak: this.peak, micVoiceMs: Math.round(this.voiceMs), micNoSignalMs: Math.round(this.noSignalMs), micUnheard: this.unheardCount };
  }
}

export interface MicFacts {
  micPeak: number;
  micVoiceMs: number;
  micNoSignalMs: number;
  /** Times the learner spoke, went quiet and was not transcribed. */
  micUnheard: number;
}

/** A session that opened its microphone again reports all its captures as one. */
export function addMicFacts(earlier: MicFacts | null, now: MicFacts): MicFacts {
  if (!earlier) return now;
  return {
    micPeak: Math.max(earlier.micPeak, now.micPeak),
    micVoiceMs: earlier.micVoiceMs + now.micVoiceMs,
    micNoSignalMs: earlier.micNoSignalMs + now.micNoSignalMs,
    micUnheard: earlier.micUnheard + now.micUnheard,
  };
}
