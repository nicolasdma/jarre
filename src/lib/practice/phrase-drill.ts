/**
 * Frase por frase as a state machine: one phrase plays and stops, the
 * learner says that phrase, only that phrase is scored, then the next one
 * plays. The component (sentence-mode.tsx) runs the effects of each phase
 * (play the phrase, open the mic, wait a beat) and feeds what happened back
 * as events; every transition lives here. Pure: tested in
 * __tests__/phrase-drill.test.ts.
 *
 * Skipping (owner, 2026-11-18: "in phrase-by-phrase we should be able to skip
 * a phrase if we get stuck"): Saltar leaves a phrase at any moment of its turn
 * (playing, listening, after a try) without a try counted. A skipped phrase
 * stays not said well, so it never helps approve the mode, and is remembered:
 * when the pass reaches its end with skipped phrases still not said well, the
 * drill stops at `leftover` ("Te quedaron N frases") and offers a pass over
 * only those, in drill order, before the summary. Without speech recognition
 * nothing is judged and nothing is a skip: Siguiente is the normal way on.
 */

import type { KeyTerm } from './key-terms';
import { drillPhrases, hasPhraseMarks } from './phrase-segments';
import { alignWords } from './scoring';
import { practiceSentences } from './sentence-timing';

/** A phrase counts as said at this word score. */
export const PASS_SCORE = 85;

/**
 * The turns of a drill: its " / " phrases when it marks them, else its
 * sentences (short ones merged, as before the marks existed).
 */
export function practicePhrases(text: string): string[] {
  return hasPhraseMarks(text) ? drillPhrases(text) : practiceSentences(text);
}

/** Score what was heard against phrase `i` alone: the rest of the drill never counts. */
export function scorePhrase(phrases: readonly string[], i: number, heard: string, terms: readonly KeyTerm[] = []): number {
  return alignWords(phrases[i] ?? '', heard, { terms }).score;
}

export type PhrasePhase =
  /** Before starting. */
  | 'ready'
  /** The phrase is playing. */
  | 'playing'
  /** The mic is open for the phrase. */
  | 'listening'
  /** Said well: the next phrase plays after a beat. */
  | 'passed'
  /** Said with misses, or not heard: repeat, listen again or skip. */
  | 'result'
  /** No speech recognition: the learner says it and moves on by hand. */
  | 'your-turn'
  /** The pass ended with skipped phrases not said well: go over them, or see the summary. */
  | 'leftover'
  | 'summary';

export interface PhraseResult {
  tries: number;
  passed: boolean;
  best: number;
}

export interface PhraseDrillState {
  count: number;
  index: number;
  phase: PhrasePhase;
  results: PhraseResult[];
  /** Last score of the current phrase, or null before one. */
  score: number | null;
  /** Nothing was heard on the last turn. */
  silent: boolean;
  /** Bumped on every play or listen, so the same phase on the same phrase runs again. */
  run: number;
  /** Phrases left before they were said well, in drill order. One said well later no longer counts as left. */
  skipped: number[];
  /** A pass over the skipped phrases only (their indices, in order), or null for the whole drill. */
  queue: number[] | null;
  /** There is speech recognition (from the last `played`): without it nothing is judged, so nothing is a skip. */
  canListen: boolean;
}

export type PhraseEvent =
  | { type: 'start' }
  | { type: 'go'; index: number }
  | { type: 'next' }
  /** Leave the phrase now, at any moment of its turn: no try counted, it comes back at the end. */
  | { type: 'skip' }
  | { type: 'prev' }
  | { type: 'replay' }
  /** The phrase finished playing (`ok`) or was cut; `canListen`: there is speech recognition. */
  | { type: 'played'; ok: boolean; canListen: boolean }
  | { type: 'again' }
  | { type: 'scored'; score: number }
  | { type: 'silent' }
  /** The beat after a phrase said well. */
  | { type: 'advance' }
  /** At `leftover`: go over the phrases still left. */
  | { type: 'review' }
  /** At `leftover`: leave them for later and see the summary. */
  | { type: 'finish' };

const fresh = (n: number): PhraseResult[] => Array.from({ length: n }, () => ({ tries: 0, passed: false, best: 0 }));

export function initialPhraseState(count: number): PhraseDrillState {
  return {
    count,
    index: 0,
    phase: 'ready',
    results: fresh(count),
    score: null,
    silent: false,
    run: 0,
    skipped: [],
    queue: null,
    canListen: true,
  };
}

/** The skipped phrases not said well yet, in drill order. */
export function leftoverPhrases(s: Pick<PhraseDrillState, 'skipped' | 'results'>): number[] {
  return s.skipped.filter((i) => !s.results[i]?.passed);
}

