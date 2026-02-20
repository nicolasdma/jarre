import type { TutorState } from '../use-voice-session';

// ============================================================================
// Per-state visual parameters — soft neon aura with ASCII elements
//
// Organic wave shapes rendered as diffused neon lines + floating ASCII.
// Heavy blur/glow gives a soft, dreamy-but-digital aesthetic.
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
  /** Wave animation speed (kept slow for smooth feel) */
  pulseSpeed: number;
  /** Audio-reactive pulse speed gain */
  audioPulseGain: number;
  /** Breathe cycle speed (Hz, 0 = none) */
  breatheSpeed: number;
  /** Breathe amplitude */
  breatheAmp: number;
  /** Neon glow blur in px — HIGH values for soft diffused look */
  glowBlur: number;
  /** Line thickness multiplier (thicker + blur = softer) */
  lineThickness: number;
  /** Probability of a glitch bar per frame */
  glitchProb: number;
  /** Number of ASCII rain characters falling above the wave */
  asciiRainCount: number;
  /** Rain fall speed multiplier */
  rainSpeed: number;
  /** Number of floating ASCII chars scattered in the wave body */
  asciiFieldCount: number;
  /** Scanline speed (0 = off) */
  scanlineSpeed: number;
  /** Primary neon color [r, g, b] */
  color: [number, number, number];
  /** Accent/glitch color [r, g, b] */
  accentColor: [number, number, number];
}

// Neon orange palette — soft tones
const ORANGE: [number, number, number] = [255, 140, 20];
const SOFT_ORANGE: [number, number, number] = [255, 170, 60];
const DIM_ORANGE: [number, number, number] = [160, 80, 10];
const HOT_WHITE: [number, number, number] = [255, 220, 170];

export const AURA_STATES: Record<TutorState, AuraStateParams> = {
  idle: {
    baseOpacity: 0.25,
    audioOpacityGain: 0,
    baseAmplitude: 8,
    audioAmplitudeGain: 0,
    frequencySensitivity: 0,
    pulseSpeed: 0.3,
    audioPulseGain: 0,
    breatheSpeed: 0.15,
    breatheAmp: 3,
    glowBlur: 18,
    lineThickness: 2,
    glitchProb: 0.001,
    asciiRainCount: 15,
    rainSpeed: 0.15,
    asciiFieldCount: 20,
    scanlineSpeed: 0,
    color: DIM_ORANGE,
    accentColor: ORANGE,
  },
  listening: {
    baseOpacity: 0.55,
    audioOpacityGain: 0.25,
    baseAmplitude: 12,
    audioAmplitudeGain: 30,
    frequencySensitivity: 0,
    pulseSpeed: 1.0,
    audioPulseGain: 2.0,
    breatheSpeed: 0,
    breatheAmp: 0,
    glowBlur: 22,
    lineThickness: 2.5,
    glitchProb: 0.006,
    asciiRainCount: 40,
    rainSpeed: 0.4,
    asciiFieldCount: 40,
    scanlineSpeed: 0,
    color: ORANGE,
    accentColor: SOFT_ORANGE,
  },
  thinking: {
    baseOpacity: 0.3,
    audioOpacityGain: 0,
    baseAmplitude: 6,
    audioAmplitudeGain: 0,
    frequencySensitivity: 0,
    pulseSpeed: 0.25,
    audioPulseGain: 0,
    breatheSpeed: 0.3,
    breatheAmp: 4,
    glowBlur: 20,
    lineThickness: 2,
    glitchProb: 0.02,
    asciiRainCount: 25,
    rainSpeed: 0.25,
    asciiFieldCount: 30,
    scanlineSpeed: 0.4,
    color: DIM_ORANGE,
    accentColor: ORANGE,
  },
  speaking: {
    baseOpacity: 0.65,
    audioOpacityGain: 0.2,
    baseAmplitude: 16,
    audioAmplitudeGain: 40,
    frequencySensitivity: 1.0,
    pulseSpeed: 1.5,
    audioPulseGain: 2.5,
    breatheSpeed: 0,
    breatheAmp: 0,
    glowBlur: 28,
    lineThickness: 3,
    glitchProb: 0.01,
    asciiRainCount: 80,
    rainSpeed: 0.6,
    asciiFieldCount: 60,
    scanlineSpeed: 0,
    color: SOFT_ORANGE,
    accentColor: HOT_WHITE,
  },
};

export const LERP_SPEED = 2.5;

// ============================================================================
// Wave shape configs — layered organic sine waves
// ============================================================================

export const WAVE_LAYERS = [
  { freq: 2.0, phase: 0.0, ampMult: 1.0,  pulsePhase: 0.0  },
  { freq: 3.0, phase: 0.8, ampMult: 0.75, pulsePhase: 1.5  },
  { freq: 2.5, phase: 2.0, ampMult: 0.6,  pulsePhase: 3.0  },
  { freq: 1.7, phase: 3.5, ampMult: 0.45, pulsePhase: 4.5  },
];

// ============================================================================
// Rendering config
// ============================================================================

/** Number of vertical neon-line columns */
export const LINE_COLUMNS = 200;
/** Max ASCII rain particles */
export const MAX_ASCII_RAIN = 120;
/** Max floating ASCII field chars */
export const MAX_ASCII_FIELD = 80;

// ============================================================================
// ASCII character sets
// ============================================================================

/** Characters for rain — Matrix-inspired mix */
export const RAIN_CHARS = '01αβγδεζηθλμνξπρστφψω∑∏∫∂∇≈≠∞⟨⟩╬║░▒▓█';
/** Characters for field — more structural/symbolic */
export const FIELD_CHARS = '░▒▓·:;|/\\─═╬╫╪◊◈⬡⎔⏣⏢△▽○●◦⊙⊕';
