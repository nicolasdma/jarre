'use client';

import { useState, useMemo, useCallback } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Math utilities for Gaussian distribution
// ---------------------------------------------------------------------------

/** Gaussian PDF at point x with mean mu and variance sigma2 */
function gaussPdf(x: number, mu: number, sigma2: number): number {
  return Math.exp(-0.5 * (x - mu) ** 2 / sigma2) / Math.sqrt(2 * Math.PI * sigma2);
}

/** Generate a random sample from N(mu, sigma2) using Box-Muller */
function gaussSample(mu: number, sigma2: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + z * Math.sqrt(sigma2);
}

// ---------------------------------------------------------------------------
// SVG Constants
// ---------------------------------------------------------------------------

const SVG_W = 600;
const SVG_H = 300;
const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;
const NUM_POINTS = 200;

// ---------------------------------------------------------------------------
// SVG curve generation helpers
// ---------------------------------------------------------------------------

function generateCurvePoints(
  xMin: number, xMax: number, mu: number, sigma2: number, maxY: number,
): string {
  const points: string[] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    const x = xMin + t * (xMax - xMin);
    const y = gaussPdf(x, mu, sigma2);
    const sx = PAD.left + t * PLOT_W;
    const sy = PAD.top + PLOT_H - (y / maxY) * PLOT_H;
    points.push(`${sx},${Math.max(PAD.top, sy)}`);
  }
  return points.join(' ');
}

