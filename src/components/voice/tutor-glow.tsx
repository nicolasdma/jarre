'use client';

/**
 * Backward-compatibility re-exports.
 * TutorGlow and TutorAmbientGlow are replaced by VoiceAura / VoiceAuraOverlay.
 */

export { VoiceAura as TutorGlow } from './voice-aura';
export type { VoiceAuraProps as TutorGlowProps } from './voice-aura';

export function TutorAmbientGlow(_props: { state: string; audioLevel?: number }) {
  return null;
}
