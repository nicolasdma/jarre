'use client';

import { useMemo } from 'react';
import type { PartitionNode, PartitionMode } from './partition-playground';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PartitionStatsProps {
  nodes: PartitionNode[];
  lastRebalance: { moved: number; total: number } | null;
  mode: PartitionMode;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function modeLabel(mode: PartitionMode): string {
  switch (mode) {
    case 'simple-hash': return 'Hash Simple (key % N)';
    case 'consistent-hash': return 'Consistent Hashing';
    case 'range': return 'Range Partitioning';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PartitionStats({ nodes, lastRebalance, mode }: PartitionStatsProps) {
  const stats = useMemo(() => {
    const counts = nodes.map(n => n.keys.length);
    const totalKeys = counts.reduce((a, b) => a + b, 0);
    const min = counts.length > 0 ? Math.min(...counts) : 0;
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    const avg = counts.length > 0 ? totalKeys / counts.length : 0;
    const skew = avg > 0 ? max / avg : 0;
    return { counts, totalKeys, min, max, avg, skew };
  }, [nodes]);

  const maxBarWidth = Math.max(...stats.counts, 1);

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Estadisticas
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {modeLabel(mode)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Total Keys" value={stats.totalKeys.toString()} />
          <MetricCard label="Total Nodos" value={nodes.length.toString()} />
          <MetricCard label="Min / Nodo" value={stats.min.toString()} />
          <MetricCard label="Max / Nodo" value={stats.max.toString()} />
          <MetricCard label="Promedio" value={stats.avg.toFixed(1)} />
          <MetricCard
            label="Skew Ratio"
            value={stats.skew.toFixed(2)}
            highlight={stats.skew > 1.5}
          />
        </div>

        {/* Keys per node bar chart */}
        <div>
          <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-3">
            Keys por Nodo
          </p>
          {nodes.length === 0 ? (
            <p className="font-mono text-[11px] text-[#c0c0b0]">Sin nodos</p>
          ) : (
            <div className="space-y-2">
              {nodes.map((node, i) => {
                const count = stats.counts[i];
                const pct = maxBarWidth > 0 ? (count / maxBarWidth) * 100 : 0;
                return (
                  <div key={node.id} className="flex items-center gap-2">
                    {/* Node label */}
                    <div className="flex items-center gap-1.5 w-12 shrink-0">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: node.color }}
                      />
                      <span className="font-mono text-[11px] text-j-text font-medium">
                        {node.label}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 h-5 bg-[#f0efe8] rounded-sm overflow-hidden relative">
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          width: `${Math.max(pct, 0.5)}%`,
                          backgroundColor: node.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>

                    {/* Count */}
                    <span className="font-mono text-[11px] text-j-text w-8 text-right tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Skew Indicator */}
        {nodes.length > 1 && stats.totalKeys > 0 && (
          <div className="p-3 bg-[#f0efe8] border-l-2 border-[#059669]">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
              Distribucion
            </p>
            <div className="flex items-center gap-2">
              <SkewBar skew={stats.skew} />
              <span className="font-mono text-[11px] text-j-text">
                {stats.skew <= 1.2
                  ? 'Excelente'
                  : stats.skew <= 1.5
                    ? 'Aceptable'
                    : stats.skew <= 2.0
                      ? 'Desbalanceada'
                      : 'Muy desbalanceada'}
              </span>
            </div>
            <p className="font-mono text-[10px] text-j-text-secondary mt-1">
              Skew = max/avg. Ideal: 1.0 (todos iguales).
              {stats.skew > 1.5 && ' El nodo mas cargado tiene mucho mas que el promedio.'}
            </p>
          </div>
        )}

        {/* Last rebalance */}
        {lastRebalance && (
          <div className="p-3 bg-[#f0efe8] border-l-2 border-[#d97706]">
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-1">
              Ultimo Rebalance
            </p>
            <p className="font-mono text-[13px] text-j-text font-medium">
              {lastRebalance.moved} de {lastRebalance.total} keys movidas
            </p>
            <div className="mt-1.5 h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${lastRebalance.total > 0 ? (lastRebalance.moved / lastRebalance.total) * 100 : 0}%`,
                  backgroundColor: lastRebalance.moved / lastRebalance.total > 0.5
                    ? '#dc2626'
                    : lastRebalance.moved / lastRebalance.total > 0.2
                      ? '#d97706'
                      : '#059669',
                }}
              />
            </div>
            <p className="font-mono text-[10px] text-j-text-secondary mt-1">
              {lastRebalance.total > 0
                ? `${((lastRebalance.moved / lastRebalance.total) * 100).toFixed(1)}% de las keys se movieron.`
                : 'Sin keys.'}
              {lastRebalance.moved / lastRebalance.total > 0.5
                ? ' Esto es costoso en produccion — cada key movida es trafico de red.'
                : lastRebalance.moved / lastRebalance.total <= 0.2
                  ? ' Excelente — minima redistribucion.'
                  : ''}
            </p>
          </div>
        )}

        {/* Key list (truncated) */}
        {stats.totalKeys > 0 && (
          <div>
            <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mb-2">
              Keys ({stats.totalKeys} total)
            </p>
            <div className="max-h-[200px] overflow-y-auto space-y-px">
              {nodes.map(node => (
                node.keys.length > 0 && (
                  <div key={node.id} className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: node.color }}
                      />
                      <span className="font-mono text-[10px] text-j-text-secondary">
                        Nodo {node.label} ({node.keys.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-3.5">
                      {node.keys.slice(0, 20).map((key, ki) => (
                        <span
                          key={ki}
                          className="font-mono text-[9px] px-1 py-0.5 bg-[#f0efe8] text-[#555] rounded-sm"
                        >
                          {key}
                        </span>
                      ))}
                      {node.keys.length > 20 && (
                        <span className="font-mono text-[9px] text-[#a0a090] px-1 py-0.5">
                          +{node.keys.length - 20} mas
                        </span>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 border ${highlight ? 'border-[#dc2626] bg-red-50' : 'border-j-border bg-white'}`}>
      <p className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider">
        {label}
      </p>
      <p className={`font-mono text-[18px] font-bold tabular-nums ${highlight ? 'text-[#dc2626]' : 'text-j-text'}`}>
        {value}
      </p>
    </div>
  );
}

function SkewBar({ skew }: { skew: number }) {
  // Map skew 1.0 - 3.0 to 0% - 100%
  const pct = Math.min(((skew - 1) / 2) * 100, 100);
  const color = skew <= 1.2
    ? '#059669'
    : skew <= 1.5
      ? '#d97706'
      : '#dc2626';

  return (
    <div className="w-16 h-2 bg-white rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: color }}
      />
    </div>
  );
}
