import type { TutorState } from '../use-voice-session';

// ============================================================================
// Per-state visual parameters for the digital grid aura
// ============================================================================

export interface AuraStateParams {
  /** Base dot opacity (0-1) */
  baseOpacity: number;
  /** Audio-reactive opacity gain */
  audioOpacityGain: number;
  /** How many rows of dots light up from bottom (0-1 of total rows) */
  baseActivation: number;
  /** Audio-reactive activation gain */
  audioActivationGain: number;
  /** How much frequency bands drive column heights (0 = ignore, 1 = full) */
  frequencySensitivity: number;
  /** Dot glow radius in px */
  glowRadius: number;
  /** Scanline speed (0 = off) */
  scanlineSpeed: number;
  /** Glitch probability per frame (0-1) */
  glitchProb: number;
  /** Pulse/breathe speed for idle animation */
  breatheSpeed: number;
  /** Breathe amplitude */
  breatheAmp: number;
  /** Primary color [r, g, b] */
  color: [number, number, number];
  /** Secondary accent color [r, g, b] for glitch/highlights */
  accentColor: [number, number, number];
}

// Orange digital palette
const ORANGE: [number, number, number] = [255, 140, 20];
const BRIGHT_ORANGE: [number, number, number] = [255, 180, 50];
const DIM_ORANGE: [number, number, number] = [200, 100, 10];
const WHITE_ORANGE: [number, number, number] = [255, 220, 160];

export const AURA_STATES: Record<TutorState, AuraStateParams> = {
  idle: {
    baseOpacity: 0.15,
    audioOpacityGain: 0,
    baseActivation: 0.08,
    audioActivationGain: 0,
    frequencySensitivity: 0,
    glowRadius: 2,
    scanlineSpeed: 0,
    glitchProb: 0.002,
    breatheSpeed: 0.3,
    breatheAmp: 0.05,
    color: DIM_ORANGE,
    accentColor: ORANGE,
  },
  listening: {
    baseOpacity: 0.5,
    audioOpacityGain: 0.4,
    baseActivation: 0.15,
    audioActivationGain: 0.7,
    frequencySensitivity: 0,
    glowRadius: 4,
    scanlineSpeed: 0,
    glitchProb: 0.01,
    breatheSpeed: 0,
    breatheAmp: 0,
    color: ORANGE,
    accentColor: BRIGHT_ORANGE,
  },
  thinking: {
    baseOpacity: 0.25,
    audioOpacityGain: 0,
    baseActivation: 0.1,
    audioActivationGain: 0,
    frequencySensitivity: 0,
    glowRadius: 3,
    scanlineSpeed: 0.8,
    glitchProb: 0.03,
    breatheSpeed: 0.5,
    breatheAmp: 0.08,
    color: DIM_ORANGE,
    accentColor: ORANGE,
  },
  speaking: {
    baseOpacity: 0.7,
    audioOpacityGain: 0.3,
    baseActivation: 0.2,
    audioActivationGain: 0.8,
    frequencySensitivity: 1.0,
    glowRadius: 6,
    scanlineSpeed: 0,
    glitchProb: 0.015,
    breatheSpeed: 0,
    breatheAmp: 0,
    color: BRIGHT_ORANGE,
    accentColor: WHITE_ORANGE,
  },
};

export const LERP_SPEED = 4.0;

// ============================================================================
// Grid layout
// ============================================================================

/** Number of dot columns */
export const GRID_COLS = 32;
/** Number of dot rows */
export const GRID_ROWS = 16;
/** Dot base radius in CSS px */
export const DOT_RADIUS = 1.5;
/** Vertical space occupied by the grid (% of viewport height from bottom) */
export const GRID_HEIGHT_PCT = 0.35;
/** Horizontal padding from edges (% of viewport width) */
export const GRID_PADDING_X_PCT = 0.04;
