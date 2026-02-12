'use client';

import type { PositionedNode } from './layout-engine';

interface ConceptNodeProps {
  node: PositionedNode;
  isSelected: boolean;
  isPrereqHighlight: boolean;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
}

/**
 * SVG visual for a single concept node.
 * 5 states based on mastery level (0-4).
 */
export function ConceptNodeSVG({
  node,
  isSelected,
  isPrereqHighlight,
  onClick,
  onHover,
}: ConceptNodeProps) {
  const { x, y, width, height, name, masteryLevel } = node;

  // Visual state by mastery level
  const styles = getMasteryStyle(masteryLevel, isSelected, isPrereqHighlight);

  // Truncate name to fit
  const displayName = name.length > 12 ? name.slice(0, 11) + '...' : name;

  return (
    <g
      onClick={() => onClick(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth={isSelected ? 2.5 : 1.5}
        strokeDasharray={styles.dasharray}
        opacity={styles.opacity}
      />

      {/* Level 4: glow effect */}
      {masteryLevel >= 4 && (
        <rect
          x={x - 2}
          y={y - 2}
          width={width + 4}
          height={height + 4}
          rx={6}
          fill="none"
          stroke={styles.stroke}
          strokeWidth={1}
          opacity={0.3}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.6;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Level badge */}
      <circle
        cx={x + width - 6}
        cy={y + 6}
        r={6}
        fill={styles.stroke}
        opacity={masteryLevel > 0 ? 0.9 : 0.3}
      />
      <text
        x={x + width - 6}
        y={y + 9.5}
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill={masteryLevel > 0 ? 'var(--j-bg)' : 'var(--j-text-tertiary)'}
      >
        {masteryLevel}
      </text>

      {/* Name */}
      <text
        x={x + width / 2}
        y={y + height / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fontFamily="var(--j-font-mono)"
        fill={styles.textFill}
      >
        {displayName}
      </text>
    </g>
  );
}

function getMasteryStyle(
  level: number,
  isSelected: boolean,
  isHighlighted: boolean
): {
  fill: string;
  stroke: string;
  dasharray: string;
  opacity: number;
  textFill: string;
} {
  const selectedBoost = isSelected || isHighlighted;

  switch (level) {
    case 0:
      return {
        fill: 'var(--j-bg)',
        stroke: 'var(--j-border)',
        dasharray: '4 3',
        opacity: selectedBoost ? 0.7 : 0.35,
        textFill: 'var(--j-text-tertiary)',
      };
    case 1:
      return {
        fill: 'var(--j-accent-light)',
        stroke: 'var(--j-accent)',
        dasharray: '',
        opacity: selectedBoost ? 1 : 0.9,
        textFill: 'var(--j-text)',
      };
    case 2:
      return {
        fill: 'var(--j-accent-light)',
        stroke: 'var(--j-accent)',
        dasharray: '',
        opacity: 1,
        textFill: 'var(--j-text)',
      };
    case 3:
      return {
        fill: 'var(--j-warm-light)',
        stroke: 'var(--j-warm)',
        dasharray: '',
        opacity: 1,
        textFill: 'var(--j-text)',
      };
    case 4:
      return {
        fill: 'var(--j-accent-light)',
        stroke: 'var(--j-accent)',
        dasharray: '',
        opacity: 1,
        textFill: 'var(--j-accent)',
      };
    default:
      return {
        fill: 'var(--j-bg)',
        stroke: 'var(--j-border)',
        dasharray: '4 3',
        opacity: 0.35,
        textFill: 'var(--j-text-tertiary)',
      };
  }
}
