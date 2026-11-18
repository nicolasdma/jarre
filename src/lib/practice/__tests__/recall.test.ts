import { describe, expect, it } from 'vitest';
import {
  drillAsksFromInterview,
  initialRecallState,
  isRecallDue,
  dueLabel,
  recallKey,
  recallPrompt,
  recallReducer,
  remainingFraction,
  remainingSeconds,
  scheduleRecall,
  type RecallAction,
  type RecallState,
} from '../recall';

const T0 = 1_000_000;

function run(state: RecallState, ...actions: RecallAction[]): RecallState {
  return actions.reduce(recallReducer, state);
}

describe('recall prompt', () => {
  it('splits label, question and target length out of a drill title', () => {
    expect(recallPrompt('Screen · ¿por qué 3Y? (30 s)')).toEqual({ question: '¿Por qué 3Y?', source: 'title', topic: null, tag: 'Screen', target: '30 s' });
    expect(recallPrompt('Screen · tu intro corta (45–60 s)')).toMatchObject({ question: 'Tu intro corta', tag: 'Screen', target: '45–60 s' });
    expect(recallPrompt('¿Por qué 3Y? ¿Por qué este rol?')).toMatchObject({ question: '¿Por qué 3Y? ¿Por qué este rol?', tag: null, target: null });
  });

  it("asks the interview's English question when the lesson links one to the drill", () => {
    expect(recallPrompt('Screen · tu intro corta (45–60 s)', 'Tell me a bit about yourself.')).toEqual({
      question: 'Tell me a bit about yourself.', source: 'ask', topic: 'Tu intro corta', tag: 'Screen', target: '45–60 s',
    });
    expect(recallPrompt('Tu Python', '  ')).toMatchObject({ question: 'Tu Python', source: 'title' });
  });

  it('reads the asks out of the stored interview block, skipping what does not fit', () => {
    const interview = {
      questions: [
        { id: 'intro', drill: 's01-intro-corta', ask: 'Tell me a bit about yourself.' },
        { id: 'again', drill: 's01-intro-corta', ask: 'Walk me through your background.' },
        { id: 'no-drill', ask: 'Anything else?' },
        { id: 'bad', drill: 3, ask: 'x' },
        null,
      ],
    };
    expect(drillAsksFromInterview(interview)).toEqual({ 's01-intro-corta': 'Tell me a bit about yourself.' });
    expect(drillAsksFromInterview(null)).toEqual({});
    expect(drillAsksFromInterview({ questions: 'nope' })).toEqual({});
  });

  it("takes a drill's own question (drill_asks) over a linked one, and without any question bank", () => {
    const interview = {
      questions: [{ id: 'q', kind: 'core', ask: 'Walk me through Two Sum.', drill: 'tt-01b', key_points: ['x'] }],
      drill_asks: { 'tt-01b': 'How would you solve Two Sum?', 'tt-f9': 'Make sense?', blank: '  ', bad: 3 },
    };
    expect(drillAsksFromInterview(interview)).toEqual({ 'tt-01b': 'How would you solve Two Sum?', 'tt-f9': 'Make sense?' });
    expect(drillAsksFromInterview({ drill_asks: { a: 'Q?' } })).toEqual({ a: 'Q?' });
    expect(drillAsksFromInterview({ drill_asks: ['nope'] })).toEqual({});
  });

  it('keeps a parenthesis that is not a length', () => {
    expect(recallPrompt('Trabajar con usuarios no técnicos (clínicos)').question).toBe('Trabajar con usuarios no técnicos (clínicos)');
  });
});

