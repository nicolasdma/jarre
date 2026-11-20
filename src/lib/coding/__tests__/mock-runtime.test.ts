import { describe, expect, it } from 'vitest';
import {
  CHECK_GAP_MS,
  dueCue,
  editorNote,
  runNote,
  hintNote,
  isHintRequest,
  phaseIndexAt,
  shouldSnapshot,
  SILENCE_CHECK_MS,
  SNAPSHOT_GAP_MS,
  STUCK_AFTER_CHECK_MS,
  type CueId,
  type MockClockState,
} from '../mock-runtime';

const MIN = 60_000;
const T0 = 1_000_000;

function state(over: Partial<MockClockState> = {}): MockClockState {
  return {
    startedAt: T0,
    durationMs: 30 * MIN,
    fired: new Set<CueId>(),
    lastCandidateSpeechAt: T0,
    lastModelSpeechAt: T0,
    modelSpeaking: false,
    lastCodeChangeAt: T0,
    codeTouched: true,
    lastCheckInAt: null,
    codeChangedSinceCheckIn: false,
    hintsGiven: 0,
    hintCount: 3,
    ...over,
  };
}

/** Everyone talking recently: no silence cue, only the clock. */
const talking = (at: number) => ({ lastCandidateSpeechAt: at - 10_000, lastModelSpeechAt: at - 10_000 });

describe('dueCue: the clock', () => {
  it('says nothing early on while they talk', () => {
    const at = T0 + 5 * MIN;
    expect(dueCue(state(talking(at)), at)).toBeNull();
  });

  it('gives ten minutes left at 20 of 30, then five left, then time is up', () => {
    const at10 = T0 + 20 * MIN;
    expect(dueCue(state(talking(at10)), at10)?.id).toBe('ten-left');
    const at5 = T0 + 25 * MIN;
    expect(dueCue(state({ ...talking(at5), fired: new Set(['ten-left']) }), at5)?.id).toBe('five-left');
    const atUp = T0 + 30 * MIN;
    const up = dueCue(state({ ...talking(atUp), fired: new Set(['ten-left', 'five-left']) }), atUp);
    expect(up).toMatchObject({ id: 'time-up', respond: true });
    expect(up?.note).toContain('interview complete');
  });

  it('skips ten-left once five-left was given (a late tick never goes backwards)', () => {
    const at = T0 + 26 * MIN;
    expect(dueCue(state({ ...talking(at), fired: new Set(['five-left']) }), at)).toBeNull();
  });

  it('waits for a quiet moment before interjecting, and for the model to stop speaking', () => {
    const at = T0 + 20 * MIN;
    expect(dueCue(state({ lastCandidateSpeechAt: at - 500, lastModelSpeechAt: at - 10_000 }), at)).toBeNull();
    expect(dueCue(state({ ...talking(at), modelSpeaking: true }), at)).toBeNull();
  });

  it('closes after time is up even if they never stop talking, a minute later', () => {
    const at = T0 + 31 * MIN;
    const s = state({ lastCandidateSpeechAt: at - 200, fired: new Set(['ten-left', 'five-left']) });
    expect(dueCue(s, at)?.id).toBe('time-up');
  });

  it('a 15-minute warm-up gets five-left but no ten-left', () => {
    const at = T0 + 6 * MIN;
    expect(dueCue(state({ ...talking(at), durationMs: 15 * MIN }), at)).toBeNull();
    const at5 = T0 + 10 * MIN;
    expect(dueCue(state({ ...talking(at5), durationMs: 15 * MIN }), at5)?.id).toBe('five-left');
  });
});

