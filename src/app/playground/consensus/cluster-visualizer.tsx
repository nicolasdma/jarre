'use client';

import type {
  RaftNodeSnapshot,
  InFlightMessage,
  Partition,
} from './raft-engine';

interface ClusterVisualizerProps {
  nodes: RaftNodeSnapshot[];
  messages: InFlightMessage[];
  partition: Partition | null;
  selectedNode: string | null;
  onSelectNode: (id: string) => void;
  onKillNode: (id: string) => void;
}

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'node-0': { x: 350, y: 70 },
  'node-1': { x: 571, y: 195 },
  'node-2': { x: 487, y: 410 },
  'node-3': { x: 213, y: 410 },
  'node-4': { x: 129, y: 195 },
};

const STATE_COLORS: Record<string, string> = {
  follower: '#6b7280',
  candidate: '#d97706',
  leader: '#059669',
};

const STATE_LABELS: Record<string, string> = {
  follower: 'FOLLOWER',
  candidate: 'CANDIDATE',
  leader: 'LEADER',
};

function getMessageColor(type: string): string {
  if (type === 'RequestVote' || type === 'RequestVoteResponse') return '#3b82f6';
  return '#059669';
}

function getMessageRadius(msg: InFlightMessage): number {
  if (msg.message.type === 'AppendEntries') {
    const entries = msg.message.entries;
    return entries.length > 0 ? 5 + Math.min(entries.length * 2, 6) : 4;
  }
  if (msg.message.type === 'RequestVote') return 5;
  return 3;
}

export function ClusterVisualizer({
  nodes,
  messages,
  partition,
  selectedNode,
  onSelectNode,
}: ClusterVisualizerProps) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-j-bg">
      <svg viewBox="0 0 700 500" className="w-full h-full max-h-full">
        {/* Partition divider */}
        {partition && (
          <PartitionDivider partition={partition} />
        )}

        {/* Message lines and dots */}
        {messages.map((msg) => (
          <MessageAnimation key={msg.id} msg={msg} partition={partition} />
        ))}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = NODE_POSITIONS[node.id];
          if (!pos) return null;
          const isSelected = selectedNode === node.id;
          const isDead = node.status === 'dead';
          const isInMinority =
            partition !== null && partition.group2.includes(node.id);

          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              className="cursor-pointer"
              opacity={isDead ? 0.4 : isInMinority ? 0.65 : 1}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={46}
                  fill="none"
                  stroke="#991b1b"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={40}
                fill={isDead ? '#f5f5f0' : '#faf9f6'}
                stroke={isDead ? '#9ca3af' : STATE_COLORS[node.state]}
                strokeWidth={isDead ? 1 : 2.5}
                strokeDasharray={isDead ? '6 4' : 'none'}
              />

              {/* State badge above */}
              <rect
                x={pos.x - 30}
                y={pos.y - 62}
                width={60}
                height={16}
                rx={3}
                fill={isDead ? '#9ca3af' : STATE_COLORS[node.state]}
              />
              <text
                x={pos.x}
                y={pos.y - 51}
                textAnchor="middle"
                fill="white"
                fontSize={8}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {isDead ? 'DEAD' : STATE_LABELS[node.state]}
              </text>

              {/* Node ID */}
              <text
                x={pos.x}
                y={pos.y - 8}
                textAnchor="middle"
                fill={isDead ? '#9ca3af' : '#2c2c2c'}
                fontSize={11}
                fontFamily="monospace"
                fontWeight="500"
              >
                {node.id}
              </text>

              {/* Term number */}
              <text
                x={pos.x}
                y={pos.y + 8}
                textAnchor="middle"
                fill={isDead ? '#9ca3af' : '#555'}
                fontSize={13}
                fontFamily="monospace"
                fontWeight="bold"
              >
                T{node.currentTerm}
              </text>

              {/* Log length below */}
              <text
                x={pos.x}
                y={pos.y + 24}
                textAnchor="middle"
                fill={isDead ? '#bbb' : '#888'}
                fontSize={9}
                fontFamily="monospace"
              >
                log: {node.log.length}
              </text>

              {/* Election timer below node */}
              {!isDead && node.state !== 'leader' && (
                <text
                  x={pos.x}
                  y={pos.y + 56}
                  textAnchor="middle"
                  fill="#a0a090"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  timer: {node.electionTimer}
                </text>
              )}

              {/* Heartbeat timer for leader */}
              {!isDead && node.state === 'leader' && (
                <text
                  x={pos.x}
                  y={pos.y + 56}
                  textAnchor="middle"
                  fill="#059669"
                  fontSize={9}
                  fontFamily="monospace"
                >
                  hb: {node.electionTimer}
                </text>
              )}

              {/* Votes received badge for candidates */}
              {!isDead && node.state === 'candidate' && (
                <>
                  <circle
                    cx={pos.x + 32}
                    cy={pos.y - 28}
                    r={10}
                    fill="#d97706"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    x={pos.x + 32}
                    y={pos.y - 24}
                    textAnchor="middle"
                    fill="white"
                    fontSize={9}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {node.votesReceived.length}
                  </text>
                </>
              )}

              {/* Commit index badge for leaders */}
              {!isDead && node.state === 'leader' && node.commitIndex >= 0 && (
                <>
                  <circle
                    cx={pos.x + 32}
                    cy={pos.y - 28}
                    r={10}
                    fill="#059669"
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    x={pos.x + 32}
                    y={pos.y - 24}
                    textAnchor="middle"
                    fill="white"
                    fontSize={8}
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    C{node.commitIndex}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(10, 460)">
          <circle cx={8} cy={0} r={4} fill="#3b82f6" />
          <text x={18} y={3} fontSize={9} fontFamily="monospace" fill="#888">
            Vote
          </text>
          <circle cx={58} cy={0} r={4} fill="#059669" />
          <text x={68} y={3} fontSize={9} fontFamily="monospace" fill="#888">
            Append
          </text>
        </g>
      </svg>
    </div>
  );
}

