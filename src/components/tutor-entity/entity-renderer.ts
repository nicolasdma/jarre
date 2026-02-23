// ============================================================================
// 3D ASCII surface renderer — morphing parametric geometries
//
// Performance-optimized two-pass architecture:
//   Pass 1 (all ~28k points): position → cheap displacement → rotate → project → z-buffer
//   Pass 2 (only ~3k z-buffer winners): compute normal → lighting → glyphs
//
// Additional optimizations:
//   - Compute/paint split: geometry computed once, painted to both canvases
//   - Pooled typed arrays: zero GC pressure from frame buffers
//   - Deferred normals: expensive numeric normals only for visible points
// ============================================================================

import {
  LUMINANCE_CHARS,
  SURFACE_GLYPHS,
  CHAR_ASPECT,
  type EntityStateParams,
} from './entity-constants';

import {
  getMorphState,
  evalMorphedPoint,
  computeNormal,
  organicDisplacement,
  isWaveformFn,
  getAudioEnergy,
  getMicLevel,
  type Vec3Out,
} from './geometries';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// Glyph interval — every N steps of theta/phi, use a surface glyph
const GLYPH_THETA_INTERVAL = 0.35;
const GLYPH_PHI_INTERVAL = 0.25;
const GLYPH_TOLERANCE = 0.04;

function nearInterval(angle: number, interval: number, tolerance: number): boolean {
  const mod = angle % interval;
  return mod < tolerance || (interval - mod) < tolerance;
}

const TWO_PI = 6.283185307179586;

// ---------------------------------------------------------------------------
// Pooled frame buffers — allocated once, reused every frame
// ---------------------------------------------------------------------------

let _poolCols = 0;
let _poolRows = 0;
let _zBuf = new Float32Array(0);
let _lumBuf = new Float32Array(0);
let _glyphBuf = new Int8Array(0);
let _thetaBuf = new Float32Array(0);
let _phiBuf = new Float32Array(0);

function ensureBuffers(cols: number, rows: number): void {
  if (cols === _poolCols && rows === _poolRows) return;
  const size = cols * rows;
  _poolCols = cols;
  _poolRows = rows;
  _zBuf = new Float32Array(size);
  _lumBuf = new Float32Array(size);
  _glyphBuf = new Int8Array(size);
  _thetaBuf = new Float32Array(size);
  _phiBuf = new Float32Array(size);
}

// Preallocated scratch vectors for the hot loop
const _pt: Vec3Out = { x: 0, y: 0, z: 0 };
const _nm: Vec3Out = { x: 0, y: 0, z: 0 };

// ---------------------------------------------------------------------------
// Cached frame state — compute once, paint to multiple canvases
// ---------------------------------------------------------------------------

let _frameCols = 0;
let _frameRows = 0;
let _frameValid = false;
let _frameCharW = 0;
let _frameCharH = 0;

// Accumulated rotation angles — prevents direction reversal on speed changes
let _rotA = 0;
let _rotB = 0;
let _lastTime = -1;

// ---------------------------------------------------------------------------
// Compute pass — geometry, z-buffer, lighting (called once per frame)
// ---------------------------------------------------------------------------

// Spring-damper tilt state — organic cursor-following with inertia
let _tiltA = 0;
let _tiltB = 0;
let _tiltVelA = 0;  // angular velocity
let _tiltVelB = 0;
const TILT_MAX = 0.30;      // max tilt offset in radians (~17°)
const TILT_STIFFNESS = 25;  // spring constant — how strongly it pulls toward target
const TILT_DAMPING = 8;     // damping — controls overshoot (critical ~2*sqrt(stiffness))

