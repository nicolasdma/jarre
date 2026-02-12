'use client';

import type { PositionedNode, Edge } from './layout-engine';

interface ConnectionArrowsProps {
  edges: Edge[];
  nodeMap: Map<string, PositionedNode>;
  highlightedChain: Set<string>;
}

/**
 * SVG bezier arrows between prerequisite nodes.
 */
export function ConnectionArrows({ edges, nodeMap, highlightedChain }: ConnectionArrowsProps) {
  return (
    <g>
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--j-border)" />
        </marker>
        <marker
          id="arrowhead-active"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--j-accent)" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;

        const isHighlighted =
          highlightedChain.has(edge.from) && highlightedChain.has(edge.to);

        // Compute bezier: from bottom-center of source to top-center of target
        const x1 = from.x + from.width / 2;
        const y1 = from.y; // top of the source (phases go 6→1 top→bottom, prereqs are lower phase)
        const x2 = to.x + to.width / 2;
        const y2 = to.y + to.height; // bottom of target

        // If same phase, draw horizontal
        if (from.phase === to.phase) {
          const sx = from.x + from.width;
          const sy = from.y + from.height / 2;
          const ex = to.x;
          const ey = to.y + to.height / 2;
          return (
            <path
              key={`${edge.from}-${edge.to}`}
              d={`M ${sx} ${sy} C ${sx + 20} ${sy}, ${ex - 20} ${ey}, ${ex} ${ey}`}
              fill="none"
              stroke={isHighlighted ? 'var(--j-accent)' : 'var(--j-border)'}
              strokeWidth={isHighlighted ? 1.5 : 0.8}
              opacity={isHighlighted ? 0.8 : 0.3}
              markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
            />
          );
        }

        // Cross-phase: bezier from bottom of target row to top of source row
        // (remember: lower phase = lower on screen)
        const cpOffset = Math.abs(y2 - y1) * 0.4;
        return (
          <path
            key={`${edge.from}-${edge.to}`}
            d={`M ${x1} ${y1} C ${x1} ${y1 - cpOffset}, ${x2} ${y2 + cpOffset}, ${x2} ${y2}`}
            fill="none"
            stroke={isHighlighted ? 'var(--j-accent)' : 'var(--j-border)'}
            strokeWidth={isHighlighted ? 1.5 : 0.8}
            opacity={isHighlighted ? 0.8 : 0.3}
            markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
          />
        );
      })}
    </g>
  );
}
