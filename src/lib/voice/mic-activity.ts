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
 * - The learner is talking (voice-level audio here) but no input transcription
 *   comes back: `unheard`.
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
/** Voice for at least this long, in total, since the last transcription... */
export const UNHEARD_VOICE_MS = 4000;
/** ...and this long since that voice began, with nothing transcribed: the model is not hearing. */
export const UNHEARD_AFTER_MS = 15_000;

export type MicHealth = 'ok' | 'no-signal' | 'unheard';

export class MicActivity {
  /** Last time a chunk carried voice-level audio, or null. */
  lastVoiceAt: number | null = null;
  private startedAt: number | null = null;
  private lastSignalAt: number | null = null;
  /** The room's level: follows a quieter chunk at once and creeps up (0.5 % per chunk: it doubles in about 14 s) under steady noise. */
  private floor: number | null = null;
  private loudRunMs = 0;
  private voiceSinceHeardMs = 0;
  private voiceSinceHeardFrom: number | null = null;
  private peak = 0;
  private voiceMs = 0;
  private noSignalMs = 0;

  /** Capture started: from here, no chunks at all is also no signal. */
  start(now: number): void {
    this.startedAt ??= now;
  }

  /**
   * One chunk of what the mic captured. `echo` marks audio captured while the
   * tutor's voice plays: it still proves the mic delivers signal, but it is
   * not counted as the learner talking. Returns whether this chunk is the
   * learner's voice.
   */
  feed(samples: Int16Array, sampleRate: number, now: number, echo = false): boolean {
    if (!samples.length) return false;
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
    if (echo || rms < Math.max(VOICE_RMS, floor * VOICE_OVER_FLOOR)) {
      this.loudRunMs = 0;
      return false;
    }
    this.loudRunMs += ms;
    if (this.loudRunMs < VOICE_SUSTAIN_MS) return false;
    this.lastVoiceAt = now;
    this.voiceMs += ms;
    this.voiceSinceHeardMs += ms;
    this.voiceSinceHeardFrom ??= now;
    return true;
  }

  /** The server transcribed something the learner said: they are heard. */
  heard(): void {
    this.voiceSinceHeardMs = 0;
    this.voiceSinceHeardFrom = null;
  }

  health(now: number): MicHealth {
    if (this.startedAt === null) return 'ok';
    if (now - (this.lastSignalAt ?? this.startedAt) >= NO_SIGNAL_AFTER_MS) return 'no-signal';
    if (
      this.voiceSinceHeardFrom !== null &&
      this.voiceSinceHeardMs >= UNHEARD_VOICE_MS &&
      now - this.voiceSinceHeardFrom >= UNHEARD_AFTER_MS
    ) {
      return 'unheard';
    }
    return 'ok';
  }

  /** Numbers for the session's diagnostics (voice_sessions.client_diag). */
  facts(): { micPeak: number; micVoiceMs: number; micNoSignalMs: number } {
    return { micPeak: this.peak, micVoiceMs: Math.round(this.voiceMs), micNoSignalMs: Math.round(this.noSignalMs) };
  }
}
