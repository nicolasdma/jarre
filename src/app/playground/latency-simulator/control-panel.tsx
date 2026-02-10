'use client';

import { useMemo } from 'react';
import type { SimulationConfig, RequestData, Percentiles } from './latency-playground';

interface ControlPanelProps {
  config: SimulationConfig;
  onConfigChange: (updates: Partial<SimulationConfig>) => void;
  onReset: () => void;
  requests: RequestData[];
  percentiles: Percentiles;
  percentileHistory: Percentiles[];
}

export function ControlPanel({
  config,
  onConfigChange,
  onReset,
  requests,
  percentiles,
  percentileHistory,
}: ControlPanelProps) {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Controles
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="font-mono text-[10px] text-j-text-secondary hover:text-j-text px-2 py-1 border border-j-border hover:border-[#ccc] transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => onConfigChange({ isRunning: !config.isRunning })}
            className={`font-mono text-[10px] px-3 py-1 transition-colors ${
              config.isRunning
                ? 'bg-[#991b1b] text-white hover:bg-[#7f1d1d]'
                : 'bg-[#d97706] text-white hover:bg-[#b45309]'
            }`}
          >
            {config.isRunning ? 'Pausar' : 'Iniciar'}
          </button>
        </div>
      </div>

      {/* Controls area */}
      <div className="px-5 py-4 border-b border-j-border shrink-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Request Rate */}
          <SliderControl
            label="Request rate"
            value={config.requestRate}
            min={1}
            max={100}
            unit="req/s"
            onChange={(v) => onConfigChange({ requestRate: v })}
          />

          {/* Base Latency */}
          <SliderControl
            label="Latencia base"
            value={config.baseLatency}
            min={10}
            max={500}
            unit="ms"
            onChange={(v) => onConfigChange({ baseLatency: v })}
          />

          {/* Std Deviation */}
          <SliderControl
            label="Desviacion estandar"
            value={config.stdDev}
            min={5}
            max={100}
            unit="ms"
            onChange={(v) => onConfigChange({ stdDev: v })}
          />

          {/* Fan-out */}
          <SliderControl
            label="Downstream services"
            value={config.downstreamServices}
            min={0}
            max={5}
            unit={config.downstreamServices === 0 ? 'sin fan-out' : `${config.downstreamServices} servicios`}
            onChange={(v) => onConfigChange({ downstreamServices: v })}
          />

          {/* SLO Target */}
          <SliderControl
            label="SLO target (p95)"
            value={config.sloTarget}
            min={50}
            max={500}
            unit="ms"
            onChange={(v) => onConfigChange({ sloTarget: v })}
          />
        </div>

        {/* Distribution selector */}
        <div className="mt-4">
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
            Distribucion
          </p>
          <div className="flex gap-1">
            {(['normal', 'lognormal', 'bimodal'] as const).map((dist) => (
              <button
                key={dist}
                onClick={() => onConfigChange({ distribution: dist })}
                className={`flex-1 font-mono text-[11px] px-3 py-1.5 transition-colors ${
                  config.distribution === dist
                    ? 'bg-[#d97706] text-white'
                    : 'bg-[#f0efe8] text-j-text-secondary hover:bg-j-border'
                }`}
              >
                {dist === 'normal' ? 'Normal' : dist === 'lognormal' ? 'Log-normal' : 'Bimodal'}
              </button>
            ))}
          </div>
        </div>

        {/* Bimodal-specific controls */}
        {config.distribution === 'bimodal' && (
          <div className="mt-3 pt-3 border-t border-j-border grid grid-cols-2 gap-x-6 gap-y-3">
            <SliderControl
              label="Slow request %"
              value={config.slowRequestRate}
              min={1}
              max={50}
              unit="%"
              onChange={(v) => onConfigChange({ slowRequestRate: v })}
            />
            <SliderControl
              label="Slow multiplier"
              value={config.slowLatencyMultiplier}
              min={2}
              max={20}
              unit={`${config.slowLatencyMultiplier}x`}
              onChange={(v) => onConfigChange({ slowLatencyMultiplier: v })}
            />
          </div>
        )}
      </div>

      {/* Visualizations */}
      <div className="flex-1 px-5 py-4 space-y-6 min-h-0">
        <LatencyHistogram
          requests={requests}
          percentiles={percentiles}
          sloTarget={config.sloTarget}
        />
        <PercentileTimeline
          history={percentileHistory}
          sloTarget={config.sloTarget}
        />
      </div>
    </div>
  );
}

