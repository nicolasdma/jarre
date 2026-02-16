'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TabbedSidebar } from '@/components/playground/tabbed-sidebar';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Constants from the paper (Kaplan et al., 2020)
// ---------------------------------------------------------------------------

/** Irreducible loss (entropy of natural language) */
const L_INF = 1.69;

/** Loss as a function of parameters: L(N) = (N_c / N)^alpha_N + L_inf */
const ALPHA_N = 0.076;
const N_C = 8.8e13; // ~88 trillion

/** Loss as a function of data tokens: L(D) = (D_c / D)^alpha_D + L_inf */
const ALPHA_D = 0.095;
const D_C = 5.4e13; // ~54 trillion

/** Loss as a function of compute (FLOPs): L(C) = (C_c / C)^alpha_C + L_inf */
const ALPHA_C = 0.050;
const C_C = 3.1e8; // ~310 million

/** FLOPS per GPU-hour on an A100 (312 TFLOPS * 3600s) */
const FLOPS_PER_GPU_HOUR = 3.12e17;

// ---------------------------------------------------------------------------
// Power law functions
// ---------------------------------------------------------------------------

function lossFromParams(n: number): number {
  return Math.pow(N_C / n, ALPHA_N) + L_INF;
}

function lossFromData(d: number): number {
  return Math.pow(D_C / d, ALPHA_D) + L_INF;
}

function lossFromCompute(c: number): number {
  return Math.pow(C_C / c, ALPHA_C) + L_INF;
}

/**
 * Kaplan optimal allocation: given compute C, split into N and D.
 * From the paper: N_opt ~ C^0.73, then D = C / (6 * N)
 */
function kaplanOptimal(c: number): { n: number; d: number; loss: number } {
  const n = Math.pow(c, 0.73) * 0.07;
  const d = c / (6 * n);
  const loss = lossFromCompute(c);
  return { n, d, loss };
}

/**
 * Chinchilla optimal allocation: ~20 tokens per parameter.
 * N_opt ~ (C / 120)^0.5, D = 20 * N
 */
