/**
 * The clock and the eyes of the coding mock: what the page tells the voice
 * interviewer, and when. The model has no clock and no screen, so the runtime
 * gives it both, as text notes it never reads aloud:
 *
 * - [EDITOR] the candidate's code, with line numbers, when it changed: at the
 *   next quiet moment and at most every 20 s, after a run and before any
 *   check-in. A real interviewer watches the shared screen.
 * - [RUN] what a run printed and which example tests passed.
 * - [HINT n] the next rung of the problem's hint ladder, only when the
 *   candidate asks for help, or says yes after the interviewer offered one
 *   because they looked stuck (the ladder is closed by default: a hint costs
 *   on the scorecard). The ladder is the runtime's, not the model's: the
 *   prompt never carries the hints, so the model cannot hand out a bigger one
 *   than the candidate earned.
 * - [TIME] and [CHECK-IN] cues: no code a quarter of the way in ("in the
 *   interest of time"), ten, five and three minutes left (the last one opens
 *   "any questions for me?"), time is up, and ninety seconds of silence.
 *   Thresholds follow docs/research/2026-11-20-entrevistador-tecnico-realista.md
 *   (sections 6.4 and 6.8).
 *
 * Every note, spoken or not, waits for a quiet moment (`quietToSend`): text
 * that reaches the Live API while the candidate is mid-utterance can make it
 * drop that utterance, and sometimes everything said after it. Measured with
 * scripts/probe-coding-mock-audio.ts on gemini-3.8-live (2026-11-20,
 * docs/research/voice-probe/coding-mock-audio-before-*.json): a note sent 3 s
 * into a 13 s spoken question left nothing transcribed and no answer in 2 of
 * 4 sessions, with either transport (sendClientContent turnComplete=false,
 * sendRealtimeInput text), and in one the session heard nothing after it; the
 * same note sent before the question was heard, answered and used in 4 of 4.
 * That was the owner's session 522c1b71: 150 s of thinking aloud, no input
 * transcription, then "could you talk me through what you're writing?".
 * "Talking" is read on the microphone itself (src/lib/voice/mic-activity.ts):
 * input transcription arrives seconds late. Everything here is pure and tested
 * (src/lib/coding/__tests__/mock-runtime.test.ts); the component only wires it.
 */

const MIN = 60_000;

/** Silence (no one talking) before the interviewer checks in. */
export const SILENCE_CHECK_MS = 1.5 * MIN;
/** After a check-in, how long with the code unchanged before offering a hint. */
export const STUCK_AFTER_CHECK_MS = 1.5 * MIN;
/** Minimum gap between two check-ins. */
export const CHECK_GAP_MS = 2 * MIN;
/** No code by this fraction of the session: the interviewer moves them on (minute 8 of 30). */
export const START_CODING_AT = 0.27;
/** With this much left, the technical part closes and "any questions for me?" opens. */
export const QUESTIONS_AT_LEFT_MS = 3 * MIN;
/** After the interviewer offers a hint, how long a "yes" counts as accepting it. */
export const HINT_OFFER_OPEN_MS = 45_000;
/** How long the candidate must be quiet before the interviewer interjects a time cue. */
export const QUIET_FOR_TIME_MS = 3000;
/** How long the candidate must be quiet before a check-in or nudge. */
export const QUIET_FOR_NUDGE_MS = 6000;
/** After time is up, how long to wait for a quiet moment before closing anyway. */
export const HARD_STOP_AFTER_MS = 3 * MIN;
/** Minimum gap between two editor snapshots sent while typing. */
export const SNAPSHOT_GAP_MS = 20_000;
/**
 * Quiet needed before any text goes into the session once the interviewer
 * has answered what the candidate last said: past the 2.5 s end-of-speech
 * window of `thinking-aloud` (src/lib/voice/live-models.ts).
 */