function generateFilledPath(
  xMin: number, xMax: number, mu: number, sigma2: number, maxY: number,
): string {
  let path = `M ${PAD.left},${PAD.top + PLOT_H}`;
  for (let i = 0; i <= NUM_POINTS; i++) {
    const t = i / NUM_POINTS;
    const x = xMin + t * (xMax - xMin);
    const y = gaussPdf(x, mu, sigma2);
    const sx = PAD.left + t * PLOT_W;
    const sy = PAD.top + PLOT_H - (y / maxY) * PLOT_H;
    path += ` L ${sx},${Math.max(PAD.top, sy)}`;
  }
  path += ` L ${PAD.left + PLOT_W},${PAD.top + PLOT_H} Z`;
  return path;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BayesianInferencePlayground() {
  // True data-generating distribution: N(trueMu, 1)
  const [trueMu, setTrueMu] = useState(3.0);

  // Prior: mu ~ N(mu0, tau2)
  const [mu0, setMu0] = useState(0);
  const [tau2, setTau2] = useState(1);

  // Observed data
  const [samples, setSamples] = useState<number[]>([]);

  // Known data variance
  const sigma2 = 1;

  // Sufficient statistics
  const n = samples.length;
  const xBar = n > 0 ? samples.reduce((a, b) => a + b, 0) / n : 0;

  // Posterior: N(muPost, sigma2Post)
  const sigma2Post = 1 / (1 / tau2 + n / sigma2);
  const muPost = sigma2Post * (mu0 / tau2 + n * xBar / sigma2);

  // Estimators
  const mle = n > 0 ? xBar : NaN;
  const mapEstimate = n > 0 ? muPost : NaN; // For Gaussian, mode = mean
  const bayesianMean = n > 0 ? muPost : mu0;

  // Regularization parameter
  const lambda = 1 / (2 * tau2);

  // Plot range: dynamically based on prior center, data range, and spread
  const plotRange = useMemo(() => {
    const tau = Math.sqrt(tau2);
    const spread = Math.max(tau, 1);
    let lo = mu0 - 4 * spread;
    let hi = mu0 + 4 * spread;

    if (n > 0) {
      const dataMin = Math.min(...samples);
      const dataMax = Math.max(...samples);
      lo = Math.min(lo, dataMin - 2);
      hi = Math.max(hi, dataMax + 2);
    }

    // Always include trueMu in range
    lo = Math.min(lo, trueMu - 2);
    hi = Math.max(hi, trueMu + 2);

    return { lo, hi };
  }, [mu0, tau2, samples, n, trueMu]);

  // Max Y for scaling
  const maxY = useMemo(() => {
    let max = 0;
    const { lo, hi } = plotRange;
    for (let i = 0; i <= NUM_POINTS; i++) {
      const x = lo + (i / NUM_POINTS) * (hi - lo);
      max = Math.max(max, gaussPdf(x, mu0, tau2));
      if (n > 0) {
        max = Math.max(max, gaussPdf(x, muPost, sigma2Post));
      }
    }
    return Math.max(max * 1.1, 0.1);
  }, [mu0, tau2, muPost, sigma2Post, n, plotRange]);

  // X-axis ticks
  const xTicks = useMemo(() => {
    const { lo, hi } = plotRange;
    const range = hi - lo;
    const rawStep = range / 6;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const step = Math.ceil(rawStep / magnitude) * magnitude;
    const ticks: number[] = [];
    const start = Math.ceil(lo / step) * step;
    for (let v = start; v <= hi; v += step) {
      ticks.push(parseFloat(v.toFixed(4)));
    }
    return ticks;
  }, [plotRange]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxY > 2 ? Math.ceil(maxY / 5) : maxY > 0.5 ? 0.2 : 0.1;
    for (let v = 0; v <= maxY; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [maxY]);

  // Convert data value to SVG x-coordinate
  const xToSVG = useCallback((val: number) => {
    const { lo, hi } = plotRange;
    const t = (val - lo) / (hi - lo);
    return PAD.left + t * PLOT_W;
  }, [plotRange]);

  // Generate a single sample
  const generateSample = useCallback(() => {
    const s = gaussSample(trueMu, sigma2);
    setSamples((prev) => [...prev, s]);
  }, [trueMu]);

  // Generate multiple samples
  const generateBulk = useCallback((count: number) => {
    const newSamples: number[] = [];
    for (let i = 0; i < count; i++) {
      newSamples.push(gaussSample(trueMu, sigma2));
    }
    setSamples((prev) => [...prev, ...newSamples]);
  }, [trueMu]);

  // Set prior
  const handleSetPrior = useCallback((newMu0: number, newTau2: number) => {
    setMu0(newMu0);
    setTau2(newTau2);
    setSamples([]);
  }, []);

  // Set true mu
  const handleSetTrueMu = useCallback((mu: number) => {
    setTrueMu(mu);
    setSamples([]);
  }, []);

  // Reset
  const handleReset = useCallback(() => {
    setMu0(0);
    setTau2(1);
    setTrueMu(3.0);
    setSamples([]);
  }, []);

  return (
    <PlaygroundLayout
      accentColor="#059669"
      disableTutor
      lessons={
        <LessonGuide
          onSetPrior={handleSetPrior}
          onGenerate={generateBulk}
          onReset={handleReset}
          onSetTrueMu={handleSetTrueMu}
        />
      }
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Controls */}
          <div className="flex gap-6 flex-wrap">
            {/* True mu */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Distribucion real: N(mu_real, 1)
              </p>
              <div>
                <label className="font-mono text-[10px] text-j-text-tertiary block mb-1">
                  mu_real = {trueMu.toFixed(1)}
                </label>
                <input
                  type="range"
                  min={-5}
                  max={8}
                  step={0.1}
                  value={trueMu}
                  onChange={(e) => {
                    setTrueMu(parseFloat(e.target.value));
                    setSamples([]);
                  }}
                  className="w-40 accent-[#059669]"
                />
              </div>
            </div>

            {/* Prior controls */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Prior: N(mu_0, tau^2)
              </p>
              <div className="flex gap-4 items-end">
                <div>
                  <label className="font-mono text-[10px] text-j-text-tertiary block mb-1">
                    mu_0 = {mu0.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min={-5}
                    max={8}
                    step={0.1}
                    value={mu0}
                    onChange={(e) => {
                      setMu0(parseFloat(e.target.value));
                      setSamples([]);
                    }}
                    className="w-32 accent-[#059669]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-j-text-tertiary block mb-1">
                    tau^2 = {tau2.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={0.05}
                    max={10}
                    step={0.05}
                    value={tau2}
                    onChange={(e) => {
                      setTau2(parseFloat(e.target.value));
                      setSamples([]);
                    }}
                    className="w-32 accent-[#059669]"
                  />
                </div>
              </div>

              {/* Preset priors */}
              <div className="flex gap-2 mt-3">
                {[
                  { label: 'Vago', mu: 0, t: 10 },
                  { label: 'Moderado', mu: 0, t: 1 },
                  { label: 'Fuerte', mu: 0, t: 0.1 },
                  { label: 'Centrado en 5', mu: 5, t: 1 },
                  { label: 'Ridge (lambda=5)', mu: 0, t: 0.1 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSetPrior(p.mu, p.t)}
                    className="px-2 py-1 border border-j-border font-mono text-[9px] tracking-wider text-j-text-tertiary hover:border-[#059669] hover:text-[#059669] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Distribution plot */}
          <div className="border border-j-border bg-white/30 p-2">
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full">
              {/* Y-axis ticks and grid */}
              {yTicks.map((v, i) => {
                const y = PAD.top + PLOT_H - (v / maxY) * PLOT_H;
                return (
                  <g key={i}>
                    <line x1={PAD.left} y1={y} x2={PAD.left + PLOT_W} y2={y} stroke="#eee" strokeWidth={0.5} />
                    <text x={PAD.left - 8} y={y + 3} textAnchor="end" className="font-mono" fontSize={9} fill="#999">
                      {v.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* X-axis ticks */}
              {xTicks.map((v) => (
                <g key={v}>
                  <line x1={xToSVG(v)} y1={PAD.top + PLOT_H} x2={xToSVG(v)} y2={PAD.top + PLOT_H + 5} stroke="#999" strokeWidth={0.5} />
                  <text x={xToSVG(v)} y={PAD.top + PLOT_H + 18} textAnchor="middle" className="font-mono" fontSize={9} fill="#999">
                    {v}
                  </text>
                </g>
              ))}

              {/* X-axis label */}
              <text x={PAD.left + PLOT_W / 2} y={SVG_H - 5} textAnchor="middle" className="font-mono" fontSize={10} fill="#666">
                mu (media estimada)
              </text>

              {/* Axes */}
              <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#999" strokeWidth={1} />
              <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#999" strokeWidth={1} />

              {/* Prior distribution (dashed, light emerald) */}
              <path
                d={generateFilledPath(plotRange.lo, plotRange.hi, mu0, tau2, maxY)}
                fill="#6ee7b7"
                fillOpacity={0.15}
              />
              <polyline
                points={generateCurvePoints(plotRange.lo, plotRange.hi, mu0, tau2, maxY)}
                fill="none"
                stroke="#6ee7b7"
                strokeWidth={2}
                strokeDasharray="6,3"
              />

              {/* Posterior distribution (solid emerald) */}
              {n > 0 && (
                <>
                  <path
                    d={generateFilledPath(plotRange.lo, plotRange.hi, muPost, sigma2Post, maxY)}
                    fill="#059669"
                    fillOpacity={0.15}
                  />
                  <polyline
                    points={generateCurvePoints(plotRange.lo, plotRange.hi, muPost, sigma2Post, maxY)}
                    fill="none"
                    stroke="#059669"
                    strokeWidth={2.5}
                  />
                </>
              )}

              {/* True mu vertical line */}
              <g>
                <line
                  x1={xToSVG(trueMu)} y1={PAD.top}
                  x2={xToSVG(trueMu)} y2={PAD.top + PLOT_H}
                  stroke="#999" strokeWidth={1} strokeDasharray="2,4"
                />
                <text x={xToSVG(trueMu)} y={PAD.top + PLOT_H + 32} textAnchor="middle" className="font-mono" fontSize={8} fill="#999">
                  mu_real
                </text>
              </g>

              {/* MLE line (red) */}
              {n > 0 && isFinite(mle) && (
                <g>
                  <line
                    x1={xToSVG(mle)} y1={PAD.top}
                    x2={xToSVG(mle)} y2={PAD.top + PLOT_H}
                    stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4,2"
                  />
                  <text x={xToSVG(mle)} y={PAD.top - 5} textAnchor="middle" className="font-mono" fontSize={9} fill="#dc2626">
                    MLE
                  </text>
                </g>
              )}

              {/* MAP line (blue) */}
              {n > 0 && isFinite(mapEstimate) && (
                <g>
                  <line
                    x1={xToSVG(mapEstimate)} y1={PAD.top}
                    x2={xToSVG(mapEstimate)} y2={PAD.top + PLOT_H}
                    stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4,2"
                  />
                  <text x={xToSVG(mapEstimate)} y={PAD.top - 5} textAnchor="middle" className="font-mono" fontSize={9} fill="#2563eb">
                    MAP
                  </text>
                </g>
              )}

              {/* Bayesian mean line (green) */}
              <g>
                <line
                  x1={xToSVG(bayesianMean)} y1={PAD.top}
                  x2={xToSVG(bayesianMean)} y2={PAD.top + PLOT_H}
                  stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4,2"
                />
                <text x={xToSVG(bayesianMean)} y={PAD.top - 5} textAnchor="middle" className="font-mono" fontSize={9} fill="#16a34a">
                  Media
                </text>
              </g>

              {/* Data points on x-axis */}
              {samples.map((s, i) => (
                <circle
                  key={i}
                  cx={xToSVG(s)}
                  cy={PAD.top + PLOT_H}
                  r={2.5}
                  fill="#059669"
                  fillOpacity={0.6}
                />
              ))}

              {/* Legend */}
              <g transform={`translate(${PAD.left + PLOT_W - 130}, ${PAD.top + 10})`}>
                <rect x={0} y={0} width={125} height={n > 0 ? 68 : 22} fill="white" fillOpacity={0.8} stroke="#eee" />
                <line x1={5} y1={12} x2={20} y2={12} stroke="#6ee7b7" strokeWidth={2} strokeDasharray="4,2" />
                <text x={25} y={15} className="font-mono" fontSize={9} fill="#666">Prior</text>
                {n > 0 && (
                  <>
                    <line x1={5} y1={28} x2={20} y2={28} stroke="#059669" strokeWidth={2.5} />
                    <text x={25} y={31} className="font-mono" fontSize={9} fill="#666">Posterior</text>
                    <text x={5} y={47} className="font-mono" fontSize={8} fill="#999">
                      n={n}, x_bar={xBar.toFixed(2)}
                    </text>
                    <text x={5} y={60} className="font-mono" fontSize={8} fill="#999">
                      sigma2_post={sigma2Post.toFixed(4)}
                    </text>
                  </>
                )}
              </g>
            </svg>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 items-center">
            <button
              onClick={generateSample}
              className="flex-1 py-3 bg-[#059669] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#047857] transition-colors"
            >
              Generar 1 muestra
            </button>
            <button
              onClick={() => generateBulk(10)}
              className="flex-1 py-3 bg-[#059669] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#047857] transition-colors"
            >
              Generar 10 muestras
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-j-border font-mono text-[11px] tracking-wider uppercase text-j-text-tertiary hover:text-j-text transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Sample history */}
          {samples.length > 0 && (
            <div className="border border-j-border p-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
                Muestras observadas ({samples.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {samples.map((s, i) => (
                  <span
                    key={i}
                    className="px-1.5 h-5 flex items-center justify-center font-mono text-[9px] text-white bg-[#059669]"
                  >
                    {s.toFixed(1)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Prior</p>
              <p className="font-mono text-lg text-j-text">
                N({mu0.toFixed(1)}, {tau2.toFixed(2)})
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Posterior</p>
              <p className="font-mono text-lg text-[#059669]">
                {n > 0 ? `N(${muPost.toFixed(3)}, ${sigma2Post.toFixed(4)})` : 'N/A'}
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Muestras</p>
              <p className="font-mono text-lg text-j-text">
                {n}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                x_bar = {n > 0 ? xBar.toFixed(4) : 'N/A'}
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Regularizacion</p>
              <p className="font-mono text-lg text-j-text">
                lambda = {lambda.toFixed(3)}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                1 / (2 * tau^2)
              </p>
            </div>
          </div>

          {/* Estimators comparison */}
          <div className="border border-j-border p-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              Estimadores puntuales
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 border-l-2 border-[#dc2626]">
                <p className="font-mono text-[10px] text-[#dc2626] uppercase mb-1">MLE</p>
                <p className="font-mono text-lg text-j-text">
                  {isFinite(mle) ? mle.toFixed(4) : 'N/A'}
                </p>
                <p className="text-[10px] text-j-text-tertiary mt-1">x_bar = sum(x_i) / n</p>
              </div>

              <div className="p-3 border-l-2 border-[#2563eb]">
                <p className="font-mono text-[10px] text-[#2563eb] uppercase mb-1">MAP</p>
                <p className="font-mono text-lg text-j-text">
                  {isFinite(mapEstimate) ? mapEstimate.toFixed(4) : 'N/A'}
                </p>
                <p className="text-[10px] text-j-text-tertiary mt-1">sigma2_post * (mu0/tau2 + n*x_bar/sigma2)</p>
              </div>

              <div className="p-3 border-l-2 border-[#16a34a]">
                <p className="font-mono text-[10px] text-[#16a34a] uppercase mb-1">Media Bayesiana</p>
                <p className="font-mono text-lg text-j-text">
                  {bayesianMean.toFixed(4)}
                </p>
                <p className="text-[10px] text-j-text-tertiary mt-1">= MAP (Gaussiana: moda = media)</p>
              </div>
            </div>
          </div>

          {/* Formulas */}
          <div className="border border-j-border p-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              Actualizacion conjugada gaussiana
            </p>
            <div className="space-y-2 font-mono text-xs text-j-text-secondary">
              <p>sigma2_post = 1 / (1/tau2 + n/sigma2) = 1 / ({(1/tau2).toFixed(3)} + {n}/{sigma2}) = {n > 0 ? sigma2Post.toFixed(4) : 'N/A'}</p>
              <p>mu_post = sigma2_post * (mu0/tau2 + n*x_bar/sigma2) = {n > 0 ? muPost.toFixed(4) : 'N/A'}</p>
              <p>MLE = x_bar = {n > 0 ? xBar.toFixed(4) : 'N/A'}</p>
              <p>MAP = mu_post = {n > 0 ? muPost.toFixed(4) : 'N/A'} (para Gaussiana, mode = mean)</p>
            </div>
          </div>
        </div>
      </div>
    </PlaygroundLayout>
  );
}