describe('recall countdown', () => {
  it('counts down from the chosen length and shows the answer when it runs out', () => {
    let s = run(initialRecallState(25), { type: 'start', now: T0 });
    expect(s.phase).toBe('thinking');
    expect(remainingSeconds(s, T0)).toBe(25);
    expect(remainingSeconds(s, T0 + 100)).toBe(25);
    expect(remainingSeconds(s, T0 + 1_000)).toBe(24);
    expect(remainingSeconds(s, T0 + 24_100)).toBe(1);
    expect(remainingFraction(s, T0 + 12_500)).toBeCloseTo(0.5);

    s = recallReducer(s, { type: 'tick', now: T0 + 24_900 });
    expect(s.phase).toBe('thinking');
    s = recallReducer(s, { type: 'tick', now: T0 + 25_000 });
    expect(s.phase).toBe('answer');
    expect(s.answeredAfter).toBe(25);
    expect(remainingSeconds(s, T0 + 25_000)).toBe(0);
  });

  it('skips to the answer early and records how long it took', () => {
    const s = run(initialRecallState(40), { type: 'start', now: T0 }, { type: 'skip', now: T0 + 18_400 });
    expect(s.phase).toBe('answer');
    expect(s.answeredAfter).toBe(18);
  });

  it('only changes length before starting', () => {
    let s = recallReducer(initialRecallState(), { type: 'seconds', seconds: 15 });
    expect(s.seconds).toBe(15);
    s = run(s, { type: 'start', now: T0 }, { type: 'seconds', seconds: 40 });
    expect(s.seconds).toBe(15);
  });

  it('rates the selected option, and again resets with the same length', () => {
    let s = run(initialRecallState(15), { type: 'start', now: T0 }, { type: 'skip', now: T0 + 5_000 });
    expect(s.selected).toBe('got');
    s = run(s, { type: 'move', by: 1 }, { type: 'move', by: 1 }, { type: 'move', by: 1 });
    expect(s.selected).toBe('missed');
    s = run(s, { type: 'move', by: -1 }, { type: 'rate' });
    expect(s).toMatchObject({ phase: 'rated', rated: 'partial' });
    expect(recallReducer(s, { type: 'rate', rating: 'got' })).toBe(s);
    expect(recallReducer(s, { type: 'again' })).toEqual(initialRecallState(15));
  });

  it('ignores rating before the answer shows', () => {
    const s = run(initialRecallState(), { type: 'start', now: T0 }, { type: 'rate', rating: 'got' });
    expect(s.phase).toBe('thinking');
  });
});

describe('recall keys', () => {
  it('space starts, skips, then plays or pauses; enter rates and moves on', () => {
    expect(recallKey('ready', ' ')).toEqual({ do: 'start' });
    expect(recallKey('thinking', ' ')).toEqual({ do: 'skip' });
    expect(recallKey('answer', ' ')).toEqual({ do: 'toggle-audio' });
    expect(recallKey('answer', 'Enter')).toEqual({ do: 'rate' });
    expect(recallKey('rated', 'Enter')).toEqual({ do: 'next' });
    expect(recallKey('answer', '3')).toEqual({ do: 'select', rating: 'missed' });
    expect(recallKey('answer', 'ArrowLeft')).toEqual({ do: 'move', by: -1 });
    expect(recallKey('thinking', '1')).toBeNull();
    expect(recallKey('ready', 'a')).toBeNull();
  });
});

describe('recall schedule', () => {
  const now = new Date(2026, 10, 14, 15, 0);

  it('brings a miss back tomorrow, a partial in two days, a first hit in three', () => {
    expect(dueLabel(scheduleRecall(undefined, 'missed', now), now)).toBe('mañana');
    expect(dueLabel(scheduleRecall(undefined, 'partial', now), now)).toBe('en 2 días');
    expect(dueLabel(scheduleRecall(undefined, 'got', now), now)).toBe('en 3 días');
  });

  it('is due by calendar day, not by the hour it was rated', () => {
    const r = scheduleRecall(undefined, 'missed', now);
    expect(isRecallDue(r, now)).toBe(false);
    expect(isRecallDue(r, new Date(2026, 10, 15, 8, 0))).toBe(true);
    expect(isRecallDue(undefined, now)).toBe(false);
  });

  it('survives a JSON round trip and grows the interval after another hit', () => {
    const first = JSON.parse(JSON.stringify(scheduleRecall(undefined, 'got', now)));
    const later = new Date(first.due);
    const second = scheduleRecall(first, 'got', later);
    expect(second.tries).toBe(2);
    expect(second.got).toBe(2);
    const firstGap = new Date(first.due).getTime() - now.getTime();
    const secondGap = new Date(second.due).getTime() - later.getTime();
    expect(secondGap).toBeGreaterThan(firstGap);
  });
});