export const QUIET_AFTER_ANSWER_MS = 3000;
/**
 * Quiet needed when the interviewer has not spoken since: it may still be
 * about to answer (first audio came 3.5 to 4.2 s after the question ended in
 * the probe), and text sent then would cut that answer.
 */
export const QUIET_UNANSWERED_MS = 7000;

/** Whether text can go into the live session now without landing on the candidate's speech or the interviewer's answer. */
export function quietToSend(params: {
  now: number;
  /** Last time the candidate's voice was on the microphone (or transcribed). */
  lastCandidateSpeechAt: number;
  lastModelSpeechAt: number;
  modelSpeaking: boolean;
}): boolean {
  const { now, lastCandidateSpeechAt, lastModelSpeechAt, modelSpeaking } = params;
  if (modelSpeaking) return false;
  const quietFor = now - lastCandidateSpeechAt;
  return quietFor >= (lastModelSpeechAt > lastCandidateSpeechAt ? QUIET_AFTER_ANSWER_MS : QUIET_UNANSWERED_MS);
}

export type CueId = 'no-code' | 'ten-left' | 'five-left' | 'questions' | 'time-up' | 'check-in' | 'hint-offer';

export interface MockClockState {
  /** Session start, ms (performance or Date clock, consistently). */
  startedAt: number;
  durationMs: number;
  /** Cues already delivered (check-ins and hints can repeat; these ids record the last one). */
  fired: ReadonlySet<CueId>;
  /** Last time the candidate's speech was heard. */
  lastCandidateSpeechAt: number;
  /** Last time the interviewer was speaking. */
  lastModelSpeechAt: number;
  /** The interviewer is speaking right now. */
  modelSpeaking: boolean;
  /** Last edit in the editor. */
  lastCodeChangeAt: number;
  /** The code differs from the starter. */
  codeTouched: boolean;
  /** Last check-in delivered, or null. */
  lastCheckInAt: number | null;
  /** The code changed since the last check-in. */
  codeChangedSinceCheckIn: boolean;
  /** Hints of the ladder given so far. */
  hintsGiven: number;
  hintCount: number;
}

