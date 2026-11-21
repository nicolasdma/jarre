import { describe, expect, it } from 'vitest';
import { addMicFacts, MicActivity, NO_SIGNAL_AFTER_MS, UNHEARD_VOICE_MS, type MicChunkContext } from '../mic-activity';

const RATE = 16000;
const T0 = 1_000_000;
/** 100 ms of a tone at the given amplitude (0 = digital silence). */
function chunk(amplitude: number): Int16Array {
  const out = new Int16Array(RATE / 10);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(amplitude * Math.sin(i / 3));
  return out;
}
/** Feed `seconds` of the same chunk, 100 ms apart; returns the time after the last one. */
function feed(mic: MicActivity, from: number, seconds: number, amplitude: number, context: MicChunkContext = {}): number {
  let t = from;
  for (let i = 0; i < Math.round(seconds * 10); i++) {
    t += 100;
    mic.feed(chunk(amplitude), RATE, t, context);
  }
  return t;
}
const ROOM = 40;
const VOICE = 6000;
/** The health at every 100 ms of `seconds` of room noise: what the session's timer would see. */
function healthWhileQuiet(mic: MicActivity, from: number, seconds: number): { t: number; seen: Set<string> } {
  const seen = new Set<string>();
  let t = from;
  for (let i = 0; i < Math.round(seconds * 10); i++) {
    t = feed(mic, t, 0.1, ROOM);
    seen.add(mic.health(t));
  }
  return { t, seen };
}

