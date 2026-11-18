import { describe, expect, it } from 'vitest';
import intro from '@/data/onboarding-intro.json';
import {
  EMPTY_INTRO_STATE,
  introClip,
  parseIntroState,
  pickIntroVariant,
  REMINDER_UNTIL,
  withHeard,
  withLessonOpened,
} from '../intro';

const at = '2026-11-18T00:00:00.000Z';

describe('pickIntroVariant', () => {
  it('the first time ever: the full welcome', () => {
    expect(pickIntroVariant({ heard: {}, lessonsOpened: 1, hasProgress: false })).toBe('welcome');
  });

  it('after the welcome, early on: the short reminder, once', () => {
    expect(pickIntroVariant({ heard: { welcome: at }, lessonsOpened: 2, hasProgress: false })).toBe('reminder');
    expect(pickIntroVariant({ heard: { welcome: at, reminder: at }, lessonsOpened: 3, hasProgress: false })).toBe('tip');
  });

  it('progress in this lesson on a new device: the reminder, not the welcome', () => {
    expect(pickIntroVariant({ heard: {}, lessonsOpened: 1, hasProgress: true })).toBe('reminder');
  });

  it('an experienced learner gets the one-line tip once, then nothing', () => {
    expect(pickIntroVariant({ heard: {}, lessonsOpened: REMINDER_UNTIL + 2, hasProgress: true })).toBe('tip');
    expect(pickIntroVariant({ heard: { tip: at }, lessonsOpened: REMINDER_UNTIL + 2, hasProgress: true })).toBeNull();
  });

  it('a skipped welcome is never offered again', () => {
    expect(pickIntroVariant({ heard: { welcome: at }, lessonsOpened: 1, hasProgress: false })).not.toBe('welcome');
  });
});

describe('intro state', () => {
  it('counts a lesson once and remembers what was heard', () => {
    let s = withLessonOpened(EMPTY_INTRO_STATE, 'a');
    s = withLessonOpened(s, 'a');
    s = withLessonOpened(s, 'b');
    s = withHeard(s, 'welcome', at);
    expect(s).toEqual({ heard: { welcome: at }, lessons: ['a', 'b'] });
    expect(parseIntroState(JSON.stringify(s))).toEqual(s);
  });

  it('reads garbage as the empty state', () => {
    expect(parseIntroState('nope')).toEqual(EMPTY_INTRO_STATE);
    expect(parseIntroState(null)).toEqual(EMPTY_INTRO_STATE);
  });
});

describe('the scripts', () => {
  it('every variant has Spanish and English text; audio only where there is something to hear', () => {
    for (const variant of ['welcome', 'reminder', 'tip'] as const) {
      for (const lang of ['es', 'en'] as const) expect(introClip(variant, lang).text.length).toBeGreaterThan(20);
    }
    expect(introClip('tip', 'es').audio).toBeNull();
  });

  it('the welcome is 30 to 45 seconds and the reminder 10 to 15, at a calm 130 to 145 words a minute', () => {
    const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
    const seconds = (t: string, wpm: number) => (words(t) / wpm) * 60;
    const welcome = intro.variants.welcome.es.text;
    const reminder = intro.variants.reminder.es.text;
    expect(seconds(welcome, 145)).toBeGreaterThanOrEqual(30);
    expect(seconds(welcome, 130)).toBeLessThanOrEqual(50);
    expect(seconds(reminder, 145)).toBeGreaterThanOrEqual(10);
    expect(seconds(reminder, 130)).toBeLessThanOrEqual(16);
  });
});
