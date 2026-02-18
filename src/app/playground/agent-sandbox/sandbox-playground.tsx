'use client';

import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLOR_P1 = '#c47a4a'; // Pattern 1 — warm (everything in sandbox)
const COLOR_P2 = '#059669'; // Pattern 2 — green (recommended, split architecture)

type ViewMode = 'pattern1' | 'pattern2' | 'side-by-side';

type ScenarioKey =
  | 'prompt-injection'
  | 'update-logic'
  | 'parallel-tasks'
  | 'sandbox-crash';

interface Scenario {
  id: ScenarioKey;
  label: string;
  description: string;
  p1Result: { verdict: 'danger' | 'warning' | 'ok'; text: string };
  p2Result: { verdict: 'danger' | 'warning' | 'ok'; text: string };
}

const SCENARIOS: Scenario[] = [
  {
    id: 'prompt-injection',
    label: 'Prompt injection attack',
    description:
      'A malicious prompt tricks the LLM into calling tools with harmful intent.',
    p1Result: {
      verdict: 'danger',
      text: 'API keys live inside the sandbox alongside the LLM. A successful injection can exfiltrate keys via tool calls or direct network access from inside the container.',
    },
    p2Result: {
      verdict: 'ok',
      text: 'API keys stay on the host. The sandbox only has tool execution capability. Even if the sandbox is compromised, the attacker cannot access keys or the agent logic.',
    },
  },
  {
    id: 'update-logic',
    label: 'Need to update agent logic',
    description:
      'You want to change the system prompt, tool definitions, or LLM model.',
    p1Result: {
      verdict: 'warning',
      text: 'The entire sandbox image must be rebuilt and redeployed. Agent code, LLM config, and tools are all baked into the container image.',
    },
    p2Result: {
      verdict: 'ok',
      text: 'Agent logic runs on the host — update instantly without touching sandboxes. Sandboxes are stateless tool executors that remain unchanged.',
    },
  },
  {
    id: 'parallel-tasks',
    label: 'Run 3 tasks in parallel',
    description:
      'Three independent tasks need to run concurrently for throughput.',
    p1Result: {
      verdict: 'warning',
      text: 'Each task requires a full container with Agent + LLM + Tools. You spin up 3 heavy containers, tripling resource consumption and LLM client overhead.',
    },
    p2Result: {
      verdict: 'ok',
      text: 'One agent on the host fans out tool calls to 3 lightweight sandboxes. The LLM and agent logic are shared — only execution environments are multiplied.',
    },
  },
  {
    id: 'sandbox-crash',
    label: 'Sandbox crashes',
    description:
      'A tool execution causes the sandbox environment to crash or hang.',
    p1Result: {
      verdict: 'danger',
      text: 'The agent dies with the sandbox. All in-flight state, conversation history, and orchestration context are lost. Must restart from scratch.',
    },
    p2Result: {
      verdict: 'ok',
      text: 'Agent survives on the host. It detects the sandbox failure, spins up a new one, and retries the tool call. Orchestration state is fully preserved.',
    },
  },
];

interface RadarAxis {
  label: string;
  key: string;
  p1: number; // 0-100
  p2: number; // 0-100
}

