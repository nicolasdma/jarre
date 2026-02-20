// ============================================================================
// Tutor Entity — Volumetric ASCII energy field constants
// ============================================================================

/**
 * Extended luminance ramp — 20 levels for smoother shading.
 * Chars chosen to suggest curved, flowing density rather than hard edges.
 * Index 0 is empty space; higher indices are denser/brighter.
 */
export const LUMINANCE_CHARS = ' .`\':,~-_"^;!><+?)(}{=*#%@';

// Warm orange palette — soft tones
const WARM_DIM: [number, number, number] = [140, 70, 15];
const WARM_MID: [number, number, number] = [200, 110, 30];
const WARM_BRIGHT: [number, number, number] = [255, 165, 60];

// ---------------------------------------------------------------------------
// Energy node definition — each node is a soft 3D gaussian blob
// ---------------------------------------------------------------------------

export interface EnergyNode {
  /** Orbit radius (fraction of field radius) */
  orbitRadius: number;
  /** Orbit speed multiplier */
  orbitSpeed: number;
  /** Phase offset (radians) */
  phase: number;
  /** Orbit tilt — angle of orbit plane from XY (radians) */
  tilt: number;
  /** Gaussian falloff sigma (fraction of field) */
  sigma: number;
  /** Intensity multiplier */
  intensity: number;
}

/**
 * Energy nodes — no single bright core.
 * Instead, 3 offset "hearts" create a diffuse center with no focal point.
 * Layers have asymmetric tilts/speeds to break frontal symmetry.
 */
export const ENERGY_NODES: EnergyNode[] = [
  // Diffuse core — 3 overlapping off-center blobs (no eye)
  { orbitRadius: 0.06, orbitSpeed: 0.08, phase: 0.0,  tilt: 0.3,  sigma: 0.40, intensity: 0.55 },
  { orbitRadius: 0.08, orbitSpeed: 0.06, phase: 2.2,  tilt: -0.4, sigma: 0.38, intensity: 0.50 },
  { orbitRadius: 0.07, orbitSpeed: 0.10, phase: 4.5,  tilt: 0.5,  sigma: 0.36, intensity: 0.50 },

  // Inner cloud — medium blobs, gentle drift, asymmetric tilts
  { orbitRadius: 0.20, orbitSpeed: 0.22, phase: 0.5,  tilt: 0.7,  sigma: 0.28, intensity: 0.55 },
  { orbitRadius: 0.24, orbitSpeed: 0.18, phase: 2.8,  tilt: -0.6, sigma: 0.26, intensity: 0.50 },
  { orbitRadius: 0.18, orbitSpeed: 0.25, phase: 4.9,  tilt: 1.0,  sigma: 0.30, intensity: 0.48 },
  { orbitRadius: 0.22, orbitSpeed: 0.20, phase: 1.4,  tilt: -0.9, sigma: 0.27, intensity: 0.45 },

  // Outer halo — wide, soft, gives the aura its extent
  { orbitRadius: 0.38, orbitSpeed: 0.12, phase: 0.8,  tilt: 1.1,  sigma: 0.24, intensity: 0.35 },
  { orbitRadius: 0.42, orbitSpeed: 0.14, phase: 3.2,  tilt: -0.8, sigma: 0.22, intensity: 0.32 },
  { orbitRadius: 0.36, orbitSpeed: 0.16, phase: 5.4,  tilt: 0.5,  sigma: 0.26, intensity: 0.34 },
  { orbitRadius: 0.40, orbitSpeed: 0.11, phase: 2.0,  tilt: -1.2, sigma: 0.23, intensity: 0.30 },

  // Wisps — gentle tendrils, not fast/sharp
  { orbitRadius: 0.52, orbitSpeed: 0.18, phase: 0.3,  tilt: 1.3,  sigma: 0.18, intensity: 0.20 },
  { orbitRadius: 0.50, orbitSpeed: 0.20, phase: 2.7,  tilt: -1.1, sigma: 0.16, intensity: 0.18 },
  { orbitRadius: 0.55, orbitSpeed: 0.15, phase: 5.0,  tilt: 0.6,  sigma: 0.17, intensity: 0.19 },
];

// ---------------------------------------------------------------------------
// State parameters
// ---------------------------------------------------------------------------

export interface EntityStateParams {
  /** Rotation speed around tilted axis A (rad/s) */
  rotSpeedA: number;
  /** Rotation speed around tilted axis B (rad/s) */
  rotSpeedB: number;
  /** Rotation speed around Y axis — adds diagonal tilt (rad/s) */
  rotSpeedC: number;
  /** Pulsation amplitude (0-1) — breathing */
  pulseAmp: number;
  /** Pulsation speed (Hz) */
  pulseSpeed: number;
  /** Base char opacity */
  charOpacity: number;
  /** CSS glow filter opacity */
  glowOpacity: number;
  /** Primary color (dim regions) */
  color: [number, number, number];
  /** Accent color (bright regions) */
  accentColor: [number, number, number];
  /** Font size in px — smaller = denser grid */
  fontSize: number;
  /** Noise texture intensity (0-1) */
  noiseIntensity: number;
}

export const ENTITY_STATES = {
  idle: {
    rotSpeedA: 0.18,
    rotSpeedB: 0.12,
    rotSpeedC: 0.08,
    pulseAmp: 0.06,
    pulseSpeed: 0.10,
    charOpacity: 0.45,
    glowOpacity: 0.30,
    color: WARM_DIM,
    accentColor: WARM_MID,
    fontSize: 11,
    noiseIntensity: 0.10,
  },
  hover: {
    rotSpeedA: 0.30,
    rotSpeedB: 0.20,
    rotSpeedC: 0.14,
    pulseAmp: 0.09,
    pulseSpeed: 0.14,
    charOpacity: 0.58,
    glowOpacity: 0.40,
    color: WARM_MID,
    accentColor: WARM_BRIGHT,
    fontSize: 11,
    noiseIntensity: 0.14,
  },
} as const satisfies Record<string, EntityStateParams>;

export type EntityState = keyof typeof ENTITY_STATES;

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------

export const IDLE_FPS = 30;
export const FRAME_INTERVAL = 1000 / IDLE_FPS;
export const LERP_SPEED = 2.5;
export const MINI_SIZE = 44;

/** Char aspect ratio — monospace chars are taller than wide */
export const CHAR_ASPECT = 0.6;