// -- Slider Control --------------------------------------------------------

function SliderControl({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
          {label}
        </span>
        <span className="font-mono text-[11px] text-j-text tabular-nums">
          {value} <span className="text-[#a0a090] text-[10px]">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-1 appearance-none bg-j-border cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[#d97706]
          [&::-webkit-slider-thumb]:hover:bg-[#b45309]
          [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[#d97706]
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:hover:bg-[#b45309]"
      />
    </div>
  );
}

// -- Latency Histogram (SVG) -----------------------------------------------

const HIST_WIDTH = 500;
const HIST_HEIGHT = 200;
const HIST_PADDING = { top: 20, right: 15, bottom: 30, left: 45 };
const NUM_BINS = 20;

function LatencyHistogram({
  requests,
  percentiles,
  sloTarget,
}: {
  requests: RequestData[];
  percentiles: Percentiles;
  sloTarget: number;
}) {
  const { bins, maxCount, maxLatency, binWidth } = useMemo(() => {
    if (requests.length === 0) {
      return { bins: [], maxCount: 0, maxLatency: 100, binWidth: 5 };
    }

    const latencies = requests.map(r => r.latency);
    const max = Math.max(...latencies);
    const cappedMax = Math.max(max, sloTarget * 1.2, 100);
    const bw = cappedMax / NUM_BINS;

    const binCounts = new Array<number>(NUM_BINS).fill(0);
    for (const lat of latencies) {
      const idx = Math.min(NUM_BINS - 1, Math.floor(lat / bw));
      binCounts[idx]++;
    }

    const maxC = Math.max(1, ...binCounts);
    return { bins: binCounts, maxCount: maxC, maxLatency: cappedMax, binWidth: bw };
  }, [requests, sloTarget]);

  const chartW = HIST_WIDTH - HIST_PADDING.left - HIST_PADDING.right;
  const chartH = HIST_HEIGHT - HIST_PADDING.top - HIST_PADDING.bottom;

  const xScale = (val: number) => HIST_PADDING.left + (val / maxLatency) * chartW;
  const yScale = (count: number) => HIST_PADDING.top + chartH - (count / maxCount) * chartH;

  const percentileLines: Array<{ value: number; label: string; color: string }> = [
    { value: percentiles.p50, label: 'p50', color: '#4a5d4a' },
    { value: percentiles.p95, label: 'p95', color: '#d97706' },
    { value: percentiles.p99, label: 'p99', color: '#ea580c' },
    { value: percentiles.p999, label: 'p999', color: '#991b1b' },
  ];

  return (
    <div>
      <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
        Histograma de latencias
      </p>
      <svg
        viewBox={`0 0 ${HIST_WIDTH} ${HIST_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: '220px' }}
      >
        {/* Background */}
        <rect
          x={HIST_PADDING.left}
          y={HIST_PADDING.top}
          width={chartW}
          height={chartH}
          fill="#faf9f6"
          stroke="#e8e6e0"
          strokeWidth={0.5}
        />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={HIST_PADDING.left}
            y1={HIST_PADDING.top + chartH * (1 - frac)}
            x2={HIST_PADDING.left + chartW}
            y2={HIST_PADDING.top + chartH * (1 - frac)}
            stroke="#e8e6e0"
            strokeWidth={0.5}
          />
        ))}

        {/* Histogram bars */}
        {bins.map((count, i) => {
          const barX = xScale(i * binWidth);
          const barW = Math.max(1, (chartW / NUM_BINS) - 1);
          const barH = (count / maxCount) * chartH;
          const barY = HIST_PADDING.top + chartH - barH;

          return (
            <rect
              key={i}
              x={barX}
              y={barY}
              width={barW}
              height={Math.max(0, barH)}
              fill="#d97706"
              opacity={0.7}
            />
          );
        })}

        {/* SLO target line */}
        {requests.length > 0 && (
          <>
            <line
              x1={xScale(sloTarget)}
              y1={HIST_PADDING.top}
              x2={xScale(sloTarget)}
              y2={HIST_PADDING.top + chartH}
              stroke="#991b1b"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <text
              x={xScale(sloTarget) + 3}
              y={HIST_PADDING.top + 10}
              fill="#991b1b"
              fontSize={8}
              fontFamily="monospace"
            >
              SLO
            </text>
          </>
        )}

        {/* Percentile lines */}
        {requests.length > 0 && percentileLines.map(({ value, label, color }) => {
          if (value <= 0 || value > maxLatency) return null;
          return (
            <g key={label}>
              <line
                x1={xScale(value)}
                y1={HIST_PADDING.top}
                x2={xScale(value)}
                y2={HIST_PADDING.top + chartH}
                stroke={color}
                strokeWidth={1}
                opacity={0.8}
              />
              <text
                x={xScale(value)}
                y={HIST_PADDING.top - 4}
                fill={color}
                fontSize={7}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const val = Math.round(maxLatency * frac);
          return (
            <text
              key={frac}
              x={HIST_PADDING.left + chartW * frac}
              y={HIST_HEIGHT - 5}
              fill="#a0a090"
              fontSize={8}
              fontFamily="monospace"
              textAnchor="middle"
            >
              {val}ms
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => (
          <text
            key={frac}
            x={HIST_PADDING.left - 5}
            y={HIST_PADDING.top + chartH * (1 - frac) + 3}
            fill="#a0a090"
            fontSize={8}
            fontFamily="monospace"
            textAnchor="end"
          >
            {Math.round(maxCount * frac)}
          </text>
        ))}

        {/* Empty state */}
        {requests.length === 0 && (
          <text
            x={HIST_WIDTH / 2}
            y={HIST_HEIGHT / 2}
            fill="#a0a090"
            fontSize={11}
            fontFamily="monospace"
            textAnchor="middle"
          >
            Inicia la simulacion para ver datos
          </text>
        )}
      </svg>
    </div>
  );
}

// -- Percentile Timeline (SVG) ---------------------------------------------

const TIMELINE_WIDTH = 500;
const TIMELINE_HEIGHT = 160;
const TL_PADDING = { top: 20, right: 15, bottom: 25, left: 45 };

function PercentileTimeline({
  history,
  sloTarget,
}: {
  history: Percentiles[];
  sloTarget: number;
}) {
  const { maxVal, dataPoints } = useMemo(() => {
    if (history.length === 0) {
      return { maxVal: 200, dataPoints: [] };
    }

    const maxP = Math.max(
      ...history.map(h => Math.max(h.p99, h.p95, h.p50)),
      sloTarget * 1.2,
    );

    return { maxVal: Math.max(maxP, 100), dataPoints: history };
  }, [history, sloTarget]);

  const chartW = TIMELINE_WIDTH - TL_PADDING.left - TL_PADDING.right;
  const chartH = TIMELINE_HEIGHT - TL_PADDING.top - TL_PADDING.bottom;

  const xScale = (idx: number) => {
    const totalPoints = Math.max(dataPoints.length, 2);
    return TL_PADDING.left + (idx / (totalPoints - 1)) * chartW;
  };
  const yScale = (val: number) => TL_PADDING.top + chartH - (val / maxVal) * chartH;

  const buildPath = (accessor: (p: Percentiles) => number): string => {
    if (dataPoints.length === 0) return '';
    return dataPoints
      .map((dp, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(accessor(dp)).toFixed(1)}`)
      .join(' ');
  };

  const lines: Array<{ accessor: (p: Percentiles) => number; color: string; label: string }> = [
    { accessor: (p) => p.p50, color: '#4a5d4a', label: 'p50' },
    { accessor: (p) => p.p95, color: '#d97706', label: 'p95' },
    { accessor: (p) => p.p99, color: '#ea580c', label: 'p99' },
  ];

  return (
    <div>
      <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
        Percentiles en el tiempo
      </p>
      <svg
        viewBox={`0 0 ${TIMELINE_WIDTH} ${TIMELINE_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: '180px' }}
      >
        {/* Background */}
        <rect
          x={TL_PADDING.left}
          y={TL_PADDING.top}
          width={chartW}
          height={chartH}
          fill="#faf9f6"
          stroke="#e8e6e0"
          strokeWidth={0.5}
        />

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line
            key={frac}
            x1={TL_PADDING.left}
            y1={TL_PADDING.top + chartH * (1 - frac)}
            x2={TL_PADDING.left + chartW}
            y2={TL_PADDING.top + chartH * (1 - frac)}
            stroke="#e8e6e0"
            strokeWidth={0.5}
          />
        ))}

        {/* SLO horizontal line */}
        {sloTarget <= maxVal && (
          <>
            <line
              x1={TL_PADDING.left}
              y1={yScale(sloTarget)}
              x2={TL_PADDING.left + chartW}
              y2={yScale(sloTarget)}
              stroke="#991b1b"
              strokeWidth={1}
              strokeDasharray="4,3"
            />
            <text
              x={TL_PADDING.left + chartW + 2}
              y={yScale(sloTarget) + 3}
              fill="#991b1b"
              fontSize={7}
              fontFamily="monospace"
            >
              SLO
            </text>
          </>
        )}

        {/* Percentile lines */}
        {dataPoints.length > 1 && lines.map(({ accessor, color, label }) => (
          <g key={label}>
            <path
              d={buildPath(accessor)}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              opacity={0.9}
            />
            {/* Label at end of line */}
            {dataPoints.length > 0 && (
              <text
                x={xScale(dataPoints.length - 1) + 4}
                y={yScale(accessor(dataPoints[dataPoints.length - 1])) + 3}
                fill={color}
                fontSize={7}
                fontFamily="monospace"
              >
                {label}
              </text>
            )}
          </g>
        ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <text
            key={frac}
            x={TL_PADDING.left - 5}
            y={TL_PADDING.top + chartH * (1 - frac) + 3}
            fill="#a0a090"
            fontSize={8}
            fontFamily="monospace"
            textAnchor="end"
          >
            {Math.round(maxVal * frac)}ms
          </text>
        ))}

        {/* X-axis label */}
        <text
          x={TIMELINE_WIDTH / 2}
          y={TIMELINE_HEIGHT - 4}
          fill="#a0a090"
          fontSize={8}
          fontFamily="monospace"
          textAnchor="middle"
        >
          tiempo (ultimos {dataPoints.length} snapshots)
        </text>

        {/* Empty state */}
        {dataPoints.length === 0 && (
          <text
            x={TIMELINE_WIDTH / 2}
            y={TIMELINE_HEIGHT / 2}
            fill="#a0a090"
            fontSize={11}
            fontFamily="monospace"
            textAnchor="middle"
          >
            Esperando datos...
          </text>
        )}
      </svg>

      {/* Legend */}
      {dataPoints.length > 0 && (
        <div className="flex gap-4 mt-1">
          {lines.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-3 h-[2px]" style={{ backgroundColor: color }} />
              <span className="font-mono text-[9px] text-j-text-secondary">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-[2px] border-t border-dashed border-[#991b1b]" />
            <span className="font-mono text-[9px] text-[#991b1b]">SLO</span>
          </div>
        </div>
      )}
    </div>
  );
}
