// ============================================================================
// Parametric geometry library for the tutor entity
//
// 4 surfaces that morph into each other in randomized order.
// Sequence is randomized continuously — never predictable.
//
// Design constraints:
//   - Zero heap allocation in hot path (all outputs via preallocated Vec3Out)
//   - Numeric normals via finite differences (3 evals per point)
//   - Organic deformation via irrational-frequency sine sum
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Vec3Out {
  x: number;
  y: number;
  z: number;
}

export type GeometryFn = (
  theta: number,
  phi: number,
  R1: number,
  R2: number,
  out: Vec3Out,
) => void;

export interface MorphState {
  fnA: GeometryFn;
  fnB: GeometryFn;
  t: number; // 0 = pure fnA, 1 = pure fnB
}

// ---------------------------------------------------------------------------
// Preallocated scratch vectors (module-level, zero-alloc)
// ---------------------------------------------------------------------------

const _pA: Vec3Out = { x: 0, y: 0, z: 0 };
const _pB: Vec3Out = { x: 0, y: 0, z: 0 };
const _nThetaP: Vec3Out = { x: 0, y: 0, z: 0 };
const _nPhiP: Vec3Out = { x: 0, y: 0, z: 0 };
const _nCenter: Vec3Out = { x: 0, y: 0, z: 0 };

// ---------------------------------------------------------------------------
// Geometry functions (4 solid surfaces)
// ---------------------------------------------------------------------------

/** Sphere — remapped from torus parameter space */
const sphereFn: GeometryFn = (theta, phi, R1, R2, out) => {
  const v = phi * 0.5; // [0,2π] → [0,π] for polar angle
  const radius = (R2 + R1) * 0.5;
  const sv = Math.sin(v);
  out.x = radius * sv * Math.cos(theta);
  out.y = radius * sv * Math.sin(theta);
  out.z = radius * Math.cos(v);
};

/** Trefoil knot tube — curve + Frenet frame */
const trefoilFn: GeometryFn = (theta, phi, R1, R2, out) => {
  const scale = R2 / 3;

  const c3p = Math.cos(3 * phi);
  const s3p = Math.sin(3 * phi);
  const c2p = Math.cos(2 * phi);
  const s2p = Math.sin(2 * phi);
  const cx = (2 + c3p) * c2p * scale;
  const cy = (2 + c3p) * s2p * scale;
  const cz = s3p * scale;

  const tx = (-3 * s3p * c2p - 2 * (2 + c3p) * s2p) * scale;
  const ty = (-3 * s3p * s2p + 2 * (2 + c3p) * c2p) * scale;
  const tz = 3 * c3p * scale;

  const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1;
  const Tx = tx / tLen;
  const Ty = ty / tLen;
  const Tz = tz / tLen;

  const absZ = Math.abs(Tz);
  const auxX = absZ > 0.9 ? 1 : 0;
  const auxY = 0;
  const auxZ = absZ > 0.9 ? 0 : 1;

  let Nx = Ty * auxZ - Tz * auxY;
  let Ny = Tz * auxX - Tx * auxZ;
  let Nz = Tx * auxY - Ty * auxX;
  const nLen = Math.sqrt(Nx * Nx + Ny * Ny + Nz * Nz) || 1;
  Nx /= nLen;
  Ny /= nLen;
  Nz /= nLen;

  const Bx = Ty * Nz - Tz * Ny;
  const By = Tz * Nx - Tx * Nz;
  const Bz = Tx * Ny - Ty * Nx;

  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  out.x = cx + R1 * (Nx * ct + Bx * st);
  out.y = cy + R1 * (Ny * ct + By * st);
  out.z = cz + R1 * (Nz * ct + Bz * st);
};

/** Boy's surface — Apéry parametrization remapped from (theta,phi) */
const boysFn: GeometryFn = (theta, phi, R1, R2, out) => {
  const u = theta * 0.5;
  const v = phi;
  const cu = Math.cos(u);
  const cu2 = cu * cu;
  const su2 = Math.sin(u) * Math.sin(u);
  const s2u = Math.sin(2 * u);
  const SQRT2 = 1.4142135623730951;

  let D = SQRT2 - s2u * Math.sin(3 * v);
  if (D < 0.1) D = 0.1;

  const scale = R2 * 0.7;
  out.x = scale * (cu2 * Math.cos(2 * v) + su2 * Math.cos(v) * SQRT2) / D;
  out.y = scale * (cu2 * Math.sin(2 * v) - su2 * Math.sin(v) * SQRT2) / D;
  out.z = scale * (3 * cu2) / D;
  out.z -= scale * 1.5;
};

/** Star — spiked sphere using spherical harmonics-like radial modulation */
const starFn: GeometryFn = (theta, phi, R1, R2, out) => {
  const v = phi * 0.5; // [0,2π] → [0,π] polar
  const sv = Math.sin(v);
  const cv = Math.cos(v);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);

  const baseR = (R2 + R1) * 0.35;
  const spike = 0.35 * (
    Math.abs(sv * sv * ct * ct * st * ct) +
    Math.abs(cv * sv * sv) * 0.5
  );
  const r = baseR * (1 + spike * 3);

  out.x = r * sv * ct;
  out.y = r * sv * st;
  out.z = r * cv;
};

// ---------------------------------------------------------------------------
// All geometries pool (with names for debug)
// ---------------------------------------------------------------------------

interface NamedGeometry {
  fn: GeometryFn;
  name: string;
}

const ALL_GEOMETRIES: NamedGeometry[] = [
  { fn: sphereFn, name: 'Sphere' },
  { fn: trefoilFn, name: 'Trefoil Knot' },
  { fn: boysFn, name: "Boy's Surface" },
  { fn: starFn, name: 'Star' },
];

