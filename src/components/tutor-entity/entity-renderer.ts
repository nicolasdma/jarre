// ============================================================================
// 3D ASCII surface renderer — morphing parametric geometries
//
// For each surface point on the current morphed geometry:
//   1. Evaluate morphed position from (theta, phi) + blend factor
//   2. Compute numeric normal via finite differences
//   3. Apply organic sine-sum displacement along normal
//   4. Rotate around X and Z axes (time-varying)
//   5. Perspective-project to 2D character grid
//   6. Z-buffer: only keep closest surface point per cell
//   7. Compute luminance from rotated normal · light direction
//   8. Map luminance to ASCII char OR surface glyph inscription
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

/** Check if an angle is near a regular grid interval */
function nearInterval(angle: number, interval: number, tolerance: number): boolean {
  const mod = angle % interval;
  return mod < tolerance || (interval - mod) < tolerance;
}

// ---------------------------------------------------------------------------
// Main torus renderer
// ---------------------------------------------------------------------------

export function renderEntityFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: EntityStateParams,
  time: number,
): void {
  ctx.clearRect(0, 0, width, height);
  if (width < 10 || height < 10) return;

  const fontSize = params.fontSize;
  const charW = fontSize * CHAR_ASPECT;
  const charH = fontSize;

  const cols = Math.floor(width / charW);
  const rows = Math.floor(height / charH);
  if (cols < 2 || rows < 2) return;

  const A = time * params.rotSpeedA;
  const B = time * params.rotSpeedB;

  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const cosB = Math.cos(B);
  const sinB = Math.sin(B);

  const minDim = Math.min(cols * charW, rows * charH);
  const R1 = minDim * params.minorRadius;
  const R2 = minDim * params.majorRadius;

  const K2 = 120;
  const K1 = (minDim * 0.45) * K2 / (R2 + R1 + 10);

  const gridSize = cols * rows;
  const zBuffer = new Float32Array(gridSize);
  const lumBuffer = new Float32Array(gridSize);
  const glyphBuffer = new Int8Array(gridSize);

  zBuffer.fill(-Infinity);
  glyphBuffer.fill(-1);

  const maxLum = LUMINANCE_CHARS.length - 1;
  const glyphCount = SURFACE_GLYPHS.length;
  const { thetaStep, phiStep } = params;

  // Morph state — autonomous cycle independent of entity state
  const morph = getMorphState(time);
  const { fnA, fnB, t: morphT } = morph;

  // Preallocated scratch for the hot loop
  const _pt: Vec3Out = { x: 0, y: 0, z: 0 };
  const _nm: Vec3Out = { x: 0, y: 0, z: 0 };

  for (let theta = 0; theta < 6.2832; theta += thetaStep) {
    for (let phi = 0; phi < 6.2832; phi += phiStep) {
      // 1. Evaluate morphed surface point
      evalMorphedPoint(fnA, fnB, morphT, theta, phi, R1, R2, _pt);

      // 2. Compute numeric normal
      computeNormal(fnA, fnB, morphT, theta, phi, R1, R2, _nm);

      // 3. Organic displacement along normal
      const disp = organicDisplacement(theta, phi, time) * R1;
      _pt.x += _nm.x * disp;
      _pt.y += _nm.y * disp;
      _pt.z += _nm.z * disp;

      // 4. Rotate around X axis (A) then Z axis (B) — same as original
      const x1 = _pt.x;
      const y1 = _pt.y * cosA - _pt.z * sinA;
      const z1 = _pt.y * sinA + _pt.z * cosA;

      const x2 = x1 * cosB - y1 * sinB;
      const y2 = x1 * sinB + y1 * cosB;
      const z2 = z1;

      // 5. Perspective projection
      const ooz = 1 / (z2 + K2);
      const xp = Math.floor(cols / 2 + K1 * ooz * x2);
      const yp = Math.floor(rows / 2 - K1 * ooz * y2 * 0.6);

      if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;

      const idx = yp * cols + xp;

      if (ooz <= zBuffer[idx]) continue;
      zBuffer[idx] = ooz;

      // 6. Rotate normal for lighting
      const rnx1 = _nm.x;
      const rny1 = _nm.y * cosA - _nm.z * sinA;
      const rnz1 = _nm.y * sinA + _nm.z * cosA;
      const rnx2 = rnx1 * cosB - rny1 * sinB;
      const rny2 = rnx1 * sinB + rny1 * cosB;

      const luminance = rnx2 * 0.4 + rny2 * 0.5 - rnz1 * 0.75;
      const lumIndex = Math.max(0, Math.round(((luminance + 1) / 2) * maxLum));
      lumBuffer[idx] = lumIndex;

      // 7. Surface glyph inscription — at grid intersections on the surface
      if (
        nearInterval(theta, GLYPH_THETA_INTERVAL, GLYPH_TOLERANCE) &&
        nearInterval(phi, GLYPH_PHI_INTERVAL, GLYPH_TOLERANCE)
      ) {
        const gi = Math.floor((theta * 7 + phi * 13) * 100) % glyphCount;
        glyphBuffer[idx] = gi;
      } else {
        glyphBuffer[idx] = -1;
      }
    }
  }

  // Render to canvas
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const [cr, cg, cb] = params.color;
  const [ar, ag, ab] = params.accentColor;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (zBuffer[idx] <= -Infinity) continue;

      const lumIndex = lumBuffer[idx];
      if (lumIndex <= 0) continue;

      const gi = glyphBuffer[idx];
      const ch = gi >= 0
        ? SURFACE_GLYPHS[gi]
        : LUMINANCE_CHARS[Math.min(lumIndex, maxLum)];

      const normalized = lumIndex / maxLum;
      const opacity = params.charOpacity * (0.35 + 0.65 * normalized);

      const blend = normalized * normalized;
      const r = Math.round(lerp(cr, ar, blend));
      const g = Math.round(lerp(cg, ag, blend));
      const b = Math.round(lerp(cb, ab, blend));

      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.fillText(ch, col * charW + charW / 2, row * charH + charH / 2);
    }
  }
}

// ---------------------------------------------------------------------------
// Mini renderer — tiny torus for mobile 44x44
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
  const cols = Math.floor(size / charW);
  const rows = Math.floor(size / charH);

  const A = time * 0.4;
  const B = time * 0.2;
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

  for (let theta = 0; theta < 6.2832; theta += 0.15) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let phi = 0; phi < 6.2832; phi += 0.05) {
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
      const xp = Math.floor(cols / 2 + K1 * ooz * x2);
      const yp = Math.floor(rows / 2 - K1 * ooz * y2 * 0.6);

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
      lumBuffer[idx] = Math.max(0, Math.round(((luminance + 1) / 2) * maxLum));
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
      ctx.fillText(ch, col * charW + charW / 2, row * charH + charH / 2);
    }
  }
}
