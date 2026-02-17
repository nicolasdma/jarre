'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SurfaceType = 'bowl' | 'rosenbrock' | 'saddle' | 'rastrigin';
type OptimizerType = 'sgd' | 'momentum' | 'adam';

interface Point {
  x: number;
  y: number;
}

interface OptimizerState {
  type: OptimizerType;
  position: Point;
  trail: Point[];
  // Momentum state
  velocity: Point;
  // Adam state
  m: Point;
  v: Point;
  t: number;
  color: string;
  label: string;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Loss surfaces & gradients
// ---------------------------------------------------------------------------

const SURFACES: Record<SurfaceType, {
  label: string;
  fn: (x: number, y: number) => number;
  grad: (x: number, y: number) => Point;
  range: { x: [number, number]; y: [number, number] };
  defaultStart: Point;
}> = {
  bowl: {
    label: 'Bowl (Convexo)',
    fn: (x, y) => x * x + y * y,
    grad: (x, y) => ({ x: 2 * x, y: 2 * y }),
    range: { x: [-3, 3], y: [-3, 3] },
    defaultStart: { x: 2.5, y: 2.5 },
  },
  rosenbrock: {
    label: 'Rosenbrock (Valley)',
    fn: (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2,
    grad: (x, y) => ({
      x: -2 * (1 - x) - 400 * x * (y - x * x),
      y: 200 * (y - x * x),
    }),
    range: { x: [-2, 2], y: [-1, 3] },
    defaultStart: { x: -1.5, y: 2 },
  },
  saddle: {
    label: 'Saddle Point',
    fn: (x, y) => x * x - y * y,
    grad: (x, y) => ({ x: 2 * x, y: -2 * y }),
    range: { x: [-3, 3], y: [-3, 3] },
    defaultStart: { x: 0.1, y: 2.5 },
  },
  rastrigin: {
    label: 'Rastrigin (Multi-mínima)',
    fn: (x, y) =>
      20 + x * x + y * y - 10 * (Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)),
    grad: (x, y) => ({
      x: 2 * x + 10 * 2 * Math.PI * Math.sin(2 * Math.PI * x),
      y: 2 * y + 10 * 2 * Math.PI * Math.sin(2 * Math.PI * y),
    }),
    range: { x: [-3, 3], y: [-3, 3] },
    defaultStart: { x: 2.5, y: 2.0 },
  },
};

// ---------------------------------------------------------------------------
// SVG Constants
// ---------------------------------------------------------------------------

const SVG_SIZE = 500;
const CONTOUR_RES = 60;

// ---------------------------------------------------------------------------
// Optimizer step functions
// ---------------------------------------------------------------------------

function stepSGD(state: OptimizerState, grad: Point, lr: number): OptimizerState {
  const newPos = {
    x: state.position.x - lr * grad.x,
    y: state.position.y - lr * grad.y,
  };
  return {
    ...state,
    position: newPos,
    trail: [...state.trail, newPos],
  };
}

function stepMomentum(state: OptimizerState, grad: Point, lr: number, beta = 0.9): OptimizerState {
  const newVel = {
    x: beta * state.velocity.x + grad.x,
    y: beta * state.velocity.y + grad.y,
  };
  const newPos = {
    x: state.position.x - lr * newVel.x,
    y: state.position.y - lr * newVel.y,
  };
  return {
    ...state,
    position: newPos,
    velocity: newVel,
    trail: [...state.trail, newPos],
  };
}

function stepAdam(state: OptimizerState, grad: Point, lr: number, beta1 = 0.9, beta2 = 0.999, eps = 1e-8): OptimizerState {
  const t = state.t + 1;
  const newM = {
    x: beta1 * state.m.x + (1 - beta1) * grad.x,
    y: beta1 * state.m.y + (1 - beta1) * grad.y,
  };
  const newV = {
    x: beta2 * state.v.x + (1 - beta2) * grad.x * grad.x,
    y: beta2 * state.v.y + (1 - beta2) * grad.y * grad.y,
  };
  const mHat = { x: newM.x / (1 - beta1 ** t), y: newM.y / (1 - beta1 ** t) };
  const vHat = { x: newV.x / (1 - beta2 ** t), y: newV.y / (1 - beta2 ** t) };
  const newPos = {
    x: state.position.x - lr * mHat.x / (Math.sqrt(vHat.x) + eps),
    y: state.position.y - lr * mHat.y / (Math.sqrt(vHat.y) + eps),
  };
  return {
    ...state,
    position: newPos,
    m: newM,
    v: newV,
    t,
    trail: [...state.trail, newPos],
  };
}

function createOptimizer(type: OptimizerType, start: Point): OptimizerState {
  const configs: Record<OptimizerType, { color: string; label: string }> = {
    sgd: { color: '#dc2626', label: 'SGD' },
    momentum: { color: '#2563eb', label: 'Momentum' },
    adam: { color: '#16a34a', label: 'Adam' },
  };
  return {
    type,
    position: { ...start },
    trail: [{ ...start }],
    velocity: { x: 0, y: 0 },
    m: { x: 0, y: 0 },
    v: { x: 0, y: 0 },
    t: 0,
    ...configs[type],
    active: true,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GradientDescentPlayground() {
  const [surface, setSurface] = useState<SurfaceType>('bowl');
  const [optimizer, setOptimizer] = useState<OptimizerType>('sgd');
  const [learningRate, setLearningRate] = useState(0.05);
  const [optimizers, setOptimizers] = useState<OptimizerState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const animRef = useRef<number | null>(null);
  const stepsRef = useRef(0);

  const surfaceConfig = SURFACES[surface];

  // Generate contour data
  const contourData = useMemo(() => {
    const { range, fn } = SURFACES[surface];
    const data: number[][] = [];
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let j = 0; j < CONTOUR_RES; j++) {
      const row: number[] = [];
      for (let i = 0; i < CONTOUR_RES; i++) {
        const x = range.x[0] + (i / (CONTOUR_RES - 1)) * (range.x[1] - range.x[0]);
        const y = range.y[1] - (j / (CONTOUR_RES - 1)) * (range.y[1] - range.y[0]);
        const val = fn(x, y);
        row.push(val);
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
      data.push(row);
    }
    return { data, minVal, maxVal };
  }, [surface]);

  // Contour color
  const getColor = useCallback((val: number, minVal: number, maxVal: number) => {
    const range = maxVal - minVal;
    if (range === 0) return 'rgb(255, 255, 255)';
    // Use log scale for better visualization
    const logMin = Math.log1p(minVal - minVal);
    const logMax = Math.log1p(maxVal - minVal);
    const logVal = Math.log1p(val - minVal);
    const t = logMax > logMin ? (logVal - logMin) / (logMax - logMin) : 0;
    // Dark blue to yellow-white
    const r = Math.round(255 * t);
    const g = Math.round(255 * t * 0.9);
    const b = Math.round(255 * (1 - t * 0.7));
    return `rgb(${r}, ${g}, ${b})`;
  }, []);

  // Convert surface coordinates to SVG
  const toSVG = useCallback((p: Point) => {
    const { range } = SURFACES[surface];
    const sx = ((p.x - range.x[0]) / (range.x[1] - range.x[0])) * SVG_SIZE;
    const sy = ((range.y[1] - p.y) / (range.y[1] - range.y[0])) * SVG_SIZE;
    return { x: sx, y: sy };
  }, [surface]);

  // Convert SVG click to surface coordinates
  const fromSVG = useCallback((sx: number, sy: number): Point => {
    const { range } = SURFACES[surface];
    return {
      x: range.x[0] + (sx / SVG_SIZE) * (range.x[1] - range.x[0]),
      y: range.y[1] - (sy / SVG_SIZE) * (range.y[1] - range.y[0]),
    };
  }, [surface]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Start optimization
  const startOptimization = useCallback((startPoint: Point, compareAll = false) => {
    stopAnimation();

    const opts: OptimizerState[] = compareAll
      ? (['sgd', 'momentum', 'adam'] as OptimizerType[]).map((t) => createOptimizer(t, startPoint))
      : [createOptimizer(optimizer, startPoint)];

    setOptimizers(opts);
    setCompareMode(compareAll);
    stepsRef.current = 0;
    setStepCount(0);
    setIsRunning(true);

    const surf = SURFACES[surface];
    const lr = learningRate;
    const MAX_STEPS = 500;

    let currentOpts = opts;

    const animate = () => {
      if (stepsRef.current >= MAX_STEPS) {
        setIsRunning(false);
        return;
      }

      stepsRef.current += 1;
      setStepCount(stepsRef.current);

      currentOpts = currentOpts.map((opt) => {
        if (!opt.active) return opt;

        const grad = surf.grad(opt.position.x, opt.position.y);

        // Clip gradient to prevent explosion
        const gradNorm = Math.sqrt(grad.x * grad.x + grad.y * grad.y);
        if (gradNorm > 100) {
          grad.x = (grad.x / gradNorm) * 100;
          grad.y = (grad.y / gradNorm) * 100;
        }

        let updated: OptimizerState;
        switch (opt.type) {
          case 'sgd':
            updated = stepSGD(opt, grad, lr);
            break;
          case 'momentum':
            updated = stepMomentum(opt, grad, lr);
            break;
          case 'adam':
            updated = stepAdam(opt, grad, lr);
            break;
        }

        // Check bounds
        const { range } = surf;
        if (
          updated.position.x < range.x[0] - 1 || updated.position.x > range.x[1] + 1 ||
          updated.position.y < range.y[0] - 1 || updated.position.y > range.y[1] + 1 ||
          !isFinite(updated.position.x) || !isFinite(updated.position.y)
        ) {
          return { ...opt, active: false };
        }

        // Check convergence
        if (gradNorm < 1e-6) {
          return { ...updated, active: false };
        }

        return updated;
      });

      setOptimizers([...currentOpts]);

      if (currentOpts.some((o) => o.active)) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
      }
    };

    // Slow down animation with interval
    let frameCount = 0;
    const throttledAnimate = () => {
      frameCount++;
      if (frameCount % 3 === 0) {
        animate();
      } else if (stepsRef.current < MAX_STEPS && currentOpts.some((o) => o.active)) {
        animRef.current = requestAnimationFrame(throttledAnimate);
      }
    };

    animRef.current = requestAnimationFrame(throttledAnimate);
  }, [surface, optimizer, learningRate, stopAnimation]);

  // Handle SVG click
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
    const sy = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
    const point = fromSVG(sx, sy);
    startOptimization(point, compareMode);
  }, [fromSVG, startOptimization, compareMode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Lesson guide callbacks
  const handleSetSurface = useCallback((s: string) => {
    stopAnimation();
    setSurface(s as SurfaceType);
    setOptimizers([]);
    setStepCount(0);
  }, [stopAnimation]);

  const handleSetOptimizer = useCallback((o: string) => {
    setOptimizer(o as OptimizerType);
    setCompareMode(false);
  }, []);

  const handleSetLearningRate = useCallback((lr: number) => {
    setLearningRate(lr);
  }, []);

  const handleRunAll = useCallback(() => {
    setCompareMode(true);
    const start = SURFACES[surface].defaultStart;
    startOptimization(start, true);
  }, [surface, startOptimization]);

  const handleReset = useCallback(() => {
    stopAnimation();
    setOptimizers([]);
    setStepCount(0);
  }, [stopAnimation]);

  // Cell size for contour grid
  const cellSize = SVG_SIZE / CONTOUR_RES;

  const surfaceOptions: { id: SurfaceType; label: string }[] = [
    { id: 'bowl', label: 'Bowl (Convexo)' },
    { id: 'rosenbrock', label: 'Rosenbrock' },
    { id: 'saddle', label: 'Saddle Point' },
    { id: 'rastrigin', label: 'Rastrigin' },
  ];

  const optimizerOptions: { id: OptimizerType; label: string; color: string }[] = [
    { id: 'sgd', label: 'SGD', color: '#dc2626' },
    { id: 'momentum', label: 'Momentum', color: '#2563eb' },
    { id: 'adam', label: 'Adam', color: '#16a34a' },
  ];

  return (
    <PlaygroundLayout
      accentColor="#b45309"
      disableTutor
      lessons={
        <LessonGuide
          onSetSurface={handleSetSurface}
          onSetOptimizer={handleSetOptimizer}
          onSetLearningRate={handleSetLearningRate}
          onRunAll={handleRunAll}
          onReset={handleReset}
        />
      }
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Controls row */}
          <div className="flex gap-6 flex-wrap">
            {/* Surface selector */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Superficie
              </p>
              <div className="flex flex-wrap gap-2">
                {surfaceOptions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSetSurface(s.id)}
                    className={`px-3 py-1.5 border font-mono text-[10px] tracking-wider transition-colors ${
                      surface === s.id
                        ? 'border-[#b45309] bg-[#b45309]/10 text-[#b45309]'
                        : 'border-j-border text-j-text-secondary hover:border-[#b45309]/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optimizer selector */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Optimizador
              </p>
              <div className="flex gap-2">
                {optimizerOptions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { handleSetOptimizer(o.id); }}
                    className={`px-3 py-1.5 border font-mono text-[10px] tracking-wider transition-colors ${
                      optimizer === o.id && !compareMode
                        ? `border-current text-[${o.color}]`
                        : 'border-j-border text-j-text-secondary hover:border-j-text/30'
                    }`}
                    style={optimizer === o.id && !compareMode ? { borderColor: o.color, color: o.color } : undefined}
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  onClick={handleRunAll}
                  className={`px-3 py-1.5 border font-mono text-[10px] tracking-wider transition-colors ${
                    compareMode
                      ? 'border-[#b45309] bg-[#b45309]/10 text-[#b45309]'
                      : 'border-j-border text-j-text-secondary hover:border-[#b45309]/50'
                  }`}
                >
                  Comparar todos
                </button>
              </div>
            </div>
          </div>

          {/* Learning rate slider */}
          <div>
            <div className="flex items-center gap-4">
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                Learning Rate
              </p>
              <span className="font-mono text-sm text-[#b45309]">{learningRate.toFixed(4)}</span>
            </div>
            <input
              type="range"
              min={0.0001}
              max={0.5}
              step={0.0001}
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              className="w-full mt-2 accent-[#b45309]"
            />
            <div className="flex justify-between font-mono text-[9px] text-j-text-tertiary">
              <span>0.0001</span>
              <span>0.5</span>
            </div>
          </div>

          {/* Contour plot */}
          <div className="border border-j-border bg-white/30 relative">
            <p className="absolute top-2 left-3 font-mono text-[10px] text-j-text-tertiary z-10">
              Click para elegir punto inicial
            </p>
            <svg
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              className="w-full cursor-crosshair"
              style={{ maxHeight: '500px' }}
              onClick={handleSvgClick}
            >
              {/* Contour heatmap */}
              {contourData.data.map((row, j) =>
                row.map((val, i) => (
                  <rect
                    key={`${j}-${i}`}
                    x={i * cellSize}
                    y={j * cellSize}
                    width={cellSize + 0.5}
                    height={cellSize + 0.5}
                    fill={getColor(val, contourData.minVal, contourData.maxVal)}
                  />
                )),
              )}

              {/* Contour lines */}
              {(() => {
                const { data, minVal, maxVal } = contourData;
                const numContours = 15;
                const lines: React.ReactNode[] = [];

                for (let c = 1; c <= numContours; c++) {
                  const threshold = minVal + (c / (numContours + 1)) * (maxVal - minVal);

                  for (let j = 0; j < CONTOUR_RES - 1; j++) {
                    for (let i = 0; i < CONTOUR_RES - 1; i++) {
                      const tl = data[j][i];
                      const tr = data[j][i + 1];
                      const bl = data[j + 1][i];
                      const br = data[j + 1][i + 1];

                      // Simple marching squares for horizontal/vertical segments
                      const x0 = i * cellSize;
                      const y0 = j * cellSize;
                      const x1 = (i + 1) * cellSize;
                      const y1 = (j + 1) * cellSize;

                      // Check edges for crossings
                      const crossings: { x: number; y: number }[] = [];

                      // Top edge
                      if ((tl - threshold) * (tr - threshold) < 0) {
                        const t = (threshold - tl) / (tr - tl);
                        crossings.push({ x: x0 + t * (x1 - x0), y: y0 });
                      }
                      // Bottom edge
                      if ((bl - threshold) * (br - threshold) < 0) {
                        const t = (threshold - bl) / (br - bl);
                        crossings.push({ x: x0 + t * (x1 - x0), y: y1 });
                      }
                      // Left edge
                      if ((tl - threshold) * (bl - threshold) < 0) {
                        const t = (threshold - tl) / (bl - tl);
                        crossings.push({ x: x0, y: y0 + t * (y1 - y0) });
                      }
                      // Right edge
                      if ((tr - threshold) * (br - threshold) < 0) {
                        const t = (threshold - tr) / (br - tr);
                        crossings.push({ x: x1, y: y0 + t * (y1 - y0) });
                      }

                      if (crossings.length >= 2) {
                        lines.push(
                          <line
                            key={`c-${c}-${j}-${i}`}
                            x1={crossings[0].x}
                            y1={crossings[0].y}
                            x2={crossings[1].x}
                            y2={crossings[1].y}
                            stroke="rgba(0,0,0,0.15)"
                            strokeWidth={0.5}
                          />,
                        );
                      }
                    }
                  }
                }
                return lines;
              })()}

              {/* Optimizer trails & positions */}
              {optimizers.map((opt, oi) => (
                <g key={oi}>
                  {/* Trail */}
                  {opt.trail.length > 1 && (
                    <polyline
                      points={opt.trail.map((p) => {
                        const sp = toSVG(p);
                        return `${sp.x},${sp.y}`;
                      }).join(' ')}
                      fill="none"
                      stroke={opt.color}
                      strokeWidth={2}
                      strokeOpacity={0.7}
                    />
                  )}

                  {/* Trail dots */}
                  {opt.trail.map((p, pi) => {
                    if (pi % 5 !== 0 && pi !== opt.trail.length - 1) return null;
                    const sp = toSVG(p);
                    return (
                      <circle
                        key={pi}
                        cx={sp.x}
                        cy={sp.y}
                        r={pi === opt.trail.length - 1 ? 5 : 2}
                        fill={opt.color}
                        opacity={pi === opt.trail.length - 1 ? 1 : 0.5}
                      />
                    );
                  })}

                  {/* Gradient arrow at current position */}
                  {opt.active && (() => {
                    const grad = surfaceConfig.grad(opt.position.x, opt.position.y);
                    const gradNorm = Math.sqrt(grad.x * grad.x + grad.y * grad.y);
                    if (gradNorm < 1e-8) return null;
                    const scale = Math.min(0.5, 20 / gradNorm);
                    const end = {
                      x: opt.position.x - grad.x * scale,
                      y: opt.position.y - grad.y * scale,
                    };
                    const sp = toSVG(opt.position);
                    const ep = toSVG(end);
                    return (
                      <line
                        x1={sp.x} y1={sp.y}
                        x2={ep.x} y2={ep.y}
                        stroke={opt.color}
                        strokeWidth={2}
                        strokeDasharray="4,2"
                        opacity={0.6}
                      />
                    );
                  })()}

                  {/* Label */}
                  {(() => {
                    const last = opt.trail[opt.trail.length - 1];
                    const sp = toSVG(last);
                    return (
                      <text
                        x={sp.x + 8}
                        y={sp.y - 8}
                        className="font-mono"
                        fontSize={10}
                        fill={opt.color}
                        fontWeight="bold"
                      >
                        {opt.label}
                      </text>
                    );
                  })()}
                </g>
              ))}
            </svg>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Pasos</p>
              <p className="font-mono text-lg text-j-text">{stepCount}</p>
            </div>

            {optimizers.map((opt) => {
              const loss = surfaceConfig.fn(opt.position.x, opt.position.y);
              return (
                <div key={opt.type} className="p-3 border bg-white/50" style={{ borderColor: opt.color + '40' }}>
                  <p className="font-mono text-[10px] uppercase mb-1" style={{ color: opt.color }}>
                    {opt.label} Loss
                  </p>
                  <p className="font-mono text-lg text-j-text">
                    {isFinite(loss) ? loss.toFixed(4) : 'NaN'}
                  </p>
                  <p className="text-[10px] text-j-text-tertiary">
                    ({opt.position.x.toFixed(2)}, {opt.position.y.toFixed(2)})
                    {!opt.active && ' - detenido'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                const start = surfaceConfig.defaultStart;
                startOptimization(start, compareMode);
              }}
              disabled={isRunning}
              className="flex-1 py-3 bg-[#b45309] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#92400e] transition-colors disabled:opacity-50"
            >
              {isRunning ? 'Ejecutando...' : compareMode ? 'Comparar desde punto default' : 'Iniciar desde punto default'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-j-border font-mono text-[11px] tracking-wider uppercase text-j-text-tertiary hover:text-j-text transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </PlaygroundLayout>
  );
}
