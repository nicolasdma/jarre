/**
 * When the tutor entity draws frames.
 *
 * The torus is decoration while nobody uses it: at rest it is one still
 * frame, and frames are drawn only while there is something to show (the
 * pointer on it, a voice session, or the settle back after either). The
 * continuous idle spin, on every page with the sidebar, kept the main
 * thread 95% busy and the GPU process at ~40% of a core with nobody
 * touching anything (scripts/perf/measure-learn.mjs, `rest`, 1440x900 @2x).
 */

/**
 * How long the entity keeps drawing after hover or a voice session ends, so
 * it eases back: the state lerp (LERP_SPEED 2.5/s) and the 3.5 s morph away
 * from the waveform (geometries.ts setVoiceActive) both finish inside it.
 */
export const SETTLE_MS = 4000;

export interface EntityLoopInput {
  /** A voice session drives the entity (speaking, listening, thinking). */
  voiceActive: boolean;
  hovered: boolean;
  /** performance.now() until which the entity is easing back to rest. */
  settleUntil: number;
  now: number;
  reducedMotion: boolean;
  /** The page is visible and the canvas has a size (display:none below lg). */
  visible: boolean;
}

/** Whether to schedule another frame after this one. */
export function entityShouldAnimate(input: EntityLoopInput): boolean {
  if (!input.visible || input.reducedMotion) return false;
  return input.voiceActive || input.hovered || input.now < input.settleUntil;
}
