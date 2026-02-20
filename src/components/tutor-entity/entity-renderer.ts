// ============================================================================
// Volumetric 3D ASCII energy field renderer
//
// A gaseous, aura-like intelligence field:
// - Multiple 3D gaussian nodes orbiting asymmetrically in 3D
// - Three-axis rotation for diagonal tilt feel
// - sqrt normalization → diffuse center, no harsh focal point
// - Extended luminance ramp for smooth gradients
// - Procedural noise for flowing gaseous texture
// ============================================================================

import {
  LUMINANCE_CHARS,
  ENERGY_NODES,
  CHAR_ASPECT,
  type EntityStateParams,
  type EnergyNode,
} from './entity-constants';

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

/** Fast pseudo-noise seed */
function noise2d(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/** Smooth noise with hermite interpolation */
function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = noise2d(ix, iy);
  const b = noise2d(ix + 1, iy);
  const c = noise2d(ix, iy + 1);
  const d = noise2d(ix + 1, iy + 1);
  // Smootherstep for even gentler transitions
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

// ---------------------------------------------------------------------------
// 3D node positioning — three-axis rotation, perspective projection
// ---------------------------------------------------------------------------

interface ProjectedNode {
  px: number;
  py: number;
  z: number;
  sigma: number;
  intensity: number;
}

function projectNodes(
  nodes: readonly EnergyNode[],
  time: number,
  params: EntityStateParams,
  pulse: number,
): ProjectedNode[] {
  // Rotation A — around X axis
  const cosA = Math.cos(time * params.rotSpeedA);
  const sinA = Math.sin(time * params.rotSpeedA);
  // Rotation B — around Z axis
  const cosB = Math.cos(time * params.rotSpeedB);
  const sinB = Math.sin(time * params.rotSpeedB);
  // Rotation C — around Y axis (diagonal tilt)
  const cosC = Math.cos(time * params.rotSpeedC);
  const sinC = Math.sin(time * params.rotSpeedC);

  return nodes.map((node) => {
    const orbitAngle = time * node.orbitSpeed + node.phase;
    const orbitR = node.orbitRadius * (1 + pulse);

    // Position in local tilted orbit plane
    let x = Math.cos(orbitAngle) * orbitR;
    let y = Math.sin(orbitAngle) * orbitR * Math.cos(node.tilt);
    let z = Math.sin(orbitAngle) * orbitR * Math.sin(node.tilt);

    // Rotation around X axis
    const y1 = y * cosA - z * sinA;
    const z1 = y * sinA + z * cosA;

    // Rotation around Y axis (adds diagonal feel)
    const x2 = x * cosC + z1 * sinC;
    const z2 = -x * sinC + z1 * cosC;

    // Rotation around Z axis
    const x3 = x2 * cosB - y1 * sinB;
    const y3 = x2 * sinB + y1 * cosB;

    // Perspective — soft, distant camera for gentle foreshortening
    const camZ = 2.8;
    const perspScale = camZ / (camZ + z2);

    return {
      px: x3 * perspScale,
      py: y3 * perspScale,
      z: z2,
      sigma: node.sigma * perspScale * (1 + pulse * 0.3),
      intensity: node.intensity * (0.7 + 0.3 * perspScale),
    };
  });
}

// ---------------------------------------------------------------------------
// Main frame renderer
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

  const pulse = params.pulseAmp * Math.sin(time * params.pulseSpeed * Math.PI * 2);
  const projected = projectNodes(ENERGY_NODES, time, params, pulse);

  const grid = new Float32Array(cols * rows);
  const maxLum = LUMINANCE_CHARS.length - 1;

  // Slowly drifting noise offsets
  const noiseOffX = time * 0.2;
  const noiseOffY = time * 0.15;

  // Precompute aspect ratio
  const aspect = (cols * charW) / (rows * charH);

  for (let row = 0; row < rows; row++) {
    const ny = (row / (rows - 1)) * 2 - 1;

    for (let col = 0; col < cols; col++) {
      const nx = ((col / (cols - 1)) * 2 - 1) * aspect;

      // Sum gaussian contributions
      let density = 0;
      for (let n = 0; n < projected.length; n++) {
        const node = projected[n];
        const dx = nx - node.px;
        const dy = ny - node.py;
        const dist2 = dx * dx + dy * dy;
        const sig2 = node.sigma * node.sigma * 2;
        density += node.intensity * Math.exp(-dist2 / sig2);
      }

      // Gentle noise texture — modulates, never dominates
      const noiseVal = smoothNoise(
        col * 0.12 + noiseOffX,
        row * 0.12 + noiseOffY,
      );
      density *= 1 + (noiseVal - 0.5) * params.noiseIntensity;

      grid[row * cols + col] = density;
    }
  }

  // Find peak for normalization
  let peak = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > peak) peak = grid[i];
  }
  if (peak < 0.001) return;

  // Render chars
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const [cr, cg, cb] = params.color;
  const [ar, ag, ab] = params.accentColor;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const raw = grid[row * cols + col];

      // sqrt normalization — compresses peaks, lifts midtones
      // This diffuses the center instead of concentrating it
      const normalized = Math.sqrt(raw / peak);

      const lumIndex = Math.round(normalized * maxLum);
      if (lumIndex <= 0) continue;

      const ch = LUMINANCE_CHARS[lumIndex];

      // Smooth opacity curve — no sharp spikes
      const opacity = params.charOpacity * (0.4 + 0.6 * normalized);

      // Gentle color blend — cubic for very smooth ramp
      const blend = normalized * normalized * normalized;
      const r = Math.round(lerp(cr, ar, blend));
      const g = Math.round(lerp(cg, ag, blend));
      const b = Math.round(lerp(cb, ab, blend));

      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.fillText(ch, col * charW + charW / 2, row * charH + charH / 2);
    }
  }
}

// ---------------------------------------------------------------------------
// Mini renderer — simplified for 44x44 mobile button
// ---------------------------------------------------------------------------

export function renderMiniFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
  color: [number, number, number],
  opacity: number,
): void {
  ctx.clearRect(0, 0, size, size);

  const fontSize = 7;
  const charW = fontSize * CHAR_ASPECT;
  const charH = fontSize;
  const cols = Math.floor(size / charW);
  const rows = Math.floor(size / charH);

  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxLum = LUMINANCE_CHARS.length - 1;
  const pulse = 0.04 * Math.sin(time * 0.10 * Math.PI * 2);
  const sigma = 0.45 + pulse;
  const sig2 = sigma * sigma * 2;

  for (let row = 0; row < rows; row++) {
    const ny = (row / (rows - 1)) * 2 - 1;
    for (let col = 0; col < cols; col++) {
      const nx = (col / (cols - 1)) * 2 - 1;
      const dist2 = nx * nx + ny * ny;
      const density = Math.exp(-dist2 / sig2);
      const normalized = Math.sqrt(density);

      const lumIndex = Math.round(normalized * maxLum);
      if (lumIndex <= 0) continue;

      const ch = LUMINANCE_CHARS[lumIndex];
      const a = opacity * (0.4 + 0.6 * normalized);

      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${a})`;
      ctx.fillText(ch, col * charW + charW / 2, row * charH + charH / 2);
    }
  }
}
