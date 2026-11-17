'use client';

/**
 * Per-drill best scores, kept in localStorage (v1: per device, no table).
 * Key: `jarre-practice-<resourceId>`; value: { [drillSlug]: DrillBest }.
 */

import { scheduleRecall, type RecallRating, type RecallRecord } from '@/lib/practice/recall';

/**
 * Frase por frase keeps two: `sentencesWell`, % of phrases said well in any
 * try (what approves it, since 2026-11-17), and `sentences`, % said well on
 * the first try (informative; before that date it was the only one kept, and
 * it still counts as a floor: lib/practice/drill-progress.ts).
 */
export type ScoredMode = 'copy' | 'repeat' | 'sentences' | 'sentencesWell';

export interface ModeBest {
  score: number;
  wpm?: number;
  at: string;
}

export type DrillBest = Partial<Record<ScoredMode, ModeBest>> & {
  /** Runs of Frase por frase without speech recognition, and of the old shadowing. */
  shadowed?: number;
  /** Pregunta → respuesta: the last rating and when it is due again (FSRS, in days). */
  recall?: RecallRecord;
  /** Escuchar: when the audio was first heard to its end (ISO; lib/practice/drill-progress.ts). */
  listened?: string;
};

export type BestScores = Record<string, DrillBest>;

function key(resourceId: string): string {
  return `jarre-practice-${resourceId}`;
}

export function loadBestScores(resourceId: string): BestScores {
  try {
    const raw = localStorage.getItem(key(resourceId));
    return raw ? (JSON.parse(raw) as BestScores) : {};
  } catch {
    return {};
  }
}

function save(resourceId: string, scores: BestScores): void {
  try {
    localStorage.setItem(key(resourceId), JSON.stringify(scores));
  } catch {
    // Private mode or full storage: scores just are not remembered.
  }
}

/** Store a result if it beats the previous best; returns the updated map. */
export function recordScore(
  resourceId: string,
  drill: string,
  mode: ScoredMode,
  score: number,
  wpm?: number,
): BestScores {
  const scores = loadBestScores(resourceId);
  const prev = scores[drill]?.[mode];
  const better = !prev || score > prev.score || (score === prev.score && (wpm ?? 0) > (prev.wpm ?? 0));
  if (better) {
    scores[drill] = { ...scores[drill], [mode]: { score, ...(wpm !== undefined ? { wpm } : {}), at: new Date().toISOString() } };
    save(resourceId, scores);
  }
  return scores;
}

/** Store a Pregunta → respuesta rating: always the latest, it drives the next review. */
export function recordRecall(resourceId: string, drill: string, rating: RecallRating, now: Date = new Date()): BestScores {
  const scores = loadBestScores(resourceId);
  scores[drill] = { ...scores[drill], recall: scheduleRecall(scores[drill]?.recall, rating, now) };
  save(resourceId, scores);
  return scores;
}

export function recordShadowed(resourceId: string, drill: string): BestScores {
  const scores = loadBestScores(resourceId);
  scores[drill] = { ...scores[drill], shadowed: (scores[drill]?.shadowed ?? 0) + 1 };
  save(resourceId, scores);
  return scores;
}

/** Escuchar heard to its end: kept once, the first time. */
export function recordListened(resourceId: string, drill: string, now: Date = new Date()): BestScores {
  const scores = loadBestScores(resourceId);
  if (scores[drill]?.listened) return scores;
  scores[drill] = { ...scores[drill], listened: now.toISOString() };
  save(resourceId, scores);
  return scores;
}
