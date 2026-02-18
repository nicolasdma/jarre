'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { PlaygroundLayout } from '@/components/playground/playground-layout';
import { LessonGuide } from './lesson-guide';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SingleRequest {
  serverId: number;
  latency: number;
  isSpike: boolean;
}

interface FanoutRequest {
  id: number;
  serverRequests: SingleRequest[];
  totalLatency: number;
  hedgedLatency: number | null;
  tiedLatency: number | null;
  wasHedged: boolean;
  wasTied: boolean;
}

interface SimulationResult {
  requests: FanoutRequest[];
  percentiles: PercentileSet;
  hedgedPercentiles: PercentileSet | null;
  tiedPercentiles: PercentileSet | null;
  individualPercentiles: PercentileSet;
}

interface PercentileSet {
  p50: number;
  p95: number;
  p99: number;
  p999: number;
  max: number;
  mean: number;
}

// ---------------------------------------------------------------------------
// Latency simulation engine
// ---------------------------------------------------------------------------

/** Box-Muller transform: generate a normally distributed random value. */
function normalRandom(mean: number, stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

/** Simulate a single server's response latency (ms). */
function simulateServerLatency(baseMean: number, baseStd: number): SingleRequest {
  const spikeChance = 0.03;
  const isSpike = Math.random() < spikeChance;

  let latency: number;
  if (isSpike) {
    // Spike: 5x-20x the mean
    const multiplier = 5 + Math.random() * 15;
    latency = baseMean * multiplier;
  } else {
    latency = Math.max(1, normalRandom(baseMean, baseStd));
  }

  return {
    serverId: 0, // assigned by caller
    latency: Math.round(latency * 100) / 100,
    isSpike,
  };
}

/** Pick K unique indices from [0, N). */
function pickServers(n: number, k: number): number[] {
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, Math.min(k, n));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function computePercentiles(values: number[]): PercentileSet {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  return {
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    p999: percentile(sorted, 99.9),
    max: sorted[sorted.length - 1] ?? 0,
    mean: sorted.length > 0 ? Math.round((sum / sorted.length) * 100) / 100 : 0,
  };
}

function runSimulation(
  numServers: number,
  fanout: number,
  batchSize: number,
  baseMean: number,
  baseStd: number,
  hedgingEnabled: boolean,
  hedgeTimeoutMs: number,
  tiedEnabled: boolean,
): SimulationResult {
  const requests: FanoutRequest[] = [];

  for (let i = 0; i < batchSize; i++) {
    const servers = pickServers(numServers, fanout);
    const serverRequests: SingleRequest[] = servers.map((sid) => {
      const req = simulateServerLatency(baseMean, baseStd);
      return { ...req, serverId: sid };
    });

    const totalLatency = Math.max(...serverRequests.map((r) => r.latency));

    // Hedged request: for each server in the fan-out, if it hasn't responded
    // by hedgeTimeoutMs, send a duplicate to a random OTHER server.
    // The effective latency per shard = min(original, hedge) where hedge
    // starts after hedgeTimeoutMs.
    let hedgedLatency: number | null = null;
    let wasHedged = false;
    if (hedgingEnabled) {
      const hedgedPerShard = serverRequests.map((req) => {
        if (req.latency > hedgeTimeoutMs) {
          // Hedge fires: send to another server after timeout
          const hedge = simulateServerLatency(baseMean, baseStd);
          const hedgeEffective = hedgeTimeoutMs + hedge.latency;
          wasHedged = true;
          return Math.min(req.latency, hedgeEffective);
        }
        return req.latency;
      });
      hedgedLatency = Math.max(...hedgedPerShard);
    }

    // Tied request: send to 2 servers immediately, cancel the slower one.
    // Effective latency per shard = min(server1, server2).
    let tiedLatency: number | null = null;
    let wasTied = false;
    if (tiedEnabled) {
      const tiedPerShard = serverRequests.map((req) => {
        const tied = simulateServerLatency(baseMean, baseStd);
        wasTied = true;
        return Math.min(req.latency, tied.latency);
      });
      tiedLatency = Math.max(...tiedPerShard);
    }

    requests.push({
      id: i,
      serverRequests,
      totalLatency,
      hedgedLatency,
      tiedLatency,
      wasHedged,
      wasTied,
    });
  }

  const totals = requests.map((r) => r.totalLatency);
  const individualLatencies = requests.flatMap((r) =>
    r.serverRequests.map((s) => s.latency)
  );

  return {
    requests,
    percentiles: computePercentiles(totals),
    hedgedPercentiles: hedgingEnabled
      ? computePercentiles(requests.map((r) => r.hedgedLatency!))
      : null,
    tiedPercentiles: tiedEnabled
      ? computePercentiles(requests.map((r) => r.tiedLatency!))
      : null,
    individualPercentiles: computePercentiles(individualLatencies),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ACCENT = '#b45309';
const ACCENT_LIGHT = '#fbbf24';

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="bg-[#fefce8] border border-[#fde68a] rounded px-3 py-2">
      <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="font-mono text-lg text-j-text font-medium">
        {value}
        {unit && <span className="text-[11px] text-[#888] ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function PercentileBar({
  label,
  percentiles,
  color,
  maxValue,
}: {
  label: string;
  percentiles: PercentileSet;
  color: string;
  maxValue: number;
}) {
  const entries: { key: string; value: number; opacity: number }[] = [
    { key: 'p50', value: percentiles.p50, opacity: 1 },
    { key: 'p95', value: percentiles.p95, opacity: 0.7 },
    { key: 'p99', value: percentiles.p99, opacity: 0.5 },
    { key: 'p999', value: percentiles.p999, opacity: 0.3 },
  ];

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[11px] text-j-text font-medium">{label}</span>
        <span className="font-mono text-[10px] text-[#888]">
          avg {percentiles.mean.toFixed(1)}ms
        </span>
      </div>
      <div className="relative h-6 bg-[#f5f5f0] rounded overflow-hidden">
        {entries.map(({ key, value, opacity }) => {
          const width = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
          return (
            <div
              key={key}
              className="absolute top-0 left-0 h-full rounded-r transition-all duration-300"
              style={{
                width: `${width}%`,
                backgroundColor: color,
                opacity,
              }}
            />
          );
        })}
        {/* Percentile labels */}
        <div className="absolute inset-0 flex items-center px-2">
          {entries.map(({ key, value }) => {
            const left = maxValue > 0 ? Math.min((value / maxValue) * 100, 98) : 0;
            return (
              <div
                key={key}
                className="absolute top-0 h-full flex items-center"
                style={{ left: `${left}%` }}
              >
                <div className="relative">
                  <div
                    className="w-px h-full absolute top-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-[8px] text-j-text absolute -top-0.5 left-1 whitespace-nowrap">
                    {key}:{value.toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Histogram({
  values,
  hedgedValues,
  tiedValues,
  bucketCount,
}: {
  values: number[];
  hedgedValues: number[] | null;
  tiedValues: number[] | null;
  bucketCount: number;
}) {
  const { buckets, hedgedBuckets, tiedBuckets, maxCount, minVal, maxVal } = useMemo(() => {
    if (values.length === 0) {
      return { buckets: [], hedgedBuckets: null, tiedBuckets: null, maxCount: 0, minVal: 0, maxVal: 0 };
    }

    const allValues = [
      ...values,
      ...(hedgedValues ?? []),
      ...(tiedValues ?? []),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;
    const bw = range / bucketCount;

    function toBuckets(vals: number[]): number[] {
      const b = new Array(bucketCount).fill(0);
      for (const v of vals) {
        const idx = Math.min(Math.floor((v - min) / bw), bucketCount - 1);
        b[idx]++;
      }
      return b;
    }

    const b = toBuckets(values);
    const hb = hedgedValues ? toBuckets(hedgedValues) : null;
    const tb = tiedValues ? toBuckets(tiedValues) : null;

    const mc = Math.max(...b, ...(hb ?? [0]), ...(tb ?? [0]));

    return { buckets: b, hedgedBuckets: hb, tiedBuckets: tb, maxCount: mc, minVal: min, maxVal: max };
  }, [values, hedgedValues, tiedValues, bucketCount]);

  if (buckets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-mono text-[12px] text-[#aaa]">
          Ejecuta un batch para ver el histograma
        </p>
      </div>
    );
  }

  const range = maxVal - minVal || 1;
  const bw = range / bucketCount;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-2 px-1">
        <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
          Distribucion de latencia
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ACCENT }} />
            <span className="font-mono text-[9px] text-[#888]">Fan-out</span>
          </div>
          {hedgedBuckets && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="font-mono text-[9px] text-[#888]">Hedged</span>
            </div>
          )}
          {tiedBuckets && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="font-mono text-[9px] text-[#888]">Tied</span>
            </div>
          )}
        </div>
      </div>

      {/* Bars */}
      <div className="flex-1 min-h-0 flex items-end gap-px px-1">
        {buckets.map((count, i) => {
          const h = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const hh = hedgedBuckets && maxCount > 0 ? (hedgedBuckets[i] / maxCount) * 100 : 0;
          const th = tiedBuckets && maxCount > 0 ? (tiedBuckets[i] / maxCount) * 100 : 0;

          return (

            <div key={`bucket-${i}`} className="flex-1 flex flex-col items-stretch justify-end h-full relative group">
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                <div className="bg-j-bg border border-j-border rounded px-2 py-1 shadow-sm whitespace-nowrap">
                  <p className="font-mono text-[9px] text-[#888]">
                    {(minVal + i * bw).toFixed(0)}-{(minVal + (i + 1) * bw).toFixed(0)}ms
                  </p>
                  <p className="font-mono text-[9px]" style={{ color: ACCENT }}>
                    {count} req
                  </p>
                  {hedgedBuckets && (
                    <p className="font-mono text-[9px] text-emerald-600">
                      {hedgedBuckets[i]} hedged
                    </p>
                  )}
                  {tiedBuckets && (
                    <p className="font-mono text-[9px] text-blue-600">
                      {tiedBuckets[i]} tied
                    </p>
                  )}
                </div>
              </div>

              {/* Stacked bars */}
              <div className="relative w-full">
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${h}%`,
                    minHeight: count > 0 ? '2px' : '0px',
                    backgroundColor: ACCENT,
                    opacity: 0.6,
                    position: 'absolute',
                    bottom: 0,
                  }}
                />
                {hedgedBuckets && (
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${hh}%`,
                      minHeight: hedgedBuckets[i] > 0 ? '2px' : '0px',
                      backgroundColor: '#10b981',
                      opacity: 0.7,
                      position: 'absolute',
                      bottom: 0,
                    }}
                  />
                )}
                {tiedBuckets && (
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${th}%`,
                      minHeight: tiedBuckets[i] > 0 ? '2px' : '0px',
                      backgroundColor: '#3b82f6',
                      opacity: 0.7,
                      position: 'absolute',
                      bottom: 0,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between px-1 mt-1">
        <span className="font-mono text-[9px] text-[#aaa]">{minVal.toFixed(0)}ms</span>
        <span className="font-mono text-[9px] text-[#aaa]">{((minVal + maxVal) / 2).toFixed(0)}ms</span>
        <span className="font-mono text-[9px] text-[#aaa]">{maxVal.toFixed(0)}ms</span>
      </div>
    </div>
  );
}

function FanoutImpactChart({ results }: { results: SimulationResult[] }) {
  if (results.length < 2) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-mono text-[11px] text-[#aaa] text-center px-4">
          Ejecuta batches con diferentes fan-out para ver el impacto
        </p>
      </div>
    );
  }

  const maxP99 = Math.max(...results.map((r) => r.percentiles.p99));

  return (
    <div className="h-full flex flex-col">
      <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider mb-2 px-1">
        Impacto del fan-out en p99
      </span>
      <div className="flex-1 min-h-0 flex items-end gap-2 px-1">
        {results.map((r, i) => {
          const h = maxP99 > 0 ? (r.percentiles.p99 / maxP99) * 100 : 0;
          const hh = r.hedgedPercentiles
            ? (r.hedgedPercentiles.p99 / maxP99) * 100
            : 0;
          return (

            <div key={`fanout-${i}`} className="flex-1 flex flex-col items-center gap-1">
              <span className="font-mono text-[8px] text-[#888]">
                {r.percentiles.p99.toFixed(0)}ms
              </span>
              <div className="w-full flex items-end gap-0.5 h-full">
                <div
                  className="flex-1 rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${h}%`,
                    backgroundColor: ACCENT,
                    opacity: 0.7,
                    minHeight: '4px',
                  }}
                />
                {r.hedgedPercentiles && (
                  <div
                    className="flex-1 rounded-t-sm transition-all duration-300"
                    style={{
                      height: `${hh}%`,
                      backgroundColor: '#10b981',
                      opacity: 0.7,
                      minHeight: '4px',
                    }}
                  />
                )}
              </div>
              <span className="font-mono text-[9px] text-[#888]">
                k={i + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function ControlsPanel({
  numServers,
  fanout,
  batchSize,
  baseMean,
  hedging,
  tied,
  hedgeTimeout,
  onNumServersChange,
  onFanoutChange,
  onBatchSizeChange,
  onBaseMeanChange,
  onHedgingToggle,
  onTiedToggle,
  onHedgeTimeoutChange,
  onRunBatch,
  onReset,
  isRunning,
}: {
  numServers: number;
  fanout: number;
  batchSize: number;
  baseMean: number;
  hedging: boolean;
  tied: boolean;
  hedgeTimeout: number;
  onNumServersChange: (v: number) => void;
  onFanoutChange: (v: number) => void;
  onBatchSizeChange: (v: number) => void;
  onBaseMeanChange: (v: number) => void;
  onHedgingToggle: () => void;
  onTiedToggle: () => void;
  onHedgeTimeoutChange: (v: number) => void;
  onRunBatch: () => void;
  onReset: () => void;
  isRunning: boolean;
}) {
  return (
    <div className="px-4 py-3 flex flex-wrap items-center gap-4">
      {/* Servers */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
          Servers
        </span>
        <input
          type="range"
          min={2}
          max={200}
          value={numServers}
          onChange={(e) => onNumServersChange(Number(e.target.value))}
          className="w-20 accent-amber-700"
        />
        <span className="font-mono text-[11px] text-j-text w-8 text-right">{numServers}</span>
      </div>

      {/* Fan-out */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
          Fan-out
        </span>
        <input
          type="range"
          min={1}
          max={Math.min(numServers, 100)}
          value={fanout}
          onChange={(e) => onFanoutChange(Number(e.target.value))}
          className="w-20 accent-amber-700"
        />
        <span className="font-mono text-[11px] text-j-text w-8 text-right">{fanout}</span>
      </div>

      {/* Batch size */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
          Batch
        </span>
        <select
          value={batchSize}
          onChange={(e) => onBatchSizeChange(Number(e.target.value))}
          className="font-mono text-[11px] bg-j-bg border border-j-border rounded px-2 py-1"
        >
          <option value={100}>100</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
          <option value={5000}>5000</option>
        </select>
      </div>

      {/* Base mean */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
          Base ms
        </span>
        <input
          type="range"
          min={5}
          max={100}
          value={baseMean}
          onChange={(e) => onBaseMeanChange(Number(e.target.value))}
          className="w-16 accent-amber-700"
        />
        <span className="font-mono text-[11px] text-j-text w-8 text-right">{baseMean}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-j-border" />

      {/* Hedging toggle */}
      <button
        onClick={onHedgingToggle}
        className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-colors ${
          hedging
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-j-bg border-j-border text-[#888] hover:text-j-text'
        }`}
      >
        Hedged {hedging ? 'ON' : 'OFF'}
      </button>

      {/* Hedge timeout */}
      {hedging && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider">
            Timeout
          </span>
          <input
            type="range"
            min={10}
            max={200}
            value={hedgeTimeout}
            onChange={(e) => onHedgeTimeoutChange(Number(e.target.value))}
            className="w-16 accent-emerald-600"
          />
          <span className="font-mono text-[11px] text-j-text w-10 text-right">{hedgeTimeout}ms</span>
        </div>
      )}

      {/* Tied toggle */}
      <button
        onClick={onTiedToggle}
        className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-colors ${
          tied
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-j-bg border-j-border text-[#888] hover:text-j-text'
        }`}
      >
        Tied {tied ? 'ON' : 'OFF'}
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-j-border" />

      {/* Run */}
      <button
        onClick={onRunBatch}
        disabled={isRunning}
        className="font-mono text-[11px] px-4 py-1.5 rounded text-white transition-colors disabled:opacity-50"
        style={{ backgroundColor: ACCENT }}
        onMouseEnter={(e) => {
          if (!isRunning) e.currentTarget.style.backgroundColor = '#92400e';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = ACCENT;
        }}
      >
        {isRunning ? 'Simulando...' : 'Ejecutar'}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="font-mono text-[11px] px-3 py-1.5 rounded border border-j-border text-[#888] hover:text-j-text transition-colors"
      >
        Reset
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Request log table
// ---------------------------------------------------------------------------

function RequestLog({ requests }: { requests: FanoutRequest[] }) {
  const displayed = requests.slice(-50).reverse();

  if (displayed.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-mono text-[11px] text-[#aaa]">Sin requests todavia</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-j-bg">
          <tr className="border-b border-j-border">
            <th className="font-mono text-[9px] text-[#888] uppercase tracking-wider text-left px-2 py-1.5">#</th>
            <th className="font-mono text-[9px] text-[#888] uppercase tracking-wider text-right px-2 py-1.5">Fan-out</th>
            <th className="font-mono text-[9px] text-[#888] uppercase tracking-wider text-right px-2 py-1.5">Latencia</th>
            <th className="font-mono text-[9px] text-[#888] uppercase tracking-wider text-right px-2 py-1.5">Hedged</th>
            <th className="font-mono text-[9px] text-[#888] uppercase tracking-wider text-right px-2 py-1.5">Tied</th>
            <th className="font-mono text-[9px] text-[#888] uppercase tracking-wider text-left px-2 py-1.5">Spikes</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((req) => {
            const spikeCount = req.serverRequests.filter((s) => s.isSpike).length;
            const isHighLatency = req.totalLatency > 200;
            return (
              <tr
                key={req.id}
                className={`border-b border-j-border/50 ${isHighLatency ? 'bg-red-50/50' : ''}`}
              >
                <td className="font-mono text-[10px] text-[#888] px-2 py-1">{req.id + 1}</td>
                <td className="font-mono text-[10px] text-j-text text-right px-2 py-1">
                  {req.serverRequests.length}
                </td>
                <td className="font-mono text-[10px] text-right px-2 py-1" style={{ color: isHighLatency ? '#dc2626' : ACCENT }}>
                  {req.totalLatency.toFixed(1)}ms
                </td>
                <td className="font-mono text-[10px] text-right px-2 py-1 text-emerald-600">
                  {req.hedgedLatency !== null ? `${req.hedgedLatency.toFixed(1)}ms` : '-'}
                </td>
                <td className="font-mono text-[10px] text-right px-2 py-1 text-blue-600">
                  {req.tiedLatency !== null ? `${req.tiedLatency.toFixed(1)}ms` : '-'}
                </td>
                <td className="font-mono text-[10px] px-2 py-1">
                  {spikeCount > 0 && (
                    <span className="text-red-500 font-medium">{spikeCount} spike{spikeCount > 1 ? 's' : ''}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main playground
// ---------------------------------------------------------------------------

export function TailLatencyPlayground() {
  // Simulation parameters
  const [numServers, setNumServers] = useState(50);
  const [fanout, setFanout] = useState(1);
  const [batchSize, setBatchSize] = useState(1000);
  const [baseMean, setBaseMean] = useState(20);
  const [hedging, setHedging] = useState(false);
  const [tied, setTied] = useState(false);
  const [hedgeTimeout, setHedgeTimeout] = useState(50);
  const [isRunning, setIsRunning] = useState(false);

  // Results
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const batchCountRef = useRef(0);

  const handleRunBatch = useCallback(() => {
    setIsRunning(true);

    // Use setTimeout to let the UI update before running the CPU-heavy simulation
    setTimeout(() => {
      const baseStd = baseMean * 0.3;
      const result = runSimulation(
        numServers,
        fanout,
        batchSize,
        baseMean,
        baseStd,
        hedging,
        hedgeTimeout,
        tied,
      );

      batchCountRef.current++;
      setCurrentResult(result);
      setHistory((prev) => [...prev, result].slice(-20));
      setIsRunning(false);
    }, 16);
  }, [numServers, fanout, batchSize, baseMean, hedging, hedgeTimeout, tied]);

  const handleReset = useCallback(() => {
    setCurrentResult(null);
    setHistory([]);
    setFanout(1);
    setHedging(false);
    setTied(false);
    setNumServers(50);
    setBatchSize(1000);
    setBaseMean(20);
    setHedgeTimeout(50);
    batchCountRef.current = 0;
  }, []);

  const handleSetFanout = useCallback((k: number) => {
    setFanout(k);
  }, []);

  const handleToggleHedging = useCallback(() => {
    setHedging((prev) => !prev);
  }, []);

  const handleToggleTied = useCallback(() => {
    setTied((prev) => !prev);
  }, []);

  const handleFanoutChange = useCallback((v: number) => {
    setFanout(v);
  }, []);

  // Compute histogram values
  const histogramValues = useMemo(() => {
    if (!currentResult) return { values: [], hedged: null, tied: null };
    return {
      values: currentResult.requests.map((r) => r.totalLatency),
      hedged: currentResult.hedgedPercentiles
        ? currentResult.requests.map((r) => r.hedgedLatency!)
        : null,
      tied: currentResult.tiedPercentiles
        ? currentResult.requests.map((r) => r.tiedLatency!)
        : null,
    };
  }, [currentResult]);

  // Max value for percentile bars (consistent scale)
  const maxPercentileValue = useMemo(() => {
    if (!currentResult) return 100;
    const candidates = [
      currentResult.percentiles.p999,
      currentResult.individualPercentiles.p999,
      currentResult.hedgedPercentiles?.p999 ?? 0,
      currentResult.tiedPercentiles?.p999 ?? 0,
    ];
    return Math.max(...candidates) * 1.1;
  }, [currentResult]);

  return (
    <PlaygroundLayout
      accentColor={ACCENT}
      disableTutor
      lessons={
        <LessonGuide
          onRunBatch={handleRunBatch}
          onSetFanout={handleSetFanout}
          onToggleHedging={handleToggleHedging}
          onToggleTied={handleToggleTied}
          onReset={handleReset}
        />
      }
      bottomPanel={<RequestLog requests={currentResult?.requests ?? []} />}
    >
      <div className="h-full flex flex-col">
          {/* Stats row */}
          <div className="shrink-0 border-b border-j-border px-4 py-3">
            {currentResult ? (
              <div className="grid grid-cols-6 gap-3">
                <StatCard label="p50" value={currentResult.percentiles.p50.toFixed(1)} unit="ms" />
                <StatCard label="p95" value={currentResult.percentiles.p95.toFixed(1)} unit="ms" />
                <StatCard label="p99" value={currentResult.percentiles.p99.toFixed(1)} unit="ms" />
                <StatCard label="p99.9" value={currentResult.percentiles.p999.toFixed(1)} unit="ms" />
                <StatCard label="Max" value={currentResult.percentiles.max.toFixed(1)} unit="ms" />
                <StatCard
                  label="Ratio p99/p50"
                  value={
                    currentResult.percentiles.p50 > 0
                      ? (currentResult.percentiles.p99 / currentResult.percentiles.p50).toFixed(1)
                      : '-'
                  }
                  unit="x"
                />
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3">
                <StatCard label="p50" value="-" />
                <StatCard label="p95" value="-" />
                <StatCard label="p99" value="-" />
                <StatCard label="p99.9" value="-" />
                <StatCard label="Max" value="-" />
                <StatCard label="Ratio p99/p50" value="-" />
              </div>
            )}
          </div>

          {/* Histogram + percentile bars */}
          <div className="flex-1 min-h-0 flex">
            {/* Histogram */}
            <div className="flex-[3] min-w-0 p-4">
              <Histogram
                values={histogramValues.values}
                hedgedValues={histogramValues.hedged}
                tiedValues={histogramValues.tied}
                bucketCount={60}
              />
            </div>

            {/* Percentile comparison + fan-out chart */}
            <div className="flex-[2] min-w-0 border-l border-j-border p-4 flex flex-col gap-4">
              {/* Percentile comparison bars */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {currentResult ? (
                  <>
                    <span className="font-mono text-[10px] text-[#888] uppercase tracking-wider mb-3 block">
                      Comparacion de percentiles
                    </span>
                    <PercentileBar
                      label="Individual"
                      percentiles={currentResult.individualPercentiles}
                      color="#9ca3af"
                      maxValue={maxPercentileValue}
                    />
                    <PercentileBar
                      label={`Fan-out (k=${fanout})`}
                      percentiles={currentResult.percentiles}
                      color={ACCENT}
                      maxValue={maxPercentileValue}
                    />
                    {currentResult.hedgedPercentiles && (
                      <PercentileBar
                        label="Hedged"
                        percentiles={currentResult.hedgedPercentiles}
                        color="#10b981"
                        maxValue={maxPercentileValue}
                      />
                    )}
                    {currentResult.tiedPercentiles && (
                      <PercentileBar
                        label="Tied"
                        percentiles={currentResult.tiedPercentiles}
                        color="#3b82f6"
                        maxValue={maxPercentileValue}
                      />
                    )}

                    {/* Key insight callout */}
                    {fanout > 1 && (
                      <div className="mt-4 bg-[#fffbeb] border border-[#fde68a] rounded px-3 py-2">
                        <p className="font-mono text-[10px] text-[#92400e] leading-relaxed">
                          Con fan-out={fanout}, la probabilidad de que al menos 1
                          servidor sea lento es{' '}
                          <span className="font-bold">
                            {((1 - Math.pow(0.97, fanout)) * 100).toFixed(1)}%
                          </span>
                          . El p99 individual ({currentResult.individualPercentiles.p99.toFixed(0)}ms)
                          se convierte en el comportamiento comun del sistema.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="font-mono text-[11px] text-[#aaa] text-center px-4">
                      Ejecuta un batch para comparar percentiles
                    </p>
                  </div>
                )}
              </div>

              {/* Fan-out impact history */}
              <div className="h-32 shrink-0 border-t border-j-border pt-3">
                <FanoutImpactChart results={history} />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="shrink-0 border-t border-j-border">
            <ControlsPanel
              numServers={numServers}
              fanout={fanout}
              batchSize={batchSize}
              baseMean={baseMean}
              hedging={hedging}
              tied={tied}
              hedgeTimeout={hedgeTimeout}
              onNumServersChange={setNumServers}
              onFanoutChange={handleFanoutChange}
              onBatchSizeChange={setBatchSize}
              onBaseMeanChange={setBaseMean}
              onHedgingToggle={handleToggleHedging}
              onTiedToggle={handleToggleTied}
              onHedgeTimeoutChange={setHedgeTimeout}
              onRunBatch={handleRunBatch}
              onReset={handleReset}
              isRunning={isRunning}
            />
          </div>
      </div>
    </PlaygroundLayout>
  );
}
