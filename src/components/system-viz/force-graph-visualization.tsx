/**
 * Force-directed knowledge graph compositor.
 *
 * SVG fullwidth, 70vh. ResizeObserver for responsive dimensions.
 * Zoom/pan/drag. Stats bar. Detail panel on click.
 */

'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type {
  GraphData,
  GraphNode,
  ConceptNodeData,
  ResourceNodeData,
  ConceptInput,
  ResourceInput,
  ResourceConceptLinkInput,
} from './graph-types';
import { buildGraphData, PHASE_META } from './graph-types';
import { useForceSimulation } from './force-graph-engine';
import { useGraphZoom, useNodeDrag } from './use-graph-interactions';
import { GraphConceptNode } from './graph-concept-node';
import { GraphResourceNode } from './graph-resource-node';
import { GraphEdges } from './graph-edges';
import { ConceptDetailPanel } from './concept-detail-panel';

interface ForceGraphVisualizationProps {
  concepts: ConceptInput[];
  definitions: Record<string, string>;
  resources: ResourceInput[];
  resourceLinks: ResourceConceptLinkInput[];
  language: 'es' | 'en';
}

export function ForceGraphVisualization({
  concepts,
  definitions,
  resources,
  resourceLinks,
  language,
}: ForceGraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Build graph data
  const graphData: GraphData = useMemo(
    () => buildGraphData(concepts, definitions, resources, resourceLinks),
    [concepts, definitions, resources, resourceLinks]
  );

  // Force simulation
  const { nodes, links, reheat } = useForceSimulation(graphData, dimensions);

  // Zoom/pan
  const { transform, zoomIn, zoomOut, resetZoom } = useGraphZoom(svgRef);

  // Drag
  const dragBehavior = useNodeDrag(reheat);

  // Node map for lookups
  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Prerequisite chain highlight
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
      if (!node) continue;

      if (node.data.type === 'concept') {
        for (const prereq of node.data.prerequisites) {
          queue.push(prereq);
        }
      }

      // Also highlight connected resource-concept edges
      for (const link of links) {
        if (link.data.type === 'resource-concept') {
          const sourceId = typeof link.source === 'object' ? (link.source as GraphNode).id : String(link.source);
          const targetId = typeof link.target === 'object' ? (link.target as GraphNode).id : String(link.target);
          if (sourceId === current && !chain.has(targetId)) queue.push(targetId);
          if (targetId === current && !chain.has(sourceId)) queue.push(sourceId);
        }
      }
    }
    return chain;
  }, [hoveredId, selectedId, nodeMap, links]);

  // Selected node data for detail panel
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;

  const handleNodeClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // Stats
  const totalConcepts = concepts.length;
  const totalMastered = concepts.filter((c) => c.masteryLevel >= 1).length;
  const totalResources = resources.length;

  // Separate nodes by type for render order
  const conceptNodes = nodes.filter((n) => n.data.type === 'concept');
  const resourceNodes = nodes.filter((n) => n.data.type === 'resource');

  return (
    <div className="relative">
      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
          {totalMastered}/{totalConcepts} {language === 'es' ? 'conceptos activos' : 'concepts active'}
        </span>
        {totalResources > 0 && (
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-info uppercase">
            {totalResources} {language === 'es' ? 'recursos' : 'resources'}
          </span>
        )}
        <div className="flex-1 h-1 bg-j-border">
          <div
            className="h-full bg-j-accent transition-all duration-500"
            style={{ width: `${totalConcepts > 0 ? (totalMastered / totalConcepts) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Graph container */}
      <div
        ref={containerRef}
        className="relative border border-j-border bg-j-bg j-dot-bg overflow-hidden"
        style={{ height: '70vh', minHeight: 500 }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ display: 'block' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="fg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--j-grid-color, transparent)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fg-grid)" opacity="0.3" />

          {/* Zoomable group */}
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {/* Phase Y labels (subtle) */}
            {dimensions.height > 0 &&
              Object.entries(PHASE_META).map(([phaseStr, meta]) => {
                const phase = parseInt(phaseStr, 10);
                const padding = 60;
                const usable = dimensions.height - padding * 2;
                const yPos = padding + usable * ((9 - phase) / 8);
                return (
                  <text
                    key={phase}
                    x={12}
                    y={yPos}
                    fontSize="8"
                    fontFamily="monospace"
                    fill="var(--j-text-tertiary)"
                    opacity={0.4}
                    style={{ textTransform: 'uppercase', letterSpacing: '0.15em' }}
                  >
                    {language === 'es' ? meta.labelEs : meta.label}
                  </text>
                );
              })}

            {/* Edges (behind nodes) */}
            <GraphEdges links={links} highlightedChain={highlightedChain} />

            {/* Resource nodes (behind concepts) */}
            {resourceNodes.map((node) => (
              <GraphResourceNode
                key={node.id}
                node={node}
                isSelected={node.id === selectedId}
                isHighlighted={highlightedChain.has(node.id)}
                onClick={handleNodeClick}
                onHover={handleHover}
                dragBehavior={dragBehavior}
              />
            ))}

            {/* Concept nodes */}
            {conceptNodes.map((node) => (
              <GraphConceptNode
                key={node.id}
                node={node}
                isSelected={node.id === selectedId}
                isHighlighted={highlightedChain.has(node.id)}
                onClick={handleNodeClick}
                onHover={handleHover}
                dragBehavior={dragBehavior}
              />
            ))}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <button
            onClick={zoomIn}
            className="w-8 h-8 bg-j-bg border border-j-border text-j-text-secondary hover:text-j-text hover:border-j-accent transition-colors flex items-center justify-center font-mono text-sm"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="w-8 h-8 bg-j-bg border border-j-border text-j-text-secondary hover:text-j-text hover:border-j-accent transition-colors flex items-center justify-center font-mono text-sm"
            title="Zoom out"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="w-8 h-8 bg-j-bg border border-j-border text-j-text-secondary hover:text-j-text hover:border-j-accent transition-colors flex items-center justify-center font-mono text-[9px]"
            title="Reset zoom"
          >
            ⟲
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-3 right-3 flex gap-4 font-mono text-[9px] text-j-text-tertiary">
          <span className="flex items-center gap-1">
            <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="var(--j-accent-light)" stroke="var(--j-accent)" strokeWidth="1" /></svg>
            {language === 'es' ? 'Concepto' : 'Concept'}
          </span>
          <span className="flex items-center gap-1">
            <svg width="10" height="10"><path d="M5 1 L9 5 L5 9 L1 5 Z" fill="var(--j-info)" fillOpacity="0.15" stroke="var(--j-info)" strokeWidth="1" /></svg>
            {language === 'es' ? 'Recurso' : 'Resource'}
          </span>
        </div>
      </div>

      {/* Detail panel */}
      {selectedNode && (
        <ConceptDetailPanel
          node={selectedNode}
          definition={
            selectedNode.data.type === 'concept'
              ? definitions[selectedNode.data.id]
              : undefined
          }
          onClose={() => setSelectedId(null)}
          language={language}
        />
      )}
    </div>
  );
}
