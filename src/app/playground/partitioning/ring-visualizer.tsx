'use client';

import { useState, useMemo } from 'react';
import type { PartitionState, PartitionMode } from './partition-playground';
import { buildRing } from './partition-playground';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RingVisualizerProps {
  state: PartitionState;
  onAddNode: () => void;
  onRemoveNode: () => void;
  onAddKeys: (count: number) => void;
  onSearchKey: (key: string) => void;
  onSetMode: (mode: PartitionMode) => void;
  onSetVirtualNodes: (n: number) => void;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// SVG math helpers
// ---------------------------------------------------------------------------

const CX = 200;
const CY = 200;
const RING_RADIUS = 160;
const KEY_RADIUS = 140;
const LABEL_RADIUS = 185;
const TICK_INNER = 154;
const TICK_OUTER = 166;
const MAX_HASH = 0xFFFFFFFF;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  // Normalize: if endAngle < startAngle, we wrap around
  let sweep = endAngle - startAngle;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// ---------------------------------------------------------------------------
// Ring View (simple-hash and consistent-hash)
// ---------------------------------------------------------------------------

function RingView({ state }: { state: PartitionState }) {
  const { nodes, keys, mode, virtualNodesPerNode, searchKey } = state;

  const ring = useMemo(() => {
    if (mode === 'consistent-hash') {
      return buildRing(nodes, virtualNodesPerNode);
    }
    return [];
  }, [nodes, mode, virtualNodesPerNode]);

  // Build arc segments for consistent hashing
  const arcSegments = useMemo(() => {
    if (mode !== 'consistent-hash' || ring.length === 0) return [];
    const segments: Array<{
      startAngle: number;
      endAngle: number;
      nodeId: string;
      color: string;
    }> = [];

    for (let i = 0; i < ring.length; i++) {
      const currentAngle = (ring[i].hash / MAX_HASH) * 360;
      const nextIdx = (i + 1) % ring.length;
      const nextAngle = (ring[nextIdx].hash / MAX_HASH) * 360;
      const ownerNode = nodes.find(n => n.id === ring[nextIdx].nodeId);
      segments.push({
        startAngle: currentAngle,
        endAngle: nextAngle === 0 && nextIdx === 0 ? 360 : nextAngle,
        nodeId: ring[nextIdx].nodeId,
        color: ownerNode?.color ?? '#ccc',
      });
    }
    return segments;
  }, [ring, nodes, mode]);

  // Build arc segments for simple hash (equal slices)
  const simpleSegments = useMemo(() => {
    if (mode !== 'simple-hash' || nodes.length === 0) return [];
    const sliceAngle = 360 / nodes.length;
    return nodes.map((node, i) => ({
      startAngle: i * sliceAngle,
      endAngle: (i + 1) * sliceAngle,
      nodeId: node.id,
      color: node.color,
    }));
  }, [nodes, mode]);

  const segments = mode === 'consistent-hash' ? arcSegments : simpleSegments;

  // Virtual node ticks for consistent hashing
  const vnodeTicks = useMemo(() => {
    if (mode !== 'consistent-hash') return [];
    return ring.map((vn, i) => {
      const angle = (vn.hash / MAX_HASH) * 360;
      const inner = polarToXY(CX, CY, TICK_INNER, angle);
      const outer = polarToXY(CX, CY, TICK_OUTER, angle);
      const ownerNode = nodes.find(n => n.id === vn.nodeId);
      return { key: `vn-${i}`, inner, outer, color: ownerNode?.color ?? '#ccc' };
    });
  }, [ring, nodes, mode]);

  // Key dots
  const keyDots = useMemo(() => {
    return keys.map(entry => {
      const angle = entry.position; // already 0-360
      const pos = polarToXY(CX, CY, KEY_RADIUS, angle);
      const ownerNode = nodes.find(n => n.id === entry.nodeId);
      return {
        key: entry.key,
        x: pos.x,
        y: pos.y,
        color: ownerNode?.color ?? '#ccc',
        angle,
      };
    });
  }, [keys, nodes]);

  // Search highlight
  const searchHighlight = useMemo(() => {
    if (!searchKey) return null;
    const entry = keys.find(k => k.key === searchKey);
    if (!entry) return null;
    const ownerNode = nodes.find(n => n.id === entry.nodeId);
    const angle = entry.position;
    const keyPos = polarToXY(CX, CY, KEY_RADIUS, angle);

    // Find the arc midpoint for the owning node
    const seg = segments.find(s => s.nodeId === entry.nodeId);
    let labelPos = { x: CX, y: CY };
    if (seg) {
      const midAngle = seg.startAngle + ((seg.endAngle - seg.startAngle) / 2);
      labelPos = polarToXY(CX, CY, LABEL_RADIUS, midAngle);
    }
    return {
      keyPos,
      labelPos,
      color: ownerNode?.color ?? '#ccc',
      nodeLabel: ownerNode?.label ?? '?',
    };
  }, [searchKey, keys, nodes, segments]);

  // Node labels around the ring
  const nodeLabels = useMemo(() => {
    if (mode === 'simple-hash') {
      const sliceAngle = 360 / (nodes.length || 1);
      return nodes.map((node, i) => {
        const midAngle = i * sliceAngle + sliceAngle / 2;
        const pos = polarToXY(CX, CY, LABEL_RADIUS + 8, midAngle);
        return { ...pos, label: node.label, color: node.color };
      });
    }
    // For consistent hash, place labels at the first virtual node of each physical node
    const placed = new Set<string>();
    const labels: Array<{ x: number; y: number; label: string; color: string }> = [];
    for (const vn of ring) {
      if (!placed.has(vn.nodeId)) {
        placed.add(vn.nodeId);
        const angle = (vn.hash / MAX_HASH) * 360;
        const pos = polarToXY(CX, CY, LABEL_RADIUS + 8, angle);
        const node = nodes.find(n => n.id === vn.nodeId);
        if (node) {
          labels.push({ ...pos, label: node.label, color: node.color });
        }
      }
    }
    return labels;
  }, [nodes, ring, mode]);

  const modeLabel = mode === 'simple-hash' ? 'Hash Simple' : 'Consistent Hash';

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full max-h-[400px]">
      {/* Background ring */}
      <circle cx={CX} cy={CY} r={RING_RADIUS} fill="none" stroke="#e8e6e0" strokeWidth="16" />

      {/* Arc segments */}
      {segments.map((seg, i) => {
        // Avoid drawing arcs where start === end
        if (Math.abs(seg.endAngle - seg.startAngle) < 0.01) return null;
        // For full circle case (single node)
        if (segments.length === 1) {
          return (
            <circle
              key={`seg-${i}`}
              cx={CX} cy={CY} r={RING_RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              opacity={0.6}
            />
          );
        }
        return (
          <path
            key={`seg-${i}`}
            d={describeArc(CX, CY, RING_RADIUS, seg.startAngle, seg.endAngle)}
            fill="none"
            stroke={seg.color}
            strokeWidth="16"
            opacity={0.6}
            strokeLinecap="butt"
          />
        );
      })}

      {/* Virtual node ticks */}
      {vnodeTicks.map(tick => (
        <line
          key={tick.key}
          x1={tick.inner.x} y1={tick.inner.y}
          x2={tick.outer.x} y2={tick.outer.y}
          stroke={tick.color}
          strokeWidth="2"
          opacity={0.8}
        />
      ))}

      {/* Key dots */}
      {keyDots.map((dot, i) => (
        <circle
          key={`key-${i}`}
          cx={dot.x} cy={dot.y}
          r={searchHighlight?.keyPos.x === dot.x && searchHighlight?.keyPos.y === dot.y ? 5 : 2.5}
          fill={dot.color}
          opacity={searchHighlight
            ? (dot.key === searchKey ? 1 : 0.15)
            : 0.7}
        />
      ))}

      {/* Search highlight: line from key to node label area */}
      {searchHighlight && (
        <>
          <line
            x1={searchHighlight.keyPos.x} y1={searchHighlight.keyPos.y}
            x2={CX} y2={CY}
            stroke={searchHighlight.color}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.6}
          />
          <circle
            cx={searchHighlight.keyPos.x} cy={searchHighlight.keyPos.y}
            r="6" fill="none" stroke={searchHighlight.color} strokeWidth="2"
          />
        </>
      )}

      {/* Node labels */}
      {nodeLabels.map((nl, i) => (
        <g key={`label-${i}`}>
          <circle cx={nl.x} cy={nl.y} r="10" fill={nl.color} opacity={0.9} />
          <text
            x={nl.x} y={nl.y}
            textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace"
          >
            {nl.label}
          </text>
        </g>
      ))}

      {/* Center label */}
      <text
        x={CX} y={CY - 10}
        textAnchor="middle" dominantBaseline="central"
        fill="#7a7a6e" fontSize="11" fontFamily="monospace"
      >
        {modeLabel}
      </text>
      <text
        x={CX} y={CY + 8}
        textAnchor="middle" dominantBaseline="central"
        fill="#2c2c2c" fontSize="13" fontWeight="bold" fontFamily="monospace"
      >
        {keys.length} keys
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Range Bar View
// ---------------------------------------------------------------------------

function RangeBarView({ state }: { state: PartitionState }) {
  const { nodes, keys, searchKey } = state;

  const rangeSize = nodes.length > 0 ? Math.ceil(256 / nodes.length) : 256;

  // Build segments
  const segments = useMemo(() => {
    return nodes.map((node, i) => {
      const start = i * rangeSize;
      const end = i === nodes.length - 1 ? 256 : (i + 1) * rangeSize;
      return {
        node,
        startPct: (start / 256) * 100,
        widthPct: ((end - start) / 256) * 100,
        startChar: String.fromCharCode(Math.max(start, 32)),
        endChar: String.fromCharCode(Math.min(end - 1, 126)),
      };
    });
  }, [nodes, rangeSize]);

  const searchEntry = searchKey ? keys.find(k => k.key === searchKey) : null;

  return (
    <div className="px-6 py-4">
      {/* Range labels above the bar */}
      <div className="relative h-6 mb-1">
        {segments.map((seg, i) => (
          <div
            key={`label-${i}`}
            className="absolute text-center"
            style={{
              left: `${seg.startPct}%`,
              width: `${seg.widthPct}%`,
            }}
          >
            <span className="font-mono text-[10px] text-[#7a7a6e]">
              {seg.node.label}
            </span>
          </div>
        ))}
      </div>

      {/* The bar */}
      <div className="relative h-10 flex rounded overflow-hidden border border-[#e8e6e0]">
        {segments.map((seg, i) => (
          <div
            key={`bar-${i}`}
            className="h-full relative"
            style={{
              width: `${seg.widthPct}%`,
              backgroundColor: seg.node.color,
              opacity: 0.6,
            }}
          >
            {i > 0 && (
              <div className="absolute left-0 top-0 bottom-0 w-px bg-white/50" />
            )}
          </div>
        ))}
      </div>

      {/* Key ticks above */}
      <div className="relative h-8 mt-1">
        {keys.map((entry, i) => {
          const pct = (entry.position / 256) * 100;
          const isHighlighted = searchEntry?.key === entry.key;
          const ownerNode = nodes.find(n => n.id === entry.nodeId);
          return (
            <div
              key={`tick-${i}`}
              className="absolute"
              style={{
                left: `${pct}%`,
                top: 0,
              }}
            >
              <div
                className="w-px"
                style={{
                  height: isHighlighted ? '24px' : '12px',
                  backgroundColor: ownerNode?.color ?? '#ccc',
                  opacity: searchEntry
                    ? (isHighlighted ? 1 : 0.15)
                    : 0.6,
                }}
              />
              {isHighlighted && (
                <span className="font-mono text-[9px] text-[#2c2c2c] whitespace-nowrap absolute top-6 -translate-x-1/2">
                  {entry.key}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Boundary labels */}
      <div className="relative h-4 mt-1">
        {segments.map((seg, i) => (
          <div
            key={`bound-${i}`}
            className="absolute"
            style={{ left: `${seg.startPct}%` }}
          >
            <span className="font-mono text-[9px] text-[#a0a090]">
              {seg.startChar}
            </span>
          </div>
        ))}
        <div className="absolute right-0">
          <span className="font-mono text-[9px] text-[#a0a090]">~</span>
        </div>
      </div>

      {/* Center info */}
      <div className="text-center mt-4">
        <span className="font-mono text-[11px] text-[#7a7a6e]">Range Partitioning</span>
        <span className="mx-2 text-[#e8e6e0]">|</span>
        <span className="font-mono text-[13px] text-[#2c2c2c] font-bold">{keys.length} keys</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controls Bar
// ---------------------------------------------------------------------------

function ControlsBar({
  state,
  searchInput,
  setSearchInput,
  onAddNode,
  onRemoveNode,
  onAddKeys,
  onSearchKey,
  onSetMode,
  onSetVirtualNodes,
  onClear,
}: RingVisualizerProps & { searchInput: string; setSearchInput: (v: string) => void }) {
  const modes: { value: PartitionMode; label: string }[] = [
    { value: 'simple-hash', label: 'Hash Simple' },
    { value: 'consistent-hash', label: 'Consistent Hash' },
    { value: 'range', label: 'Range' },
  ];

  return (
    <div className="px-4 py-3 border-t border-[#e8e6e0] bg-[#faf9f6] space-y-3">
      {/* Mode selector */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider mr-2 shrink-0">
          Modo
        </span>
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => onSetMode(m.value)}
            className={`px-3 py-1 font-mono text-[11px] border transition-colors ${
              state.mode === m.value
                ? 'bg-[#059669] text-white border-[#059669]'
                : 'bg-white text-[#7a7a6e] border-[#e8e6e0] hover:border-[#059669] hover:text-[#059669]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onAddNode}
          disabled={state.nodes.length >= 8}
          className="px-3 py-1 font-mono text-[11px] bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          + Nodo
        </button>
        <button
          onClick={onRemoveNode}
          disabled={state.nodes.length <= 1}
          className="px-3 py-1 font-mono text-[11px] bg-white text-[#7a7a6e] border border-[#e8e6e0] hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          - Nodo
        </button>
        <div className="w-px h-4 bg-[#e8e6e0]" />
        <button
          onClick={() => onAddKeys(10)}
          disabled={state.nodes.length === 0}
          className="px-3 py-1 font-mono text-[11px] bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +10 Keys
        </button>
        <button
          onClick={() => onAddKeys(50)}
          disabled={state.nodes.length === 0}
          className="px-3 py-1 font-mono text-[11px] bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +50 Keys
        </button>
        <div className="w-px h-4 bg-[#e8e6e0]" />

        {/* Search */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSearchKey(searchInput);
            }}
            placeholder="Buscar key..."
            className="px-2 py-1 w-32 font-mono text-[11px] border border-[#e8e6e0] bg-white text-[#2c2c2c] placeholder:text-[#c0c0b0] focus:outline-none focus:border-[#059669]"
          />
          <button
            onClick={() => onSearchKey(searchInput)}
            className="px-2 py-1 font-mono text-[11px] bg-white text-[#7a7a6e] border border-[#e8e6e0] hover:border-[#059669] hover:text-[#059669] transition-colors"
          >
            Buscar
          </button>
        </div>

        <div className="w-px h-4 bg-[#e8e6e0]" />
        <button
          onClick={onClear}
          className="px-3 py-1 font-mono text-[11px] text-[#dc2626] bg-white border border-[#e8e6e0] hover:border-[#dc2626] transition-colors"
        >
          Limpiar todo
        </button>
      </div>

      {/* Virtual nodes slider (only for consistent hash) */}
      {state.mode === 'consistent-hash' && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#a0a090] uppercase tracking-wider shrink-0">
            Virtual Nodes
          </span>
          <input
            type="range"
            min={1}
            max={150}
            value={state.virtualNodesPerNode}
            onChange={e => onSetVirtualNodes(parseInt(e.target.value, 10))}
            className="flex-1 max-w-[200px] accent-[#059669]"
          />
          <span className="font-mono text-[12px] text-[#2c2c2c] w-8 text-right">
            {state.virtualNodesPerNode}
          </span>
          <span className="font-mono text-[10px] text-[#a0a090]">
            (total: {state.virtualNodesPerNode * state.nodes.length} en el anillo)
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RingVisualizer(props: RingVisualizerProps) {
  const { state } = props;
  const [searchInput, setSearchInput] = useState('');

  const handleSearchKey = (key: string) => {
    setSearchInput(key);
    props.onSearchKey(key);
  };

  return (
    <div className="h-full flex flex-col bg-[#faf9f6]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#e8e6e0] flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Visualizacion
        </span>
        <span className="font-mono text-[10px] text-[#a0a090]">
          {state.nodes.length} nodos
        </span>
      </div>

      {/* Visualization */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-2 overflow-hidden">
        {state.nodes.length === 0 ? (
          <div className="text-center">
            <p className="font-mono text-[13px] text-[#7a7a6e] mb-2">
              Sin nodos
            </p>
            <p className="font-mono text-[11px] text-[#a0a090]">
              Agrega nodos desde la guia o los controles
            </p>
          </div>
        ) : state.mode === 'range' ? (
          <div className="w-full">
            <RangeBarView state={state} />
          </div>
        ) : (
          <RingView state={state} />
        )}
      </div>

      {/* Controls */}
      <ControlsBar
        {...props}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSearchKey={handleSearchKey}
      />
    </div>
  );
}