function MessageAnimation({
  msg,
  partition,
}: {
  msg: InFlightMessage;
  partition: Partition | null;
}) {
  const from = NODE_POSITIONS[msg.message.from];
  const to = NODE_POSITIONS[msg.message.to];
  if (!from || !to) return null;

  // Check if message crosses partition (it will be dropped but show it dimmed)
  const crossesPartition =
    partition !== null &&
    !(
      (partition.group1.includes(msg.message.from) &&
        partition.group1.includes(msg.message.to)) ||
      (partition.group2.includes(msg.message.from) &&
        partition.group2.includes(msg.message.to))
    );

  const progress = msg.progress;
  const currentX = from.x + (to.x - from.x) * progress;
  const currentY = from.y + (to.y - from.y) * progress;

  const color = getMessageColor(msg.message.type);
  const radius = getMessageRadius(msg);
  const isVote =
    msg.message.type === 'RequestVote' ||
    msg.message.type === 'RequestVoteResponse';

  return (
    <g opacity={crossesPartition ? 0.2 : 0.9}>
      {/* Trail line */}
      <line
        x1={from.x}
        y1={from.y}
        x2={currentX}
        y2={currentY}
        stroke={color}
        strokeWidth={1}
        strokeDasharray={isVote ? '4 3' : 'none'}
        opacity={0.3}
      />

      {/* Message dot */}
      <circle
        cx={currentX}
        cy={currentY}
        r={radius}
        fill={color}
        opacity={0.9}
      />

      {/* Label for entries */}
      {msg.message.type === 'AppendEntries' &&
        msg.message.entries.length > 0 && (
          <text
            x={currentX}
            y={currentY - radius - 3}
            textAnchor="middle"
            fontSize={7}
            fontFamily="monospace"
            fill={color}
            fontWeight="bold"
          >
            +{msg.message.entries.length}
          </text>
        )}
    </g>
  );
}

function PartitionDivider({ partition }: { partition: Partition }) {
  // Draw a red dashed line separating the two groups
  // Calculate the centroid of each group and draw a perpendicular bisector
  const g1Positions = partition.group1
    .map((id) => NODE_POSITIONS[id])
    .filter(Boolean);
  const g2Positions = partition.group2
    .map((id) => NODE_POSITIONS[id])
    .filter(Boolean);

  if (g1Positions.length === 0 || g2Positions.length === 0) return null;

  const centroid1 = {
    x: g1Positions.reduce((s, p) => s + p.x, 0) / g1Positions.length,
    y: g1Positions.reduce((s, p) => s + p.y, 0) / g1Positions.length,
  };
  const centroid2 = {
    x: g2Positions.reduce((s, p) => s + p.x, 0) / g2Positions.length,
    y: g2Positions.reduce((s, p) => s + p.y, 0) / g2Positions.length,
  };

  // Midpoint between centroids
  const mid = {
    x: (centroid1.x + centroid2.x) / 2,
    y: (centroid1.y + centroid2.y) / 2,
  };

  // Direction perpendicular to the line connecting centroids
  const dx = centroid2.x - centroid1.x;
  const dy = centroid2.y - centroid1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / len;
  const perpY = dx / len;

  const lineLen = 400;

  return (
    <g>
      <line
        x1={mid.x - perpX * lineLen}
        y1={mid.y - perpY * lineLen}
        x2={mid.x + perpX * lineLen}
        y2={mid.y + perpY * lineLen}
        stroke="#991b1b"
        strokeWidth={2}
        strokeDasharray="8 6"
        opacity={0.6}
      />
      {/* Partition label */}
      <text
        x={mid.x}
        y={mid.y - 10}
        textAnchor="middle"
        fontSize={10}
        fontFamily="monospace"
        fill="#991b1b"
        fontWeight="bold"
        opacity={0.7}
      >
        PARTITION
      </text>
    </g>
  );
}
