/**
 * Pregunta → respuesta: retrieval practice for a spoken drill.
 *
 * The prompt is on screen, a countdown runs while the learner answers aloud,
 * then the drill's own recording plays with the text revealed and the learner
 * rates the try. The rating goes through the same FSRS engine as the review
 * cards (src/lib/fsrs.ts), scheduled in whole days, and is kept per device
 * with the other drill results (best-scores.ts).
 *
 * Everything here is pure: the component only feeds it the clock and keys.
 */

import type { Card as FSRSCard } from 'ts-fsrs';
import { createNewFSRSCard, reviewRatingToFSRSGrade, scheduleFSRSDays } from '@/lib/fsrs';
import type { ReviewRating } from '@/types';

// ---------------------------------------------------------------------------
// The prompt
// ---------------------------------------------------------------------------

export interface RecallPrompt {
  /**
   * What to answer: the interviewer's English question when the lesson has
   * one for this drill, else the title, e.g. "¿Por qué 3Y? ¿Por qué este rol?".
   */
  question: string;
  /** `ask`: the interview's own question. `title`: built from the drill title. */
  source: 'ask' | 'title';
  /** With an `ask`, the drill's own topic (the title), in Spanish. */
  topic: string | null;
  /** A label before " · " in the title, e.g. "Screen". */
  tag: string | null;
  /** A target length at the end of the title, e.g. "45–60 s". */
  target: string | null;
}

/**
 * The English question the interview mock asks for each drill: the lesson's
 * `interview.questions[].ask`, keyed by its `drill` (the first one wins).
 * Read from the stored block as is; anything malformed is skipped.
 */
export function drillAsksFromInterview(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  const list = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(list)) return out;
  for (const q of list) {
    if (!q || typeof q !== 'object') continue;
    const { drill, ask } = q as { drill?: unknown; ask?: unknown };
    if (typeof drill === 'string' && typeof ask === 'string' && ask.trim() && !(drill in out)) out[drill] = ask.trim();
  }
  return out;
}

/**
 * Drills have no question field (lesson-format.ts: title, text_en, text_es,
 * concept). About half are linked from the interview's questions, whose `ask`
 * is the real English question; for the rest the title already is the
 * question or its topic, in Spanish: "Screen · ¿por qué 3Y? (30 s)", so the
 * prompt is the title with its label and target length pulled apart.
 */
export function recallPrompt(title: string, ask?: string | null): RecallPrompt {
  const fromTitle = titlePrompt(title);
  if (ask && ask.trim()) return { ...fromTitle, question: ask.trim(), source: 'ask', topic: fromTitle.question };
  return fromTitle;
}

function titlePrompt(title: string): RecallPrompt {
  let rest = title.trim();
  let target: string | null = null;
  const t = rest.match(/\s*\(([^()]*\d[^()]*\bs)\)\s*$/);
  if (t) {
    target = t[1].trim();
    rest = rest.slice(0, t.index).trim();
  }
  let tag: string | null = null;
  const dot = rest.indexOf(' · ');
  if (dot > 0) {
    tag = rest.slice(0, dot).trim();
    rest = rest.slice(dot + 3).trim();
  }
  // "¿por qué 3Y?" → "¿Por qué 3Y?": the first letter, after any opening mark.
  const question = rest ? rest.replace(/\p{L}/u, (c) => c.toUpperCase()) : title.trim();
  return { question, source: 'title', topic: null, tag, target };
}

// ---------------------------------------------------------------------------
// The countdown
// ---------------------------------------------------------------------------

export const RECALL_SECONDS = [15, 25, 40] as const;
export type RecallSeconds = (typeof RECALL_SECONDS)[number];
export const DEFAULT_RECALL_SECONDS: RecallSeconds = 25;

export function isRecallSeconds(value: unknown): value is RecallSeconds {
  return RECALL_SECONDS.includes(value as RecallSeconds);
}

export type RecallRating = 'got' | 'partial' | 'missed';
export const RECALL_RATINGS: { id: RecallRating; label: string; key: string }[] = [
  { id: 'got', label: 'La tenía', key: '1' },
  { id: 'partial', label: 'A medias', key: '2' },
  { id: 'missed', label: 'No salió', key: '3' },
];

/**
 * ready: the prompt, waiting for a start. thinking: the countdown, answering
 * aloud. answer: the recording plays, the text shows, rating. rated: done.
 */
export type RecallPhase = 'ready' | 'thinking' | 'answer' | 'rated';

export interface RecallState {
  phase: RecallPhase;
  seconds: RecallSeconds;
  /** ms timestamp the countdown started at. */
  startedAt: number | null;
  /** Seconds actually spent before the answer (skip or timeout). */
  answeredAfter: number | null;
  selected: RecallRating;
  rated: RecallRating | null;
}

export type RecallAction =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'skip'; now: number }
  | { type: 'select'; rating: RecallRating }
  | { type: 'move'; by: -1 | 1 }
  | { type: 'rate'; rating?: RecallRating }
  | { type: 'again' }
  | { type: 'seconds'; seconds: RecallSeconds };

export function initialRecallState(seconds: RecallSeconds = DEFAULT_RECALL_SECONDS): RecallState {
  return { phase: 'ready', seconds, startedAt: null, answeredAfter: null, selected: 'got', rated: null };
}

/** Whole seconds left on the countdown, as shown (25 … 1, then 0). */
export function remainingSeconds(state: RecallState, now: number): number {
  if (state.phase === 'ready' || state.startedAt === null) return state.seconds;
  if (state.phase !== 'thinking') return 0;
  const left = state.seconds * 1000 - (now - state.startedAt);
  return Math.max(0, Math.ceil(left / 1000));
}

