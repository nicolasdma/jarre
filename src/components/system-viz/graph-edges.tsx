/**
 * SVG edges for the force-directed graph.
 *
 * - Prerequisite: solid line + arrowhead
 * - Resource-concept: dashed line, width by relevance_score
 * - Highlight chain on hover/select
 */

'use client';

import type { GraphNode, GraphLink } from './graph-types';

interface GraphEdgesProps {
  links: GraphLink[];
  highlightedChain: Set<string>;
}

function resolveNode(nodeOrId: string | GraphNode): GraphNode | null {
  if (typeof nodeOrId === 'string') return null;
  return nodeOrId;
}

export function GraphEdges({ links, highlightedChain }: GraphEdgesProps) {
  return (
    <g>
      <defs>
        <marker
          id="fg-arrow"
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
          id="fg-arrow-active"
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

      {links.map((link, i) => {
        const source = resolveNode(link.source as string | GraphNode);
        const target = resolveNode(link.target as string | GraphNode);
        if (!source || !target) return null;

        const sx = source.x ?? 0;
        const sy = source.y ?? 0;
        const tx = target.x ?? 0;
        const ty = target.y ?? 0;

        const isPrereq = link.data.type === 'prerequisite';
        const sourceId = source.id;
        const targetId = target.id;

        const isHighlighted =
          highlightedChain.has(sourceId) && highlightedChain.has(targetId);

        if (isPrereq) {
          return (
            <line
              key={`${sourceId}-${targetId}-${i}`}
              x1={sx}
              y1={sy}
              x2={tx}
              y2={ty}
              stroke={isHighlighted ? 'var(--j-accent)' : 'var(--j-border)'}
              strokeWidth={isHighlighted ? 2 : 1}
              opacity={isHighlighted ? 0.8 : 0.3}
              markerEnd={isHighlighted ? 'url(#fg-arrow-active)' : 'url(#fg-arrow)'}
            />
          );
        }

        // Resource-concept edge
        const relevance = link.data.type === 'resource-concept' ? link.data.relevanceScore : 0.5;
        const strokeWidth = 0.5 + relevance * 1.5;

        return (
          <line
            key={`${sourceId}-${targetId}-${i}`}
            x1={sx}
            y1={sy}
            x2={tx}
            y2={ty}
            stroke={isHighlighted ? 'var(--j-info)' : 'var(--j-border)'}
            strokeWidth={isHighlighted ? strokeWidth + 0.5 : strokeWidth}
            strokeDasharray="4 3"
            opacity={isHighlighted ? 0.7 : 0.2}
          />
        );
      })}
    </g>
  );
}
