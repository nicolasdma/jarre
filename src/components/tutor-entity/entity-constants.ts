// ============================================================================
// Tutor Entity — 3D ASCII Torus constants
// ============================================================================

/** Luminance ramp — smooth gradient from dim to bright */
export const LUMINANCE_CHARS = ' .`\':,~-_"^;!><+?)(}{=*#%@';

/**
 * Surface inscription chars — scattered on the torus at regular (theta, phi)
 * intervals, replacing the luminance char. Mix of letters + original symbols.
 */
export const SURFACE_GLYPHS = 'AaBbCcDdEeFfGgHhJjKkNnRrSsTtWwXxZz.,:;=!*#%@><+?)(}{~-';

// Warm orange palette
const WARM_DIM: [number, number, number] = [140, 70, 15];
const WARM_MID: [number, number, number] = [200, 110, 30];
const WARM_BRIGHT: [number, number, number] = [255, 165, 60];

// ---------------------------------------------------------------------------
// State parameters
// ---------------------------------------------------------------------------

export interface EntityStateParams {
  /** Torus major radius R (fraction of viewport min-dim) */
  majorRadius: number;
  /** Torus minor radius r (fraction of viewport min-dim) */
  minorRadius: number;
  /** Rotation speed around X axis (rad/s) */
  rotSpeedA: number;
  /** Rotation speed around Z axis (rad/s) */
  rotSpeedB: number;
  /** Surface sampling step for theta (smaller = denser) */
  thetaStep: number;
  /** Surface sampling step for phi (smaller = denser) */
  phiStep: number;
  /** Base char opacity */
  charOpacity: number;
  /** CSS glow filter opacity */
  glowOpacity: number;
  /** Primary color (dim faces) */
  color: [number, number, number];
  /** Accent color (bright faces) */
  accentColor: [number, number, number];
  /** Font size in px */
  fontSize: number;
  /** Color cycle speed between base and white (Hz, 0 = off) */
  colorCycleSpeed: number;
  /** How far toward white the cycle goes (0-1) */
  colorCycleIntensity: number;
  /** Probability of a sparkle per visible char per frame (0-1) */
  sparkleProb: number;
  /** CSS blur for glow canvas in px */
  glowBlur: number;
}

export const ENTITY_STATES = {
  /** Entrance — big and fast, plays on mount */
  intro: {
    majorRadius: 0.32,
    minorRadius: 0.16,
    rotSpeedA: 0.10,
    rotSpeedB: 0.05,
    thetaStep: 0.07,
    phiStep: 0.02,
    charOpacity: 0.55,
    glowOpacity: 0.35,
    color: WARM_MID,
    accentColor: WARM_BRIGHT,
    fontSize: 12,
    colorCycleSpeed: 0,
    colorCycleIntensity: 0,
    sparkleProb: 0,
    glowBlur: 6,
  },
  /** Settled idle — small, calm */
  idle: {
    majorRadius: 0.08,
    minorRadius: 0.04,
    rotSpeedA: 0.03,
    rotSpeedB: 0.016,
    thetaStep: 0.07,
    phiStep: 0.02,
    charOpacity: 0.40,
    glowOpacity: 0.20,
    color: WARM_DIM,
    accentColor: WARM_MID,
    fontSize: 12,
    colorCycleSpeed: 0,
    colorCycleIntensity: 0,
    sparkleProb: 0,
    glowBlur: 6,
  },
  /** Hover — gentle awareness, slightly warmer, subtle cursor response */
  hover: {
    majorRadius: 0.09,
    minorRadius: 0.045,
    rotSpeedA: 0.02,
    rotSpeedB: 0.01,
    thetaStep: 0.06,
    phiStep: 0.018,
    charOpacity: 0.55,
    glowOpacity: 0.30,
    color: WARM_MID,
    accentColor: WARM_BRIGHT,
    fontSize: 12,
    colorCycleSpeed: 0,
    colorCycleIntensity: 0,
    sparkleProb: 0,
    glowBlur: 6,
  },
  /** Speaking — Gemini is talking, large and energetic, audio drives deformation */
  speaking: {
    majorRadius: 0.20,
    minorRadius: 0.10,
    rotSpeedA: 0.09,
    rotSpeedB: 0.05,
    thetaStep: 0.055,
    phiStep: 0.016,
    charOpacity: 0.90,
    glowOpacity: 0.65,
    color: WARM_MID,
    accentColor: WARM_BRIGHT,
    fontSize: 12,
    colorCycleSpeed: 0.5,
    colorCycleIntensity: 0.25,
    sparkleProb: 0.03,
    glowBlur: 10,
  },
  /** Listening — user is talking, warm and attentive, contracts with mic input */
  listening: {
    majorRadius: 0.11,
    minorRadius: 0.055,
    rotSpeedA: 0.012,
    rotSpeedB: 0.006,
    thetaStep: 0.07,
    phiStep: 0.02,
    charOpacity: 0.55,
    glowOpacity: 0.32,
    color: WARM_MID,
    accentColor: WARM_BRIGHT,
    fontSize: 12,
    colorCycleSpeed: 0,
    colorCycleIntensity: 0,
    sparkleProb: 0,
    glowBlur: 6,
  },
  /** Thinking — processing, slow breathing pulse applied in TutorEntity */
  thinking: {
    majorRadius: 0.10,
    minorRadius: 0.05,
    rotSpeedA: 0.01,
    rotSpeedB: 0.005,
    thetaStep: 0.07,
    phiStep: 0.02,
    charOpacity: 0.50,
    glowOpacity: 0.28,
    color: WARM_DIM,
    accentColor: WARM_MID,
    fontSize: 12,
    colorCycleSpeed: 0,
    colorCycleIntensity: 0,
    sparkleProb: 0,
    glowBlur: 6,
  },
} as const satisfies Record<string, EntityStateParams>;

export type EntityState = keyof typeof ENTITY_STATES;

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------

export const IDLE_FPS = 30;
export const FRAME_INTERVAL = 1000 / IDLE_FPS;
/** Lerp speed for normal transitions (hover→idle, etc.) */
export const LERP_SPEED = 2.5;
/** Slower lerp for intro → idle shrink (seconds to ~settle) */
export const INTRO_LERP_SPEED = 0.8;
/** Very gentle lerp for idle → hover (~4s to settle) */
export const HOVER_LERP_SPEED = 0.4;
/** How long the intro plays at full size before shrinking (seconds) */
export const INTRO_HOLD_DURATION = 2.0;
export const MINI_SIZE = 44;

/** Char aspect ratio — monospace chars are taller than wide */
export const CHAR_ASPECT = 0.6;