describe('MicActivity', () => {
  it('says no-signal when the microphone delivers digital silence, and recovers', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 2, 0);
    expect(mic.health(t)).toBe('ok');
    t = feed(mic, t, NO_SIGNAL_AFTER_MS / 1000, 0);
    expect(mic.health(t)).toBe('no-signal');
    t = feed(mic, t, 0.2, 40);
    expect(mic.health(t)).toBe('ok');
  });

  it('says no-signal when no chunk arrives at all', () => {
    const mic = new MicActivity();
    mic.start(T0);
    expect(mic.health(T0 + NO_SIGNAL_AFTER_MS)).toBe('no-signal');
  });

  it('a quiet room is not a dead microphone, and is not the learner talking', () => {
    const mic = new MicActivity();
    mic.start(T0);
    const t = feed(mic, T0, 30, 40);
    expect(mic.health(t)).toBe('ok');
    expect(mic.lastVoiceAt).toBeNull();
  });

  it('knows the learner is talking at once, and ignores a key click', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, 40);
    mic.feed(chunk(6000), RATE, (t += 100)); // one loud 100 ms: a key, a knock
    t = feed(mic, t, 1, 40);
    expect(mic.lastVoiceAt).toBeNull();
    t = feed(mic, t, 1, 6000);
    expect(mic.lastVoiceAt).toBe(t);
  });

  it('a steady loud hiss (gain control on a noisy room) is not the learner talking; speech over it is', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 20, 2500);
    expect(mic.lastVoiceAt).toBeNull();
    t = feed(mic, t, 1, 12000);
    expect(mic.lastVoiceAt).toBe(t);
  });

  it("does not count the tutor's own voice coming back through the microphone", () => {
    const mic = new MicActivity();
    mic.start(T0);
    const t = feed(mic, T0, 20, 6000, { echo: true });
    expect(mic.lastVoiceAt).toBeNull();
    expect(mic.health(t)).toBe('ok');
  });

  it('says unheard when the learner spoke, went quiet, and nothing was transcribed, until something is', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    t = feed(mic, t, 6, VOICE);
    expect(mic.health(t)).toBe('ok');
    // Still inside the quiet a healthy session needs to close the turn and transcribe it.
    t = feed(mic, t, (mic.quietMs - 200) / 1000, ROOM);
    expect(mic.health(t)).toBe('ok');
    t = feed(mic, t, 0.3, ROOM);
    expect(mic.health(t)).toBe('unheard');
    // It holds while they repeat themselves into a session that does not hear...
    t = feed(mic, t, 2, VOICE);
    expect(mic.health(t)).toBe('unheard');
    // ...until something is transcribed.
    mic.heard();
    expect(mic.health(t)).toBe('ok');
    expect(mic.facts().micUnheard).toBe(1);
  });

  it('a candidate thinking aloud for a minute with nothing transcribed yet is heard: the transcription comes when the turn ends', () => {
    // scripts/probe-live-long-utterance.ts: 40 s of speech, first fragment at 21 s; 48 s with 1.5 s pauses, first fragment at 51 s.
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    const seen = new Set<string>();
    for (let sentence = 0; sentence < 10; sentence++) {
      for (let i = 0; i < 50; i++) {
        t = feed(mic, t, 0.1, VOICE);
        seen.add(mic.health(t));
      }
      const pause = healthWhileQuiet(mic, t, 1.5);
      t = pause.t;
      pause.seen.forEach((h) => seen.add(h));
    }
    // The server closes the turn 2.5 s after the last word and transcribes it about 0.7 s later.
    const tail = healthWhileQuiet(mic, t, 3.2);
    tail.seen.forEach((h) => seen.add(h));
    mic.heard();
    const after = healthWhileQuiet(mic, tail.t, 30);
    after.seen.forEach((h) => seen.add(h));
    expect([...seen]).toEqual(['ok']);
    expect(mic.facts().micUnheard).toBe(0);
  });

  it('waits for the turn-taking window of its session', () => {
    const quick = new MicActivity({ endOfSpeechMs: 1300 });
    const slow = new MicActivity({ endOfSpeechMs: 3500 });
    expect(slow.quietMs - quick.quietMs).toBe(2200);
    for (const mic of [quick, slow]) {
      mic.start(T0);
      const t = feed(mic, feed(mic, T0, 1, ROOM), 6, VOICE);
      feed(mic, t, (quick.quietMs + 300) / 1000, ROOM);
    }
    const t = T0 + 7000 + quick.quietMs + 300;
    expect(quick.health(t)).toBe('unheard');
    expect(slow.health(t)).toBe('ok');
  });

  it('a cough or a chair is forgotten, and never adds up to an unheard learner', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    const seen = new Set<string>();
    // 1.5 s of noise every 30 s for ten minutes: far more than UNHEARD_VOICE_MS in total.
    for (let i = 0; i < 20; i++) {
      t = feed(mic, t, 1.5, VOICE);
      const quiet = healthWhileQuiet(mic, t, 28.5);
      t = quiet.t;
      quiet.seen.forEach((h) => seen.add(h));
    }
    expect(mic.facts().micVoiceMs).toBeGreaterThan(UNHEARD_VOICE_MS * 4);
    expect([...seen]).toEqual(['ok']);
  });

  it('a keyboard is not a voice nobody transcribed', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    // A minute of loud typing, a key every 100 ms.
    for (let i = 0; i < 600; i++) {
      t += 100;
      mic.feed(chunk(VOICE), RATE, t, { lastKeyAt: t - 30 });
    }
    const quiet = healthWhileQuiet(mic, t, 30);
    expect([...quiet.seen]).toEqual(['ok']);
  });

  it('typing after speaking keeps the utterance open instead of ending it', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    t = feed(mic, t, 6, VOICE);
    // They keep talking while they type for longer than the quiet: no verdict yet.
    for (let i = 0; i < (mic.quietMs / 100) * 2; i++) {
      t += 100;
      mic.feed(chunk(VOICE), RATE, t, { lastKeyAt: t - 30 });
      expect(mic.health(t)).toBe('ok');
    }
    // Then silence and still nothing transcribed: the six seconds they said first went nowhere.
    t = feed(mic, t, (mic.quietMs + 200) / 1000, ROOM);
    expect(mic.health(t)).toBe('unheard');
  });

  it('what is said while the socket is being replaced is no proof of a deaf session', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    t = feed(mic, t, 10, VOICE, { sent: false });
    expect(mic.lastVoiceAt).toBe(t);
    const quiet = healthWhileQuiet(mic, t, 30);
    expect([...quiet.seen]).toEqual(['ok']);
  });

  it('the tutor answering is not the quiet after the learner spoke', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, ROOM);
    t = feed(mic, t, 6, VOICE);
    // Headphones: the mic is silent while the tutor talks for longer than the quiet.
    t = feed(mic, t, (mic.quietMs * 2) / 1000, ROOM, { echo: true });
    expect(mic.health(t)).toBe('ok');
    t = feed(mic, t, (mic.quietMs + 200) / 1000, ROOM);
    expect(mic.health(t)).toBe('unheard');
  });

  it('reports what it measured for the session diagnostics', () => {
    const mic = new MicActivity();
    mic.start(T0);
    const t = feed(mic, T0, 1, 0);
    feed(mic, t, 2, 6000);
    // The floor starts at digital silence, so the tone is voice from its third chunk.
    const facts = mic.facts();
    expect(facts.micNoSignalMs).toBe(1000);
    expect(facts.micPeak).toBeGreaterThan(5000);
    expect(facts.micVoiceMs).toBe(1800);
  });

  it('a microphone opened again adds to what the first capture measured', () => {
    const first = { micPeak: 9000, micVoiceMs: 5000, micNoSignalMs: 0, micUnheard: 1 };
    const second = { micPeak: 4000, micVoiceMs: 1200, micNoSignalMs: 300, micUnheard: 0 };
    expect(addMicFacts(null, second)).toEqual(second);
    expect(addMicFacts(first, second)).toEqual({ micPeak: 9000, micVoiceMs: 6200, micNoSignalMs: 300, micUnheard: 1 });
  });
});
