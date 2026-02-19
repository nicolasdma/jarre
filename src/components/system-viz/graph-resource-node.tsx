/**
 * SVG resource node for the force-directed graph.
 *
 * Diamond shape. Color: --j-info. Smaller than concept nodes.
 * Icon varies by resource type.
 */

'use client';

import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import type { DragBehavior, SubjectPosition } from 'd3-drag';
import type { GraphNode, ResourceNodeData, UserResourceType } from './graph-types';

interface GraphResourceNodeProps {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
  dragBehavior: DragBehavior<SVGGElement, GraphNode, GraphNode | SubjectPosition>;
}

const DIAMOND_SIZE = 12;

function getDiamondPath(size: number): string {
  return `M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z`;
}

function getTypeIcon(type: UserResourceType): string {
  switch (type) {
    case 'youtube': return '▶';
    case 'article': return '¶';
    case 'paper': return '◇';
    case 'book': return '▤';
    case 'podcast': return '♪';
    default: return '◦';
  }
}

export function GraphResourceNode({
  node,
  isSelected,
  isHighlighted,
  onClick,
  onHover,
  dragBehavior,
}: GraphResourceNodeProps) {
  const gRef = useRef<SVGGElement>(null);
  const data = node.data as ResourceNodeData;
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    const sel = select<SVGGElement, GraphNode>(g).datum(node);
    sel.call(dragBehavior);
    return () => {
      sel.on('.drag', null);
    };
  }, [dragBehavior, node]);

  const displayTitle = data.title.length > 12 ? data.title.slice(0, 11) + '...' : data.title;
  const opacity = isSelected || isHighlighted ? 1 : 0.75;

  return (
    <g
      ref={gRef}
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Diamond shape */}
      <path
        d={getDiamondPath(DIAMOND_SIZE)}
        fill="var(--j-info)"
        fillOpacity={0.15}
        stroke="var(--j-info)"
        strokeWidth={isSelected ? 2 : 1.2}
        opacity={opacity}
      />

      {/* Type icon */}
      <text
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fill="var(--j-info)"
        opacity={0.9}
      >
        {getTypeIcon(data.resourceType)}
      </text>

      {/* Title below */}
      <text
        y={DIAMOND_SIZE + 10}
        textAnchor="middle"
        fontSize="8"
        fontFamily="var(--j-font-mono)"
        fill="var(--j-text-secondary)"
        opacity={opacity}
      >
        {displayTitle}
      </text>
    </g>
  );
}
