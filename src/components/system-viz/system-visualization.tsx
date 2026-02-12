'use client';

import { useState, useMemo, useCallback } from 'react';
import { computeLayout, PHASE_META, type ConceptNode } from './layout-engine';
import { ConceptNodeSVG } from './concept-node';
import { ConnectionArrows } from './connection-arrows';
import { ConceptDetailPanel } from './concept-detail-panel';

interface SystemVisualizationProps {
  concepts: ConceptNode[];
  definitions: Record<string, string>;
  language: 'es' | 'en';
}

export function SystemVisualization({ concepts, definitions, language }: SystemVisualizationProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const layout = useMemo(() => computeLayout(concepts), [concepts]);

  const nodeMap = useMemo(() => {
    const map = new Map(layout.nodes.map((n) => [n.id, n]));
    return map;
  }, [layout.nodes]);

  // Build prerequisite chain for highlight
  const highlightedChain = useMemo(() => {
    const target = hoveredId ?? selectedId;
    if (!target) return new Set<string>();

    const chain = new Set<string>();
    const queue = [target];
    while (queue.length > 0) {
      const current = queue.pop()!;
      if (chain.has(current)) continue;
      chain.add(current);
      const node = nodeMap.get(current);
      if (node) {
        for (const prereq of node.prerequisites) {
          queue.push(prereq);
        }
      }
    }
    return chain;
  }, [hoveredId, selectedId, nodeMap]);

  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;

  const handleNodeClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // Stats
  const totalMastered = concepts.filter((c) => c.masteryLevel >= 1).length;
  const totalConcepts = concepts.length;

  // Phase bands: draw from top (6) to bottom (1)
  const phases = [6, 5, 4, 3, 2, 1];

  return (
    <div className="relative">
      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-6">
        <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
          {totalMastered}/{totalConcepts} {language === 'es' ? 'conceptos activos' : 'concepts active'}
        </span>
        <div className="flex-1 h-1 bg-j-border">
          <div
            className="h-full bg-j-accent transition-all duration-500"
            style={{ width: `${(totalMastered / totalConcepts) * 100}%` }}
          />
        </div>
      </div>

      {/* SVG diagram */}
      <div className="overflow-x-auto border border-j-border bg-j-bg">
        <svg
          viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
          width="100%"
          style={{ minHeight: 600 }}
        >
          {/* Phase bands */}
          {phases.map((phase, i) => {
            const bandY = 40 + i * 130;
            const meta = PHASE_META[phase];
            return (
              <g key={phase}>
                {/* Band background */}
                <rect
                  x={0}
                  y={bandY}
                  width={layout.viewBox.width}
                  height={130}
                  fill={i % 2 === 0 ? 'var(--j-bg)' : 'var(--j-bg-alt)'}
                  opacity={0.5}
                />
                {/* Phase label */}
                <text
                  x={20}
                  y={bandY + 20}
                  fontSize="9"
                  fontFamily="monospace"
                  fill="var(--j-text-tertiary)"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}
                >
                  {language === 'es' ? meta.labelEs : meta.label}
                </text>
                <text
                  x={20}
                  y={bandY + 32}
                  fontSize="8"
                  fontFamily="monospace"
                  fill="var(--j-text-tertiary)"
                  opacity={0.6}
                >
                  FASE {phase}
                </text>
              </g>
            );
          })}

          {/* Connection arrows (behind nodes) */}
          <ConnectionArrows
            edges={layout.edges}
            nodeMap={nodeMap}
            highlightedChain={highlightedChain}
          />

          {/* Concept nodes */}
          {layout.nodes.map((node) => (
            <ConceptNodeSVG
              key={node.id}
              node={node}
              isSelected={node.id === selectedId}
              isPrereqHighlight={highlightedChain.has(node.id)}
              onClick={handleNodeClick}
              onHover={handleHover}
            />
          ))}
        </svg>
      </div>

      {/* Detail panel */}
      <ConceptDetailPanel
        node={selectedNode ?? null}
        definition={selectedId ? definitions[selectedId] : undefined}
        onClose={() => setSelectedId(null)}
        language={language}
      />
    </div>
  );
}