/** Fraction of the countdown still left, 1 → 0, for the bar. */
export function remainingFraction(state: RecallState, now: number): number {
  if (state.phase === 'ready' || state.startedAt === null) return 1;
  if (state.phase !== 'thinking') return 0;
  return Math.min(1, Math.max(0, 1 - (now - state.startedAt) / (state.seconds * 1000)));
}

function toAnswer(state: RecallState, now: number): RecallState {
  const spent = state.startedAt === null ? 0 : Math.min(state.seconds, Math.max(0, (now - state.startedAt) / 1000));
  return { ...state, phase: 'answer', answeredAfter: Math.round(spent) };
}

export function recallReducer(state: RecallState, action: RecallAction): RecallState {
  switch (action.type) {
    case 'start':
      if (state.phase !== 'ready') return state;
      return { ...state, phase: 'thinking', startedAt: action.now, answeredAfter: null };
    case 'tick':
      if (state.phase !== 'thinking' || state.startedAt === null) return state;
      return action.now - state.startedAt >= state.seconds * 1000 ? toAnswer(state, action.now) : state;
    case 'skip':
      return state.phase === 'thinking' ? toAnswer(state, action.now) : state;
    case 'select':
      return state.phase === 'answer' ? { ...state, selected: action.rating } : state;
    case 'move': {
      if (state.phase !== 'answer') return state;
      const i = RECALL_RATINGS.findIndex((r) => r.id === state.selected);
      const next = Math.min(RECALL_RATINGS.length - 1, Math.max(0, i + action.by));
      return { ...state, selected: RECALL_RATINGS[next].id };
    }
    case 'rate': {
      if (state.phase !== 'answer') return state;
      const rating = action.rating ?? state.selected;
      return { ...state, phase: 'rated', selected: rating, rated: rating };
    }
    case 'again':
      return initialRecallState(state.seconds);
    case 'seconds':
      return state.phase === 'ready' ? { ...state, seconds: action.seconds } : state;
  }
}

/** What a key does in each phase; null: not ours (let the browser have it). */
export type RecallKey =
  | { do: 'start' }
  | { do: 'skip' }
  | { do: 'toggle-audio' }
  | { do: 'select'; rating: RecallRating }
  | { do: 'move'; by: -1 | 1 }
  | { do: 'rate' }
  | { do: 'next' };

export function recallKey(phase: RecallPhase, key: string): RecallKey | null {
  if (key === ' ') {
    if (phase === 'ready') return { do: 'start' };
    if (phase === 'thinking') return { do: 'skip' };
    return { do: 'toggle-audio' };
  }
  if (key === 'Enter') {
    if (phase === 'ready') return { do: 'start' };
    if (phase === 'thinking') return { do: 'skip' };
    if (phase === 'answer') return { do: 'rate' };
    return { do: 'next' };
  }
  if (phase === 'answer') {
    const r = RECALL_RATINGS.find((x) => x.key === key);
    if (r) return { do: 'select', rating: r.id };
    if (key === 'ArrowLeft') return { do: 'move', by: -1 };
    if (key === 'ArrowRight') return { do: 'move', by: 1 };
  }
  return null;
}

// ---------------------------------------------------------------------------
// The schedule
// ---------------------------------------------------------------------------

/** One drill's recall history, as stored (JSON: dates are ISO strings). */
export interface RecallRecord {
  last: RecallRating;
  at: string;
  /** Next review, ISO. */
  due: string;
  tries: number;
  got: number;
  card: StoredCard;
}

type StoredCard = Omit<FSRSCard, 'due' | 'last_review'> & { due: string; last_review?: string };

const RATING_TO_REVIEW: Record<RecallRating, ReviewRating> = { got: 'good', partial: 'hard', missed: 'wrong' };

function storeCard(card: FSRSCard): StoredCard {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? new Date(card.last_review).toISOString() : undefined,
  };
}

function loadCard(card: StoredCard): FSRSCard {
  return { ...card, due: new Date(card.due), last_review: card.last_review ? new Date(card.last_review) : undefined };
}

/**
 * The record after a rating. A miss comes back tomorrow, a partial in two
 * days, a first "got it" in three; later intervals grow with FSRS.
 */
export function scheduleRecall(prev: RecallRecord | undefined, rating: RecallRating, now: Date = new Date()): RecallRecord {
  const card = prev ? loadCard(prev.card) : createNewFSRSCard(now);
  const next = scheduleFSRSDays(card, reviewRatingToFSRSGrade(RATING_TO_REVIEW[rating]), now).card;
  return {
    last: rating,
    at: now.toISOString(),
    due: next.due.toISOString(),
    tries: (prev?.tries ?? 0) + 1,
    got: (prev?.got ?? 0) + (rating === 'got' ? 1 : 0),
    card: storeCard(next),
  };
}

function dayNumber(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
}

/** Due by calendar day, local time: rated at 15:00, due again any time tomorrow. */
export function isRecallDue(record: RecallRecord | undefined, now: Date = new Date()): boolean {
  if (!record) return false;
  return dayNumber(new Date(record.due)) <= dayNumber(now);
}

/** "hoy", "mañana", "en 3 días". */
export function dueLabel(record: RecallRecord, now: Date = new Date()): string {
  const days = dayNumber(new Date(record.due)) - dayNumber(now);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'mañana';
  return `en ${days} días`;
}