export interface Cue {
  id: CueId;
  /** Ask the interviewer to speak now (turnComplete), or only add context. */
  respond: boolean;
  note: string;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The next cue to deliver now, or null. Call it about once a second; deliver
 * what it returns and add its id to `fired` (check-ins update
 * `lastCheckInAt`, hints `hintsGiven`).
 */
export function dueCue(s: MockClockState, now: number): Cue | null {
  const elapsed = now - s.startedAt;
  const left = s.durationMs - elapsed;
  const lastSpeech = Math.max(s.lastCandidateSpeechAt, s.lastModelSpeechAt);
  const candidateQuietFor = now - s.lastCandidateSpeechAt;
  const canInterject = (quietMs: number) => !s.modelSpeaking && candidateQuietFor >= quietMs;

  if (left <= 0 && !s.fired.has('time-up')) {
    if (canInterject(QUIET_FOR_TIME_MS) || -left >= HARD_STOP_AFTER_MS / 3) {
      return {
        id: 'time-up',
        respond: true,
        note: `[TIME ${mmss(elapsed)} · Time is up. Close the interview now: if they are mid-sentence, let them finish the thought first. One or two sentences in character (thank them, next steps by email), no feedback. Then say exactly "interview complete".]`,
      };
    }
    return null;
  }

  if (s.durationMs >= 15 * MIN && left <= QUESTIONS_AT_LEFT_MS && !s.fired.has('questions')) {
    if (!canInterject(QUIET_FOR_TIME_MS)) return null;
    return {
      id: 'questions',
      respond: true,
      note: `[TIME ${mmss(elapsed)} · About three minutes left. Close the technical part now: if they are still writing, "Let's pause the code here."; if you never asked for the complexity, ask for it first, in one question. Then: "That's the technical part. We have a couple of minutes: any questions for me?" and answer what they ask, briefly.]`,
    };
  }

  if (s.durationMs >= 15 * MIN && left <= 5 * MIN && !s.fired.has('five-left') && !s.fired.has('questions') && !s.fired.has('time-up')) {
    if (!canInterject(QUIET_FOR_TIME_MS)) return null;
    return {
      id: 'five-left',
      respond: true,
      note: `[TIME ${mmss(elapsed)} · About five minutes left. Say so briefly. If they have not run or tested their code, ask them to walk you through a test case now; if they have, ask for the exact time and space complexity, then one senior follow-up.]`,
    };
  }

  if (s.durationMs >= 25 * MIN && left <= 10 * MIN && !s.fired.has('ten-left') && !s.fired.has('five-left')) {
    if (!canInterject(QUIET_FOR_TIME_MS)) return null;
    return {
      id: 'ten-left',
      respond: true,
      note: `[TIME ${mmss(elapsed)} · About ten minutes left. Mention it in one short sentence, the way an interviewer keeps time, and let them continue. No question unless they are clearly lost.]`,
    };
  }

  if (!s.codeTouched && elapsed >= START_CODING_AT * s.durationMs && !s.fired.has('no-code')) {
    if (!canInterject(QUIET_FOR_TIME_MS)) return null;
    return {
      id: 'no-code',
      respond: true,
      note: `[TIME ${mmss(elapsed)} · No code yet and ${mmss(left)} left. Move them on, politely, in one sentence: "In the interest of time, let's get some code down.", the version they have in mind, even the brute force.]`,
    };
  }

  const silentFor = now - lastSpeech;
  const sinceCheckIn = s.lastCheckInAt === null ? Infinity : now - s.lastCheckInAt;
  if (
    s.lastCheckInAt !== null &&
    !s.codeChangedSinceCheckIn &&
    sinceCheckIn >= STUCK_AFTER_CHECK_MS &&
    s.hintsGiven < s.hintCount &&
    silentFor >= QUIET_FOR_NUDGE_MS &&
    canInterject(QUIET_FOR_NUDGE_MS)
  ) {
    return {
      id: 'hint-offer',
      respond: true,
      note: `[CHECK-IN ${mmss(elapsed)} · They still look stuck: the code has not changed since your last check-in. Offer help and wait: "Want a small hint?". Do not give any hint in this turn.]`,
    };
  }

  if (silentFor >= SILENCE_CHECK_MS && sinceCheckIn >= CHECK_GAP_MS && canInterject(QUIET_FOR_NUDGE_MS)) {
    const typing = now - s.lastCodeChangeAt < MIN;
    return {
      id: 'check-in',
      respond: true,
      note: typing
        ? `[CHECK-IN ${mmss(elapsed)} · They have been coding without a word for a minute and a half. Ask them, in one short sentence, to talk you through what they are writing.]`
        : `[CHECK-IN ${mmss(elapsed)} · A minute and a half of silence and the code has not changed. Check in briefly, like an interviewer: "Take your time. What are you thinking?". Do not give a hint yet.]`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hints
// ---------------------------------------------------------------------------

// Asking, not describing: "I'm stuck" alone gets "where are you?" from the interviewer, not a rung of the ladder.
const HINT_ASK = /\b(hint|clue|nudge|pointer|help me|some help|any help|a little help|can you help|could you help)\b/i;
const HINT_ACCEPT = /^\W*(yes|yeah|yep|yup|sure|please|ok|okay|go ahead|that would help|that'd help|why not)\b/i;
const HINT_DECLINE = /\b(no|don'?t|do not|without)\s+(need\s+)?(a\s+|any\s+)?(hint|help)/i;

/** The candidate is asking for help in this utterance. */
export function isHintRequest(utterance: string): boolean {
  return HINT_ASK.test(utterance) && !HINT_DECLINE.test(utterance);
}

/** After "Want a small hint?": the candidate says yes. */
export function isHintAccept(utterance: string): boolean {
  return HINT_ACCEPT.test(utterance.trim()) && !HINT_DECLINE.test(utterance) && !/^\W*(ok|okay|sure)\W+(so|let me|i'?ll|i will|i think)\b/i.test(utterance.trim());
}

/** The note that hands the interviewer the next rung of the ladder, or that the ladder is spent. */
export function hintNote(hints: readonly string[], given: number): { note: string; level: number | null } {
  if (given >= hints.length) {
    return {
      level: null,
      note: '[HINT · No hints left in the ladder. Do not give the solution: ask one guiding question about the step they are missing.]',
    };
  }
  const level = given + 1;
  return {
    level,
    note: `[HINT ${level} of ${hints.length} · Give this hint now, in your own words, briefly, and nothing beyond it: ${hints[given]}]`,
  };
}

// ---------------------------------------------------------------------------
// What the interviewer sees
// ---------------------------------------------------------------------------

export type SnapshotReason = 'typing' | 'update' | 'run' | 'check-in' | 'reconnect' | 'start' | 'language';

export function withLineNumbers(code: string): string {
  const lines = code.replace(/\s+$/, '').split('\n');
  const width = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(width, ' ')}| ${l}`).join('\n');
}

/**
 * The candidate's screen as a note. `language` is the pad's language picker
 * (TypeScript, JavaScript, Python 3): the interviewer sees which one they code in,
 * and a switch (`reason` 'language') is said as such.
 */
export function editorNote(code: string, elapsedMs: number, reason: SnapshotReason, language?: string): string {
  const what =
    reason === 'language' && language
      ? `they switched the pad's language to ${language}; this is the editor now`
      : `the candidate's screen right now (${reason})${language ? `, coding in ${language}` : ''}`;
  return `[EDITOR ${mmss(elapsedMs)} · ${what}. Not spoken: never read it aloud.]\n${withLineNumbers(code)}`;
}

/** Whether to send a new editor snapshot. */
export function shouldSnapshot(params: {
  code: string;
  lastSentCode: string | null;
  lastSentAt: number | null;
  now: number;
  reason: SnapshotReason;
}): boolean {
  const { code, lastSentCode, lastSentAt, now, reason } = params;
  if (code === lastSentCode) return false;
  if (reason === 'typing') return lastSentAt === null || now - lastSentAt >= SNAPSHOT_GAP_MS;
  return true;
}

export interface RunSummary {
  kind: 'run' | 'examples';
  /** The pad's language, as on the picker. */
  language?: string;
  passed: number;
  total: number;
  error?: string;
  failed: string[];
  logs: string[];
}

export function runNote(r: RunSummary, elapsedMs: number): string {
  const lines = [
    `[RUN ${mmss(elapsedMs)} · they ${r.kind === 'examples' ? 'ran the example tests' : 'ran their code'}${r.language ? ` (${r.language})` : ''}. Not spoken.]`,
  ];
  if (r.error) lines.push(`Error: ${r.error}`);
  if (r.total) lines.push(`Tests: ${r.passed}/${r.total} pass${r.failed.length ? `; failing: ${r.failed.join('; ')}` : ''}`);
  if (r.logs.length) lines.push(`Output:\n${r.logs.slice(0, 15).join('\n')}`);
  if (!r.error && !r.total && !r.logs.length) lines.push('No output.');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// The on-screen guide
// ---------------------------------------------------------------------------

/** The phase the clock is in, by fraction of the session. */
export function phaseIndexAt<T extends { from: number; to: number }>(phases: readonly T[], elapsedMs: number, durationMs: number): number {
  if (!phases.length) return -1;
  const f = Math.min(0.9999, Math.max(0, elapsedMs / durationMs));
  const i = phases.findIndex((p) => f >= p.from && f < p.to);
  return i >= 0 ? i : phases.length - 1;
}

/** "12:30" style clock. */
export function formatClock(ms: number): string {
  return mmss(ms);
}
