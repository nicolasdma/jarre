/**
 * Frase por frase as a state machine: one phrase plays and stops, the
 * learner says that phrase, only that phrase is scored, then the next one
 * plays. The component (sentence-mode.tsx) runs the effects of each phase
 * (play the phrase, open the mic, wait a beat) and feeds what happened back
 * as events; every transition lives here. Pure: tested in
 * __tests__/phrase-drill.test.ts.
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
}

export type PhraseEvent =
  | { type: 'start' }
  | { type: 'go'; index: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'replay' }
  /** The phrase finished playing (`ok`) or was cut; `canListen`: there is speech recognition. */
  | { type: 'played'; ok: boolean; canListen: boolean }
  | { type: 'again' }
  | { type: 'scored'; score: number }
  | { type: 'silent' }
  /** The beat after a phrase said well. */
  | { type: 'advance' };

const fresh = (n: number): PhraseResult[] => Array.from({ length: n }, () => ({ tries: 0, passed: false, best: 0 }));

export function initialPhraseState(count: number): PhraseDrillState {
  return { count, index: 0, phase: 'ready', results: fresh(count), score: null, silent: false, run: 0 };
}

function play(s: PhraseDrillState, index: number): PhraseDrillState {
  if (index >= s.count) return { ...s, phase: 'summary', score: null, silent: false };
  return { ...s, index: Math.max(0, index), phase: 'playing', score: null, silent: false, run: s.run + 1 };
}

export function phraseDrillReducer(s: PhraseDrillState, e: PhraseEvent): PhraseDrillState {
  switch (e.type) {
    case 'start':
      return play({ ...s, results: fresh(s.count) }, 0);
    case 'go':
      return play(s, e.index);
    case 'next':
      return s.phase === 'ready' || s.phase === 'summary' ? s : play(s, s.index + 1);
    case 'prev':
      return s.phase === 'ready' || s.phase === 'summary' ? s : play(s, Math.max(0, s.index - 1));
    case 'replay':
      return s.phase === 'ready' || s.phase === 'summary' ? s : play(s, s.index);
    case 'played':
      if (s.phase !== 'playing') return s;
      if (!e.ok) return { ...s, phase: 'result' };
      return e.canListen ? { ...s, phase: 'listening', run: s.run + 1 } : { ...s, phase: 'your-turn' };
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
      return s.phase === 'passed' ? play(s, s.index + 1) : s;
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
