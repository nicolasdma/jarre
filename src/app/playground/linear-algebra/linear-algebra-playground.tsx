'use client';

import { useState, useMemo, useCallback } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Matrix2x2 = [[number, number], [number, number]];

interface Preset {
  label: string;
  matrix: Matrix2x2;
}

// ---------------------------------------------------------------------------
// Math utilities (no external libs)
// ---------------------------------------------------------------------------

function matMul(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

function transformPoint(m: Matrix2x2, p: [number, number]): [number, number] {
  return [
    m[0][0] * p[0] + m[0][1] * p[1],
    m[1][0] * p[0] + m[1][1] * p[1],
  ];
}

function determinant(m: Matrix2x2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function trace(m: Matrix2x2): number {
  return m[0][0] + m[1][1];
}

/** Eigenvalues of 2x2 matrix via quadratic formula */
function eigenvalues(m: Matrix2x2): { real: [number, number]; imag: [number, number] } {
  const t = trace(m);
  const d = determinant(m);
  const disc = t * t - 4 * d;

  if (disc >= 0) {
    const sqrtDisc = Math.sqrt(disc);
    return {
      real: [(t + sqrtDisc) / 2, (t - sqrtDisc) / 2],
      imag: [0, 0],
    };
  } else {
    const sqrtDisc = Math.sqrt(-disc);
    return {
      real: [t / 2, t / 2],
      imag: [sqrtDisc / 2, -sqrtDisc / 2],
    };
  }
}

/** Eigenvectors for real eigenvalues */
function eigenvectors(m: Matrix2x2): [number, number][] {
  const eigs = eigenvalues(m);
  if (eigs.imag[0] !== 0) return [];

  const vectors: [number, number][] = [];
  for (const lambda of eigs.real) {
    const a = m[0][0] - lambda;
    const b = m[0][1];

    if (Math.abs(a) > 1e-10 || Math.abs(b) > 1e-10) {
      if (Math.abs(b) > 1e-10) {
        const len = Math.sqrt(a * a + b * b);
        vectors.push([-b / len, a / len]);
      } else {
        vectors.push([0, 1]);
      }
    } else {
      vectors.push([1, 0]);
    }
  }
  return vectors;
}

/** Singular values of 2x2 matrix */
function singularValues(m: Matrix2x2): [number, number] {
  const ata: Matrix2x2 = [
    [m[0][0] * m[0][0] + m[1][0] * m[1][0], m[0][0] * m[0][1] + m[1][0] * m[1][1]],
    [m[0][1] * m[0][0] + m[1][1] * m[1][0], m[0][1] * m[0][1] + m[1][1] * m[1][1]],
  ];
  const eigs = eigenvalues(ata);
  const s1 = Math.sqrt(Math.max(0, eigs.real[0]));
  const s2 = Math.sqrt(Math.max(0, eigs.real[1]));
  return s1 >= s2 ? [s1, s2] : [s2, s1];
}

/** Simple 2x2 SVD: A = U * Sigma * V^T */
function svd2x2(m: Matrix2x2): { U: Matrix2x2; S: [number, number]; Vt: Matrix2x2 } {
  // Compute A^T A
  const ata: Matrix2x2 = [
    [m[0][0] * m[0][0] + m[1][0] * m[1][0], m[0][0] * m[0][1] + m[1][0] * m[1][1]],
    [m[0][1] * m[0][0] + m[1][1] * m[1][0], m[0][1] * m[0][1] + m[1][1] * m[1][1]],
  ];

  // Eigendecomposition of A^T A for V
  const eigVals = eigenvalues(ata);
  const s1 = Math.sqrt(Math.max(0, eigVals.real[0]));
  const s2 = Math.sqrt(Math.max(0, eigVals.real[1]));

  // Eigenvectors of A^T A
  const vecs = eigenvectors(ata);
  let Vt: Matrix2x2;

  if (vecs.length >= 2) {
    Vt = [vecs[0], vecs[1]];
  } else {
    Vt = [[1, 0], [0, 1]];
  }

  // U columns: u_i = (1/sigma_i) * A * v_i
  let U: Matrix2x2;
  if (s1 > 1e-10) {
    const u0 = transformPoint(m, Vt[0]);
    const u0n: [number, number] = [u0[0] / s1, u0[1] / s1];

    if (s2 > 1e-10) {
      const u1 = transformPoint(m, Vt[1]);
      const u1n: [number, number] = [u1[0] / s2, u1[1] / s2];
      U = [u0n, u1n];
    } else {
      U = [u0n, [-u0n[1], u0n[0]]];
    }
  } else {
    U = [[1, 0], [0, 1]];
  }

  return {
    U: [
      [U[0][0], U[1][0]],
      [U[0][1], U[1][1]],
    ],
    S: [s1, s2],
    Vt,
  };
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const PRESETS: Record<string, Preset> = {
  identity: { label: 'Identidad', matrix: [[1, 0], [0, 1]] },
  rotation: { label: 'Rotación 45°', matrix: [[0.707, -0.707], [0.707, 0.707]] },
  scale: { label: 'Escala (2x, 0.5y)', matrix: [[2, 0], [0, 0.5]] },
  shear: { label: 'Shear', matrix: [[1, 0.5], [0, 1]] },
  reflection: { label: 'Reflexión', matrix: [[1, 0], [0, -1]] },
  projection: { label: 'Proyección', matrix: [[1, 0], [0, 0]] },
};

// ---------------------------------------------------------------------------
// SVG Constants
// ---------------------------------------------------------------------------

const SVG_SIZE = 500;
const GRID_RANGE = 4;
const SCALE = SVG_SIZE / (2 * GRID_RANGE);
const CENTER = SVG_SIZE / 2;

function toSVG(x: number, y: number): [number, number] {
  return [CENTER + x * SCALE, CENTER - y * SCALE];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LinearAlgebraPlayground() {
  const [matrix, setMatrix] = useState<Matrix2x2>([[1, 0], [0, 1]]);

  const updateCell = (row: number, col: number, val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    setMatrix((prev) => {
      const next: Matrix2x2 = [[...prev[0]], [...prev[1]]] as Matrix2x2;
      next[row][col] = num;
      return next;
    });
  };

  const applyPreset = useCallback((presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) setMatrix(preset.matrix);
  }, []);

  const handleReset = useCallback(() => {
    setMatrix([[1, 0], [0, 1]]);
  }, []);

  // Computed values
  const det = useMemo(() => determinant(matrix), [matrix]);
  const eigs = useMemo(() => eigenvalues(matrix), [matrix]);
  const eigVecs = useMemo(() => eigenvectors(matrix), [matrix]);
  const svals = useMemo(() => singularValues(matrix), [matrix]);
  const svdResult = useMemo(() => svd2x2(matrix), [matrix]);

  // Unit square corners: (0,0), (1,0), (1,1), (0,1)
  const unitSquare: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const transformedSquare = useMemo(
    () => unitSquare.map((p) => transformPoint(matrix, p)),
    [matrix],
  );

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
      // Horizontal
      const [hx1, hy1] = toSVG(-GRID_RANGE, i);
      const [hx2, hy2] = toSVG(GRID_RANGE, i);
      lines.push({ x1: hx1, y1: hy1, x2: hx2, y2: hy2 });
      // Vertical
      const [vx1, vy1] = toSVG(i, -GRID_RANGE);
      const [vx2, vy2] = toSVG(i, GRID_RANGE);
      lines.push({ x1: vx1, y1: vy1, x2: vx2, y2: vy2 });
    }
    return lines;
  }, []);

  // Transformed grid lines
  const transformedGridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
      // Horizontal: transform endpoints
      const h1 = transformPoint(matrix, [-GRID_RANGE, i]);
      const h2 = transformPoint(matrix, [GRID_RANGE, i]);
      const [hx1, hy1] = toSVG(h1[0], h1[1]);
      const [hx2, hy2] = toSVG(h2[0], h2[1]);
      lines.push({ x1: hx1, y1: hy1, x2: hx2, y2: hy2 });
      // Vertical
      const v1 = transformPoint(matrix, [i, -GRID_RANGE]);
      const v2 = transformPoint(matrix, [i, GRID_RANGE]);
      const [vx1, vy1] = toSVG(v1[0], v1[1]);
      const [vx2, vy2] = toSVG(v2[0], v2[1]);
      lines.push({ x1: vx1, y1: vy1, x2: vx2, y2: vy2 });
    }
    return lines;
  }, [matrix]);

  const squarePath = useMemo(() => {
    const pts = transformedSquare.map((p) => toSVG(p[0], p[1]));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';
  }, [transformedSquare]);

  const formatNum = (n: number) => {
    const rounded = Math.round(n * 1000) / 1000;
    return rounded.toString();
  };

  const formatMatrix = (m: Matrix2x2) =>
    `[${formatNum(m[0][0])}, ${formatNum(m[0][1])}; ${formatNum(m[1][0])}, ${formatNum(m[1][1])}]`;

  return (
    <PlaygroundLayout
      accentColor="#1e40af"
      disableTutor
      lessons={
        <LessonGuide
          onApplyPreset={applyPreset}
          onReset={handleReset}
        />
      }
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Matrix input + presets */}
          <div className="flex gap-6 flex-wrap">
            {/* Matrix input */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Matriz 2x2
              </p>
              <div className="inline-grid grid-cols-2 gap-2">
                {[0, 1].map((row) =>
                  [0, 1].map((col) => (
                    <input
                      key={`${row}-${col}`}
                      type="number"
                      step="0.1"
                      value={matrix[row][col]}
                      onChange={(e) => updateCell(row, col, e.target.value)}
                      className="w-20 py-2 px-3 border border-j-border bg-white/50 font-mono text-sm text-j-text text-center focus:outline-none focus:border-[#1e40af] transition-colors"
                    />
                  )),
                )}
              </div>
            </div>

            {/* Presets */}
            <div className="flex-1 min-w-[200px]">
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Presets
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className="px-3 py-1.5 border border-j-border font-mono text-[10px] tracking-wider text-j-text-secondary hover:border-[#1e40af] hover:text-[#1e40af] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Visualization */}
          <div className="border border-j-border bg-white/30">
            <svg
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              className="w-full"
              style={{ maxHeight: '500px' }}
            >
              {/* Original grid (faint) */}
              {gridLines.map((l, i) => (
                <line

                  key={`og-${i}`}
                  x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="#e5e5e5"
                  strokeWidth={0.5}
                />
              ))}

              {/* Transformed grid */}
              {transformedGridLines.map((l, i) => (
                <line

                  key={`tg-${i}`}
                  x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="#93c5fd"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
              ))}

              {/* Axes */}
              <line
                x1={0} y1={CENTER} x2={SVG_SIZE} y2={CENTER}
                stroke="#999" strokeWidth={1}
              />
              <line
                x1={CENTER} y1={0} x2={CENTER} y2={SVG_SIZE}
                stroke="#999" strokeWidth={1}
              />

              {/* Original unit square (faint) */}
              <path
                d={`M${toSVG(0, 0).join(',')} L${toSVG(1, 0).join(',')} L${toSVG(1, 1).join(',')} L${toSVG(0, 1).join(',')} Z`}
                fill="#dbeafe"
                fillOpacity={0.3}
                stroke="#93c5fd"
                strokeWidth={1}
                strokeDasharray="4,4"
              />

              {/* Transformed unit square */}
              <path
                d={squarePath}
                fill="#1e40af"
                fillOpacity={0.15}
                stroke="#1e40af"
                strokeWidth={2}
              />

              {/* Eigenvectors (if real) */}
              {eigVecs.map((vec, i) => {
                const scaledLen = 2.5;
                const [x1, y1] = toSVG(-vec[0] * scaledLen, -vec[1] * scaledLen);
                const [x2, y2] = toSVG(vec[0] * scaledLen, vec[1] * scaledLen);
                const color = i === 0 ? '#dc2626' : '#16a34a';
                return (

                  <g key={`eig-${i}`}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="6,3"
                      opacity={0.8}
                    />
                    {/* Arrow head */}
                    <circle
                      cx={x2} cy={y2} r={4}
                      fill={color}
                      opacity={0.8}
                    />
                    <text
                      x={x2 + 8}
                      y={y2 - 8}
                      className="font-mono"
                      fontSize={10}
                      fill={color}
                    >
                      {`λ${i + 1}=${formatNum(eigs.real[i])}`}
                    </text>
                  </g>
                );
              })}

              {/* Basis vectors after transform */}
              {(() => {
                const e1 = transformPoint(matrix, [1, 0]);
                const e2 = transformPoint(matrix, [0, 1]);
                const [e1x, e1y] = toSVG(e1[0], e1[1]);
                const [e2x, e2y] = toSVG(e2[0], e2[1]);
                const [ox, oy] = toSVG(0, 0);
                return (
                  <>
                    <line x1={ox} y1={oy} x2={e1x} y2={e1y} stroke="#1e40af" strokeWidth={2.5} markerEnd="url(#arrowBlue)" />
                    <line x1={ox} y1={oy} x2={e2x} y2={e2y} stroke="#7c3aed" strokeWidth={2.5} markerEnd="url(#arrowPurple)" />
                  </>
                );
              })()}

              {/* Arrow markers */}
              <defs>
                <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#1e40af" />
                </marker>
                <marker id="arrowPurple" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#7c3aed" />
                </marker>
              </defs>

              {/* Origin dot */}
              <circle cx={CENTER} cy={CENTER} r={3} fill="#333" />
            </svg>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Determinante</p>
              <p className={`font-mono text-lg ${Math.abs(det) < 0.001 ? 'text-red-600' : det < 0 ? 'text-amber-600' : 'text-j-text'}`}>
                {formatNum(det)}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                {Math.abs(det) < 0.001 ? 'Singular (colapso)' : det < 0 ? 'Orientacion invertida' : `Area × ${formatNum(Math.abs(det))}`}
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Eigenvalores</p>
              {eigs.imag[0] === 0 ? (
                <p className="font-mono text-lg text-j-text">
                  {formatNum(eigs.real[0])}, {formatNum(eigs.real[1])}
                </p>
              ) : (
                <p className="font-mono text-sm text-amber-600">
                  {formatNum(eigs.real[0])} ± {formatNum(Math.abs(eigs.imag[0]))}i
                </p>
              )}
              <p className="text-[10px] text-j-text-tertiary mt-1">
                {eigs.imag[0] !== 0 ? 'Complejos (rotacion)' : 'Reales'}
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Valores singulares</p>
              <p className="font-mono text-lg text-j-text">
                {formatNum(svals[0])}, {formatNum(svals[1])}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                Estiramiento max/min
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Condición</p>
              <p className="font-mono text-lg text-j-text">
                {svals[1] > 1e-10 ? formatNum(svals[0] / svals[1]) : '∞'}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                σ₁/σ₂ (estabilidad numérica)
              </p>
            </div>
          </div>

          {/* SVD Decomposition */}
          <div className="border border-j-border p-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              Descomposición SVD: A = U · Σ · V<sup>T</sup>
            </p>
            <div className="flex items-center gap-3 flex-wrap font-mono text-sm">
              <div className="p-2 border border-[#7c3aed]/30 bg-[#7c3aed]/5">
                <p className="text-[10px] text-[#7c3aed] mb-1">U (rotación)</p>
                <p className="text-j-text">{formatMatrix(svdResult.U)}</p>
              </div>
              <span className="text-j-text-tertiary">·</span>
              <div className="p-2 border border-[#dc2626]/30 bg-[#dc2626]/5">
                <p className="text-[10px] text-[#dc2626] mb-1">Σ (escala)</p>
                <p className="text-j-text">[{formatNum(svdResult.S[0])}, 0; 0, {formatNum(svdResult.S[1])}]</p>
              </div>
              <span className="text-j-text-tertiary">·</span>
              <div className="p-2 border border-[#16a34a]/30 bg-[#16a34a]/5">
                <p className="text-[10px] text-[#16a34a] mb-1">V<sup>T</sup> (rotación)</p>
                <p className="text-j-text">{formatMatrix(svdResult.Vt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlaygroundLayout>
  );
}