const RADAR_AXES: RadarAxis[] = [
  { label: 'Security', key: 'security', p1: 30, p2: 90 },
  { label: 'Iteration Speed', key: 'iteration', p1: 25, p2: 85 },
  { label: 'Parallelization', key: 'parallel', p1: 35, p2: 85 },
  { label: 'Cost', key: 'cost', p1: 40, p2: 75 },
  { label: 'Latency', key: 'latency', p1: 80, p2: 55 },
  { label: 'Simplicity', key: 'simplicity', p1: 85, p2: 45 },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function CornerBrackets({
  children,
  color,
  label,
  className = '',
  dashed = false,
}: {
  children: React.ReactNode;
  color: string;
  label?: string;
  className?: string;
  dashed?: boolean;
}) {
  const borderStyle = dashed ? 'dashed' : 'solid';
  return (
    <div className={`relative ${className}`}>
      {/* Corner brackets */}
      <div
        className="absolute top-0 left-0 w-3 h-3 border-t border-l"
        style={{ borderColor: color, borderStyle }}
      />
      <div
        className="absolute top-0 right-0 w-3 h-3 border-t border-r"
        style={{ borderColor: color, borderStyle }}
      />
      <div
        className="absolute bottom-0 left-0 w-3 h-3 border-b border-l"
        style={{ borderColor: color, borderStyle }}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 border-b border-r"
        style={{ borderColor: color, borderStyle }}
      />
      {label && (
        <span
          className="absolute -top-2.5 left-4 px-1 font-mono text-[9px] tracking-[0.15em] uppercase bg-j-bg"
          style={{ color }}
        >
          {label}
        </span>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

function ComponentBox({
  label,
  color,
  icon,
  highlight = false,
  dimmed = false,
}: {
  label: string;
  color: string;
  icon: string;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className="px-3 py-2 border font-mono text-[10px] tracking-wider uppercase text-center transition-all duration-300"
      style={{
        borderColor: highlight ? color : dimmed ? `${color}33` : `${color}66`,
        color: dimmed ? `${color}55` : color,
        backgroundColor: highlight ? `${color}15` : 'transparent',
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      <span className="text-sm block mb-0.5">{icon}</span>
      {label}
    </div>
  );
}

function Arrow({
  direction = 'down',
  color,
  label,
  dashed = false,
}: {
  direction?: 'down' | 'right' | 'left-right';
  color: string;
  label?: string;
  dashed?: boolean;
}) {
  if (direction === 'right' || direction === 'left-right') {
    return (
      <div className="flex items-center gap-1">
        {direction === 'left-right' && (
          <span style={{ color }} className="text-[10px]">
            {'<'}
          </span>
        )}
        <div className="flex-1 flex flex-col items-center">
          <div
            className="w-full h-px"
            style={{
              backgroundColor: color,
              backgroundImage: dashed
                ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)`
                : 'none',
              backgroundSize: dashed ? '8px 1px' : 'auto',
              height: '1px',
            }}
          />
          {label && (
            <span
              className="font-mono text-[8px] tracking-wider uppercase mt-0.5"
              style={{ color }}
            >
              {label}
            </span>
          )}
        </div>
        <span style={{ color }} className="text-[10px]">
          {'>'}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-px h-4"
        style={{
          backgroundColor: dashed ? 'transparent' : color,
          backgroundImage: dashed
            ? `repeating-linear-gradient(180deg, ${color} 0, ${color} 3px, transparent 3px, transparent 6px)`
            : 'none',
          backgroundSize: dashed ? '1px 6px' : 'auto',
        }}
      />
      <span style={{ color }} className="text-[8px] leading-none">
        v
      </span>
      {label && (
        <span
          className="font-mono text-[8px] tracking-wider uppercase"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Architecture Diagrams
// ---------------------------------------------------------------------------

function Pattern1Diagram({
  activeScenario,
}: {
  activeScenario: ScenarioKey | null;
}) {
  const isInjection = activeScenario === 'prompt-injection';
  const isCrash = activeScenario === 'sandbox-crash';

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2"
        style={{ color: COLOR_P1 }}
      >
        Pattern 1: Everything in Sandbox
      </span>

      <CornerBrackets
        color={isCrash ? '#ef4444' : COLOR_P1}
        label="Sandbox Container"
        className="w-full max-w-xs"
      >
        <div className="flex flex-col items-center gap-2">
          <ComponentBox
            label="Agent"
            color={COLOR_P1}
            icon="~"
            dimmed={isCrash}
          />
          <Arrow direction="down" color={COLOR_P1} />
          <ComponentBox
            label="LLM Client"
            color={COLOR_P1}
            icon="#"
            dimmed={isCrash}
          />
          <Arrow direction="down" color={COLOR_P1} />
          <div className="flex gap-3">
            <ComponentBox
              label="Tools"
              color={COLOR_P1}
              icon=">"
              dimmed={isCrash}
            />
            <ComponentBox
              label="API Keys"
              color={COLOR_P1}
              icon="*"
              highlight={isInjection}
              dimmed={isCrash}
            />
          </div>
          {isInjection && (
            <div
              className="font-mono text-[9px] text-center mt-1 px-2 py-1 border"
              style={{
                color: '#ef4444',
                borderColor: '#ef444466',
                backgroundColor: '#ef444410',
              }}
            >
              Keys exposed to compromised LLM
            </div>
          )}
          {isCrash && (
            <div
              className="font-mono text-[9px] text-center mt-1 px-2 py-1 border"
              style={{
                color: '#ef4444',
                borderColor: '#ef444466',
                backgroundColor: '#ef444410',
              }}
            >
              Everything dies together
            </div>
          )}
        </div>
      </CornerBrackets>

      <Arrow direction="down" color={COLOR_P1} label="HTTP endpoint" />

      <ComponentBox label="Host" color={COLOR_P1} icon="[]" />
    </div>
  );
}

function Pattern2Diagram({
  activeScenario,
}: {
  activeScenario: ScenarioKey | null;
}) {
  const isParallel = activeScenario === 'parallel-tasks';
  const isCrash = activeScenario === 'sandbox-crash';

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="font-mono text-[10px] tracking-[0.15em] uppercase mb-2"
        style={{ color: COLOR_P2 }}
      >
        Pattern 2: Agent on Host
      </span>

      <CornerBrackets
        color={COLOR_P2}
        label="Host"
        className="w-full max-w-xs"
        dashed
      >
        <div className="flex flex-col items-center gap-2">
          <ComponentBox label="Agent" color={COLOR_P2} icon="~" />
          <Arrow direction="down" color={COLOR_P2} />
          <ComponentBox label="LLM Client" color={COLOR_P2} icon="#" />
          <ComponentBox label="API Keys" color={COLOR_P2} icon="*" />
        </div>
      </CornerBrackets>

      <Arrow
        direction="down"
        color={COLOR_P2}
        label="API boundary (tool calls)"
        dashed
      />

      <div className={`flex ${isParallel ? 'gap-3' : 'gap-0'}`}>
        <CornerBrackets
          color={isCrash ? '#ef4444' : COLOR_P2}
          label={isParallel ? 'Sandbox 1' : 'Remote Sandbox'}
          className={isParallel ? 'w-28' : 'w-full max-w-xs'}
        >
          <div className="flex flex-col items-center gap-1">
            <ComponentBox
              label="Tools"
              color={COLOR_P2}
              icon=">"
              dimmed={isCrash}
            />
            {isCrash && (
              <div
                className="font-mono text-[8px] text-center"
                style={{ color: '#ef4444' }}
              >
                Crash! Agent retries
              </div>
            )}
          </div>
        </CornerBrackets>

        {isParallel && (
          <>
            <CornerBrackets
              color={COLOR_P2}
              label="Sandbox 2"
              className="w-28"
            >
              <ComponentBox label="Tools" color={COLOR_P2} icon=">" />
            </CornerBrackets>
            <CornerBrackets
              color={COLOR_P2}
              label="Sandbox 3"
              className="w-28"
            >
              <ComponentBox label="Tools" color={COLOR_P2} icon=">" />
            </CornerBrackets>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radar Chart (SVG)
// ---------------------------------------------------------------------------

function RadarChart({ hoveredAxis }: { hoveredAxis: string | null }) {
  const cx = 140;
  const cy = 140;
  const maxR = 110;
  const levels = 5;
  const n = RADAR_AXES.length;

  const angleSlice = (Math.PI * 2) / n;

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (value / 100) * maxR;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * maxR;
    const points = Array.from({ length: n }, (_, j) => {
      const angle = angleSlice * j - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    return points;
  });

  const p1Points = RADAR_AXES.map((a, i) => getPoint(i, a.p1).join(',')).join(
    ' '
  );
  const p2Points = RADAR_AXES.map((a, i) => getPoint(i, a.p2).join(',')).join(
    ' '
  );

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px]">
      {/* Grid */}
      {gridLevels.map((pts) => (
        <polygon
          key={pts}
          points={pts}
          fill="none"
          stroke="var(--j-border, #333)"
          strokeWidth="0.5"
          opacity={0.4}
        />
      ))}

      {/* Axis lines */}
      {RADAR_AXES.map((axis, i) => {
        const [ex, ey] = getPoint(i, 100);
        return (
          <line
            key={axis.label}
            x1={cx}
            y1={cy}
            x2={ex}
            y2={ey}
            stroke="var(--j-border, #333)"
            strokeWidth="0.5"
            opacity={0.3}
          />
        );
      })}

      {/* P1 polygon */}
      <polygon
        points={p1Points}
        fill={`${COLOR_P1}22`}
        stroke={COLOR_P1}
        strokeWidth="1.5"
      />

      {/* P2 polygon */}
      <polygon
        points={p2Points}
        fill={`${COLOR_P2}22`}
        stroke={COLOR_P2}
        strokeWidth="1.5"
      />

      {/* Dots and labels */}
      {RADAR_AXES.map((axis, i) => {
        const [lx, ly] = getPoint(i, 115);
        const [p1x, p1y] = getPoint(i, axis.p1);
        const [p2x, p2y] = getPoint(i, axis.p2);
        const isHovered = hoveredAxis === axis.key;
        return (
          <g key={axis.key}>
            <circle
              cx={p1x}
              cy={p1y}
              r={isHovered ? 4 : 3}
              fill={COLOR_P1}
            />
            <circle
              cx={p2x}
              cy={p2y}
              r={isHovered ? 4 : 3}
              fill={COLOR_P2}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fontFamily="monospace"
              fill={isHovered ? '#fff' : 'var(--j-text-secondary, #999)'}
              className="uppercase"
              letterSpacing="0.08em"
            >
              {axis.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Scenario Card
// ---------------------------------------------------------------------------

function ScenarioResult({
  result,
}: {
  result: { verdict: 'danger' | 'warning' | 'ok'; text: string };
}) {
  const verdictColors = {
    danger: { bg: '#ef444415', border: '#ef444444', text: '#ef4444', label: 'HIGH RISK' },
    warning: { bg: '#f59e0b15', border: '#f59e0b44', text: '#f59e0b', label: 'FRICTION' },
    ok: { bg: '#05966915', border: '#05966944', text: '#059669', label: 'HANDLED' },
  };

  const c = verdictColors[result.verdict];

  return (
    <div
      className="p-3 border"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
    >
      <span
        className="font-mono text-[9px] tracking-[0.15em] uppercase block mb-1"
        style={{ color: c.text }}
      >
        {c.label}
      </span>
      <p className="font-mono text-[11px] leading-relaxed text-j-text-secondary">
        {result.text}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SandboxPlayground() {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [activeScenarios, setActiveScenarios] = useState<Set<ScenarioKey>>(
    new Set()
  );
  const [hoveredRadarAxis, setHoveredRadarAxis] = useState<string | null>(null);

  const toggleScenario = useCallback((id: ScenarioKey) => {
    setActiveScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Use the first active scenario for diagram highlighting
  const primaryScenario = useMemo(() => {
    const arr = Array.from(activeScenarios);
    return arr.length > 0 ? arr[arr.length - 1] : null;
  }, [activeScenarios]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* ---- Introduction ---- */}
        <section>
          <p className="font-mono text-[12px] text-j-text-secondary leading-relaxed max-w-2xl">
            Two patterns for sandboxing AI agent tool execution. Pattern 1 puts
            everything inside one container. Pattern 2 separates the agent brain
            from the execution environment. Toggle scenarios below to see how
            each architecture responds to real-world challenges.
          </p>
        </section>

        {/* ---- View Mode Selector ---- */}
        <section>
          <div className="flex items-center gap-1">
            {(
              [
                { key: 'pattern1', label: 'Pattern 1' },
                { key: 'side-by-side', label: 'Side by Side' },
                { key: 'pattern2', label: 'Pattern 2' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className="font-mono text-[10px] tracking-[0.15em] uppercase px-4 py-2 border transition-all duration-200"
                style={{
                  borderColor:
                    viewMode === key
                      ? key === 'pattern1'
                        ? COLOR_P1
                        : key === 'pattern2'
                          ? COLOR_P2
                          : '#888'
                      : 'var(--j-border, #333)',
                  color:
                    viewMode === key
                      ? key === 'pattern1'
                        ? COLOR_P1
                        : key === 'pattern2'
                          ? COLOR_P2
                          : '#fff'
                      : 'var(--j-text-secondary, #999)',
                  backgroundColor:
                    viewMode === key
                      ? key === 'pattern1'
                        ? `${COLOR_P1}10`
                        : key === 'pattern2'
                          ? `${COLOR_P2}10`
                          : 'rgba(255,255,255,0.03)'
                      : 'transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ---- Architecture Diagrams ---- */}
        <section>
          <h2 className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary mb-4">
            Architecture Diagram
          </h2>
          <div
            className={`grid gap-8 ${
              viewMode === 'side-by-side' ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(viewMode === 'pattern1' || viewMode === 'side-by-side') && (
              <div className="flex justify-center">
                <Pattern1Diagram activeScenario={primaryScenario} />
              </div>
            )}
            {(viewMode === 'pattern2' || viewMode === 'side-by-side') && (
              <div className="flex justify-center">
                <Pattern2Diagram activeScenario={primaryScenario} />
              </div>
            )}
          </div>
        </section>

        {/* ---- Scenario Simulator ---- */}
        <section>
          <h2 className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary mb-4">
            Scenario Simulator
          </h2>
          <div className="space-y-4">
            {SCENARIOS.map((scenario) => {
              const isActive = activeScenarios.has(scenario.id);
              return (
                <div key={scenario.id}>
                  <button
                    onClick={() => toggleScenario(scenario.id)}
                    className="flex items-center gap-3 w-full text-left group"
                  >
                    <div
                      className="w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        borderColor: isActive
                          ? COLOR_P2
                          : 'var(--j-border, #333)',
                        backgroundColor: isActive
                          ? `${COLOR_P2}20`
                          : 'transparent',
                      }}
                    >
                      {isActive && (
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: COLOR_P2 }}
                        >
                          x
                        </span>
                      )}
                    </div>
                    <div>
                      <span
                        className="font-mono text-[11px] tracking-wider uppercase transition-colors duration-200"
                        style={{
                          color: isActive
                            ? '#fff'
                            : 'var(--j-text-secondary, #999)',
                        }}
                      >
                        {scenario.label}
                      </span>
                      <p className="font-mono text-[10px] text-j-text-tertiary mt-0.5">
                        {scenario.description}
                      </p>
                    </div>
                  </button>

                  {isActive && (
                    <div className="mt-3 ml-7 grid grid-cols-2 gap-3">
                      <div>
                        <span
                          className="font-mono text-[9px] tracking-[0.15em] uppercase block mb-1.5"
                          style={{ color: COLOR_P1 }}
                        >
                          Pattern 1
                        </span>
                        <ScenarioResult result={scenario.p1Result} />
                      </div>
                      <div>
                        <span
                          className="font-mono text-[9px] tracking-[0.15em] uppercase block mb-1.5"
                          style={{ color: COLOR_P2 }}
                        >
                          Pattern 2
                        </span>
                        <ScenarioResult result={scenario.p2Result} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- Trade-off Radar ---- */}
        <section>
          <h2 className="font-mono text-[10px] tracking-[0.15em] uppercase text-j-text-tertiary mb-4">
            Trade-off Radar
          </h2>
          <div className="grid grid-cols-[280px_1fr] gap-8 items-start">
            <RadarChart hoveredAxis={hoveredRadarAxis} />
            <div className="space-y-2 pt-4">
              {/* Legend */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-0.5"
                    style={{ backgroundColor: COLOR_P1 }}
                  />
                  <span className="font-mono text-[9px] tracking-wider uppercase text-j-text-secondary">
                    Pattern 1
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-0.5"
                    style={{ backgroundColor: COLOR_P2 }}
                  />
                  <span className="font-mono text-[9px] tracking-wider uppercase text-j-text-secondary">
                    Pattern 2
                  </span>
                </div>
              </div>

              {/* Axis details */}
              {RADAR_AXES.map((axis) => (
                <div
                  key={axis.key}
                  className="flex items-center gap-3 py-1.5 px-2 cursor-default transition-colors duration-150"
                  style={{
                    backgroundColor:
                      hoveredRadarAxis === axis.key
                        ? 'rgba(255,255,255,0.03)'
                        : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredRadarAxis(axis.key)}
                  onMouseLeave={() => setHoveredRadarAxis(null)}
                >
                  <span className="font-mono text-[10px] tracking-wider uppercase text-j-text-secondary w-32">
                    {axis.label}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-j-border/20 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-300"
                        style={{
                          width: `${axis.p1}%`,
                          backgroundColor: `${COLOR_P1}88`,
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-[9px] w-6 text-right"
                      style={{ color: COLOR_P1 }}
                    >
                      {axis.p1}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-j-border/20 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-300"
                        style={{
                          width: `${axis.p2}%`,
                          backgroundColor: `${COLOR_P2}88`,
                        }}
                      />
                    </div>
                    <span
                      className="font-mono text-[9px] w-6 text-right"
                      style={{ color: COLOR_P2 }}
                    >
                      {axis.p2}
                    </span>
                  </div>
                </div>
              ))}

              <p className="font-mono text-[10px] text-j-text-tertiary mt-4 leading-relaxed">
                Pattern 1 wins on simplicity and latency (no network hop for
                tool calls). Pattern 2 dominates on security, iteration speed,
                parallelization, and cost efficiency. For production agent
                systems, Pattern 2 is the recommended architecture.
              </p>
            </div>
          </div>
        </section>

        {/* ---- Bottom spacer ---- */}
        <div className="h-8" />
      </div>
    </div>
  );
}
