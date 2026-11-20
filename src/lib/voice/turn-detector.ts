/**
 * Jarre - End of turn decided by the page, for a learner who thinks aloud
 * while typing (the coding mock's `adaptive` turn taking).
 *
 * The Live API's automatic activity detection has one silence window for the
 * whole session (realtimeInputConfig goes in the setup): long enough not to
 * answer every pause of someone typing (2.5 s) makes every direct question
 * wait those 2.5 s. With it disabled the client marks the turns itself
 * ("activityStart" and "activityEnd" in realtimeInput;
 * ai.google.dev/gemini-api/docs/live-api/capabilities#disable-automatic-vad
 * and ai.google.dev/api/live#automaticactivitydetection, read 2026-11-20), so
 * the window can follow what the page knows and the model does not: whether a
 * key was pressed in the last two seconds.
 *
 * - Typing, or typed within TYPING_RECENT_MS: a pause is thinking. The turn
 *   ends after TURN_END_TYPING_MS of silence.
 * - Not typing: a pause is the end of a question. TURN_END_QUIET_MS.
 *
 * Voice comes from MicActivity (src/lib/voice/mic-activity.ts), which needs
 * 300 ms of voice before it says so: the chunks before that are kept
 * (PREROLL_CHUNKS) and sent right after activityStart, so the first word is
 * not lost. Between turns nothing is sent. Pure: the hook feeds it each
 * 100 ms chunk and sends what it returns, in order
 * (src/lib/voice/__tests__/turn-detector.test.ts; measured against the real
 * API with scripts/probe-coding-mock-turns.ts).
 */

/** Silence that ends the turn when the learner is not typing. */
export const TURN_END_QUIET_MS = 900;
/**
 * Silence that ends the turn while they type: they are thinking aloud. Over
 * 3 s: at 3000 a 2.8 s pause ended the turn just as the next sentence began
 * (MicActivity takes 300 ms to call it voice), in the first probe run.
 */
export const TURN_END_TYPING_MS = 3500;
/** A key this recently means "typing". */
export const TYPING_RECENT_MS = 2000;
/** Chunks kept from before the voice was detected (100 ms each). */
export const PREROLL_CHUNKS = 6;

export type TurnOutput = { type: 'start' } | { type: 'end' } | { type: 'audio'; chunk: Int16Array };

export class TurnDetector {
  private active = false;
  private lastVoiceAt = 0;
  private preroll: Int16Array[] = [];

  /** Whether a turn is open (activityStart sent, activityEnd not yet). */
  get open(): boolean {
    return this.active;
  }

  /**
   * One captured chunk. `voiced`: MicActivity says it is the learner's voice.
   * `lastKeyAt`: the last key pressed in the editor (same clock as `now`), or
   * null. Returns what to send, in order.
   */
  feed(input: { chunk: Int16Array; voiced: boolean; now: number; lastKeyAt: number | null }): TurnOutput[] {
    const { chunk, voiced, now, lastKeyAt } = input;
    if (!this.active) {
      this.preroll.push(chunk);
      if (this.preroll.length > PREROLL_CHUNKS) this.preroll.shift();
      if (!voiced) return [];
      this.active = true;
      this.lastVoiceAt = now;
      const out: TurnOutput[] = [{ type: 'start' }, ...this.preroll.map((c) => ({ type: 'audio' as const, chunk: c }))];
      this.preroll = [];
      return out;
    }
    if (voiced) this.lastVoiceAt = now;
    const typing = lastKeyAt !== null && now - lastKeyAt <= TYPING_RECENT_MS;
    if (now - this.lastVoiceAt >= (typing ? TURN_END_TYPING_MS : TURN_END_QUIET_MS)) {
      this.active = false;
      return [{ type: 'audio', chunk }, { type: 'end' }];
    }
    return [{ type: 'audio', chunk }];
  }

  /** The session is closing or reconnecting: close an open turn. */
  reset(): TurnOutput[] {
    const out: TurnOutput[] = this.active ? [{ type: 'end' }] : [];
    this.active = false;
    this.preroll = [];
    return out;
  }
}
