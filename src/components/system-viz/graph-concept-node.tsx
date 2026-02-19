/**
 * SVG concept node for the force-directed graph.
 *
 * Circle with radius proportional to mastery level.
 * Color by mastery (reuses getMasteryStyle). Glow for L3-4. Badge with level.
 */

'use client';

import { useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import type { DragBehavior, SubjectPosition } from 'd3-drag';
import type { GraphNode, ConceptNodeData } from './graph-types';
import { getMasteryStyle } from './graph-types';

interface GraphConceptNodeProps {
  node: GraphNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
  dragBehavior: DragBehavior<SVGGElement, GraphNode, GraphNode | SubjectPosition>;
}

const BASE_RADIUS = 16;
const RADIUS_PER_LEVEL = 1.5;

function getRadius(masteryLevel: number): number {
  return BASE_RADIUS + masteryLevel * RADIUS_PER_LEVEL;
}

export function GraphConceptNode({
  node,
  isSelected,
  isHighlighted,
  onClick,
  onHover,
  dragBehavior,
}: GraphConceptNodeProps) {
  const gRef = useRef<SVGGElement>(null);
  const data = node.data as ConceptNodeData;
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const radius = getRadius(data.masteryLevel);
  const styles = getMasteryStyle(data.masteryLevel, isSelected, isHighlighted);

  // Attach drag behavior
  useEffect(() => {
    const g = gRef.current;
    if (!g) return;
    const sel = select<SVGGElement, GraphNode>(g).datum(node);
    sel.call(dragBehavior);
    return () => {
      sel.on('.drag', null);
    };
  }, [dragBehavior, node]);

  // Truncate name
  const displayName = data.name.length > 10 ? data.name.slice(0, 9) + '...' : data.name;

  return (
    <g
      ref={gRef}
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      {/* Level 4: animated outer glow */}
      {data.masteryLevel >= 4 && (
        <circle r={radius + 4} fill="none" stroke={styles.stroke} strokeWidth={1} opacity={0.3}>
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Level 3+: static outer glow */}
      {data.masteryLevel >= 3 && (
        <circle r={radius + 2} fill="none" stroke={styles.stroke} strokeWidth={0.5} opacity={0.15} />
      )}

      {/* Main circle */}
      <circle
        r={radius}
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={styles.dasharray}
        opacity={styles.opacity}
      />

      {/* Name label */}
      <text
        y={1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9"
        fontFamily="var(--j-font-mono)"
        fill={styles.textFill}
      >
        {displayName}
      </text>

      {/* Level badge */}
      <circle
        cx={radius * 0.65}
        cy={-radius * 0.65}
        r={6}
        fill={styles.stroke}
        opacity={data.masteryLevel > 0 ? 0.9 : 0.3}
      />
      <text
        x={radius * 0.65}
        y={-radius * 0.65 + 3.5}
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill={data.masteryLevel > 0 ? 'var(--j-bg)' : 'var(--j-text-tertiary)'}
      >
        {data.masteryLevel}
      </text>
    </g>
  );
}
