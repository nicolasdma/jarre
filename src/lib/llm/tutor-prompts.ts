/**
 * Socratic Tutor System Prompt & State Serializers
 *
 * Provides the system prompt and per-playground state serializers
 * used to build LLM message arrays for the Socratic tutor feature.
 */

import type { DeepSeekMessage } from './deepseek';

// ---------------------------------------------------------------------------
// 1. System prompt
// ---------------------------------------------------------------------------

export const TUTOR_SYSTEM_PROMPT = `Eres un tutor socrático experto en sistemas distribuidos.

REGLAS:
1. NUNCA des la respuesta directa. Guía con preguntas.
2. Usa el estado actual de la simulación para hacer preguntas específicas.
3. Máximo 3 oraciones por respuesta. Sé conciso.
4. Si el estudiante está equivocado, no corrijas directamente — haz una pregunta que le haga descubrir el error.
5. Responde en español.
6. No uses markdown ni formato especial. Solo texto plano.`;

// ---------------------------------------------------------------------------
// 2. State serializers
// ---------------------------------------------------------------------------

/**
 * Serialize a Raft cluster snapshot (~200 tokens max).
 */
export function serializeConsensusState(snapshot: unknown): string {
  const s = snapshot as {
    nodes?: Array<{
      id?: string;
      state?: string;
      status?: string;
      term?: number;
      votedFor?: string | null;
      log?: Array<{ term?: number; command?: string; committed?: boolean }>;
    }>;
    messages?: Array<{ type?: string; from?: string; to?: string }>;
    events?: Array<{ type?: string; nodeId?: string; detail?: string }>;
    tick?: number;
    partition?: { groupA?: string[]; groupB?: string[] } | null;
  };

  const nodes = s?.nodes ?? [];
  const events = s?.events ?? [];
  const tick = s?.tick ?? 0;
  const partition = s?.partition ?? null;

  const leader = nodes.find((n) => n.state === 'leader');
  const totalCommitted = nodes.reduce((sum, n) => {
    const committed = (n.log ?? []).filter((e) => e.committed).length;
    return sum + committed;
  }, 0);

  const nodeLines = nodes
    .map(
      (n) =>
        `  ${n.id ?? '?'}: ${n.state ?? '?'}/${n.status ?? '?'} term=${n.term ?? 0}`,
    )
    .join('\n');

  const lastEvents = events
    .slice(-3)
    .map((e) => `  ${e.type ?? '?'}: ${e.detail ?? ''}`)
    .join('\n');

  const partitionInfo = partition
    ? `Particionado: grupoA=[${(partition.groupA ?? []).join(',')}] grupoB=[${(partition.groupB ?? []).join(',')}]`
    : 'Sin particion';

  return [
    `Tick: ${tick}`,
    `Nodos (${nodes.length}):`,
    nodeLines,
    `Lider: ${leader?.id ?? 'ninguno'}`,
    `Entradas committed totales: ${totalCommitted}`,
    partitionInfo,
    `Ultimos eventos:`,
    lastEvents || '  (ninguno)',
  ].join('\n');
}

/**
 * Serialize replication playground state (~200 tokens max).
 */
export function serializeReplicationState(state: unknown): string {
  const s = state as {
    nodes?: Array<{
      id?: string;
      role?: string;
      status?: string;
      data?: Map<string, { value?: string; version?: number }>;
    }>;
    events?: Array<{ type?: string; description?: string; severity?: string }>;
    config?: {
      mode?: string;
      replicationDelay?: number;
      autoFailover?: boolean;
    };
    isPartitioned?: boolean;
    violations?: string[];
  };

  const nodes = s?.nodes ?? [];
  const events = s?.events ?? [];
  const config = s?.config ?? {};
  const violations = s?.violations ?? [];

  const nodeLines = nodes
    .map((n) => `  ${n.id ?? '?'}: ${n.role ?? '?'}/${n.status ?? '?'}`)
    .join('\n');

  const lastEvents = events
    .slice(-3)
    .map((e) => `  [${e.severity ?? '?'}] ${e.description ?? ''}`)
    .join('\n');

  return [
    `Modo: ${config.mode ?? '?'}, delay: ${config.replicationDelay ?? '?'}ms, autoFailover: ${config.autoFailover ?? false}`,
    `Particionado: ${s?.isPartitioned ? 'si' : 'no'}`,
    `Nodos (${nodes.length}):`,
    nodeLines,
    `Violaciones: ${violations.length}`,
    `Ultimos eventos:`,
    lastEvents || '  (ninguno)',
  ].join('\n');
}

