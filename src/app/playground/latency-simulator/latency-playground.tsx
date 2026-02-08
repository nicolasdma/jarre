'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LessonGuide } from './lesson-guide';
import { ControlPanel } from './control-panel';
import { MetricsPanel } from './metrics-panel';
import { TabbedSidebar } from '@/components/playground/tabbed-sidebar';
import { TutorPanel } from '@/components/playground/tutor-panel';

export interface SimulationConfig {
  isRunning: boolean;
  requestRate: number;
  distribution: 'normal' | 'lognormal' | 'bimodal';
  baseLatency: number;
  stdDev: number;
  slowRequestRate: number;
  slowLatencyMultiplier: number;
  downstreamServices: number;
  sloTarget: number;
}

export interface RequestData {
  id: number;
  latency: number;
  timestamp: number;
}

export interface Percentiles {
  p50: number;
  p95: number;
  p99: number;
  p999: number;
  avg: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
  isRunning: false,
  requestRate: 10,
  distribution: 'normal',
  baseLatency: 50,
  stdDev: 10,
  slowRequestRate: 10,
  slowLatencyMultiplier: 10,
  downstreamServices: 0,
  sloTarget: 200,
};

const PRESETS: Record<string, Partial<SimulationConfig>> = {
  baseline: {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'normal',
    downstreamServices: 0,
    sloTarget: 200,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  lognormal: {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'lognormal',
    downstreamServices: 0,
    sloTarget: 200,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  bimodal: {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'bimodal',
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
    downstreamServices: 0,
    sloTarget: 200,
  },
  fanout: {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'normal',
    downstreamServices: 3,
    sloTarget: 200,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  highload: {
    requestRate: 50,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'normal',
    downstreamServices: 0,
    sloTarget: 200,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  cascade: {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'lognormal',
    downstreamServices: 4,
    sloTarget: 200,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  'slo-lognormal': {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'lognormal',
    downstreamServices: 0,
    sloTarget: 100,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  'bimodal-5': {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'bimodal',
    slowRequestRate: 5,
    slowLatencyMultiplier: 10,
    downstreamServices: 0,
    sloTarget: 200,
  },
  'gc-pauses': {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'bimodal',
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
    downstreamServices: 0,
    sloTarget: 200,
  },
  'rate-100': {
    requestRate: 100,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'normal',
    downstreamServices: 0,
    sloTarget: 200,
    slowRequestRate: 10,
    slowLatencyMultiplier: 10,
  },
  'error-budget': {
    requestRate: 10,
    baseLatency: 50,
    stdDev: 10,
    distribution: 'bimodal',
    slowRequestRate: 5,
    slowLatencyMultiplier: 10,
    downstreamServices: 0,
    sloTarget: 100,
  },
};

const ROLLING_WINDOW = 1000;
const MAX_HISTORY = 50;

/** Box-Muller transform: generate a standard normal random variate. */
function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Generate a single latency sample based on distribution config. */
function generateLatency(config: SimulationConfig): number {
  const { distribution, baseLatency, stdDev, slowRequestRate, slowLatencyMultiplier } = config;

  switch (distribution) {
    case 'normal': {
      const sample = baseLatency + gaussianRandom() * stdDev;
      return Math.max(1, sample);
    }
    case 'lognormal': {
      const mu = Math.log(baseLatency);
      const sigma = 0.5;
      const sample = Math.exp(mu + gaussianRandom() * sigma);
      return Math.max(1, sample);
    }
    case 'bimodal': {
      if (Math.random() * 100 < slowRequestRate) {
        const slowBase = baseLatency * slowLatencyMultiplier;
        const sample = slowBase + gaussianRandom() * (stdDev * 2);
        return Math.max(1, sample);
      }
      const sample = baseLatency + gaussianRandom() * stdDev;
      return Math.max(1, sample);
    }
    default:
      return baseLatency;
  }
}

/** Apply tail latency amplification: fan-out to N services, take max. */
function applyFanOut(config: SimulationConfig): number {
  if (config.downstreamServices <= 0) {
    return generateLatency(config);
  }

  let maxLatency = 0;
  for (let i = 0; i < config.downstreamServices; i++) {
    const sample = generateLatency(config);
    if (sample > maxLatency) maxLatency = sample;
  }
  return maxLatency;
}

/** Calculate percentiles from an array of latencies. */
function calculatePercentiles(latencies: number[]): Percentiles {
  if (latencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, p999: 0, avg: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const len = sorted.length;

  const percentile = (p: number): number => {
    const idx = Math.ceil((p / 100) * len) - 1;
    return sorted[Math.max(0, idx)];
  };

  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    p50: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    p999: percentile(99.9),
    avg: sum / len,
  };
}

export function LatencyPlayground() {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [percentiles, setPercentiles] = useState<Percentiles>({
    p50: 0, p95: 0, p99: 0, p999: 0, avg: 0,
  });
  const [percentileHistory, setPercentileHistory] = useState<Percentiles[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [sloViolations, setSloViolations] = useState(0);

  const nextIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for values used inside the interval callback to avoid stale closures
  const configRef = useRef(config);
  configRef.current = config;

  const requestsRef = useRef(requests);
  requestsRef.current = requests;

  const totalRequestsRef = useRef(totalRequests);
  totalRequestsRef.current = totalRequests;

  const sloViolationsRef = useRef(sloViolations);
  sloViolationsRef.current = sloViolations;

  const [proactiveQuestion, setProactiveQuestion] = useState<string | null>(null);
  const lastProactiveRef = useRef(0);

  // Start/stop simulation
  useEffect(() => {
    if (config.isRunning) {
      intervalRef.current = setInterval(() => {
        const currentConfig = configRef.current;
        const batchSize = Math.max(1, Math.round(currentConfig.requestRate / 10));
        const now = Date.now();
        const newRequests: RequestData[] = [];

        for (let i = 0; i < batchSize; i++) {
          const latency = applyFanOut(currentConfig);
          newRequests.push({
            id: nextIdRef.current++,
            latency,
            timestamp: now,
          });
        }

        // Update requests with rolling window
        const updatedRequests = [...requestsRef.current, ...newRequests].slice(-ROLLING_WINDOW);
        const latencies = updatedRequests.map(r => r.latency);
        const newPercentiles = calculatePercentiles(latencies);

        // Count SLO violations in this batch
        const batchViolations = newRequests.filter(
          r => r.latency > currentConfig.sloTarget
        ).length;

        setRequests(updatedRequests);
        setPercentiles(newPercentiles);
        setTotalRequests(prev => prev + newRequests.length);
        setSloViolations(prev => prev + batchViolations);
        setPercentileHistory(prev => [...prev, newPercentiles].slice(-MAX_HISTORY));
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [config.isRunning]);

  // Proactive tutor trigger: SLO violation rate >10% or p99 > 3x p50
  useEffect(() => {
    if (totalRequests < 50) return;
    const violationRate = (sloViolations / totalRequests) * 100;
    const p99TooHigh = percentiles.p50 > 0 && percentiles.p99 > percentiles.p50 * 3;
    if (violationRate <= 10 && !p99TooHigh) return;

    const now = Date.now();
    if (now - lastProactiveRef.current < 30000) return;
    lastProactiveRef.current = now;

    fetch('/api/playground/tutor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playground: 'latency',
        state: { config, percentiles, totalRequests, sloViolations },
        history: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.question) setProactiveQuestion(data.question);
      })
      .catch(() => {});
  }, [totalRequests, sloViolations, percentiles]);

  const handleConfigChange = useCallback((updates: Partial<SimulationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const handleApplyPreset = useCallback((presetName: string) => {
    const preset = PRESETS[presetName];
    if (!preset) return;

    // Reset data when applying a preset
    setRequests([]);
    setPercentiles({ p50: 0, p95: 0, p99: 0, p999: 0, avg: 0 });
    setPercentileHistory([]);
    setTotalRequests(0);
    setSloViolations(0);
    nextIdRef.current = 0;

    setConfig(prev => ({
      ...prev,
      ...preset,
      isRunning: true,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig(prev => ({ ...prev, isRunning: false }));
    setRequests([]);
    setPercentiles({ p50: 0, p95: 0, p99: 0, p999: 0, avg: 0 });
    setPercentileHistory([]);
    setTotalRequests(0);
    setSloViolations(0);
    nextIdRef.current = 0;
  }, []);

  return (
    <div className="h-full flex">
      {/* Left: Lesson Guide */}
      <div className="flex-[2] shrink-0 border-r border-[#e8e6e0] overflow-hidden">
        <TabbedSidebar
          lessons={
            <LessonGuide
              onApplyPreset={handleApplyPreset}
              currentConfig={config}
            />
          }
          tutor={
            <TutorPanel
              playground="latency"
              getState={() => ({ config, percentiles, totalRequests, sloViolations })}
              accentColor="#d97706"
              proactiveQuestion={proactiveQuestion}
              onDismissProactive={() => setProactiveQuestion(null)}
            />
          }
          hasNotification={!!proactiveQuestion}
          accentColor="#d97706"
        />
      </div>

      {/* Center: Control Panel */}
      <div className="flex-[4] min-w-0 border-r border-[#e8e6e0]">
        <ControlPanel
          config={config}
          onConfigChange={handleConfigChange}
          onReset={handleReset}
          requests={requests}
          percentiles={percentiles}
          percentileHistory={percentileHistory}
        />
      </div>

      {/* Right: Metrics */}
      <div className="flex-[3] min-w-0 overflow-y-auto">
        <MetricsPanel
          percentiles={percentiles}
          totalRequests={totalRequests}
          sloTarget={config.sloTarget}
          sloViolations={sloViolations}
          config={config}
        />
      </div>
    </div>
  );
}
