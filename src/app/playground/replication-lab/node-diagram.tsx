'use client';

import { useRef, useEffect, useState } from 'react';
import type { ReplicationNode, ReplicationMessage, SimConfig, DataEntry } from './replication-playground';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NodeDiagramProps {
  nodes: ReplicationNode[];
  messages: ReplicationMessage[];
  config: SimConfig;
  onWrite: () => void;
  onReadFromNode: (nodeId: string) => void;
  onCrashNode: (nodeId: string) => void;
  onRecoverNode: (nodeId: string) => void;
  onPartition: () => void;
  onHeal: () => void;
  onToggleMode: () => void;
  onDelayChange: (delay: number) => void;
  isPartitioned: boolean;
  violations: string[];
}

// ---------------------------------------------------------------------------
// Node positions in SVG coordinate space
// ---------------------------------------------------------------------------

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'leader': { x: 300, y: 90 },
  'follower-1': { x: 140, y: 310 },
  'follower-2': { x: 460, y: 310 },
};

const NODE_RADIUS = 52;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeColor(status: ReplicationNode['status']): string {
  switch (status) {
    case 'healthy': return '#4a5d4a';
    case 'crashed': return '#991b1b';
    case 'partitioned': return '#d97706';
  }
}

function getNodeStrokeDash(status: ReplicationNode['status']): string {
  switch (status) {
    case 'healthy': return 'none';
    case 'crashed': return 'none';
    case 'partitioned': return '6,4';
  }
}

function getRoleBadgeColor(role: ReplicationNode['role']): string {
  return role === 'leader' ? '#2d4a6a' : '#7a7a6e';
}

function getMessageColor(type: ReplicationMessage['type']): string {
  switch (type) {
    case 'write': return '#2d4a6a';
    case 'replicate': return '#4a5d4a';
    case 'ack': return '#999';
  }
}

