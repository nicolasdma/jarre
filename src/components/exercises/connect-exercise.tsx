'use client';

import { useState, useCallback, useRef } from 'react';
import { gradeConnect } from '@/lib/exercises/grading';
import type { ConnectExercise, ExerciseResult } from '@/types';

interface Props {
  exercise: ConnectExercise;
  onSubmit: (result: ExerciseResult) => void;
}

export function ConnectExerciseComponent({ exercise, onSubmit }: Props) {
  const [connections, setConnections] = useState<[string, string][]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const NODE_R = 28;

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (connecting === null) {
        // Start connection
        setConnecting(nodeId);
      } else if (connecting === nodeId) {
        // Cancel
        setConnecting(null);
      } else {
        // Complete connection
        const newConn: [string, string] = [connecting, nodeId];

        // Check if this connection already exists (either direction)
        const exists = connections.some(
          ([a, b]) =>
            (a === connecting && b === nodeId) || (a === nodeId && b === connecting)
        );

        if (exists) {
          // Remove it
          setConnections((prev) =>
            prev.filter(
              ([a, b]) =>
                !((a === connecting && b === nodeId) || (a === nodeId && b === connecting))
            )
          );
        } else {
          setConnections((prev) => [...prev, newConn]);
        }
        setConnecting(null);
      }
    },
    [connecting, connections]
  );

  function handleSubmit() {
    const score = gradeConnect(connections, exercise.correctConnections);
    onSubmit({
      exerciseId: exercise.id,
      score,
      isCorrect: score >= 70,
      details: { connections, correctConnections: exercise.correctConnections },
    });
  }

  function handleClear() {
    setConnections([]);
    setConnecting(null);
  }

  // Get node position map
  const nodeMap = new Map(exercise.nodes.map((n) => [n.id, n]));

  return (
    <div className="space-y-4">
      <div className="border border-j-border bg-j-bg p-2 overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={exercise.svgViewBox}
          width="100%"
          style={{ minHeight: 280 }}
        >
          {/* Drawn connections */}
          {connections.map(([fromId, toId], i) => {
            const from = nodeMap.get(fromId);
            const to = nodeMap.get(toId);
            if (!from || !to) return null;
            return (
              <line
                key={`${fromId}-${toId}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--j-accent)"
                strokeWidth={2}
                markerEnd="url(#connect-arrow)"
              />
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="connect-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--j-accent)" />
            </marker>
          </defs>

          {/* Nodes */}
          {exercise.nodes.map((node) => {
            const isConnecting = connecting === node.id;
            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  fill={isConnecting ? 'var(--j-accent-light)' : 'var(--j-bg)'}
                  stroke={isConnecting ? 'var(--j-accent)' : 'var(--j-border-input)'}
                  strokeWidth={isConnecting ? 2.5 : 1.5}
                />
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="var(--j-font-mono)"
                  fill="var(--j-text)"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Connecting hint */}
      {connecting && (
        <p className="text-xs text-j-warm font-mono">
          Conectando desde {nodeMap.get(connecting)?.label}... haz click en el destino.
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={connections.length === 0}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
        >
          Verificar conexiones
        </button>
        <button
          onClick={handleClear}
          className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 uppercase hover:border-j-accent transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