function chinchillaOptimal(c: number): { n: number; d: number; loss: number } {
  const n = Math.pow(c / 120, 0.5);
  const d = 20 * n;
  // Chinchilla achieves somewhat better loss due to more data
  const loss = lossFromCompute(c) * 0.97;
  return { n, d, loss };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatSI(value: number): string {
  if (value >= 1e18) return (value / 1e18).toFixed(1) + 'E';
  if (value >= 1e15) return (value / 1e15).toFixed(1) + 'P';
  if (value >= 1e12) return (value / 1e12).toFixed(1) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toFixed(0);
}

function formatFLOPs(value: number): string {
  if (value >= 1e24) return (value / 1e24).toFixed(1) + ' YFLOPs';
  if (value >= 1e21) return (value / 1e21).toFixed(1) + ' ZFLOPs';
  if (value >= 1e18) return (value / 1e18).toFixed(1) + ' EFLOPs';
  if (value >= 1e15) return (value / 1e15).toFixed(1) + ' PFLOPs';
  if (value >= 1e12) return (value / 1e12).toFixed(1) + ' TFLOPs';
  return (value / 1e9).toFixed(1) + ' GFLOPs';
}

function formatDollars(value: number): string {
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(0) + 'K';
  return '$' + value.toFixed(0);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'parameters' | 'data' | 'compute' | 'optimal' | 'budget';

interface ChartPoint {
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// SVG Chart Component
// ---------------------------------------------------------------------------

interface LogLogChartProps {
  title: string;
  xLabel: string;
  yLabel: string;
  curves: {
    points: ChartPoint[];
    color: string;
    label: string;
    dashed?: boolean;
  }[];
  marker?: { x: number; y: number; color: string; label: string };
  xDomain: [number, number];
  yDomain: [number, number];
  width: number;
  height: number;
}

const CHART_PAD = { top: 30, right: 30, bottom: 50, left: 65 };

function LogLogChart({
  title,
  xLabel,
  yLabel,
  curves,
  marker,
  xDomain,
  yDomain,
  width,
  height,
}: LogLogChartProps) {
  const plotW = width - CHART_PAD.left - CHART_PAD.right;
  const plotH = height - CHART_PAD.top - CHART_PAD.bottom;

  const logXMin = Math.log10(xDomain[0]);
  const logXMax = Math.log10(xDomain[1]);
  const logYMin = Math.log10(yDomain[0]);
  const logYMax = Math.log10(yDomain[1]);

  const toSvgX = (v: number) =>
    CHART_PAD.left + ((Math.log10(v) - logXMin) / (logXMax - logXMin)) * plotW;
  const toSvgY = (v: number) =>
    CHART_PAD.top + (1 - (Math.log10(v) - logYMin) / (logYMax - logYMin)) * plotH;

  // Grid lines
  const xTicks: number[] = [];
  for (let e = Math.ceil(logXMin); e <= Math.floor(logXMax); e++) {
    xTicks.push(Math.pow(10, e));
  }
  const yTicks: number[] = [];
  for (let e = Math.ceil(logYMin * 10) / 10; e <= logYMax; e += 0.1) {
    yTicks.push(Math.pow(10, e));
  }
  // Keep only a manageable number of y-ticks
  const filteredYTicks = yTicks.filter((_, i) => i % Math.max(1, Math.floor(yTicks.length / 8)) === 0);

  return (
    <svg width={width} height={height} className="select-none">
      {/* Background */}
      <rect
        x={CHART_PAD.left}
        y={CHART_PAD.top}
        width={plotW}
        height={plotH}
        fill="#fafafa"
        stroke="#e5e5e5"
      />

      {/* Title */}
      <text
        x={width / 2}
        y={16}
        textAnchor="middle"
        className="fill-[#333] text-[12px]"
        fontFamily="monospace"
      >
        {title}
      </text>

      {/* X grid + labels */}
      {xTicks.map((tick) => {
        const sx = toSvgX(tick);
        return (
          <g key={`x-${tick}`}>
            <line x1={sx} y1={CHART_PAD.top} x2={sx} y2={CHART_PAD.top + plotH} stroke="#eee" />
            <text
              x={sx}
              y={CHART_PAD.top + plotH + 16}
              textAnchor="middle"
              className="fill-[#888] text-[9px]"
              fontFamily="monospace"
            >
              {formatSI(tick)}
            </text>
          </g>
        );
      })}

      {/* Y grid + labels */}
      {filteredYTicks.map((tick) => {
        const sy = toSvgY(tick);
        if (sy < CHART_PAD.top || sy > CHART_PAD.top + plotH) return null;
        return (
          <g key={`y-${tick}`}>
            <line
              x1={CHART_PAD.left}
              y1={sy}
              x2={CHART_PAD.left + plotW}
              y2={sy}
              stroke="#eee"
            />
            <text
              x={CHART_PAD.left - 8}
              y={sy + 3}
              textAnchor="end"
              className="fill-[#888] text-[9px]"
              fontFamily="monospace"
            >
              {tick.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Axis labels */}
      <text
        x={width / 2}
        y={height - 4}
        textAnchor="middle"
        className="fill-[#666] text-[10px]"
        fontFamily="monospace"
      >
        {xLabel}
      </text>
      <text
        x={14}
        y={height / 2}
        textAnchor="middle"
        className="fill-[#666] text-[10px]"
        fontFamily="monospace"
        transform={`rotate(-90, 14, ${height / 2})`}
      >
        {yLabel}
      </text>

      {/* Curves */}
      {curves.map((curve) => {
        const pathD = curve.points
          .filter((p) => p.x > 0 && p.y > 0)
          .map((p, i) => {
            const sx = toSvgX(p.x);
            const sy = toSvgY(p.y);
            return `${i === 0 ? 'M' : 'L'}${sx},${sy}`;
          })
          .join(' ');

        return (
          <path
            key={curve.label}
            d={pathD}
            fill="none"
            stroke={curve.color}
            strokeWidth={2}
            strokeDasharray={curve.dashed ? '6,3' : undefined}
          />
        );
      })}

      {/* Marker */}
      {marker && (
        <g>
          <circle
            cx={toSvgX(marker.x)}
            cy={toSvgY(marker.y)}
            r={5}
            fill={marker.color}
            stroke="white"
            strokeWidth={2}
          />
          <text
            x={toSvgX(marker.x) + 10}
            y={toSvgY(marker.y) - 8}
            className="fill-[#333] text-[10px] font-medium"
            fontFamily="monospace"
          >
            {marker.label}
          </text>
        </g>
      )}

      {/* Legend */}
      {curves.length > 1 && (
        <g>
          {curves.map((curve, i) => (
            <g key={curve.label} transform={`translate(${CHART_PAD.left + 10}, ${CHART_PAD.top + 12 + i * 16})`}>
              <line
                x1={0}
                y1={0}
                x2={16}
                y2={0}
                stroke={curve.color}
                strokeWidth={2}
                strokeDasharray={curve.dashed ? '4,2' : undefined}
              />
              <text x={22} y={4} className="fill-[#555] text-[9px]" fontFamily="monospace">
                {curve.label}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Generate curve points
// ---------------------------------------------------------------------------

function generateCurvePoints(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  numPoints: number = 200
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const logMin = Math.log10(xMin);
  const logMax = Math.log10(xMax);
  for (let i = 0; i < numPoints; i++) {
    const logX = logMin + (i / (numPoints - 1)) * (logMax - logMin);
    const x = Math.pow(10, logX);
    const y = fn(x);
    points.push({ x, y });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Slider component
// ---------------------------------------------------------------------------

interface LogSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
  accentColor?: string;
}

function LogSlider({ label, value, min, max, onChange, formatValue, accentColor = '#1e40af' }: LogSliderProps) {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  const logValue = Math.log10(value);
  const percent = ((logValue - logMin) / (logMax - logMin)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const logV = logMin + (parseFloat(e.target.value) / 1000) * (logMax - logMin);
    onChange(Math.pow(10, logV));
  };

  const sliderValue = ((logValue - logMin) / (logMax - logMin)) * 1000;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[12px] font-medium" style={{ color: accentColor }}>
          {formatValue ? formatValue(value) : formatSI(value)}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={0}
          max={1000}
          value={sliderValue}
          onChange={handleChange}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${percent}%, #e5e5e5 ${percent}%, #e5e5e5 100%)`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Allocation bar
// ---------------------------------------------------------------------------

interface AllocationBarProps {
  label: string;
  nParams: number;
  dTokens: number;
  color: string;
}

function AllocationBar({ label, nParams, dTokens, color }: AllocationBarProps) {
  const logN = Math.log10(nParams);
  const logD = Math.log10(dTokens);
  const total = logN + logD;
  const nPercent = (logN / total) * 100;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[9px] text-[#888]">
          {formatSI(nParams)} params / {formatSI(dTokens)} tokens
        </span>
      </div>
      <div className="flex h-5 rounded overflow-hidden border border-[#e5e5e5]">
        <div
          className="flex items-center justify-center transition-all duration-300"
          style={{ width: `${nPercent}%`, backgroundColor: color, opacity: 0.8 }}
        >
          <span className="text-white font-mono text-[8px]">N</span>
        </div>
        <div
          className="flex items-center justify-center transition-all duration-300"
          style={{ width: `${100 - nPercent}%`, backgroundColor: color, opacity: 0.4 }}
        >
          <span className="font-mono text-[8px]" style={{ color }}>D</span>
        </div>
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="font-mono text-[8px] text-[#aaa]">
          Ratio: {(dTokens / nParams).toFixed(1)} tokens/param
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Loss vs Parameters
// ---------------------------------------------------------------------------

function ParametersView({ chartSize }: { chartSize: { w: number; h: number } }) {
  const [params, setParams] = useState(1e9);
  const curvePoints = generateCurvePoints(lossFromParams, 1e7, 1e11);
  const currentLoss = lossFromParams(params);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <LogLogChart
          title="Loss vs Parameters (N)"
          xLabel="Parameters (N)"
          yLabel="Test Loss (L)"
          curves={[
            { points: curvePoints, color: '#1e40af', label: `L(N) = (N_c/N)^${ALPHA_N}` },
          ]}
          marker={{ x: params, y: currentLoss, color: '#1e40af', label: `L=${currentLoss.toFixed(3)}` }}
          xDomain={[1e7, 1e11]}
          yDomain={[1.8, 3.5]}
          width={chartSize.w}
          height={chartSize.h}
        />
      </div>
      <div className="shrink-0 border-t border-j-border px-6 py-4">
        <LogSlider
          label="Model Parameters (N)"
          value={params}
          min={1e7}
          max={1e11}
          onChange={setParams}
        />
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Stat label="Loss" value={currentLoss.toFixed(4)} />
          <Stat label="Parameters" value={formatSI(params)} />
          <Stat label="Perplexity" value={Math.exp(currentLoss).toFixed(1)} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Loss vs Data
// ---------------------------------------------------------------------------

function DataView({ chartSize }: { chartSize: { w: number; h: number } }) {
  const [tokens, setTokens] = useState(1e10);
  const curvePoints = generateCurvePoints(lossFromData, 1e9, 1e12);
  const currentLoss = lossFromData(tokens);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <LogLogChart
          title="Loss vs Training Tokens (D)"
          xLabel="Training Tokens (D)"
          yLabel="Test Loss (L)"
          curves={[
            { points: curvePoints, color: '#059669', label: `L(D) = (D_c/D)^${ALPHA_D}` },
          ]}
          marker={{ x: tokens, y: currentLoss, color: '#059669', label: `L=${currentLoss.toFixed(3)}` }}
          xDomain={[1e9, 1e12]}
          yDomain={[1.8, 3.5]}
          width={chartSize.w}
          height={chartSize.h}
        />
      </div>
      <div className="shrink-0 border-t border-j-border px-6 py-4">
        <LogSlider
          label="Training Tokens (D)"
          value={tokens}
          min={1e9}
          max={1e12}
          onChange={setTokens}
          accentColor="#059669"
        />
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Stat label="Loss" value={currentLoss.toFixed(4)} />
          <Stat label="Tokens" value={formatSI(tokens)} />
          <Stat label="Perplexity" value={Math.exp(currentLoss).toFixed(1)} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Loss vs Compute
// ---------------------------------------------------------------------------

function ComputeView({ chartSize }: { chartSize: { w: number; h: number } }) {
  const [compute, setCompute] = useState(1e20);
  const curvePoints = generateCurvePoints(lossFromCompute, 1e15, 1e25);
  const currentLoss = lossFromCompute(compute);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <LogLogChart
          title="Loss vs Compute (C)"
          xLabel="Compute (FLOPs)"
          yLabel="Test Loss (L)"
          curves={[
            { points: curvePoints, color: '#9333ea', label: `L(C) = (C_c/C)^${ALPHA_C}` },
          ]}
          marker={{ x: compute, y: currentLoss, color: '#9333ea', label: `L=${currentLoss.toFixed(3)}` }}
          xDomain={[1e15, 1e25]}
          yDomain={[1.8, 3.0]}
          width={chartSize.w}
          height={chartSize.h}
        />
      </div>
      <div className="shrink-0 border-t border-j-border px-6 py-4">
        <LogSlider
          label="Compute Budget (FLOPs)"
          value={compute}
          min={1e15}
          max={1e25}
          onChange={setCompute}
          formatValue={formatFLOPs}
          accentColor="#9333ea"
        />
        <div className="grid grid-cols-3 gap-4 mt-2">
          <Stat label="Loss" value={currentLoss.toFixed(4)} />
          <Stat label="Compute" value={formatFLOPs(compute)} />
          <Stat label="GPU-hours (A100)" value={formatSI(compute / FLOPS_PER_GPU_HOUR)} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Optimal Allocation (Kaplan vs Chinchilla)
// ---------------------------------------------------------------------------

function OptimalView({ chartSize }: { chartSize: { w: number; h: number } }) {
  const [compute, setCompute] = useState(1e21);

  const kaplan = kaplanOptimal(compute);
  const chinchilla = chinchillaOptimal(compute);

  // Generate curves showing loss vs compute for both strategies
  const kaplanCurve = generateCurvePoints(
    (c) => kaplanOptimal(c).loss,
    1e17,
    1e25
  );
  const chinchillaCurve = generateCurvePoints(
    (c) => chinchillaOptimal(c).loss,
    1e17,
    1e25
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <LogLogChart
          title="Compute-Optimal Allocation: Kaplan vs Chinchilla"
          xLabel="Compute (FLOPs)"
          yLabel="Test Loss (L)"
          curves={[
            { points: kaplanCurve, color: '#dc2626', label: 'Kaplan (2020)' },
            { points: chinchillaCurve, color: '#059669', label: 'Chinchilla (2022)', dashed: true },
          ]}
          marker={{ x: compute, y: kaplan.loss, color: '#dc2626', label: `L=${kaplan.loss.toFixed(3)}` }}
          xDomain={[1e17, 1e25]}
          yDomain={[1.8, 2.8]}
          width={chartSize.w}
          height={chartSize.h}
        />
      </div>
      <div className="shrink-0 border-t border-j-border px-6 py-4">
        <LogSlider
          label="Compute Budget (FLOPs)"
          value={compute}
          min={1e17}
          max={1e25}
          onChange={setCompute}
          formatValue={formatFLOPs}
          accentColor="#9333ea"
        />

        <div className="mt-3 space-y-1">
          <AllocationBar
            label="Kaplan"
            nParams={kaplan.n}
            dTokens={kaplan.d}
            color="#dc2626"
          />
          <AllocationBar
            label="Chinchilla"
            nParams={chinchilla.n}
            dTokens={chinchilla.d}
            color="#059669"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="bg-[#fef2f2] rounded px-3 py-2 border border-[#fecaca]">
            <p className="font-mono text-[9px] text-[#dc2626] uppercase tracking-wider mb-1">Kaplan</p>
            <p className="font-mono text-[11px] text-[#333]">
              {formatSI(kaplan.n)} params, {formatSI(kaplan.d)} tokens
            </p>
            <p className="font-mono text-[10px] text-[#888]">
              Loss: {kaplan.loss.toFixed(4)} | {(kaplan.d / kaplan.n).toFixed(1)} tok/param
            </p>
          </div>
          <div className="bg-[#ecfdf5] rounded px-3 py-2 border border-[#a7f3d0]">
            <p className="font-mono text-[9px] text-[#059669] uppercase tracking-wider mb-1">Chinchilla</p>
            <p className="font-mono text-[11px] text-[#333]">
              {formatSI(chinchilla.n)} params, {formatSI(chinchilla.d)} tokens
            </p>
            <p className="font-mono text-[10px] text-[#888]">
              Loss: {chinchilla.loss.toFixed(4)} | {(chinchilla.d / chinchilla.n).toFixed(1)} tok/param
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: Budget Calculator
// ---------------------------------------------------------------------------

function BudgetView({ chartSize }: { chartSize: { w: number; h: number } }) {
  const [budget, setBudget] = useState(1e6);
  const [costPerHour, setCostPerHour] = useState(2.0);

  const gpuHours = budget / costPerHour;
  const totalFLOPs = gpuHours * FLOPS_PER_GPU_HOUR;
  const kaplan = kaplanOptimal(totalFLOPs);
  const chinchilla = chinchillaOptimal(totalFLOPs);

  // Known models for reference
  const referenceModels = [
    { name: 'GPT-2', n: 1.5e9, d: 40e9, flops: 6 * 1.5e9 * 40e9 },
    { name: 'GPT-3', n: 175e9, d: 300e9, flops: 6 * 175e9 * 300e9 },
    { name: 'Chinchilla', n: 70e9, d: 1.4e12, flops: 6 * 70e9 * 1.4e12 },
    { name: 'LLaMA-65B', n: 65e9, d: 1.4e12, flops: 6 * 65e9 * 1.4e12 },
  ];

  // Chart: show reference models on a params vs tokens scatter
  const refPoints = referenceModels.map((m) => ({ x: m.n, y: m.d }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <svg width={chartSize.w} height={chartSize.h} className="select-none">
          <rect
            x={CHART_PAD.left}
            y={CHART_PAD.top}
            width={chartSize.w - CHART_PAD.left - CHART_PAD.right}
            height={chartSize.h - CHART_PAD.top - CHART_PAD.bottom}
            fill="#fafafa"
            stroke="#e5e5e5"
          />

          <text
            x={chartSize.w / 2}
            y={16}
            textAnchor="middle"
            className="fill-[#333] text-[12px]"
            fontFamily="monospace"
          >
            Budget: {formatDollars(budget)} at {formatDollars(costPerHour)}/GPU-hr
          </text>

          {/* Iso-compute line: 6*N*D = totalFLOPs => D = totalFLOPs / (6*N) */}
          {(() => {
            const plotW = chartSize.w - CHART_PAD.left - CHART_PAD.right;
            const plotH = chartSize.h - CHART_PAD.top - CHART_PAD.bottom;
            const logNMin = 8; // 100M
            const logNMax = 12; // 1T
            const logDMin = 9; // 1B
            const logDMax = 13; // 10T

            const toX = (logN: number) => CHART_PAD.left + ((logN - logNMin) / (logNMax - logNMin)) * plotW;
            const toY = (logD: number) => CHART_PAD.top + (1 - (logD - logDMin) / (logDMax - logDMin)) * plotH;

            // Iso-compute curve
            const isoPoints: string[] = [];
            for (let i = 0; i <= 100; i++) {
              const logN = logNMin + (i / 100) * (logNMax - logNMin);
              const n = Math.pow(10, logN);
              const d = totalFLOPs / (6 * n);
              const logD = Math.log10(d);
              if (logD >= logDMin && logD <= logDMax) {
                isoPoints.push(`${isoPoints.length === 0 ? 'M' : 'L'}${toX(logN)},${toY(logD)}`);
              }
            }

            // Grid
            const xTicks = [1e8, 1e9, 1e10, 1e11, 1e12];
            const yTicks = [1e9, 1e10, 1e11, 1e12, 1e13];

            return (
              <g>
                {/* Grid */}
                {xTicks.map((t) => (
                  <g key={`bx-${t}`}>
                    <line x1={toX(Math.log10(t))} y1={CHART_PAD.top} x2={toX(Math.log10(t))} y2={CHART_PAD.top + plotH} stroke="#eee" />
                    <text x={toX(Math.log10(t))} y={CHART_PAD.top + plotH + 16} textAnchor="middle" className="fill-[#888] text-[9px]" fontFamily="monospace">
                      {formatSI(t)}
                    </text>
                  </g>
                ))}
                {yTicks.map((t) => (
                  <g key={`by-${t}`}>
                    <line x1={CHART_PAD.left} y1={toY(Math.log10(t))} x2={CHART_PAD.left + plotW} y2={toY(Math.log10(t))} stroke="#eee" />
                    <text x={CHART_PAD.left - 8} y={toY(Math.log10(t)) + 3} textAnchor="end" className="fill-[#888] text-[9px]" fontFamily="monospace">
                      {formatSI(t)}
                    </text>
                  </g>
                ))}

                {/* Axis labels */}
                <text x={chartSize.w / 2} y={chartSize.h - 4} textAnchor="middle" className="fill-[#666] text-[10px]" fontFamily="monospace">
                  Parameters (N)
                </text>
                <text x={14} y={chartSize.h / 2} textAnchor="middle" className="fill-[#666] text-[10px]" fontFamily="monospace" transform={`rotate(-90, 14, ${chartSize.h / 2})`}>
                  Training Tokens (D)
                </text>

                {/* Iso-compute line */}
                <path d={isoPoints.join(' ')} fill="none" stroke="#9333ea" strokeWidth={2} strokeDasharray="6,3" />
                <text x={CHART_PAD.left + 10} y={CHART_PAD.top + 14} className="fill-[#9333ea] text-[9px]" fontFamily="monospace">
                  C = {formatFLOPs(totalFLOPs)}
                </text>

                {/* Reference models */}
                {referenceModels.map((m) => {
                  const logN = Math.log10(m.n);
                  const logD = Math.log10(m.d);
                  if (logN < logNMin || logN > logNMax || logD < logDMin || logD > logDMax) return null;
                  return (
                    <g key={m.name}>
                      <circle cx={toX(logN)} cy={toY(logD)} r={4} fill="#888" stroke="white" strokeWidth={1.5} />
                      <text x={toX(logN) + 8} y={toY(logD) - 6} className="fill-[#666] text-[8px]" fontFamily="monospace">
                        {m.name}
                      </text>
                    </g>
                  );
                })}

                {/* Kaplan optimal point */}
                <circle cx={toX(Math.log10(kaplan.n))} cy={toY(Math.log10(kaplan.d))} r={6} fill="#dc2626" stroke="white" strokeWidth={2} />
                <text
                  x={toX(Math.log10(kaplan.n)) + 10}
                  y={toY(Math.log10(kaplan.d)) + 4}
                  className="fill-[#dc2626] text-[9px] font-medium"
                  fontFamily="monospace"
                >
                  Kaplan
                </text>

                {/* Chinchilla optimal point */}
                <circle cx={toX(Math.log10(chinchilla.n))} cy={toY(Math.log10(chinchilla.d))} r={6} fill="#059669" stroke="white" strokeWidth={2} />
                <text
                  x={toX(Math.log10(chinchilla.n)) + 10}
                  y={toY(Math.log10(chinchilla.d)) + 4}
                  className="fill-[#059669] text-[9px] font-medium"
                  fontFamily="monospace"
                >
                  Chinchilla
                </text>

                {/* 20:1 line (Chinchilla ratio) */}
                {(() => {
                  const linePoints: string[] = [];
                  for (let i = 0; i <= 100; i++) {
                    const logN = logNMin + (i / 100) * (logNMax - logNMin);
                    const n = Math.pow(10, logN);
                    const d = 20 * n;
                    const logD = Math.log10(d);
                    if (logD >= logDMin && logD <= logDMax) {
                      linePoints.push(`${linePoints.length === 0 ? 'M' : 'L'}${toX(logN)},${toY(logD)}`);
                    }
                  }
                  return (
                    <g>
                      <path d={linePoints.join(' ')} fill="none" stroke="#059669" strokeWidth={1} strokeDasharray="3,3" opacity={0.5} />
                      <text
                        x={CHART_PAD.left + plotW - 60}
                        y={CHART_PAD.top + plotH - 8}
                        className="fill-[#059669] text-[8px]"
                        fontFamily="monospace"
                        opacity={0.7}
                      >
                        20:1 ratio
                      </text>
                    </g>
                  );
                })()}
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="shrink-0 border-t border-j-border px-6 py-4">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <LogSlider
            label="Budget ($)"
            value={budget}
            min={1e3}
            max={1e9}
            onChange={setBudget}
            formatValue={formatDollars}
            accentColor="#9333ea"
          />
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">$/GPU-Hour</span>
              <span className="font-mono text-[12px] font-medium text-[#9333ea]">
                ${costPerHour.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              value={costPerHour * 100}
              onChange={(e) => setCostPerHour(parseInt(e.target.value) / 100)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #9333ea 0%, #9333ea ${((costPerHour - 0.5) / 4.5) * 100}%, #e5e5e5 ${((costPerHour - 0.5) / 4.5) * 100}%, #e5e5e5 100%)`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Stat label="GPU-hours" value={formatSI(gpuHours)} />
          <Stat label="Total FLOPs" value={formatFLOPs(totalFLOPs)} />
          <Stat label="Kaplan Loss" value={kaplan.loss.toFixed(4)} />
          <Stat label="Chinchilla Loss" value={chinchilla.loss.toFixed(4)} />
        </div>

        <div className="mt-3 space-y-1">
          <AllocationBar label="Kaplan" nParams={kaplan.n} dTokens={kaplan.d} color="#dc2626" />
          <AllocationBar label="Chinchilla" nParams={chinchilla.n} dTokens={chinchilla.d} color="#059669" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat widget
// ---------------------------------------------------------------------------

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f5f5f5] rounded px-3 py-2">
      <p className="font-mono text-[8px] text-[#aaa] uppercase tracking-wider">{label}</p>
      <p className="font-mono text-[13px] text-[#333] font-medium">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View selector tabs
// ---------------------------------------------------------------------------

const VIEW_TABS: { key: ViewMode; label: string; color: string }[] = [
  { key: 'parameters', label: 'N (Params)', color: '#1e40af' },
  { key: 'data', label: 'D (Data)', color: '#059669' },
  { key: 'compute', label: 'C (Compute)', color: '#9333ea' },
  { key: 'optimal', label: 'Optimal Split', color: '#dc2626' },
  { key: 'budget', label: 'Budget Calc', color: '#9333ea' },
];

// ---------------------------------------------------------------------------
// Main Playground
// ---------------------------------------------------------------------------

export function ScalingLawsPlayground() {
  const [view, setView] = useState<ViewMode>('parameters');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ w: 600, h: 400 });

  // Responsive chart sizing
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setChartSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleSelectView = useCallback((v: ViewMode) => {
    setView(v);
  }, []);

  const activeTab = VIEW_TABS.find((t) => t.key === view)!;

  return (
    <div className="h-full flex">
      {/* Sidebar: Lessons */}
      <div className="flex-[2] shrink-0 border-r border-j-border overflow-hidden">
        <TabbedSidebar
          lessons={<LessonGuide onSelectView={handleSelectView} />}
          disableTutor
          accentColor="#1e40af"
        />
      </div>

      {/* Main area */}
      <div className="flex-[5] min-w-0 flex flex-col">
        {/* View tabs */}
        <div className="shrink-0 border-b border-j-border flex items-center px-2 bg-white">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                view === tab.key
                  ? 'font-medium'
                  : 'text-[#aaa] hover:text-[#666]'
              }`}
              style={
                view === tab.key
                  ? { color: tab.color, borderBottom: `2px solid ${tab.color}` }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2 pr-2">
            <span className="font-mono text-[9px] text-[#bbb] uppercase tracking-wider">
              Kaplan et al. 2020
            </span>
          </div>
        </div>

        {/* Chart area */}
        <div ref={chartContainerRef} className="flex-1 min-h-0 overflow-hidden">
          {view === 'parameters' && <ParametersView chartSize={chartSize} />}
          {view === 'data' && <DataView chartSize={chartSize} />}
          {view === 'compute' && <ComputeView chartSize={chartSize} />}
          {view === 'optimal' && <OptimalView chartSize={chartSize} />}
          {view === 'budget' && <BudgetView chartSize={chartSize} />}
        </div>
      </div>
    </div>
  );
}
