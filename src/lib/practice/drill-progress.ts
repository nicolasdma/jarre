/**
 * A drill's progress in Decirlo. Since 2026-11-18 (the UX audit's plan, approved
 * by the owner) a phrase is done with its three guided steps: Escuchar, Repetir
 * and Sin mirar (Pregunta → respuesta). Copiar and Frase por frase still keep
 * and show their approval, under "más formas de practicar", but no longer
 * count. Before that, every mode counted: how many of its modes are
 * approved (owner, 2026-11-17: "cada ejercicio tiene que ir contando a medida
 * que termine y se apruebe … marcarlo solo en aprobado, no siempre … si hago
 * 3/4 quedan 3/4"). Replaces the 1-to-5 grade, which took the best score of
 * any mode and read 5/5 on a drill with only Copiar and Repetir done.
 *
 * A mode adds 1 only when approved, read from what the page already keeps per
 * device (best-scores.ts). Those values only go up (best score, count of "La
 * tenía", the date Escuchar was completed), so a worse attempt later never
 * takes an approval back, and the scores kept before this rule count too.
 *
 * - Escuchar: the recording (or the browser voice) heard to its end, with at
 *   least LISTEN_COVERAGE of it actually played (trackListen below). Nothing
 *   before this rule recorded it, so it starts unapproved.
 * - Copiar: typing accuracy ≥ 90 %.
 * - Repetir: % of the drill's words said, ≥ 80 %.
 * - Frase por frase: the % of phrases said well (≥ PASS_SCORE, 85, the app's
 *   "said well") in any try, ≥ 80 % (owner, 2026-11-17: "si repito y sale
 *   bien, debe tomarla como bien"; 9 of 13 at once plus 3 after repeating is
 *   12 of 13, approved). A phrase skipped below the bar does not count. Kept
 *   as `sentencesWell`; `sentences`, the % on the first try, is informative
 *   now, but a best kept before this rule had only that one and it still
 *   approves at 80 % (it is never above the new one). Without speech
 *   recognition the run is kept (`shadowed`) but never approves: nothing
 *   judged it.
 * - Pregunta → respuesta: rated "La tenía" at least once.
 *
 * Only Escuchar and Frase por frase need audio; a drill with no recording and
 * no browser voice has the other three, and its total is 3.
 */

import type { DrillBest } from '@/components/practice/best-scores';
import type { DrillMode } from '@/components/practice/types';

/** Minimum % per scored mode. */
export const APPROVAL_PERCENT = { copy: 90, repeat: 80, sentences: 80 } as const;

/** Share of the audio that has to be played for Escuchar. */
export const LISTEN_COVERAGE = 0.9;

const STEPS: readonly DrillMode[] = ['listen', 'repeat', 'recall'];

/** The steps that make a phrase done: Escuchar needs audio (a recording or the browser voice). */
export function drillModes(hasAudio: boolean): DrillMode[] {
  return hasAudio ? [...STEPS] : STEPS.filter((m) => m !== 'listen');
}

export function isModeApproved(best: DrillBest | undefined, mode: DrillMode): boolean {
  if (!best) return false;
  switch (mode) {
    case 'listen':
      return Boolean(best.listened);
    case 'copy':
    case 'repeat':
      return (best[mode]?.score ?? 0) >= APPROVAL_PERCENT[mode];
    case 'sentences':
      return Math.max(best.sentencesWell?.score ?? 0, best.sentences?.score ?? 0) >= APPROVAL_PERCENT.sentences;
    case 'recall':
      return (best.recall?.got ?? 0) > 0;
  }
}

export interface DrillProgress {
  /** Approved steps, in order. */
  approved: DrillMode[];
  done: number;
  total: number;
  /** Every step it has is approved. */
  complete: boolean;
  /** Anything was tried, approved or not. */
  started: boolean;
}

export function drillProgress(best: DrillBest | undefined, modes: readonly DrillMode[]): DrillProgress {
  const approved = modes.filter((m) => isModeApproved(best, m));
  const started = Boolean(
    best && (best.listened || best.copy || best.repeat || best.sentences || best.sentencesWell || best.shadowed || best.recall),
  );
  return { approved, done: approved.length, total: modes.length, complete: modes.length > 0 && approved.length === modes.length, started };
}

// ---------------------------------------------------------------------------
// Escuchar: heard to the end
// ---------------------------------------------------------------------------

/** The audio, split in bins; a bin counts once playback passed through it. */
export const LISTEN_BINS = 50;
/**
 * The longest step between two readings of the playhead that still counts as
 * playing through: a recording reports every frame, the browser voice every
 * word. A longer jump forward (a seek), or any jump back (Desde el principio,
 * a loop), plays nothing in between.
 */
export const LISTEN_MAX_STEP_S = 1.5;

export interface ListenTrack {
  bins: boolean[];
  /** Last playhead seen, seconds; null before the first. */
  last: number | null;
}

export function newListenTrack(): ListenTrack {
  return { bins: Array.from({ length: LISTEN_BINS }, () => false), last: null };
}

function binOf(time: number, duration: number): number {
  return Math.min(LISTEN_BINS - 1, Math.max(0, Math.floor((time / duration) * LISTEN_BINS)));
}

/** The track after the playhead moved to `time` (seconds) in audio `duration` long. Pure. */
export function trackListen(track: ListenTrack, time: number, duration: number): ListenTrack {
  if (!(duration > 0) || !Number.isFinite(time)) return track;
  const prev = track.last;
  if (prev === null || time <= prev || time - prev > LISTEN_MAX_STEP_S) return { ...track, last: time };
  const bins = track.bins.slice();
  for (let b = binOf(prev, duration); b <= binOf(time, duration); b++) bins[b] = true;
  return { bins, last: time };
}

/** Played to its last bin, with at least LISTEN_COVERAGE of it heard. */
export function listenedThrough(track: ListenTrack): boolean {
  const heard = track.bins.filter(Boolean).length;
  return track.bins[LISTEN_BINS - 1] && heard >= Math.ceil(LISTEN_COVERAGE * LISTEN_BINS);
}
