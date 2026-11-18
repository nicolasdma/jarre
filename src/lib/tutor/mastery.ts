/**
 * Jarre - Mastery per concept, by rules over the evidence
 *
 * 0 not seen · 1 weak · 2 on the way · 3 solid · 4 mastered
 * (docs/tutor/02-arquitectura.md §3.3). Deterministic and dated, so the same
 * evidence always gives the same state and every level can be explained:
 *
 * - An unresolved misconception (or a gap) in the last 14 days → weak at most.
 * - Explained or answered right in two different sessions, with no unresolved
 *   misconception after the first of them → solid.
 * - Solid and right again in a third session → mastered.
 * - Some right answer, nothing above → on the way. Only errors → weak.
 * - Nothing new in 30 days → one level down (the spirit of FSRS, without
 *   modelling stability yet), never below 1 once seen.
 */

import type { EvidenceRow } from './evidence';

export const MASTERY_LABEL = ['no visto', 'flojo', 'en camino', 'firme', 'dominado'] as const;
export type Mastery = 0 | 1 | 2 | 3 | 4;

const DAY = 24 * 60 * 60 * 1000;
const RECENT_ERROR_DAYS = 14;
const DECAY_DAYS = 30;

type Ev = Pick<EvidenceRow, 'kind' | 'verdict' | 'resolved' | 'at' | 'sessionId'>;

const isRight = (e: Ev) => e.kind === 'explained' && (e.verdict === 'correct' || e.verdict === null);
const isOpenError = (e: Ev) => (e.kind === 'misconception' && e.resolved !== true) || e.kind === 'gap';

export function masteryOf(evidence: Ev[], now: number = Date.now()): Mastery {
  const relevant = evidence.filter((e) => e.kind === 'explained' || e.kind === 'misconception' || e.kind === 'gap');
  if (relevant.length === 0) return 0;
  const sorted = [...relevant].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const last = Date.parse(sorted[sorted.length - 1].at);

  const rightSessions: string[] = [];
  for (const e of sorted) {
    if (isRight(e)) {
      const key = e.sessionId ?? e.at;
      if (!rightSessions.includes(key)) rightSessions.push(key);
    }
  }
  const firstRightAt = sorted.find(isRight)?.at;
  const errorsAfterFirstRight = firstRightAt
    ? sorted.some((e) => isOpenError(e) && Date.parse(e.at) >= Date.parse(firstRightAt))
    : true;
  const recentOpenError = sorted.some((e) => isOpenError(e) && now - Date.parse(e.at) <= RECENT_ERROR_DAYS * DAY);

  let level: Mastery;
  if (rightSessions.length === 0) level = 1;
  else if (rightSessions.length >= 3 && !errorsAfterFirstRight) level = 4;
  else if (rightSessions.length >= 2 && !errorsAfterFirstRight) level = 3;
  else level = 2;

  if (recentOpenError && level > 1) level = 1;
  if (now - last > DECAY_DAYS * DAY && level > 1) level = (level - 1) as Mastery;
  return level;
}
