import type { TutorState } from '../use-voice-session';

// ============================================================================
// Per-state visual parameters — digital neon aura
//
// Organic wave shapes rendered as thousands of vertical pixel-lines,
// particles, and glitch artifacts. Dense, alive, Matrix-meets-equalizer.
// ============================================================================

export interface AuraStateParams {
  /** Base opacity for the line field (0-1) */
  baseOpacity: number;
  /** Audio-reactive opacity boost */
  audioOpacityGain: number;
  /** Base wave amplitude as % of viewport height */
  baseAmplitude: number;
  /** Audio-reactive amplitude gain (%) */
  audioAmplitudeGain: number;
  /** How much frequency bands modulate per-column height (0-1) */
  frequencySensitivity: number;
  /** Wave animation speed */
  pulseSpeed: number;
  /** Audio-reactive pulse speed gain */
  audioPulseGain: number;
  /** Breathe cycle speed (Hz, 0 = none) */
  breatheSpeed: number;
  /** Breathe amplitude */
  breatheAmp: number;
  /** Neon glow blur in px */
  glowBlur: number;
  /** Probability of a glitch bar per frame */
  glitchProb: number;
  /** Number of rain particles (falling dots above the wave) */
  rainCount: number;
  /** Rain fall speed multiplier */
  rainSpeed: number;
  /** Scanline speed (0 = off, >0 = horizontal sweep) */
  scanlineSpeed: number;
  /** Primary neon color [r, g, b] */
  color: [number, number, number];
  /** Accent/glitch color [r, g, b] */
  accentColor: [number, number, number];
}

// Neon orange palette
const ORANGE: [number, number, number] = [255, 140, 20];
const BRIGHT_ORANGE: [number, number, number] = [255, 180, 50];
const DIM_ORANGE: [number, number, number] = [180, 80, 5];
const HOT_WHITE: [number, number, number] = [255, 230, 180];

export const AURA_STATES: Record<TutorState, AuraStateParams> = {
  idle: {
    baseOpacity: 0.35,
    audioOpacityGain: 0,
    baseAmplitude: 8,
    audioAmplitudeGain: 0,
    frequencySensitivity: 0,
    pulseSpeed: 0.6,
    audioPulseGain: 0,
    breatheSpeed: 0.2,
    breatheAmp: 3,
    glowBlur: 4,
    glitchProb: 0.003,
    rainCount: 30,
    rainSpeed: 0.3,
    scanlineSpeed: 0,
    color: DIM_ORANGE,
    accentColor: ORANGE,
  },
  listening: {
    baseOpacity: 0.7,
    audioOpacityGain: 0.3,
    baseAmplitude: 12,
    audioAmplitudeGain: 35,
    frequencySensitivity: 0,
    pulseSpeed: 2.0,
    audioPulseGain: 4.0,
    breatheSpeed: 0,
    breatheAmp: 0,
    glowBlur: 6,
    glitchProb: 0.012,
    rainCount: 80,
    rainSpeed: 0.8,
    scanlineSpeed: 0,
    color: ORANGE,
    accentColor: BRIGHT_ORANGE,
  },
  thinking: {
    baseOpacity: 0.4,
    audioOpacityGain: 0,
    baseAmplitude: 6,
    audioAmplitudeGain: 0,
    frequencySensitivity: 0,
    pulseSpeed: 0.4,
    audioPulseGain: 0,
    breatheSpeed: 0.4,
    breatheAmp: 4,
    glowBlur: 5,
    glitchProb: 0.04,
    rainCount: 50,
    rainSpeed: 0.5,
    scanlineSpeed: 0.6,
    color: DIM_ORANGE,
    accentColor: ORANGE,
  },
  speaking: {
    baseOpacity: 0.85,
    audioOpacityGain: 0.15,
    baseAmplitude: 18,
    audioAmplitudeGain: 45,
    frequencySensitivity: 1.0,
    pulseSpeed: 3.0,
    audioPulseGain: 5.0,
    breatheSpeed: 0,
    breatheAmp: 0,
    glowBlur: 8,
    glitchProb: 0.02,
    rainCount: 150,
    rainSpeed: 1.2,
    scanlineSpeed: 0,
    color: BRIGHT_ORANGE,
    accentColor: HOT_WHITE,
  },
};

export const LERP_SPEED = 3.5;

// ============================================================================
// Wave shape configs — layered organic sine waves (same math as before)
// Now rendered as thousands of vertical pixel-lines instead of filled paths
// ============================================================================

export const WAVE_LAYERS = [
  { freq: 2.0, phase: 0.0, ampMult: 1.0,  pulsePhase: 0.0  },
  { freq: 3.0, phase: 0.8, ampMult: 0.75, pulsePhase: 1.5  },
  { freq: 2.5, phase: 2.0, ampMult: 0.6,  pulsePhase: 3.0  },
  { freq: 1.7, phase: 3.5, ampMult: 0.45, pulsePhase: 4.5  },
];

// ============================================================================
// Rendering density
// ============================================================================

/** Number of vertical line-columns across the viewport width */
export const LINE_COLUMNS = 300;
/** Max rain particles allocated */
export const MAX_RAIN_PARTICLES = 200;
