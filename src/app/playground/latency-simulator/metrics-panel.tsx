'use client';

import type { SimulationConfig, Percentiles } from './latency-playground';

interface MetricsPanelProps {
  percentiles: Percentiles;
  totalRequests: number;
  sloTarget: number;
  sloViolations: number;
  config: SimulationConfig;
}

export function MetricsPanel({
  percentiles,
  totalRequests,
  sloTarget,
  sloViolations,
  config,
}: MetricsPanelProps) {
  const violationRate = totalRequests > 0
    ? (sloViolations / totalRequests) * 100
    : 0;

  const isWithinSLO = percentiles.p95 <= sloTarget || totalRequests === 0;

  // Error budget: for a p95 SLO, 5% of requests are allowed to exceed.
  // We track how many actually exceeded (sloViolations / totalRequests).
  const allowedViolationRate = 5; // 5% for p95 SLO
  const errorBudgetConsumed = totalRequests > 0
    ? Math.min(100, (violationRate / allowedViolationRate) * 100)
    : 0;

  const distributionLabels: Record<string, string> = {
    normal: 'Normal (campana)',
    lognormal: 'Log-normal (cola larga)',
    bimodal: 'Bimodal (dos picos)',
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#e8e6e0] flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Metricas
        </span>
        <span className={`font-mono text-[10px] px-2 py-0.5 ${
          config.isRunning
            ? 'bg-[#fef3c7] text-[#92400e]'
            : 'bg-[#f0f0ec] text-[#aaa]'
        }`}>
          {config.isRunning ? 'simulando' : 'pausado'}
        </span>
      </div>

      {/* Percentile cards */}
      <div className="px-5 py-4 border-b border-[#e8e6e0]">
        <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-3">
          Percentiles
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PercentileCard
            label="p50"
            sublabel="mediana"
            value={percentiles.p50}
            color="#4a5d4a"
            bgColor="bg-[#f0f4f0]"
          />
          <PercentileCard
            label="p95"
            sublabel="5% mas lento"
            value={percentiles.p95}
            color="#d97706"
            bgColor="bg-[#fef3c7]/40"
            highlight={!isWithinSLO}
          />
          <PercentileCard
            label="p99"
            sublabel="1% mas lento"
            value={percentiles.p99}
            color="#ea580c"
            bgColor="bg-[#fff7ed]"
          />
          <PercentileCard
            label="p99.9"
            sublabel="0.1% mas lento"
            value={percentiles.p999}
            color="#991b1b"
            bgColor="bg-[#fef2f2]"
          />
        </div>

        {/* Average */}
        <div className="mt-2 bg-[#f5f5f0] px-3 py-2 flex items-center justify-between">
          <div>
            <p className="font-mono text-[9px] text-[#a0a090] uppercase tracking-wider">
              Promedio
            </p>
            <p className="font-mono text-[10px] text-[#7a7a6e] mt-0.5">
              (puede mentir)
            </p>
          </div>
          <span className="font-mono text-lg text-[#7a7a6e] tabular-nums">
            {totalRequests > 0 ? `${percentiles.avg.toFixed(1)}ms` : '--'}
          </span>
        </div>
      </div>

      {/* SLO Status */}
      <div className="px-5 py-4 border-b border-[#e8e6e0]">
        <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-3">
          Estado del SLO
        </p>

        {/* SLO badge */}
        <div className={`px-4 py-3 mb-3 ${
          isWithinSLO
            ? 'bg-[#f0f4f0] border border-[#dde5dd]'
            : 'bg-[#fef2f2] border border-[#fecaca]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-mono text-[12px] font-medium ${
              isWithinSLO ? 'text-[#4a5d4a]' : 'text-[#991b1b]'
            }`}>
              {isWithinSLO ? 'DENTRO DEL SLO' : 'VIOLANDO SLO'}
            </span>
            <span className={`font-mono text-[10px] ${
              isWithinSLO ? 'text-[#4a5d4a]' : 'text-[#991b1b]'
            }`}>
              p95 {'<'} {sloTarget}ms
            </span>
          </div>
          {totalRequests > 0 && (
            <p className={`font-mono text-[10px] mt-1 ${
              isWithinSLO ? 'text-[#7a7a6e]' : 'text-[#991b1b]'
            }`}>
              p95 actual: {percentiles.p95.toFixed(1)}ms
            </p>
          )}
        </div>

        {/* Violation counter */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#f5f5f0] px-3 py-2">
            <p className="font-mono text-[9px] text-[#a0a090] uppercase tracking-wider">
              Violaciones
            </p>
            <p className="font-mono text-sm text-[#2c2c2c] mt-0.5 tabular-nums">
              {sloViolations.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#f5f5f0] px-3 py-2">
            <p className="font-mono text-[9px] text-[#a0a090] uppercase tracking-wider">
              Tasa de violacion
            </p>
            <p className={`font-mono text-sm mt-0.5 tabular-nums ${
              violationRate > 5 ? 'text-[#991b1b]' : 'text-[#2c2c2c]'
            }`}>
              {totalRequests > 0 ? `${violationRate.toFixed(1)}%` : '--'}
            </p>
          </div>
        </div>
      </div>

      {/* Error Budget */}
      <div className="px-5 py-4 border-b border-[#e8e6e0]">
        <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-3">
          Error Budget
        </p>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[9px] text-[#7a7a6e]">
              Budget consumido
            </span>
            <span className={`font-mono text-[11px] tabular-nums ${
              errorBudgetConsumed > 80
                ? 'text-[#991b1b]'
                : errorBudgetConsumed > 50
                  ? 'text-[#d97706]'
                  : 'text-[#4a5d4a]'
            }`}>
              {totalRequests > 0 ? `${errorBudgetConsumed.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div className="h-2.5 bg-[#f0f0ec] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                errorBudgetConsumed > 80
                  ? 'bg-[#991b1b]'
                  : errorBudgetConsumed > 50
                    ? 'bg-[#d97706]'
                    : 'bg-[#4a5d4a]'
              }`}
              style={{ width: `${Math.min(100, errorBudgetConsumed)}%` }}
            />
          </div>
          <p className="font-mono text-[9px] text-[#a0a090] mt-1">
            Permitido: {allowedViolationRate}% de requests {'>'} {sloTarget}ms
          </p>
        </div>

        {errorBudgetConsumed >= 100 && totalRequests > 0 && (
          <div className="bg-[#fef2f2] border border-[#fecaca] px-3 py-2 mt-2">
            <p className="font-mono text-[10px] text-[#991b1b] font-medium">
              ERROR BUDGET AGOTADO
            </p>
            <p className="font-mono text-[9px] text-[#991b1b]/70 mt-0.5">
              Bloquear deployments hasta recuperar
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-[#e8e6e0]">
        <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-3">
          Estadisticas
        </p>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Total requests"
            value={totalRequests.toLocaleString()}
          />
          <StatCard
            label="Throughput"
            value={config.isRunning ? `~${config.requestRate} req/s` : '0 req/s'}
          />
          <StatCard
            label="Distribucion"
            value={distributionLabels[config.distribution]}
          />
          <StatCard
            label="Fan-out"
            value={config.downstreamServices === 0
              ? 'Sin fan-out'
              : `${config.downstreamServices} servicios`}
          />
        </div>
      </div>

      {/* Distribution shape indicator */}
      <div className="px-5 py-4">
        <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-3">
          Forma de la distribucion
        </p>
        <DistributionShape distribution={config.distribution} />

        {config.downstreamServices > 0 && (
          <div className="mt-3 bg-[#fef3c7]/40 border border-[#d97706]/20 px-3 py-2">
            <p className="font-mono text-[10px] text-[#92400e] font-medium mb-1">
              Tail Latency Amplification
            </p>
            <p className="font-mono text-[9px] text-[#92400e]/70">
              Con {config.downstreamServices} servicios, la probabilidad de al menos 1 request lento
              es 1-(0.99^{config.downstreamServices}) = {((1 - Math.pow(0.99, config.downstreamServices)) * 100).toFixed(1)}% en p99.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Sub-components --------------------------------------------------------

function PercentileCard({
  label,
  sublabel,
  value,
  color,
  bgColor,
  highlight = false,
}: {
  label: string;
  sublabel: string;
  value: number;
  color: string;
  bgColor: string;
  highlight?: boolean;
}) {
  return (
    <div className={`px-3 py-2.5 ${bgColor} ${highlight ? 'ring-1 ring-[#991b1b]/30' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
        {highlight && (
          <span className="font-mono text-[8px] text-[#991b1b] bg-[#fef2f2] px-1 py-0.5">
            SLO
          </span>
        )}
      </div>
      <p className="font-mono text-lg tabular-nums mt-0.5" style={{ color }}>
        {value > 0 ? `${value.toFixed(1)}ms` : '--'}
      </p>
      <p className="font-mono text-[9px] text-[#a0a090]">
        {sublabel}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f5f5f0] px-3 py-2">
      <p className="font-mono text-[9px] text-[#a0a090] uppercase tracking-wider">
        {label}
      </p>
      <p className="font-mono text-[11px] text-[#2c2c2c] mt-0.5">
        {value}
      </p>
    </div>
  );
}

function DistributionShape({ distribution }: { distribution: string }) {
  // Simple SVG mini-chart showing the theoretical shape
  const width = 200;
  const height = 60;
  const padding = 10;

  const generatePoints = (): string => {
    const points: string[] = [];
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const x = padding + (i / steps) * chartW;
      let y: number;

      switch (distribution) {
        case 'normal': {
          const t = (i / steps - 0.5) * 6;
          const gaussian = Math.exp(-0.5 * t * t);
          y = padding + chartH - gaussian * chartH;
          break;
        }
        case 'lognormal': {
          const t = (i / steps) * 3;
          if (t <= 0) {
            y = padding + chartH;
          } else {
            const logn = (1 / (t * 0.5 * Math.sqrt(2 * Math.PI))) *
              Math.exp(-Math.pow(Math.log(t) - 0.3, 2) / (2 * 0.25));
            y = padding + chartH - Math.min(logn * 0.8, 1) * chartH;
          }
          break;
        }
        case 'bimodal': {
          const t1 = (i / steps - 0.3) * 8;
          const t2 = (i / steps - 0.75) * 8;
          const g1 = Math.exp(-0.5 * t1 * t1) * 0.9;
          const g2 = Math.exp(-0.5 * t2 * t2) * 0.4;
          y = padding + chartH - (g1 + g2) * chartH;
          break;
        }
        default: {
          y = padding + chartH;
        }
      }

      points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${Math.max(padding, y).toFixed(1)}`);
    }

    return points.join(' ');
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: '70px' }}>
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        fill="#faf9f6"
        stroke="#e8e6e0"
        strokeWidth={0.5}
      />
      <path
        d={generatePoints()}
        fill="none"
        stroke="#d97706"
        strokeWidth={1.5}
      />
      <text
        x={width / 2}
        y={height - 1}
        fill="#a0a090"
        fontSize={7}
        fontFamily="monospace"
        textAnchor="middle"
      >
        latencia →
      </text>
    </svg>
  );
}