// ---------------------------------------------------------------------------
// Continuous random morph — picks next geometry on the fly, never repeats
// ---------------------------------------------------------------------------

/** Hold time range (seconds) */
const HOLD_MIN = 20;
const HOLD_MAX = 90;

/** Transition time range (seconds) — 4s fastest, 12s slowest */
const TRANSITION_MIN = 4;
const TRANSITION_MAX = 12;

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function smoothstep(x: number): number {
  return x * x * (3 - 2 * x);
}

/** Pick a random geometry from the pool, excluding `exclude` */
function randomGeometry(exclude: NamedGeometry): NamedGeometry {
  const candidates = ALL_GEOMETRIES.filter(g => g !== exclude);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Runtime state — tracks which shapes are active and when they were picked
let _current: NamedGeometry = ALL_GEOMETRIES[Math.floor(Math.random() * ALL_GEOMETRIES.length)];
let _next: NamedGeometry = randomGeometry(_current);
let _currentHold = randomInRange(HOLD_MIN, HOLD_MAX);
let _currentTransition = randomInRange(TRANSITION_MIN, TRANSITION_MAX);
let _currentCycle = _currentHold + _currentTransition;
let _cycleStart = 0;
let _initialized = false;

/** Current geometry name (for debug display) */
export function getCurrentGeometryName(): string {
  return _current.name;
}

/**
 * Get the current morph state based on elapsed time.
 * Picks the next geometry randomly each cycle — never predictable.
 */
export function getMorphState(time: number): MorphState {
  if (!_initialized) {
    _cycleStart = time;
    _initialized = true;
  }

  const elapsed = time - _cycleStart;

  if (elapsed >= _currentCycle) {
    _current = _next;
    _next = randomGeometry(_current);
    _currentHold = randomInRange(HOLD_MIN, HOLD_MAX);
    _currentTransition = randomInRange(TRANSITION_MIN, TRANSITION_MAX);
    _currentCycle = _currentHold + _currentTransition;
    _cycleStart += _currentCycle;
    if (time - _cycleStart >= _currentCycle) {
      _cycleStart = time;
    }
  }

  const withinCycle = time - _cycleStart;
  const t = withinCycle > _currentHold
    ? smoothstep((withinCycle - _currentHold) / _currentTransition)
    : 0;

  return { fnA: _current.fn, fnB: _next.fn, t };
}

// ---------------------------------------------------------------------------
// Morphed point evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate a morphed point: linear interpolation between two geometries.
 * When t=0, pure fnA. When t=1, pure fnB.
 */
export function evalMorphedPoint(
  fnA: GeometryFn,
  fnB: GeometryFn,
  t: number,
  theta: number,
  phi: number,
  R1: number,
  R2: number,
  out: Vec3Out,
): void {
  if (t <= 0) {
    fnA(theta, phi, R1, R2, out);
    return;
  }
  if (t >= 1) {
    fnB(theta, phi, R1, R2, out);
    return;
  }
  fnA(theta, phi, R1, R2, _pA);
  fnB(theta, phi, R1, R2, _pB);
  out.x = _pA.x + (_pB.x - _pA.x) * t;
  out.y = _pA.y + (_pB.y - _pA.y) * t;
  out.z = _pA.z + (_pB.z - _pA.z) * t;
}

// ---------------------------------------------------------------------------
// Numeric normals via finite differences
// ---------------------------------------------------------------------------

const NORMAL_EPS = 0.001;

/**
 * Compute surface normal at (theta, phi) using finite differences.
 * Result is normalized and written to `out`.
 */
export function computeNormal(
  fnA: GeometryFn,
  fnB: GeometryFn,
  t: number,
  theta: number,
  phi: number,
  R1: number,
  R2: number,
  out: Vec3Out,
): void {
  evalMorphedPoint(fnA, fnB, t, theta, phi, R1, R2, _nCenter);

  evalMorphedPoint(fnA, fnB, t, theta + NORMAL_EPS, phi, R1, R2, _nThetaP);
  const dTx = (_nThetaP.x - _nCenter.x) / NORMAL_EPS;
  const dTy = (_nThetaP.y - _nCenter.y) / NORMAL_EPS;
  const dTz = (_nThetaP.z - _nCenter.z) / NORMAL_EPS;

  evalMorphedPoint(fnA, fnB, t, theta, phi + NORMAL_EPS, R1, R2, _nPhiP);
  const dPx = (_nPhiP.x - _nCenter.x) / NORMAL_EPS;
  const dPy = (_nPhiP.y - _nCenter.y) / NORMAL_EPS;
  const dPz = (_nPhiP.z - _nCenter.z) / NORMAL_EPS;

  let nx = dTy * dPz - dTz * dPy;
  let ny = dTz * dPx - dTx * dPz;
  let nz = dTx * dPy - dTy * dPx;

  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  out.x = nx / len;
  out.y = ny / len;
  out.z = nz / len;
}

// ---------------------------------------------------------------------------
// Organic deformation — irrational-frequency sine displacement
// ---------------------------------------------------------------------------

/**
 * Compute organic displacement magnitude along the normal.
 * Returns a value in [-0.075, +0.075] (relative to R1).
 */
export function organicDisplacement(theta: number, phi: number, time: number): number {
  return (
    0.03 * Math.sin(theta * 3.7 + time * 1.1) +
    0.02 * Math.sin(phi * 5.3 - time * 0.7) +
    0.015 * Math.sin(theta * 2.1 + phi * 4.3 + time * 1.5) +
    0.01 * Math.sin(theta * 7.1 - phi * 3.7 + time * 0.9)
  );
}
