/**
 * The voice intro on a lesson's Entender screen: which variant a learner gets.
 * The texts (and audio paths) live in src/data/onboarding-intro.json, one file
 * for every lesson.
 *
 * - welcome: the first time ever (no variant heard yet, at most the second lesson
 *   opened on this device, and no progress in this lesson).
 * - reminder: a returning learner, early on (the welcome already heard, or
 *   progress in this lesson on a new device), while fewer than REMINDER_UNTIL
 *   lessons were opened.
 * - tip: an experienced learner, one line of text, once.
 * - nothing after that.
 *
 * Nothing plays by itself (play on tap). Each variant shows until it is heard
 * to the end, skipped or dismissed, and never again after that.
 */

import intro from '@/data/onboarding-intro.json';
import type { Language } from '@/lib/translations';

export type IntroVariant = 'welcome' | 'reminder' | 'tip';

export interface IntroClip {
  title: string;
  text: string;
  audio: string | null;
}

/** Lessons opened (on this device) from which the reminder is no longer offered. */
export const REMINDER_UNTIL = 6;

export interface IntroState {
  /** Variants heard, skipped or dismissed, with when. */
  heard: Partial<Record<IntroVariant, string>>;
  /** Lessons whose Entender screen was opened on this device. */
  lessons: string[];
}

export const EMPTY_INTRO_STATE: IntroState = { heard: {}, lessons: [] };

export function pickIntroVariant(input: {
  heard: IntroState['heard'];
  /** Distinct lessons opened, this one included. */
  lessonsOpened: number;
  /** This learner already has progress in this lesson (saved on the server). */
  hasProgress: boolean;
}): IntroVariant | null {
  const { heard, lessonsOpened, hasProgress } = input;
  const newcomer = !heard.welcome && !heard.reminder && !heard.tip;
  if (newcomer && lessonsOpened <= 2 && !hasProgress) return 'welcome';
  if (!heard.reminder && lessonsOpened < REMINDER_UNTIL && (heard.welcome || hasProgress || lessonsOpened <= 2)) return 'reminder';
  if (!heard.tip) return 'tip';
  return null;
}

export function introClip(variant: IntroVariant, language: Language): IntroClip {
  const v = (intro.variants as Record<IntroVariant, Record<Language, IntroClip>>)[variant];
  return v[language] ?? v.es;
}

/** The state with this lesson counted as opened (once per lesson). */
export function withLessonOpened(state: IntroState, resourceId: string): IntroState {
  return state.lessons.includes(resourceId) ? state : { ...state, lessons: [...state.lessons, resourceId] };
}

export function withHeard(state: IntroState, variant: IntroVariant, at: string): IntroState {
  return { ...state, heard: { ...state.heard, [variant]: at } };
}

/** A stored state, or the empty one when there is none or it is not the expected shape. */
export function parseIntroState(raw: string | null): IntroState {
  if (!raw) return EMPTY_INTRO_STATE;
  try {
    const v = JSON.parse(raw) as Partial<IntroState>;
    const heard = v && typeof v.heard === 'object' && v.heard ? v.heard : {};
    const lessons = Array.isArray(v?.lessons) ? v.lessons.filter((x): x is string => typeof x === 'string') : [];
    return { heard: heard as IntroState['heard'], lessons };
  } catch {
    return EMPTY_INTRO_STATE;
  }
}