export function computeEntityFrame(
  width: number,
  height: number,
  params: EntityStateParams,
  time: number,
  focalPoint?: { x: number; y: number } | null,
  frequencyBands?: Float32Array | null,
  micLevel?: number,
): boolean {
  if (width < 10 || height < 10) {
    _frameValid = false;
    return false;
  }

  const fontSize = params.fontSize;
  const charW = fontSize * CHAR_ASPECT;
  const charH = fontSize;

  const cols = (width / charW) | 0;
  const rows = (height / charH) | 0;
  if (cols < 2 || rows < 2) {
    _frameValid = false;
    return false;
  }

  _frameCols = cols;
  _frameRows = rows;
  _frameCharW = charW;
  _frameCharH = charH;

  ensureBuffers(cols, rows);

  // Morph state — needed early for voiceBlend
  const morph = getMorphState(time);
  const { fnA, fnB, t: morphT } = morph;

  // Voice blend: how much waveform is currently visible (0 = none, 1 = full)
  const isTargetWave = isWaveformFn(fnB);
  const isCurrentWave = isWaveformFn(fnA);
  const voiceBlend = isCurrentWave ? 1 : isTargetWave ? morphT : 0;

  // Accumulate rotation incrementally — direction never reverses on speed change
  // Stop accumulating rotation when waveform is fully active
  const dt = _lastTime < 0 ? 0 : time - _lastTime;
  _lastTime = time;
  const rotScale = 1 - voiceBlend;
  _rotA += dt * params.rotSpeedA * rotScale;
  _rotB += dt * params.rotSpeedB * rotScale;

  // Spring-damper tilt — entity orients toward cursor with inertia
  // Dampen tilt toward zero when waveform active (bars should be upright)
  {
    const tiltScale = 1 - voiceBlend;
    const targetA = focalPoint ? -(focalPoint.y - 0.5) * 2 * TILT_MAX * tiltScale : 0;
    const targetB = focalPoint ? -(focalPoint.x - 0.5) * 2 * TILT_MAX * tiltScale : 0;

    // F = -stiffness * displacement - damping * velocity
    const forceA = -TILT_STIFFNESS * (_tiltA - targetA) - TILT_DAMPING * _tiltVelA;
    const forceB = -TILT_STIFFNESS * (_tiltB - targetB) - TILT_DAMPING * _tiltVelB;

    _tiltVelA += forceA * dt;
    _tiltVelB += forceB * dt;
    _tiltA += _tiltVelA * dt;
    _tiltB += _tiltVelB * dt;
  }

  // Base rotation (X then Z axes) — blend toward identity for waveform
  const rawCosA = Math.cos(_rotA);
  const rawSinA = Math.sin(_rotA);
  const rawCosB = Math.cos(_rotB);
  const rawSinB = Math.sin(_rotB);
  const cosA = rawCosA + (1 - rawCosA) * voiceBlend;
  const sinA = rawSinA * (1 - voiceBlend);
  const cosB = rawCosB + (1 - rawCosB) * voiceBlend;
  const sinB = rawSinB * (1 - voiceBlend);
  // Tilt: X-axis (up/down) and Y-axis (left/right) — cursor following
  const cosTiltX = Math.cos(_tiltA);
  const sinTiltX = Math.sin(_tiltA);
  const cosTiltY = Math.cos(_tiltB);
  const sinTiltY = Math.sin(_tiltB);

  const minDim = Math.min(cols * charW, rows * charH);
  const R1 = minDim * params.minorRadius;
  const R2 = minDim * params.majorRadius;

  const K2 = 120;
  const K1 = (minDim * 0.45) * K2 / (R2 + R1 + 10);
  const halfCols = cols * 0.5;
  const halfRows = rows * 0.5;

  // Reset buffers
  _zBuf.fill(-Infinity);
  _glyphBuf.fill(-1);

  const { thetaStep, phiStep } = params;

  // =========================================================================
  // PASS 1: Position → cheap displacement → rotate → project → z-buffer
  // Normal computation is DEFERRED to pass 2 (only for z-buffer winners)
  // =========================================================================

  for (let theta = 0; theta < TWO_PI; theta += thetaStep) {
    for (let phi = 0; phi < TWO_PI; phi += phiStep) {
      // Evaluate morphed surface point
      evalMorphedPoint(fnA, fnB, morphT, theta, phi, R1, R2, _pt);

      // Cheap organic displacement using normalized position as proxy normal
      // Avoids the expensive 3-eval computeNormal for non-visible points
      const px = _pt.x;
      const py = _pt.y;
      const pz = _pt.z;
      const pLen = Math.sqrt(px * px + py * py + pz * pz) || 1;
      let disp = organicDisplacement(theta, phi, time) * R1;

      // === Audio-reactive displacement (fades out as waveform takes over) ===
      if (frequencyBands && frequencyBands.length > 0) {
        const dispScale = 1 - voiceBlend;
        if (dispScale > 0.001) {
          const bandIndex = ((theta / TWO_PI) * frequencyBands.length) | 0;
          const band = frequencyBands[Math.min(bandIndex, frequencyBands.length - 1)];
          const nextBand = frequencyBands[(bandIndex + 1) % frequencyBands.length];
          const frac = (theta / TWO_PI) * frequencyBands.length - bandIndex;
          const blended = band + (nextBand - band) * frac;
          disp += blended * R1 * 0.8 * dispScale;
          disp += band * R1 * 0.15 * Math.sin(phi * 13 + time * 8) * dispScale;
        }
      }

      // Mic reactivity — pulse inward when user speaks (fade out with waveform)
      if (micLevel && micLevel > 0.01) {
        disp -= micLevel * R1 * 0.3 * (1 - voiceBlend);
      }

      _pt.x += (px / pLen) * disp;
      _pt.y += (py / pLen) * disp;
      _pt.z += (pz / pLen) * disp;

      // Rotate: base spin (X then Z), then cursor tilt (X then Y)
      // Base spin
      const bx = _pt.x;
      const by = _pt.y * cosA - _pt.z * sinA;
      const bz = _pt.y * sinA + _pt.z * cosA;
      const sx = bx * cosB - by * sinB;
      const sy = bx * sinB + by * cosB;
      const sz = bz;
      // Cursor tilt: X-axis (up/down)
      const tx = sx;
      const ty = sy * cosTiltX - sz * sinTiltX;
      const tz = sy * sinTiltX + sz * cosTiltX;
      // Cursor tilt: Y-axis (left/right)
      const x2 = tx * cosTiltY + tz * sinTiltY;
      const y2 = ty;
      const z2 = -tx * sinTiltY + tz * cosTiltY;

      // Perspective projection (|0 is faster than Math.floor for positive values)
      const ooz = 1 / (z2 + K2);
      const xp = (halfCols + K1 * ooz * x2) | 0;
      const yp = (halfRows - K1 * ooz * y2 * 0.6) | 0;

      if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;

      const idx = yp * cols + xp;
      if (ooz <= _zBuf[idx]) continue;

      // Z-buffer winner — store depth and angles for pass 2
      _zBuf[idx] = ooz;
      _thetaBuf[idx] = theta;
      _phiBuf[idx] = phi;
    }
  }

  // =========================================================================
  // PASS 2: Compute normals + lighting ONLY for z-buffer winners (~3k vs ~28k)
  // =========================================================================

  const maxLum = LUMINANCE_CHARS.length - 1;
  const glyphCount = SURFACE_GLYPHS.length;
  const gridSize = cols * rows;

  for (let idx = 0; idx < gridSize; idx++) {
    if (_zBuf[idx] <= -Infinity) continue;

    const theta = _thetaBuf[idx];
    const phi = _phiBuf[idx];

    // Compute real numeric normal (3 geometry evals — expensive but only for visible points)
    computeNormal(fnA, fnB, morphT, theta, phi, R1, R2, _nm);

    // Rotate normal (same chain as points: base spin then cursor tilt)
    const nbx = _nm.x;
    const nby = _nm.y * cosA - _nm.z * sinA;
    const nbz = _nm.y * sinA + _nm.z * cosA;
    const nsx = nbx * cosB - nby * sinB;
    const nsy = nbx * sinB + nby * cosB;
    const nsz = nbz;
    const ntx = nsx;
    const nty = nsy * cosTiltX - nsz * sinTiltX;
    const ntz = nsy * sinTiltX + nsz * cosTiltX;
    const rnx2 = ntx * cosTiltY + ntz * sinTiltY;
    const rny2 = nty;
    const rnz2 = -ntx * sinTiltY + ntz * cosTiltY;

    // Lighting — boost intensity when waveform is active and audio is loud
    let luminance = rnx2 * 0.4 + rny2 * 0.5 - rnz2 * 0.75;
    if (voiceBlend > 0) {
      const energy = getAudioEnergy();
      // Push luminance toward bright end proportional to audio energy
      luminance += voiceBlend * energy * 0.8;
      // Brighten bars when user speaks (listening state feedback)
      luminance += voiceBlend * getMicLevel() * 0.5;
    }
    const lumIndex = Math.max(0, Math.min(maxLum, ((luminance + 1) * 0.5 * maxLum + 0.5) | 0));
    _lumBuf[idx] = lumIndex;

    // Glyph inscription
    if (
      nearInterval(theta, GLYPH_THETA_INTERVAL, GLYPH_TOLERANCE) &&
      nearInterval(phi, GLYPH_PHI_INTERVAL, GLYPH_TOLERANCE)
    ) {
      _glyphBuf[idx] = ((theta * 7 + phi * 13) * 100 | 0) % glyphCount;
    }
  }

  _frameValid = true;
  return true;
}

