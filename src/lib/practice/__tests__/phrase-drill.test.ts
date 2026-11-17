import { describe, expect, it } from 'vitest';
import {
  firstTryPercent,
  saidWellPercent,
  initialPhraseState,
  PASS_SCORE,
  phraseDrillReducer as step,
  practicePhrases,
  scorePhrase,
  type PhraseDrillState,
  type PhraseEvent,
} from '../phrase-drill';

const INTRO = "Hi, I'm Nicolás, / a full-stack engineer from Córdoba, Argentina. / I've been writing code for six years,";

const run = (s: PhraseDrillState, ...events: PhraseEvent[]) => events.reduce(step, s);
const played: PhraseEvent = { type: 'played', ok: true, canListen: true };

describe('the turns of a drill', () => {
  it('are its " / " phrases, with no merging and no slash', () => {
    expect(practicePhrases(INTRO)).toEqual([
      "Hi, I'm Nicolás,",
      'a full-stack engineer from Córdoba, Argentina.',
      "I've been writing code for six years,",
    ]);
  });

  it('are its sentences when it has no marks (short ones ride with the next)', () => {
    expect(practicePhrases('Sure. I can start right away. A contract works well for me.')).toEqual([
      'Sure. I can start right away.',
      'A contract works well for me.',
    ]);
  });

  it('score what was said against that phrase alone', () => {
    const phrases = practicePhrases(INTRO);
    expect(scorePhrase(phrases, 1, 'a full stack engineer from Cordoba Argentina')).toBe(100);
    // Saying the next phrase, or the whole drill, is not saying this one.
    expect(scorePhrase(phrases, 1, "I've been writing code for six years")).toBeLessThan(PASS_SCORE);
    expect(scorePhrase(phrases, 0, "hi I'm Nicolas")).toBe(100);
  });
});

describe('Frase por frase', () => {
  it('plays a phrase, then listens, then moves on after a pass', () => {
    let s = run(initialPhraseState(3), { type: 'start' });
    expect(s).toMatchObject({ index: 0, phase: 'playing' });
    s = step(s, played);
    expect(s.phase).toBe('listening');
    s = step(s, { type: 'scored', score: 92 });
    expect(s).toMatchObject({ phase: 'passed', score: 92 });
    expect(s.results[0]).toEqual({ tries: 1, passed: true, best: 92 });
    s = step(s, { type: 'advance' });
    expect(s).toMatchObject({ index: 1, phase: 'playing' });
  });

  it('stays on a phrase said with misses until it is repeated, replayed or skipped', () => {
    let s = run(initialPhraseState(3), { type: 'start' }, played, { type: 'scored', score: 60 });
    expect(s.phase).toBe('result');
    expect(step(s, { type: 'advance' })).toBe(s);
    const again = step(s, { type: 'again' });
    expect(again).toMatchObject({ index: 0, phase: 'listening', score: null });
    expect(again.run).toBeGreaterThan(s.run);
    s = run(again, { type: 'scored', score: 88 });
    expect(s.results[0]).toEqual({ tries: 2, passed: true, best: 88 });
    const replayed = step(run(initialPhraseState(3), { type: 'start' }, played, { type: 'scored', score: 10 }), { type: 'replay' });
    expect(replayed).toMatchObject({ index: 0, phase: 'playing' });
    const skipped = step(run(initialPhraseState(3), { type: 'start' }, played, { type: 'scored', score: 10 }), { type: 'next' });
    expect(skipped).toMatchObject({ index: 1, phase: 'playing' });
    expect(skipped.results[0]).toEqual({ tries: 1, passed: false, best: 10 });
  });

  it('gives the turn back when nothing was heard, without counting a try', () => {
    const s = run(initialPhraseState(2), { type: 'start' }, played, { type: 'silent' });
    expect(s).toMatchObject({ phase: 'result', silent: true });
    expect(s.results[0].tries).toBe(0);
  });

  it('without speech recognition, the learner says it and moves on by hand', () => {
    const s = run(initialPhraseState(2), { type: 'start' }, { type: 'played', ok: true, canListen: false });
    expect(s.phase).toBe('your-turn');
    expect(step(s, { type: 'next' })).toMatchObject({ index: 1, phase: 'playing' });
  });

  it('a cut playback waits instead of opening the mic', () => {
    const s = run(initialPhraseState(2), { type: 'start' }, { type: 'played', ok: false, canListen: true });
    expect(s.phase).toBe('result');
  });

  it('ignores events from a phase that is over', () => {
    const s = run(initialPhraseState(2), { type: 'start' });
    expect(step(s, { type: 'scored', score: 100 })).toBe(s);
    const listening = step(s, played);
    expect(step(listening, played)).toBe(listening);
  });

  it('jumps to any phrase, goes back one, and ends with a summary', () => {
    let s = run(initialPhraseState(3), { type: 'start' }, { type: 'go', index: 2 });
    expect(s).toMatchObject({ index: 2, phase: 'playing' });
    s = step(s, { type: 'prev' });
    expect(s.index).toBe(1);
    s = run(s, { type: 'go', index: 2 }, played, { type: 'scored', score: 100 }, { type: 'advance' });
    expect(s.phase).toBe('summary');
    expect(step(s, { type: 'next' })).toBe(s);
  });

  it('starting again clears the results', () => {
    const done = run(initialPhraseState(1), { type: 'start' }, played, { type: 'scored', score: 40 }, { type: 'next' });
    expect(done.phase).toBe('summary');
    const s = step(done, { type: 'start' });
    expect(s).toMatchObject({ index: 0, phase: 'playing' });
    expect(s.results[0].tries).toBe(0);
  });

  it('reports the share said well on the first try', () => {
    expect(firstTryPercent([{ tries: 1, passed: true, best: 90 }, { tries: 2, passed: true, best: 90 }, { tries: 1, passed: false, best: 50 }])).toBe(33);
  });

  it("the owner's drill (2026-11-17): 9 at once, 3 after 2, 3 and 5 tries, 1 skipped at 67 % is 12 of 13 said well", () => {
    const results = [
      ...Array.from({ length: 9 }, () => ({ tries: 1, passed: true, best: 90 })),
      { tries: 2, passed: true, best: 88 },
      { tries: 3, passed: true, best: 86 },
      { tries: 5, passed: true, best: 85 },
      { tries: 4, passed: false, best: 67 },
    ];
    expect(firstTryPercent(results)).toBe(69);
    expect(saidWellPercent(results)).toBe(92);
  });

  it('a phrase skipped without trying, or below the bar, never counts as said well', () => {
    expect(saidWellPercent([{ tries: 0, passed: false, best: 0 }, { tries: 3, passed: false, best: 84 }])).toBe(0);
  });

  it('repeating until it passes marks the phrase said well', () => {
    const s = run(initialPhraseState(1), { type: 'start' }, played, { type: 'scored', score: 60 }, { type: 'replay' }, played, { type: 'scored', score: PASS_SCORE });
    expect(s.results[0]).toMatchObject({ tries: 2, passed: true });
    expect(saidWellPercent(s.results)).toBe(100);
    expect(firstTryPercent(s.results)).toBe(0);
  });
});