/**
 * Serialize partitioning playground state (~200 tokens max).
 */
export function serializePartitionState(state: unknown): string {
  const s = state as {
    mode?: string;
    nodes?: Array<{ id?: string; label?: string; keys?: string[] }>;
    keys?: Array<{ key?: string; nodeId?: string }>;
    virtualNodesPerNode?: number;
    lastRebalance?: { moved?: number; total?: number } | null;
  };

  const nodes = s?.nodes ?? [];
  const keys = s?.keys ?? [];
  const vnodes = s?.virtualNodesPerNode ?? 0;
  const rebalance = s?.lastRebalance ?? null;

  const distribution = nodes
    .map((n) => `  ${n.label ?? n.id ?? '?'}: ${(n.keys ?? []).length} keys`)
    .join('\n');

  const rebalanceInfo = rebalance
    ? `Ultimo rebalanceo: ${rebalance.moved ?? 0} movidas de ${rebalance.total ?? 0}`
    : 'Sin rebalanceo reciente';

  return [
    `Modo: ${s?.mode ?? '?'}`,
    `Nodos: ${nodes.length}, Keys totales: ${keys.length}`,
    `Vnodes por nodo: ${vnodes}`,
    `Distribucion:`,
    distribution || '  (vacio)',
    rebalanceInfo,
  ].join('\n');
}

/**
 * Serialize latency playground state (~200 tokens max).
 */
export function serializeLatencyState(state: unknown): string {
  const s = state as {
    config?: {
      distribution?: string;
      baseLatency?: number;
      stdDev?: number;
      downstreamServices?: number;
      sloTarget?: number;
      requestRate?: number;
      slowRequestRate?: number;
      slowLatencyMultiplier?: number;
    };
    percentiles?: {
      p50?: number;
      p95?: number;
      p99?: number;
      p999?: number;
      avg?: number;
    };
    totalRequests?: number;
    sloViolations?: number;
  };

  const config = s?.config ?? {};
  const pct = s?.percentiles ?? {};
  const total = s?.totalRequests ?? 0;
  const violations = s?.sloViolations ?? 0;
  const violationRate = total > 0 ? ((violations / total) * 100).toFixed(2) : '0.00';

  return [
    `Distribucion: ${config.distribution ?? '?'}, base: ${config.baseLatency ?? '?'}ms`,
    `SLO target: ${config.sloTarget ?? '?'}ms`,
    `Fan-out: ${config.downstreamServices ?? '?'} servicios`,
    `Percentiles: p50=${pct.p50 ?? '?'}ms p95=${pct.p95 ?? '?'}ms p99=${pct.p99 ?? '?'}ms p999=${pct.p999 ?? '?'}ms avg=${pct.avg ?? '?'}ms`,
    `Requests totales: ${total}`,
    `Violaciones SLO: ${violations} (${violationRate}%)`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 3. Message builder
// ---------------------------------------------------------------------------

const SERIALIZERS: Record<string, (state: unknown) => string> = {
  consensus: serializeConsensusState,
  replication: serializeReplicationState,
  partitioning: serializePartitionState,
  latency: serializeLatencyState,
};

/**
 * Build the full DeepSeekMessage array for the Socratic tutor.
 *
 * @param playground  - Which playground is active.
 * @param state       - Current simulation state (playground-specific).
 * @param conversationHistory - Prior turns (capped to last 10).
 * @param userMessage - Optional explicit user message. When absent the LLM
 *                      is asked to proactively generate a Socratic question.
 */
export function buildTutorMessages(
  playground: 'consensus' | 'replication' | 'partitioning' | 'latency',
  state: unknown,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage?: string,
): DeepSeekMessage[] {
  const serializer = SERIALIZERS[playground];
  const serializedState = serializer(state);

  const systemContent =
    TUTOR_SYSTEM_PROMPT +
    '\n\nESTADO ACTUAL DE LA SIMULACIÓN:\n' +
    serializedState;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemContent },
  ];

  // Append last 10 conversation turns
  const recentHistory = conversationHistory.slice(-10);
  for (const turn of recentHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }

  // Final user message: explicit or proactive prompt
  if (userMessage !== undefined) {
    messages.push({ role: 'user', content: userMessage });
  } else {
    messages.push({
      role: 'user',
      content:
        'Genera una pregunta socrática breve basada en el estado actual de la simulación.',
    });
  }

  return messages;
}
