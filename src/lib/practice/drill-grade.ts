/**
 * A drill's grade from 1 to 5, for the "Decilo en inglés" list: which drills
 * were done and how well, and which were skipped (owner, 2026-11-17: "cada
 * práctica de audio me diga de 1 a 5 cuáles completé, algunas las salteo").
 *
 * No new evaluation: it reads the ones each attempt already got and the page
 * already keeps (best-scores.ts, localStorage):
 * - Repetir and Frase por frase: % of the words said, judged by the browser's
 *   recognizer against the text (scoring.ts); Copiar: typing accuracy %.
 *   0-100 maps to 1-5 around the app's own bar for "said well",
 *   PASS_SCORE = 85 (phrase-drill.ts): 95+ is 5, 85+ is 4 (passes the bar),
 *   70+ is 3, 50+ is 2, below that 1.
 * - Pregunta → respuesta: the last rating (judged against the drill, then
 *   confirmed by the learner): La tenía 5, A medias 3, No salió 1.
 * The grade is the best of those, like "Mejor:" under the trainer. A drill
 * practiced only where nothing can be judged (Frase por frase without
 * recognition) is done, without a grade.
 */

import type { DrillBest } from '@/components/practice/best-scores';
import type { RecallRating } from './recall';
import { PASS_SCORE } from './phrase-drill';

export type Grade = 1 | 2 | 3 | 4 | 5;

export interface DrillGrade {
  /** Any mode has a result. */
  done: boolean;
  /** Best grade among the judged attempts; null when none was judged. */
  grade: Grade | null;
}

export function gradeFromPercent(score: number): Grade {
  if (score >= 95) return 5;
  if (score >= PASS_SCORE) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  return 1;
}

const RECALL_GRADE: Record<RecallRating, Grade> = { got: 5, partial: 3, missed: 1 };

export function drillGrade(best: DrillBest | undefined): DrillGrade {
  if (!best) return { done: false, grade: null };
  const grades: Grade[] = [];
  for (const mode of ['repeat', 'sentences', 'copy'] as const) {
    const m = best[mode];
    if (m) grades.push(gradeFromPercent(m.score));
  }
  if (best.recall) grades.push(RECALL_GRADE[best.recall.last]);
  const done = grades.length > 0 || Boolean(best.shadowed);
  return { done, grade: grades.length ? (Math.max(...grades) as Grade) : null };
}
