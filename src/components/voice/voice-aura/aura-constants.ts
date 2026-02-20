import type { TutorState } from '../use-voice-session';

// ============================================================================
// Per-state visual parameters for the voice aura equalizer waves
// ============================================================================

export interface AuraStateParams {
  /** Base opacity (0-1) */
  baseOpacity: number;
  /** Audio-reactive opacity gain */
  audioOpacityGain: number;
  /** Base wave height as % of container height */
  baseAmplitude: number;
  /** Audio-reactive amplitude gain (%) — THIS is what makes it react */
  audioAmplitudeGain: number;
  /** Vertical pulse speed — how fast the waves breathe up/down */
  pulseSpeed: number;
  /** Audio-reactive pulse speed gain */
  audioPulseGain: number;
  /** Breathe cycle speed (Hz, 0 = none) */
  breatheSpeed: number;
  /** Breathe amplitude */
  breatheAmp: number;
  /** CSS blur radius */
  blurRadius: number;
  /** Wave colors — intense orange neon */
  colors: string[];
  /** How much frequency bands modulate wave height (0 = ignore, 1 = full) */
  frequencySensitivity: number;
}

export const AURA_STATES: Record<TutorState, AuraStateParams> = {
  idle: {
    baseOpacity: 0.6,
    audioOpacityGain: 0,
    baseAmplitude: 6,
    audioAmplitudeGain: 0,
    pulseSpeed: 0.8,
    audioPulseGain: 0,
    breatheSpeed: 0.15,
    breatheAmp: 0.1,
    blurRadius: 35,
    frequencySensitivity: 0,
    colors: [
      'rgba(255, 140, 20, 0.7)',
      'rgba(255, 120, 0, 0.55)',
      'rgba(255, 160, 40, 0.45)',
      'rgba(255, 100, 0, 0.35)',
    ],
  },
  listening: {
    baseOpacity: 0.9,
    audioOpacityGain: 0.1,
    baseAmplitude: 10,
    audioAmplitudeGain: 30,
    pulseSpeed: 2.0,
    audioPulseGain: 4.0,
    breatheSpeed: 0,
    breatheAmp: 0,
    blurRadius: 30,
    frequencySensitivity: 0,
    colors: [
      'rgba(255, 160, 30, 0.9)',
      'rgba(255, 130, 0, 0.75)',
      'rgba(255, 180, 50, 0.65)',
      'rgba(255, 110, 0, 0.55)',
    ],
  },
  thinking: {
    baseOpacity: 0.55,
    audioOpacityGain: 0,
    baseAmplitude: 4,
    audioAmplitudeGain: 0,
    pulseSpeed: 0.5,
    audioPulseGain: 0,
    breatheSpeed: 0.3,
    breatheAmp: 0.12,
    blurRadius: 40,
    frequencySensitivity: 0,
    colors: [
      'rgba(255, 150, 30, 0.6)',
      'rgba(255, 120, 10, 0.45)',
      'rgba(255, 140, 20, 0.35)',
      'rgba(230, 110, 0, 0.30)',
    ],
  },
  speaking: {
    baseOpacity: 1.0,
    audioOpacityGain: 0,
    baseAmplitude: 15,
    audioAmplitudeGain: 40,
    pulseSpeed: 3.0,
    audioPulseGain: 5.0,
    breatheSpeed: 0,
    breatheAmp: 0,
    blurRadius: 25,
    frequencySensitivity: 1.0,
    colors: [
      'rgba(255, 170, 30, 1.0)',
      'rgba(255, 140, 0, 0.9)',
      'rgba(255, 200, 50, 0.8)',
      'rgba(255, 120, 0, 0.7)',
    ],
  },
};

export const LERP_SPEED = 3.0;

/**
 * Per-wave-layer config.
 * freq: how many "hills" across the width
 * phase: time offset so layers don't pulse in sync
 * yOffset: vertical stacking (% of height)
 * ampMult: amplitude multiplier relative to base
 * pulsePhase: offset for the vertical pulsing
 */
export const WAVE_CONFIGS = [
  { freq: 2.0, phase: 0.0,  yOffset: 0, ampMult: 1.0,  pulsePhase: 0.0 },
  { freq: 3.0, phase: 0.8,  yOffset: 2, ampMult: 0.75, pulsePhase: 1.5 },
  { freq: 2.5, phase: 2.0,  yOffset: 4, ampMult: 0.6,  pulsePhase: 3.0 },
  { freq: 1.7, phase: 3.5,  yOffset: 6, ampMult: 0.45, pulsePhase: 4.5 },
];
