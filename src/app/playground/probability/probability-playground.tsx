'use client';

import { useState, useMemo, useCallback } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Math utilities for Beta distribution
// ---------------------------------------------------------------------------

/** Log of Gamma function (Stirling approximation + Lanczos for small values) */
function logGamma(x: number): number {
  if (x <= 0) return Infinity;
  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Log of Beta function B(a,b) */
function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

/** Beta PDF at point x with parameters alpha, beta */
function betaPdf(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return 0;
  const logPdf = (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta(alpha, beta);
  return Math.exp(logPdf);
}

/** Entropy of Beta distribution */
function betaEntropy(alpha: number, beta: number): number {
  const psi = (x: number): number => {
    // Digamma function approximation
    let result = 0;
    let val = x;
    while (val < 6) {
      result -= 1 / val;
      val += 1;
    }
    result += Math.log(val) - 1 / (2 * val);
    const v2 = 1 / (val * val);
    result -= v2 * (1 / 12 - v2 * (1 / 120 - v2 / 252));
    return result;
  };

  return logBeta(alpha, beta) - (alpha - 1) * psi(alpha) - (beta - 1) * psi(beta) + (alpha + beta - 2) * psi(alpha + beta);
}

/** KL divergence D_KL(posterior || prior) for Beta distributions */
function betaKL(a1: number, b1: number, a2: number, b2: number): number {
  const psi = (x: number): number => {
    let result = 0;
    let val = x;
    while (val < 6) {
      result -= 1 / val;
      val += 1;
    }
    result += Math.log(val) - 1 / (2 * val);
    const v2 = 1 / (val * val);
    result -= v2 * (1 / 12 - v2 * (1 / 120 - v2 / 252));
    return result;
  };

  return (
    logBeta(a2, b2) - logBeta(a1, b1) +
    (a1 - a2) * psi(a1) +
    (b1 - b2) * psi(b1) +
    (a2 - a1 + b2 - b1) * psi(a1 + b1)
  );
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

function generateCurvePoints(alpha: number, beta: number, maxY: number): string {
  const points: string[] = [];
  for (let i = 0; i <= NUM_POINTS; i++) {
    const x = i / NUM_POINTS;
    const y = betaPdf(x, alpha, beta);
    const sx = PAD.left + x * PLOT_W;
    const sy = PAD.top + PLOT_H - (y / maxY) * PLOT_H;
    points.push(`${sx},${Math.max(PAD.top, sy)}`);
  }
  return points.join(' ');
}

function generateFilledPath(alpha: number, beta: number, maxY: number): string {
  let path = `M ${PAD.left},${PAD.top + PLOT_H}`;
  for (let i = 0; i <= NUM_POINTS; i++) {
    const x = i / NUM_POINTS;
    const y = betaPdf(x, alpha, beta);
    const sx = PAD.left + x * PLOT_W;
    const sy = PAD.top + PLOT_H - (y / maxY) * PLOT_H;
    path += ` L ${sx},${Math.max(PAD.top, sy)}`;
  }
  path += ` L ${PAD.left + PLOT_W},${PAD.top + PLOT_H} Z`;
  return path;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProbabilityPlayground() {
  const [priorAlpha, setPriorAlpha] = useState(1);
  const [priorBeta, setPriorBeta] = useState(1);
  const [successes, setSuccesses] = useState(0);
  const [failures, setFailures] = useState(0);
  const [history, setHistory] = useState<('S' | 'F')[]>([]);

  // Posterior parameters
  const postAlpha = priorAlpha + successes;
  const postBeta = priorBeta + failures;
  const totalObs = successes + failures;

  // Estimators
  const mle = totalObs > 0 ? successes / totalObs : NaN;
  const map = (postAlpha > 1 && postBeta > 1) ? (postAlpha - 1) / (postAlpha + postBeta - 2) : NaN;
  const bayesianMean = postAlpha / (postAlpha + postBeta);

  // Entropy and KL
  const priorEntropy = useMemo(() => betaEntropy(priorAlpha, priorBeta), [priorAlpha, priorBeta]);
  const posteriorEntropy = useMemo(() => betaEntropy(postAlpha, postBeta), [postAlpha, postBeta]);
  const klDivergence = useMemo(
    () => (totalObs > 0 ? betaKL(postAlpha, postBeta, priorAlpha, priorBeta) : 0),
    [postAlpha, postBeta, priorAlpha, priorBeta, totalObs],
  );

  // Max Y for plot scaling
  const maxY = useMemo(() => {
    let max = 0;
    for (let i = 1; i < NUM_POINTS; i++) {
      const x = i / NUM_POINTS;
      max = Math.max(max, betaPdf(x, priorAlpha, priorBeta));
      max = Math.max(max, betaPdf(x, postAlpha, postBeta));
    }
    return Math.max(max * 1.1, 1);
  }, [priorAlpha, priorBeta, postAlpha, postBeta]);

  // Observe
  const observe = useCallback((outcome: 'success' | 'failure') => {
    if (outcome === 'success') {
      setSuccesses((s) => s + 1);
      setHistory((h) => [...h, 'S']);
    } else {
      setFailures((f) => f + 1);
      setHistory((h) => [...h, 'F']);
    }
  }, []);

  const bulkObserve = useCallback((s: number, f: number) => {
    setSuccesses((prev) => prev + s);
    setFailures((prev) => prev + f);
    const newEntries: ('S' | 'F')[] = [
      ...Array(s).fill('S' as const),
      ...Array(f).fill('F' as const),
    ];
    setHistory((h) => [...h, ...newEntries]);
  }, []);

  const handleSetPrior = useCallback((a: number, b: number) => {
    setPriorAlpha(a);
    setPriorBeta(b);
    setSuccesses(0);
    setFailures(0);
    setHistory([]);
  }, []);

  const handleReset = useCallback(() => {
    setPriorAlpha(1);
    setPriorBeta(1);
    setSuccesses(0);
    setFailures(0);
    setHistory([]);
  }, []);

  // X position for vertical line
  const xToSVG = (val: number) => PAD.left + val * PLOT_W;

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxY > 5 ? Math.ceil(maxY / 5) : maxY > 2 ? 1 : 0.5;
    for (let v = 0; v <= maxY; v += step) {
      ticks.push(v);
    }
    return ticks;
  }, [maxY]);

  return (
    <PlaygroundLayout
      accentColor="#7c3aed"
      disableTutor
      lessons={
        <LessonGuide
          onSetPrior={handleSetPrior}
          onObserve={observe}
          onBulkObserve={bulkObserve}
          onReset={handleReset}
        />
      }
    >
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Prior controls */}
          <div className="flex gap-6 flex-wrap">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
                Prior: Beta(α, β)
              </p>
              <div className="flex gap-4 items-end">
                <div>
                  <label className="font-mono text-[10px] text-j-text-tertiary block mb-1">
                    α = {priorAlpha}
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={30}
                    step={0.1}
                    value={priorAlpha}
                    onChange={(e) => {
                      setPriorAlpha(parseFloat(e.target.value));
                      setSuccesses(0);
                      setFailures(0);
                      setHistory([]);
                    }}
                    className="w-32 accent-[#7c3aed]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] text-j-text-tertiary block mb-1">
                    β = {priorBeta}
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={30}
                    step={0.1}
                    value={priorBeta}
                    onChange={(e) => {
                      setPriorBeta(parseFloat(e.target.value));
                      setSuccesses(0);
                      setFailures(0);
                      setHistory([]);
                    }}
                    className="w-32 accent-[#7c3aed]"
                  />
                </div>
              </div>

              {/* Preset priors */}
              <div className="flex gap-2 mt-3">
                {[
                  { label: 'Uniforme', a: 1, b: 1 },
                  { label: 'Jeffreys', a: 0.5, b: 0.5 },
                  { label: 'Justa', a: 10, b: 10 },
                  { label: 'Sesgada', a: 2, b: 5 },
                  { label: 'Prior fuerte', a: 20, b: 20 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSetPrior(p.a, p.b)}
                    className="px-2 py-1 border border-j-border font-mono text-[9px] tracking-wider text-j-text-tertiary hover:border-[#7c3aed] hover:text-[#7c3aed] transition-colors"
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
              {yTicks.map((v) => {
                const y = PAD.top + PLOT_H - (v / maxY) * PLOT_H;
                return (
                  <g key={v}>
                    <line x1={PAD.left} y1={y} x2={PAD.left + PLOT_W} y2={y} stroke="#eee" strokeWidth={0.5} />
                    <text x={PAD.left - 8} y={y + 3} textAnchor="end" className="font-mono" fontSize={9} fill="#999">
                      {v.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* X-axis ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1={xToSVG(v)} y1={PAD.top + PLOT_H} x2={xToSVG(v)} y2={PAD.top + PLOT_H + 5} stroke="#999" strokeWidth={0.5} />
                  <text x={xToSVG(v)} y={PAD.top + PLOT_H + 18} textAnchor="middle" className="font-mono" fontSize={9} fill="#999">
                    {v}
                  </text>
                </g>
              ))}

              {/* X-axis label */}
              <text x={PAD.left + PLOT_W / 2} y={SVG_H - 5} textAnchor="middle" className="font-mono" fontSize={10} fill="#666">
                θ (probabilidad)
              </text>

              {/* Axes */}
              <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#999" strokeWidth={1} />
              <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#999" strokeWidth={1} />

              {/* Prior distribution (filled, faint) */}
              <path
                d={generateFilledPath(priorAlpha, priorBeta, maxY)}
                fill="#c4b5fd"
                fillOpacity={0.2}
              />
              <polyline
                points={generateCurvePoints(priorAlpha, priorBeta, maxY)}
                fill="none"
                stroke="#c4b5fd"
                strokeWidth={2}
                strokeDasharray="6,3"
              />

              {/* Posterior distribution (filled) */}
              {totalObs > 0 && (
                <>
                  <path
                    d={generateFilledPath(postAlpha, postBeta, maxY)}
                    fill="#7c3aed"
                    fillOpacity={0.15}
                  />
                  <polyline
                    points={generateCurvePoints(postAlpha, postBeta, maxY)}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                  />
                </>
              )}

              {/* MLE line */}
              {totalObs > 0 && isFinite(mle) && (
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

              {/* MAP line */}
              {totalObs > 0 && isFinite(map) && (
                <g>
                  <line
                    x1={xToSVG(map)} y1={PAD.top}
                    x2={xToSVG(map)} y2={PAD.top + PLOT_H}
                    stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4,2"
                  />
                  <text x={xToSVG(map)} y={PAD.top - 5} textAnchor="middle" className="font-mono" fontSize={9} fill="#2563eb">
                    MAP
                  </text>
                </g>
              )}

              {/* Bayesian mean line */}
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

              {/* Legend */}
              <g transform={`translate(${PAD.left + PLOT_W - 120}, ${PAD.top + 10})`}>
                <rect x={0} y={0} width={115} height={totalObs > 0 ? 52 : 22} fill="white" fillOpacity={0.8} stroke="#eee" />
                <line x1={5} y1={12} x2={20} y2={12} stroke="#c4b5fd" strokeWidth={2} strokeDasharray="4,2" />
                <text x={25} y={15} className="font-mono" fontSize={9} fill="#666">Prior</text>
                {totalObs > 0 && (
                  <>
                    <line x1={5} y1={28} x2={20} y2={28} stroke="#7c3aed" strokeWidth={2.5} />
                    <text x={25} y={31} className="font-mono" fontSize={9} fill="#666">Posterior</text>
                    <text x={5} y={47} className="font-mono" fontSize={8} fill="#999">
                      n={totalObs} (S={successes}, F={failures})
                    </text>
                  </>
                )}
              </g>
            </svg>
          </div>

          {/* Observation buttons */}
          <div className="flex gap-3 items-center">
            <button
              onClick={() => observe('success')}
              className="flex-1 py-3 bg-[#16a34a] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#15803d] transition-colors"
            >
              Observar éxito (cara)
            </button>
            <button
              onClick={() => observe('failure')}
              className="flex-1 py-3 bg-[#dc2626] text-white font-mono text-[11px] tracking-wider uppercase hover:bg-[#b91c1c] transition-colors"
            >
              Observar fracaso (cruz)
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-j-border font-mono text-[11px] tracking-wider uppercase text-j-text-tertiary hover:text-j-text transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Observation history */}
          {history.length > 0 && (
            <div className="border border-j-border p-3">
              <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
                Historial de observaciones ({history.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 flex items-center justify-center font-mono text-[10px] text-white ${
                      h === 'S' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'
                    }`}
                  >
                    {h}
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
                Beta({priorAlpha.toFixed(1)}, {priorBeta.toFixed(1)})
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Posterior</p>
              <p className="font-mono text-lg text-[#7c3aed]">
                Beta({postAlpha.toFixed(1)}, {postBeta.toFixed(1)})
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">Entropía posterior</p>
              <p className="font-mono text-lg text-j-text">
                {posteriorEntropy.toFixed(4)}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                Prior: {priorEntropy.toFixed(4)}
              </p>
            </div>

            <div className="p-3 border border-j-border bg-white/50">
              <p className="font-mono text-[10px] text-j-text-tertiary uppercase mb-1">KL Divergence</p>
              <p className="font-mono text-lg text-j-text">
                {klDivergence.toFixed(4)}
              </p>
              <p className="text-[10px] text-j-text-tertiary mt-1">
                D_KL(post || prior)
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
                <p className="text-[10px] text-j-text-tertiary mt-1">k/n = {successes}/{totalObs || '0'}</p>
              </div>

              <div className="p-3 border-l-2 border-[#2563eb]">
                <p className="font-mono text-[10px] text-[#2563eb] uppercase mb-1">MAP</p>
                <p className="font-mono text-lg text-j-text">
                  {isFinite(map) ? map.toFixed(4) : 'N/A'}
                </p>
                <p className="text-[10px] text-j-text-tertiary mt-1">(α+k-1)/(α+β+n-2)</p>
              </div>

              <div className="p-3 border-l-2 border-[#16a34a]">
                <p className="font-mono text-[10px] text-[#16a34a] uppercase mb-1">Media Bayesiana</p>
                <p className="font-mono text-lg text-j-text">
                  {bayesianMean.toFixed(4)}
                </p>
                <p className="text-[10px] text-j-text-tertiary mt-1">(α+k)/(α+β+n)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlaygroundLayout>
  );
}