function play(s: PhraseDrillState, index: number): PhraseDrillState {
  if (index >= s.count) return end(s);
  return { ...s, index: Math.max(0, index), phase: 'playing', score: null, silent: false, run: s.run + 1 };
}

/** The pass is over: the skipped phrases still left first, then the summary. */
function end(s: PhraseDrillState): PhraseDrillState {
  const left = s.canListen ? leftoverPhrases(s) : [];
  return { ...s, phase: left.length > 0 ? 'leftover' : 'summary', queue: null, score: null, silent: false };
}

/** The phrase after the current one in this pass (the whole drill, or the skipped ones), or `count` at the end. */
function after(s: PhraseDrillState): number {
  if (!s.queue) return s.index + 1;
  return s.queue.find((i) => i > s.index) ?? s.count;
}

function before(s: PhraseDrillState): number {
  if (!s.queue) return Math.max(0, s.index - 1);
  return [...s.queue].reverse().find((i) => i < s.index) ?? s.index;
}

/** Leaving the current phrase before it was said well, in a turn that judges it, remembers it as skipped. */
function leave(s: PhraseDrillState): PhraseDrillState {
  const judged = s.canListen && (s.phase === 'playing' || s.phase === 'listening' || s.phase === 'result');
  if (!judged || s.results[s.index]?.passed || s.skipped.includes(s.index)) return s;
  return { ...s, skipped: [...s.skipped, s.index].sort((a, b) => a - b) };
}

const idle = (s: PhraseDrillState) => s.phase === 'ready' || s.phase === 'summary' || s.phase === 'leftover';

export function phraseDrillReducer(s: PhraseDrillState, e: PhraseEvent): PhraseDrillState {
  switch (e.type) {
    case 'start':
      return play({ ...s, results: fresh(s.count), skipped: [], queue: null }, 0);
    case 'go':
      // Picking a phrase by hand leaves a pass over the skipped ones.
      return play({ ...s, queue: s.queue?.includes(e.index) ? s.queue : null }, e.index);
    case 'next':
    case 'skip':
      return idle(s) ? s : play(leave(s), after(s));
    case 'prev':
      return idle(s) ? s : play(s, before(s));
    case 'replay':
      return idle(s) ? s : play(s, s.index);
    case 'played':
      if (s.phase !== 'playing') return s;
      if (!e.ok) return { ...s, phase: 'result', canListen: e.canListen };
      return e.canListen
        ? { ...s, phase: 'listening', run: s.run + 1, canListen: true }
        : { ...s, phase: 'your-turn', canListen: false };
    case 'again':
      return s.phase === 'result' || s.phase === 'passed' || s.phase === 'your-turn'
        ? { ...s, phase: 'listening', score: null, silent: false, run: s.run + 1 }
        : s;
    case 'scored': {
      if (s.phase !== 'listening') return s;
      const passed = e.score >= PASS_SCORE;
      const results = s.results.map((r, k) =>
        k === s.index ? { tries: r.tries + 1, passed: r.passed || passed, best: Math.max(r.best, e.score) } : r,
      );
      return { ...s, results, score: e.score, silent: false, phase: passed ? 'passed' : 'result' };
    }
    case 'silent':
      return s.phase === 'listening' ? { ...s, phase: 'result', score: null, silent: true } : s;
    case 'advance':
      return s.phase === 'passed' ? play(s, after(s)) : s;
    case 'review': {
      if (s.phase !== 'leftover') return s;
      const queue = leftoverPhrases(s);
      return queue.length ? play({ ...s, queue }, queue[0]) : { ...s, phase: 'summary' };
    }
    case 'finish':
      return s.phase === 'leftover' ? { ...s, phase: 'summary' } : s;
  }
}

/** What a scored run of Frase por frase leaves: both %, rounded. */
export interface SentencesResult {
  /** % of phrases said well (≥ PASS_SCORE) in any try: approves the mode. */
  saidWell: number;
  /** % said well on the first try: informative. */
  firstTry: number;
}

/** % of phrases said well (≥ PASS_SCORE) in any try; a phrase skipped below the bar does not count. */
export function saidWellPercent(results: readonly PhraseResult[]): number {
  const well = results.filter((r) => r.passed).length;
  return Math.round((well / Math.max(1, results.length)) * 100);
}

/** % of phrases said well on the first try: informative, it no longer approves. */
export function firstTryPercent(results: readonly PhraseResult[]): number {
  const firstTry = results.filter((r) => r.passed && r.tries === 1).length;
  return Math.round((firstTry / Math.max(1, results.length)) * 100);
}