describe('dueCue: silence, no code, stuck', () => {
  it('nudges to start coding at 40% with no code', () => {
    const at = T0 + 12 * MIN;
    const cue = dueCue(state({ ...talking(at), codeTouched: false }), at);
    expect(cue?.id).toBe('no-code');
  });

  it('checks in after two minutes of silence, asking to narrate when they type', () => {
    const at = T0 + 10 * MIN;
    const quiet = { lastCandidateSpeechAt: at - SILENCE_CHECK_MS, lastModelSpeechAt: at - SILENCE_CHECK_MS };
    const typing = dueCue(state({ ...quiet, lastCodeChangeAt: at - 5000 }), at);
    expect(typing?.id).toBe('check-in');
    expect(typing?.note).toMatch(/talk you through what they are writing/);
    const idle = dueCue(state({ ...quiet, lastCodeChangeAt: at - 3 * MIN }), at);
    expect(idle?.note).toMatch(/Do not give a hint yet/);
  });

  it('does not check in again too soon', () => {
    const at = T0 + 10 * MIN;
    const quiet = { lastCandidateSpeechAt: at - SILENCE_CHECK_MS, lastModelSpeechAt: at - SILENCE_CHECK_MS };
    expect(dueCue(state({ ...quiet, lastCheckInAt: at - CHECK_GAP_MS + 1000, codeChangedSinceCheckIn: true }), at)).toBeNull();
  });

  it('offers a hint when the code has not moved since the check-in, and never past the ladder', () => {
    const at = T0 + 15 * MIN;
    const quiet = { lastCandidateSpeechAt: at - 20_000, lastModelSpeechAt: at - 20_000 };
    const s = state({ ...quiet, lastCheckInAt: at - STUCK_AFTER_CHECK_MS, codeChangedSinceCheckIn: false });
    expect(dueCue(s, at)?.id).toBe('stuck-hint');
    expect(dueCue({ ...s, hintsGiven: 3 }, at)).toBeNull();
    expect(dueCue({ ...s, codeChangedSinceCheckIn: true }, at)).toBeNull();
  });
});

describe('hints', () => {
  it('hears a request for help, not a refusal', () => {
    expect(isHintRequest("Can I get a hint on this part?")).toBe(true);
    expect(isHintRequest("I'm stuck on the window")).toBe(true);
    expect(isHintRequest("I don't need a hint, I think I have it")).toBe(false);
    expect(isHintRequest('Let me write the loop')).toBe(false);
  });

  it('hands out the ladder one rung at a time, then says it is spent', () => {
    const ladder = ['small', 'medium', 'big'];
    expect(hintNote(ladder, 0)).toMatchObject({ level: 1 });
    expect(hintNote(ladder, 0).note).toContain('small');
    expect(hintNote(ladder, 0).note).not.toContain('medium');
    expect(hintNote(ladder, 2).note).toContain('3 of 3');
    expect(hintNote(ladder, 3)).toMatchObject({ level: null });
  });
});

describe('what the interviewer sees', () => {
  it('numbers the lines of the editor', () => {
    const note = editorNote('const a = 1;\nreturn a;\n', 65_000, 'speaking');
    expect(note).toContain('[EDITOR 1:05');
    expect(note).toContain('1| const a = 1;\n2| return a;');
  });

  it('says which language the pad is in, and a language switch', () => {
    expect(editorNote('x = 1\n', 5_000, 'typing', 'Python 3')).toContain("the candidate's screen right now (typing), coding in Python 3.");
    expect(editorNote('def f():\n    pass\n', 5_000, 'language', 'Python 3')).toContain("they switched the pad's language to Python 3");
    expect(runNote({ kind: 'run', language: 'Python 3', passed: 0, total: 0, failed: [], logs: ['hi'] }, 5_000)).toContain('ran their code (Python 3)');
  });

  it('sends a snapshot only when the code changed, and at most once a minute while typing', () => {
    const base = { code: 'b', lastSentCode: 'a', lastSentAt: T0, now: T0 + 1000 };
    expect(shouldSnapshot({ ...base, code: 'a', reason: 'run' })).toBe(false);
    expect(shouldSnapshot({ ...base, reason: 'speaking' })).toBe(true);
    expect(shouldSnapshot({ ...base, reason: 'typing' })).toBe(false);
    expect(shouldSnapshot({ ...base, now: T0 + SNAPSHOT_GAP_MS, reason: 'typing' })).toBe(true);
  });

  it('places the clock in its phase', () => {
    const phases = [
      { from: 0, to: 0.1 },
      { from: 0.1, to: 0.5 },
      { from: 0.5, to: 1 },
    ];
    expect(phaseIndexAt(phases, 0, 30 * MIN)).toBe(0);
    expect(phaseIndexAt(phases, 10 * MIN, 30 * MIN)).toBe(1);
    expect(phaseIndexAt(phases, 40 * MIN, 30 * MIN)).toBe(2);
  });
});
