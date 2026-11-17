/**
 * The clock and the eyes of the coding mock: what the page tells the voice
 * interviewer, and when. The model has no clock and no screen, so the runtime
 * gives it both, as text notes it never reads aloud:
 *
 * - [EDITOR] the candidate's code, with line numbers, when they start talking
 *   (if it changed), after a run, before any check-in, and at most once a
 *   minute while they type. A real interviewer watches the shared screen.
 * - [RUN] what a run printed and which example tests passed.
 * - [HINT n] the next rung of the problem's hint ladder, only when the
 *   candidate asks for help or has been stuck after a check-in. The ladder is
 *   the runtime's, not the model's: the prompt never carries the hints, so the
 *   model cannot hand out a bigger one than the candidate earned.
 * - [TIME] and [CHECK-IN] cues: ten and five minutes left, time is up, no code
 *   yet, and two minutes of silence ("talk me through it").
 *
 * Notes that need the interviewer to speak now (`respond`) wait for a quiet
 * moment: the candidate not talking for a few seconds and the model not
 * speaking. Everything here is pure and tested
 * (src/lib/coding/__tests__/mock-runtime.test.ts); the component only wires it.
 */

const MIN = 60_000;

/** Silence (no one talking) before the interviewer checks in. */
export const SILENCE_CHECK_MS = 2 * MIN;
/** After a check-in, how long with the code unchanged before offering a hint. */
export const STUCK_AFTER_CHECK_MS = 3 * MIN;
/** Minimum gap between two check-ins. */
export const CHECK_GAP_MS = 2.5 * MIN;
/** How long the candidate must be quiet before the interviewer interjects a time cue. */
export const QUIET_FOR_TIME_MS = 3000;
/** How long the candidate must be quiet before a check-in or nudge. */
export const QUIET_FOR_NUDGE_MS = 6000;
/** After time is up, how long to wait for a quiet moment before closing anyway. */
export const HARD_STOP_AFTER_MS = 3 * MIN;
/** Minimum gap between two editor snapshots sent while typing. */
export const SNAPSHOT_GAP_MS = MIN;

export type CueId = 'no-code' | 'ten-left' | 'five-left' | 'time-up' | 'check-in' | 'stuck-hint';

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

  if (s.durationMs >= 15 * MIN && left <= 5 * MIN && !s.fired.has('five-left') && !s.fired.has('time-up')) {
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

  if (!s.codeTouched && elapsed >= 0.4 * s.durationMs && !s.fired.has('no-code')) {
    if (!canInterject(QUIET_FOR_NUDGE_MS)) return null;
    return {
      id: 'no-code',
      respond: true,
      note: `[TIME ${mmss(elapsed)} · No code yet and ${mmss(left)} left. Suggest, in one sentence, that they start writing the version they have in mind, even the brute force.]`,
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
      id: 'stuck-hint',
      respond: true,
      note: `[CHECK-IN ${mmss(elapsed)} · They still look stuck: the code has not changed since your last check-in. Offer a small hint, as a nudge or a question. The hint follows.]`,
    };
  }

  if (silentFor >= SILENCE_CHECK_MS && sinceCheckIn >= CHECK_GAP_MS && canInterject(QUIET_FOR_NUDGE_MS)) {
    const typing = now - s.lastCodeChangeAt < MIN;
    return {
      id: 'check-in',
      respond: true,
      note: typing
        ? `[CHECK-IN ${mmss(elapsed)} · They have been coding in silence for two minutes. Ask them, in one short sentence, to talk you through what they are writing.]`
        : `[CHECK-IN ${mmss(elapsed)} · Two minutes of silence and the code has not changed. Check in briefly, like an interviewer: ask where they are and what they are thinking. Do not give a hint yet.]`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Hints
// ---------------------------------------------------------------------------

const HINT_ASK = /\b(hint|clue|nudge|pointer|stuck|help me|some help|any help|a little help)\b/i;
const HINT_DECLINE = /\b(no|don'?t|do not|without)\s+(need\s+)?(a\s+|any\s+)?(hint|help)/i;

/** The candidate is asking for help in this utterance. */
export function isHintRequest(utterance: string): boolean {
  return HINT_ASK.test(utterance) && !HINT_DECLINE.test(utterance);
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

export type SnapshotReason = 'speaking' | 'typing' | 'run' | 'check-in' | 'reconnect' | 'start';

export function withLineNumbers(code: string): string {
  const lines = code.replace(/\s+$/, '').split('\n');
  const width = String(lines.length).length;
  return lines.map((l, i) => `${String(i + 1).padStart(width, ' ')}| ${l}`).join('\n');
}

export function editorNote(code: string, elapsedMs: number, reason: SnapshotReason): string {
  return `[EDITOR ${mmss(elapsedMs)} · the candidate's screen right now (${reason}). Not spoken: never read it aloud.]\n${withLineNumbers(code)}`;
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
  passed: number;
  total: number;
  error?: string;
  failed: string[];
  logs: string[];
}

export function runNote(r: RunSummary, elapsedMs: number): string {
  const lines = [`[RUN ${mmss(elapsedMs)} · they ${r.kind === 'examples' ? 'ran the example tests' : 'ran their code'}. Not spoken.]`];
  if (r.error) lines.push(`Error: ${r.error}`);
  if (r.total) lines.push(`Tests: ${r.passed}/${r.total} pass${r.failed.length ? `; failing: ${r.failed.join('; ')}` : ''}`);
  if (r.logs.length) lines.push(`Output:\n${r.logs.slice(0, 15).join('\n')}`);
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
