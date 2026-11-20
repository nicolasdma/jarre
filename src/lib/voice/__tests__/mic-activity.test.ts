import { describe, expect, it } from 'vitest';
import { MicActivity, NO_SIGNAL_AFTER_MS, UNHEARD_AFTER_MS } from '../mic-activity';

const RATE = 16000;
const T0 = 1_000_000;
/** 100 ms of a tone at the given amplitude (0 = digital silence). */
function chunk(amplitude: number): Int16Array {
  const out = new Int16Array(RATE / 10);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(amplitude * Math.sin(i / 3));
  return out;
}
/** Feed `seconds` of the same chunk, 100 ms apart; returns the time after the last one. */
function feed(mic: MicActivity, from: number, seconds: number, amplitude: number, echo = false): number {
  let t = from;
  for (let i = 0; i < seconds * 10; i++) {
    t += 100;
    mic.feed(chunk(amplitude), RATE, t, echo);
  }
  return t;
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
    const t = feed(mic, T0, 20, 6000, true);
    expect(mic.lastVoiceAt).toBeNull();
    expect(mic.health(t)).toBe('ok');
  });

  it('says unheard when the learner talks and nothing is transcribed, until something is', () => {
    const mic = new MicActivity();
    mic.start(T0);
    let t = feed(mic, T0, 1, 40);
    t = feed(mic, t, 6, 6000);
    expect(mic.health(t)).toBe('ok');
    t = feed(mic, t, UNHEARD_AFTER_MS / 1000, 40);
    expect(mic.health(t)).toBe('unheard');
    mic.heard();
    expect(mic.health(t)).toBe('ok');
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
});
