import { describe, expect, it } from 'vitest';
import {
  CHECK_GAP_MS,
  dueCue,
  editorNote,
  runNote,
  hintNote,
  isHintAccept,
  isHintRequest,
  phaseIndexAt,
  QUIET_AFTER_ANSWER_MS,
  QUIET_UNANSWERED_MS,
  quietToSend,
  shouldSnapshot,
  SILENCE_CHECK_MS,
  SNAPSHOT_GAP_MS,
  START_CODING_AT,
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

  it('gives ten minutes left at 20 of 30, then five, then "any questions for me?" at three, then time is up', () => {
    const at10 = T0 + 20 * MIN;
    expect(dueCue(state(talking(at10)), at10)?.id).toBe('ten-left');
    const at5 = T0 + 25 * MIN;
    expect(dueCue(state({ ...talking(at5), fired: new Set(['ten-left']) }), at5)?.id).toBe('five-left');
    const at3 = T0 + 27 * MIN;
    const questions = dueCue(state({ ...talking(at3), fired: new Set(['ten-left', 'five-left']) }), at3);
    expect(questions).toMatchObject({ id: 'questions', respond: true });
    expect(questions?.note).toContain('any questions for me?');
    // A late tick never goes back to five-left once the questions opened.
    expect(dueCue(state({ ...talking(at3), fired: new Set(['ten-left', 'questions']) }), at3)).toBeNull();
    const atUp = T0 + 30 * MIN;
    const up = dueCue(state({ ...talking(atUp), fired: new Set(['ten-left', 'five-left', 'questions']) }), atUp);
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
    const s = state({ lastCandidateSpeechAt: at - 200, fired: new Set(['ten-left', 'five-left', 'questions']) });
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
  it('moves them on to code at minute 8 of 30 with no code: "in the interest of time"', () => {
    const early = T0 + 7 * MIN;
    expect(dueCue(state({ ...talking(early), codeTouched: false }), early)).toBeNull();
    const at = T0 + START_CODING_AT * 30 * MIN + 1000;
    const cue = dueCue(state({ ...talking(at), codeTouched: false }), at);
    expect(cue?.id).toBe('no-code');
    expect(cue?.note).toContain('In the interest of time');
    expect(dueCue(state({ ...talking(at), codeTouched: true }), at)).toBeNull();
  });

  it('checks in after a minute and a half of silence, asking to narrate when they type', () => {
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

  it('offers a hint, without giving it, when the code has not moved since the check-in, and never past the ladder', () => {
    const at = T0 + 15 * MIN;
    const quiet = { lastCandidateSpeechAt: at - 20_000, lastModelSpeechAt: at - 20_000 };
    const s = state({ ...quiet, lastCheckInAt: at - STUCK_AFTER_CHECK_MS, codeChangedSinceCheckIn: false });
    const offer = dueCue(s, at);
    expect(offer?.id).toBe('hint-offer');
    expect(offer?.note).toContain('Want a small hint?');
    expect(offer?.note).toContain('Do not give any hint in this turn');
    expect(dueCue({ ...s, hintsGiven: 3 }, at)).toBeNull();
    expect(dueCue({ ...s, codeChangedSinceCheckIn: true }, at)).toBeNull();
  });
});

describe('hints', () => {
  it('hears a request for help, not a refusal', () => {
    expect(isHintRequest("Can I get a hint on this part?")).toBe(true);
    expect(isHintRequest('Could you help me out here?')).toBe(true);
    // Describing is not asking: the interviewer asks where they are, the ladder stays closed.
    expect(isHintRequest("I'm stuck on the window")).toBe(false);
    expect(isHintRequest('I was stuck on this before, now I see it')).toBe(false);
    expect(isHintRequest("I don't need a hint, I think I have it")).toBe(false);
    expect(isHintRequest('Let me write the loop')).toBe(false);
  });

  it('takes a yes to "Want a small hint?", not a no and not thinking aloud', () => {
    expect(isHintAccept('Yes, please.')).toBe(true);
    expect(isHintAccept('Sure, that would help')).toBe(true);
    expect(isHintAccept('No, I think I have it')).toBe(false);
    expect(isHintAccept("No thanks, I don't need a hint")).toBe(false);
    expect(isHintAccept('Okay so I will loop over the array')).toBe(false);
    expect(isHintAccept('The map holds the index')).toBe(false);
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

describe('when a note may go into the live session', () => {
  const base = { now: T0 + 60_000, lastCandidateSpeechAt: T0, lastModelSpeechAt: T0, modelSpeaking: false };

  it('never while the candidate is talking: a note mid-utterance makes the model drop what they say', () => {
    expect(quietToSend({ ...base, lastCandidateSpeechAt: base.now - 200 })).toBe(false);
    expect(quietToSend({ ...base, lastCandidateSpeechAt: base.now - 2600 })).toBe(false);
  });

  it('never while the interviewer speaks', () => {
    expect(quietToSend({ ...base, modelSpeaking: true })).toBe(false);
  });

  it('waits longer when the interviewer may still be about to answer what they said', () => {
    const spoke = base.now - QUIET_AFTER_ANSWER_MS;
    // Nothing from the interviewer since: its answer can still be on the way.
    expect(quietToSend({ ...base, lastCandidateSpeechAt: spoke, lastModelSpeechAt: spoke - 5000 })).toBe(false);
    expect(quietToSend({ ...base, lastCandidateSpeechAt: base.now - QUIET_UNANSWERED_MS, lastModelSpeechAt: T0 })).toBe(true);
    // The interviewer already answered: the end-of-speech window is enough.
    expect(quietToSend({ ...base, lastCandidateSpeechAt: spoke, lastModelSpeechAt: spoke + 1500 })).toBe(true);
  });

  it('a candidate coding in silence is a quiet moment', () => {
    expect(quietToSend(base)).toBe(true);
  });
});

describe('what the interviewer sees', () => {
  it('numbers the lines of the editor', () => {
    const note = editorNote('const a = 1;\nreturn a;\n', 65_000, 'typing');
    expect(note).toContain('[EDITOR 1:05');
    expect(note).toContain('1| const a = 1;\n2| return a;');
  });

  it('says which language the pad is in, and a language switch', () => {
    expect(editorNote('x = 1\n', 5_000, 'typing', 'Python 3')).toContain("the candidate's screen right now (typing), coding in Python 3.");
    expect(editorNote('def f():\n    pass\n', 5_000, 'language', 'Python 3')).toContain("they switched the pad's language to Python 3");
    expect(runNote({ kind: 'run', language: 'Python 3', passed: 0, total: 0, failed: [], logs: ['hi'] }, 5_000)).toContain('ran their code (Python 3)');
  });

  it('sends a snapshot only when the code changed, and at most every 20 s while typing', () => {
    const base = { code: 'b', lastSentCode: 'a', lastSentAt: T0, now: T0 + 1000 };
    expect(shouldSnapshot({ ...base, code: 'a', reason: 'run' })).toBe(false);
    expect(shouldSnapshot({ ...base, reason: 'check-in' })).toBe(true);
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
