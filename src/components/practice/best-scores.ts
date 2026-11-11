'use client';

/**
 * Per-drill best scores, kept in localStorage (v1: per device, no table).
 * Key: `jarre-practice-<resourceId>`; value: { [drillSlug]: DrillBest }.
 */

/** `sentences`: % of sentences said well on the first try (Frase por frase). */
export type ScoredMode = 'copy' | 'repeat' | 'sentences';

export interface ModeBest {
  score: number;
  wpm?: number;
  at: string;
}

export type DrillBest = Partial<Record<ScoredMode, ModeBest>> & {
  /** Runs of Frase por frase without speech recognition, and of the old shadowing. */
  shadowed?: number;
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

export function recordShadowed(resourceId: string, drill: string): BestScores {
  const scores = loadBestScores(resourceId);
  scores[drill] = { ...scores[drill], shadowed: (scores[drill]?.shadowed ?? 0) + 1 };
  save(resourceId, scores);
  return scores;
}