// ---------------------------------------------------------------------------
// Paint pass — reads cached buffers, renders to a canvas (called per canvas)
// ---------------------------------------------------------------------------

export function paintEntityFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: EntityStateParams,
  focalPoint?: { x: number; y: number } | null,
  time: number = 0,
): void {
  ctx.clearRect(0, 0, width, height);
  if (!_frameValid) return;

  const cols = _frameCols;
  const rows = _frameRows;
  const charW = _frameCharW;
  const charH = _frameCharH;
  const maxLum = LUMINANCE_CHARS.length - 1;

  ctx.font = `${params.fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const [cr, cg, cb] = params.color;
  const [ar, ag, ab] = params.accentColor;
  const charOpacity = params.charOpacity;

  // Precompute focal point availability
  const hasFocal = focalPoint != null;
  const fx = hasFocal ? focalPoint!.x : 0;
  const fy = hasFocal ? focalPoint!.y : 0;

  const sparkleProb = params.sparkleProb;
  const hasWaves = params.colorCycleSpeed > 0;

  for (let row = 0; row < rows; row++) {
    const rowOffset = row * cols;
    const cy = row * charH + charH * 0.5;

    for (let col = 0; col < cols; col++) {
      const idx = rowOffset + col;
      if (_zBuf[idx] <= -Infinity) continue;

      const lumIndex = _lumBuf[idx];
      if (lumIndex <= 0) continue;

      const gi = _glyphBuf[idx];
      const ch = gi >= 0
        ? SURFACE_GLYPHS[gi]
        : LUMINANCE_CHARS[Math.min(lumIndex, maxLum)];

      // Focal boost: radial glow centered on cursor position
      let focalBoost = 1.0;
      if (hasFocal) {
        const dx = (col / cols) - fx;
        const dy = (row / rows) - fy;
        const dist2 = dx * dx + dy * dy;
        // Peak 2.5x at cursor, tight core + soft halo
        focalBoost = 1.0 + 1.5 * Math.exp(-dist2 * 18);
      }

      const normalized = lumIndex / maxLum;
      const boostedNorm = Math.min(1, normalized * focalBoost);

      // Sparkle: random chars flash bright white
      const isSparkle = sparkleProb > 0 && Math.random() < sparkleProb && boostedNorm > 0.3;

      // Surface waves: flowing brightness ripples across theta/phi
      let waveBoost = 0;
      if (hasWaves) {
        const theta = _thetaBuf[idx];
        const phi = _phiBuf[idx];
        // Three waves at different speeds/directions for organic flow
        const w1 = Math.sin(theta * 3.0 + phi * 1.5 + time * 2.2);
        const w2 = Math.sin(theta * 1.2 - phi * 2.8 + time * 1.5);
        const w3 = Math.sin(theta * 2.5 + phi * 3.5 - time * 3.0) * 0.5;
        // Combine: range ~[-1, 1], bias toward positive
        waveBoost = (w1 * 0.45 + w2 * 0.35 + w3 * 0.20) * 0.5 + 0.5;
        // Sharpen peaks for distinct bright bands, dim valleys
        waveBoost = waveBoost * waveBoost;
      }

      let opacity: number;
      let r: number, g: number, b: number;

      if (isSparkle) {
        opacity = Math.min(1.0, charOpacity * 1.5);
        r = 255; g = 255; b = 255;
      } else {
        const waveLum = hasWaves ? boostedNorm + waveBoost * 0.4 : boostedNorm;
        const clampedLum = Math.min(1, waveLum);

        opacity = charOpacity * (0.35 + 0.65 * clampedLum) * Math.min(1.0, focalBoost * 0.7);

        // Blend toward accent color more aggressively on wave peaks
        const blend = clampedLum * clampedLum;
        r = (cr + (ar - cr) * blend + 0.5) | 0;
        g = (cg + (ag - cg) * blend + 0.5) | 0;
        b = (cb + (ab - cb) * blend + 0.5) | 0;
      }

      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.fillText(ch, col * charW + charW * 0.5, cy);
    }
  }
}

// ---------------------------------------------------------------------------
// Legacy API — kept for backward compatibility (used by nothing now)
// ---------------------------------------------------------------------------

export function renderEntityFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: EntityStateParams,
  time: number,
  focalPoint?: { x: number; y: number } | null,
): void {
  computeEntityFrame(width, height, params, time, focalPoint);
  paintEntityFrame(ctx, width, height, params, focalPoint, time);
}

// ---------------------------------------------------------------------------
// Mini renderer — tiny torus for mobile 44x44 (unchanged, already fast)
// ---------------------------------------------------------------------------

export function renderMiniFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
  color: [number, number, number],
  opacity: number,
): void {
  ctx.clearRect(0, 0, size, size);

  const fontSize = 6;
  const charW = fontSize * CHAR_ASPECT;
  const charH = fontSize;
  const cols = (size / charW) | 0;
  const rows = (size / charH) | 0;

  const A = time * 0.08;
  const B = time * 0.04;
  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const cosB = Math.cos(B);
  const sinB = Math.sin(B);

  const R1 = size * 0.12;
  const R2 = size * 0.22;
  const K2 = 40;
  const K1 = (size * 0.35) * K2 / (R2 + R1 + 5);

  const gridSize = cols * rows;
  const zBuffer = new Float32Array(gridSize);
  const lumBuffer = new Float32Array(gridSize);
  zBuffer.fill(-Infinity);

  const maxLum = LUMINANCE_CHARS.length - 1;

  for (let theta = 0; theta < TWO_PI; theta += 0.15) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let phi = 0; phi < TWO_PI; phi += 0.05) {
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const circleX = R2 + R1 * cosTheta;
      const circleY = R1 * sinTheta;

      const x1 = circleX * cosPhi;
      const y1 = circleX * sinPhi * cosA - circleY * sinA;
      const z1 = circleX * sinPhi * sinA + circleY * cosA;

      const x2 = x1 * cosB - y1 * sinB;
      const y2 = x1 * sinB + y1 * cosB;
      const z2 = z1;

      const ooz = 1 / (z2 + K2);
      const xp = (cols * 0.5 + K1 * ooz * x2) | 0;
      const yp = (rows * 0.5 - K1 * ooz * y2 * 0.6) | 0;

      if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;

      const idx = yp * cols + xp;
      if (ooz <= zBuffer[idx]) continue;
      zBuffer[idx] = ooz;

      const nx1 = cosTheta * cosPhi;
      const ny1 = cosTheta * sinPhi * cosA - sinTheta * sinA;
      const nz1 = cosTheta * sinPhi * sinA + sinTheta * cosA;
      const nx2 = nx1 * cosB - ny1 * sinB;
      const ny2 = nx1 * sinB + ny1 * cosB;

      const luminance = nx2 * 0.4 + ny2 * 0.5 - nz1 * 0.75;
      lumBuffer[idx] = Math.max(0, ((luminance + 1) * 0.5 * maxLum + 0.5) | 0);
    }
  }

  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (zBuffer[idx] <= -Infinity) continue;
      const lumIndex = lumBuffer[idx];
      if (lumIndex <= 0) continue;

      const ch = LUMINANCE_CHARS[Math.min(lumIndex, maxLum)];
      const normalized = lumIndex / maxLum;
      const a = opacity * (0.35 + 0.65 * normalized);

      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${a})`;
      ctx.fillText(ch, col * charW + charW * 0.5, row * charH + charH * 0.5);
    }
  }
}