function interpolate(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getLastEntries(data: Map<string, DataEntry>, count: number): Array<[string, DataEntry]> {
  const entries = Array.from(data.entries());
  // Sort by version descending, take last N
  entries.sort((a, b) => b[1].version - a[1].version);
  return entries.slice(0, count);
}

function getMaxVersion(data: Map<string, DataEntry>): number {
  let max = 0;
  for (const entry of data.values()) {
    if (entry.version > max) max = entry.version;
  }
  return max;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NodeDiagram({
  nodes,
  messages,
  config,
  onWrite,
  onReadFromNode,
  onCrashNode,
  onRecoverNode,
  onPartition,
  onHeal,
  onToggleMode,
  onDelayChange,
  isPartitioned,
  violations,
}: NodeDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animFrame, setAnimFrame] = useState(0);

  // Animation loop for smooth message movement
  useEffect(() => {
    if (messages.length === 0) return;
    let raf: number;
    const tick = () => {
      setAnimFrame(f => f + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [messages.length > 0]);

  const leader = nodes.find(n => n.role === 'leader');
  const follower1 = nodes.find(n => n.id === 'follower-1');
  const follower2 = nodes.find(n => n.id === 'follower-2');

  // Build connections: leader -> follower-1, leader -> follower-2
  const connections: Array<{ from: string; to: string }> = [];
  if (leader) {
    for (const n of nodes) {
      if (n.id !== leader.id) {
        connections.push({ from: leader.id, to: n.id });
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#faf9f6]">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#e8e6e0] flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Cluster
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#a0a090]">
            Modo: <span className="text-[#2d4a6a] font-medium">{config.mode.toUpperCase()}</span>
          </span>
          <span className="font-mono text-[10px] text-[#a0a090]">
            Delay: <span className="text-[#2d4a6a] font-medium">{config.replicationDelay}ms</span>
          </span>
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="flex-1 min-h-0 p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 600 400"
          className="w-full h-full"
          style={{ maxHeight: '100%' }}
        >
          {/* Definitions */}
          <defs>
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Connections */}
          {connections.map(conn => {
            const fromPos = NODE_POSITIONS[conn.from] ?? NODE_POSITIONS['leader'];
            const toPos = NODE_POSITIONS[conn.to] ?? NODE_POSITIONS['follower-1'];
            const toNode = nodes.find(n => n.id === conn.to);
            const fromNode = nodes.find(n => n.id === conn.from);
            const isCrashed = toNode?.status === 'crashed' || fromNode?.status === 'crashed';
            const isPartLine = isPartitioned && (conn.to === 'follower-2' || conn.from === 'follower-2');

            return (
              <line
                key={`${conn.from}-${conn.to}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={isCrashed ? '#ddd' : isPartLine ? '#d97706' : '#ccc'}
                strokeWidth={isCrashed ? 1 : 2}
                strokeDasharray={isCrashed ? '2,4' : isPartLine ? '8,6' : 'none'}
                opacity={isCrashed ? 0.4 : 1}
              />
            );
          })}

          {/* Partition indicator line */}
          {isPartitioned && (
            <g>
              <line
                x1={340}
                y1={60}
                x2={340}
                y2={380}
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="6,4"
                opacity={0.5}
              />
              <text x={350} y={200} fontSize={10} fill="#d97706" fontFamily="monospace">
                PARTICION
              </text>
            </g>
          )}

          {/* In-flight messages */}
          {messages.filter(m => m.status === 'in-flight').map(msg => {
            const fromPos = NODE_POSITIONS[msg.from] ?? NODE_POSITIONS['leader'];
            const toPos = NODE_POSITIONS[msg.to] ?? NODE_POSITIONS['follower-1'];

            const now = Date.now();
            const duration = msg.deliverAt - msg.sentAt;
            const elapsed = now - msg.sentAt;
            const progress = Math.min(1, elapsed / Math.max(duration, 1));

            const cx = interpolate(fromPos.x, toPos.x, progress);
            const cy = interpolate(fromPos.y, toPos.y, progress);
            const color = getMessageColor(msg.type);

            return (
              <g key={msg.id}>
                <circle cx={cx} cy={cy} r={7} fill={color} opacity={0.9}>
                  <animate attributeName="r" values="6;8;6" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <text
                  x={cx}
                  y={cy - 12}
                  fontSize={8}
                  fill={color}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {msg.key}={msg.value}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const pos = NODE_POSITIONS[node.id] ?? NODE_POSITIONS['leader'];
            const color = getNodeColor(node.status);
            const strokeDash = getNodeStrokeDash(node.status);
            const badgeColor = getRoleBadgeColor(node.role);
            const lastEntries = getLastEntries(node.data, 3);
            const maxVersion = getMaxVersion(node.data);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onClick={() => {
                  if (node.status === 'crashed') {
                    onRecoverNode(node.id);
                  } else if (node.status !== 'partitioned') {
                    onCrashNode(node.id);
                  }
                }}
              >
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  fill="#faf9f6"
                  stroke={color}
                  strokeWidth={2.5}
                  strokeDasharray={strokeDash}
                  filter="url(#node-shadow)"
                />

                {/* Role badge */}
                <rect
                  x={pos.x - 28}
                  y={pos.y - NODE_RADIUS - 14}
                  width={56}
                  height={16}
                  rx={3}
                  fill={badgeColor}
                />
                <text
                  x={pos.x}
                  y={pos.y - NODE_RADIUS - 3}
                  fontSize={8}
                  fill="white"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  {node.role.toUpperCase()}
                </text>

                {/* Node ID */}
                <text
                  x={pos.x}
                  y={pos.y - 28}
                  fontSize={9}
                  fill="#2c2c2c"
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {node.id}
                </text>

                {/* Data entries */}
                {lastEntries.length === 0 ? (
                  <text
                    x={pos.x}
                    y={pos.y + 2}
                    fontSize={9}
                    fill="#bbb"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    (vacio)
                  </text>
                ) : (
                  lastEntries.map(([key, entry], i) => (
                    <text
                      key={key}
                      x={pos.x}
                      y={pos.y - 8 + i * 14}
                      fontSize={9}
                      fill="#555"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {key}={entry.value}
                    </text>
                  ))
                )}

                {/* Version badge */}
                {maxVersion > 0 && (
                  <g>
                    <circle
                      cx={pos.x + NODE_RADIUS - 8}
                      cy={pos.y - NODE_RADIUS + 8}
                      r={12}
                      fill="#2d4a6a"
                    />
                    <text
                      x={pos.x + NODE_RADIUS - 8}
                      y={pos.y - NODE_RADIUS + 12}
                      fontSize={9}
                      fill="white"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      v{maxVersion}
                    </text>
                  </g>
                )}

                {/* Status indicator for crashed */}
                {node.status === 'crashed' && (
                  <g>
                    <line x1={pos.x - 20} y1={pos.y - 20} x2={pos.x + 20} y2={pos.y + 20} stroke="#991b1b" strokeWidth={3} />
                    <line x1={pos.x + 20} y1={pos.y - 20} x2={pos.x - 20} y2={pos.y + 20} stroke="#991b1b" strokeWidth={3} />
                  </g>
                )}

                {/* Click hint */}
                <text
                  x={pos.x}
                  y={pos.y + NODE_RADIUS + 16}
                  fontSize={8}
                  fill="#bbb"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {node.status === 'crashed' ? 'click: recover' : node.status === 'partitioned' ? '' : 'click: crash'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Control bar */}
      <div className="px-4 py-3 border-t border-[#e8e6e0] shrink-0">
        {/* Row 1: Main actions */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            onClick={onWrite}
            className="px-3 py-1.5 bg-[#2d4a6a] text-white font-mono text-[11px] hover:bg-[#1e3a5f] transition-colors rounded"
          >
            Escribir
          </button>

          <button
            onClick={() => onReadFromNode('follower-1')}
            className="px-3 py-1.5 bg-[#f0efe8] text-[#2c2c2c] font-mono text-[11px] hover:bg-[#e8e6e0] transition-colors border border-[#e8e6e0] rounded"
          >
            Leer F1
          </button>

          <button
            onClick={() => onReadFromNode('follower-2')}
            className="px-3 py-1.5 bg-[#f0efe8] text-[#2c2c2c] font-mono text-[11px] hover:bg-[#e8e6e0] transition-colors border border-[#e8e6e0] rounded"
          >
            Leer F2
          </button>

          <div className="w-px h-5 bg-[#e8e6e0]" />

          <button
            onClick={isPartitioned ? onHeal : onPartition}
            className={`px-3 py-1.5 font-mono text-[11px] transition-colors border rounded ${
              isPartitioned
                ? 'bg-[#d97706] text-white border-[#d97706] hover:bg-[#b45309]'
                : 'bg-[#f0efe8] text-[#2c2c2c] border-[#e8e6e0] hover:bg-[#e8e6e0]'
            }`}
          >
            {isPartitioned ? 'Curar red' : 'Particionar'}
          </button>

          <div className="w-px h-5 bg-[#e8e6e0]" />

          <button
            onClick={onToggleMode}
            className={`px-3 py-1.5 font-mono text-[11px] transition-colors border rounded ${
              config.mode === 'sync'
                ? 'bg-[#2d4a6a] text-white border-[#2d4a6a]'
                : 'bg-[#f0efe8] text-[#2c2c2c] border-[#e8e6e0] hover:bg-[#e8e6e0]'
            }`}
          >
            {config.mode === 'sync' ? 'SYNC' : 'ASYNC'}
          </button>
        </div>

        {/* Row 2: Delay slider */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#7a7a6e] shrink-0">DELAY</span>
          <input
            type="range"
            min={100}
            max={3000}
            step={100}
            value={config.replicationDelay}
            onChange={(e) => onDelayChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#2d4a6a] h-1"
          />
          <span className="font-mono text-[10px] text-[#2d4a6a] w-12 text-right shrink-0">
            {config.replicationDelay}ms
          </span>
        </div>

        {/* Violations banner */}
        {violations.length > 0 && (
          <div className="mt-2 px-3 py-1.5 bg-[#fef2f2] border border-[#fecaca] rounded">
            <span className="font-mono text-[10px] text-[#991b1b]">
              {violations.length} violacion{violations.length !== 1 ? 'es' : ''} detectada{violations.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
