/**
 * Which mode a drill shows (owner, 2026-11-18: on "Longest Substring · la
 * ventana…" in Pregunta → respuesta, the next drill opened in Pregunta →
 * respuesta too; "debería empezar en ESCUCHAR").
 *
 * The mode belongs to the drill being practiced, not to the lesson: the one
 * the learner is on keeps the mode they picked; any other drill they move to
 * (next, previous, the list, another section) opens in the first mode of the
 * flow. Its progress (best-scores.ts) is untouched.
 */

import { drillModes } from './drill-progress';
import type { DrillMode } from '@/components/practice/types';

/** The drill being practiced and the mode it is in (slug null: none picked yet). */
export interface DrillModeState {
  slug: string | null;
  mode: DrillMode;
}

/** The first step of the flow for a drill: Escuchar, or Copiar when there is nothing to listen to. */
export function firstMode(hasAudio: boolean): DrillMode {
  return drillModes(hasAudio)[0];
}

/** The mode `slug` shows: the one it was left in if it is the drill being practiced, else the first. */
export function modeOf(state: DrillModeState, slug: string | null, first: DrillMode): DrillMode {
  return slug !== null && state.slug === slug ? state.mode : first;
}
