'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LessonGuide } from './lesson-guide';
import { PlaygroundLayout } from '@/components/playground/playground-layout';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreamEvent {
  offset: number;
  timestamp: number;
  key: string;
  value: string;
  producerId: string;
}

interface Partition {
  id: number;
  events: StreamEvent[];
}

interface Consumer {
  id: string;
  groupId: string;
  assignedPartitions: number[];
  offsets: Record<number, number>; // partitionId -> committed offset
  color: string;
  status: 'active' | 'idle';
}

interface InFlightEvent {
  id: string;
  event: StreamEvent;
  partitionId: number;
  producerId: string;
  progress: number; // 0..1 for animation
  phase: 'to-broker' | 'to-consumer';
  consumerId?: string;
}

interface BrokerState {
  partitions: Partition[];
  consumers: Consumer[];
  inFlight: InFlightEvent[];
  totalProduced: number;
  totalConsumed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = '#1e40af';

const EVENT_KEYS = ['user.signup', 'order.created', 'payment.processed', 'item.shipped', 'user.login', 'cart.updated', 'review.posted', 'inventory.low'];

const EVENT_VALUES = [
  '{"userId":"u-42","plan":"pro"}',
  '{"orderId":"ord-77","total":129.99}',
  '{"paymentId":"pay-33","status":"ok"}',
  '{"shipmentId":"shp-12","carrier":"dhl"}',
  '{"userId":"u-42","ip":"10.0.1.5"}',
  '{"cartId":"c-99","items":3}',
  '{"reviewId":"r-55","stars":4}',
  '{"sku":"SKU-100","qty":2}',
];

const CONSUMER_COLORS = [
  '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2',
];

const PRODUCER_NAMES = ['producer-A', 'producer-B', 'producer-C'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let eventCounter = 0;
let consumerCounter = 0;
let inflightCounter = 0;

function generateEvent(): { key: string; value: string; producerId: string } {
  const idx = Math.floor(Math.random() * EVENT_KEYS.length);
  const producerId = PRODUCER_NAMES[Math.floor(Math.random() * PRODUCER_NAMES.length)];
  return { key: EVENT_KEYS[idx], value: EVENT_VALUES[idx], producerId };
}

function hashKey(key: string, numPartitions: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % numPartitions;
}

function assignPartitions(partitions: Partition[], consumers: Consumer[]): Consumer[] {
  const activeConsumers = consumers.filter((c) => c.status === 'active');
  if (activeConsumers.length === 0) return consumers;

  // Reset all assignments
  const updated = consumers.map((c) => ({ ...c, assignedPartitions: [] as number[] }));
  const active = updated.filter((c) => c.status === 'active');

  // Round-robin assignment
  partitions.forEach((p, i) => {
    const consumer = active[i % active.length];
    consumer.assignedPartitions.push(p.id);
    // Initialize offset for new partitions
    if (consumer.offsets[p.id] === undefined) {
      consumer.offsets[p.id] = 0;
    }
  });

  return updated;
}

function createInitialState(): BrokerState {
  eventCounter = 0;
  consumerCounter = 0;
  inflightCounter = 0;

  const partitions: Partition[] = [
    { id: 0, events: [] },
    { id: 1, events: [] },
    { id: 2, events: [] },
  ];

  const consumers: Consumer[] = [
    {
      id: `consumer-${++consumerCounter}`,
      groupId: 'group-1',
      assignedPartitions: [0, 1],
      offsets: { 0: 0, 1: 0, 2: 0 },
      color: CONSUMER_COLORS[0],
      status: 'active',
    },
    {
      id: `consumer-${++consumerCounter}`,
      groupId: 'group-1',
      assignedPartitions: [2],
      offsets: { 0: 0, 1: 0, 2: 0 },
      color: CONSUMER_COLORS[1],
      status: 'active',
    },
  ];

  return {
    partitions,
    consumers: assignPartitions(partitions, consumers),
    inFlight: [],
    totalProduced: 0,
    totalConsumed: 0,
  };
}

// ---------------------------------------------------------------------------
// Component: Producer Panel
// ---------------------------------------------------------------------------

function ProducerPanel({
  totalProduced,
  autoMode,
  onProduce,
  onToggleAuto,
}: {
  totalProduced: number;
  autoMode: boolean;
  onProduce: () => void;
  onToggleAuto: () => void;
}) {
  return (
    <div className="border border-j-border rounded p-3 bg-j-bg">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] text-j-text-secondary uppercase tracking-wider">
          Productores
        </span>
        <span className="font-mono text-[10px] text-j-text-tertiary">
          {totalProduced} eventos
        </span>
      </div>
      <div className="flex gap-2 mb-3">
        {PRODUCER_NAMES.map((name) => (
          <div
            key={name}
            className="flex-1 border border-j-border rounded px-2 py-1.5 text-center"
          >
            <span className="font-mono text-[10px] text-j-text-secondary">
              {name}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onProduce}
          className="flex-1 px-3 py-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-mono text-[11px] tracking-wider rounded transition-colors"
        >
          Producir evento
        </button>
        <button
          onClick={onToggleAuto}
          className={`px-3 py-2 font-mono text-[11px] tracking-wider rounded transition-colors border ${
            autoMode
              ? 'bg-[#1e40af] text-white border-[#1e40af]'
              : 'border-j-border text-j-text-secondary hover:border-[#1e40af] hover:text-[#1e40af]'
          }`}
        >
          {autoMode ? 'Auto ON' : 'Auto OFF'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Partition Visualizer
// ---------------------------------------------------------------------------

function PartitionVisualizer({
  partitions,
  consumers,
}: {
  partitions: Partition[];
  consumers: Consumer[];
}) {
  function getConsumerForPartition(partitionId: number): Consumer | undefined {
    return consumers.find(
      (c) => c.status === 'active' && c.assignedPartitions.includes(partitionId)
    );
  }

  return (
    <div className="border border-j-border rounded p-3 bg-j-bg">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] text-j-text-secondary uppercase tracking-wider">
          Broker — Log particionado
        </span>
        <span className="font-mono text-[10px] text-j-text-tertiary">
          {partitions.length} particiones
        </span>
      </div>

      <div className="space-y-3">
        {partitions.map((partition) => {
          const consumer = getConsumerForPartition(partition.id);
          const consumerOffset = consumer?.offsets[partition.id] ?? 0;
          const latestOffset = partition.events.length;
          const lag = latestOffset - consumerOffset;

          return (
            <div key={partition.id} className="space-y-1.5">
              {/* Partition header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-j-text font-medium">
                    P{partition.id}
                  </span>
                  {consumer && (
                    <span
                      className="font-mono text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: consumer.color + '15',
                        color: consumer.color,
                      }}
                    >
                      {consumer.id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-j-text-tertiary">
                    offset: {latestOffset}
                  </span>
                  {lag > 0 && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        lag > 5
                          ? 'bg-red-100 text-red-700'
                          : lag > 2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      lag: {lag}
                    </span>
                  )}
                </div>
              </div>

              {/* Event log visualization */}
              <div className="flex gap-0.5 overflow-x-auto pb-1">
                {partition.events.length === 0 ? (
                  <div className="font-mono text-[10px] text-j-text-tertiary italic px-1">
                    (vacio)
                  </div>
                ) : (
                  partition.events.map((event, idx) => {
                    const isConsumed = idx < consumerOffset;
                    const isNext = idx === consumerOffset;

                    return (
                      <div
                        key={event.offset}
                        className={`group relative shrink-0 w-8 h-8 border rounded flex items-center justify-center cursor-default transition-all ${
                          isConsumed
                            ? 'border-green-300 bg-green-50'
                            : isNext
                              ? 'border-[#1e40af] bg-blue-50 ring-1 ring-[#1e40af]'
                              : 'border-j-border bg-j-bg'
                        }`}
                      >
                        <span
                          className={`font-mono text-[9px] ${
                            isConsumed
                              ? 'text-green-600'
                              : isNext
                                ? 'text-[#1e40af]'
                                : 'text-j-text-secondary'
                          }`}
                        >
                          {event.offset}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                          <div className="bg-[#1a1a1a] text-white px-3 py-2 rounded shadow-lg whitespace-nowrap">
                            <div className="font-mono text-[10px] space-y-0.5">
                              <div>
                                <span className="text-[#888]">offset:</span>{' '}
                                {event.offset}
                              </div>
                              <div>
                                <span className="text-[#888]">key:</span>{' '}
                                {event.key}
                              </div>
                              <div>
                                <span className="text-[#888]">from:</span>{' '}
                                {event.producerId}
                              </div>
                              <div className="text-[9px] text-[#666] max-w-[200px] truncate">
                                {event.value}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Offset pointer */}
              {partition.events.length > 0 && consumer && (
                <div className="flex items-center gap-1">
                  <div
                    className="h-0.5 rounded"
                    style={{
                      width: `${Math.max(0, (consumerOffset / Math.max(partition.events.length, 1)) * 100)}%`,
                      backgroundColor: consumer.color,
                      minWidth: consumerOffset > 0 ? '4px' : '0',
                    }}
                  />
                  <span
                    className="font-mono text-[9px] shrink-0"
                    style={{ color: consumer.color }}
                  >
                    committed: {consumerOffset}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Consumer Group Panel
// ---------------------------------------------------------------------------

function ConsumerGroupPanel({
  consumers,
  partitions,
  selectedConsumer,
  onSelectConsumer,
  onAddConsumer,
  onRemoveConsumer,
}: {
  consumers: Consumer[];
  partitions: Partition[];
  selectedConsumer: string | null;
  onSelectConsumer: (id: string) => void;
  onAddConsumer: () => void;
  onRemoveConsumer: (id: string) => void;
}) {
  function getTotalLag(consumer: Consumer): number {
    return consumer.assignedPartitions.reduce((sum, pId) => {
      const partition = partitions.find((p) => p.id === pId);
      if (!partition) return sum;
      const offset = consumer.offsets[pId] ?? 0;
      return sum + (partition.events.length - offset);
    }, 0);
  }

  function getTotalProcessed(consumer: Consumer): number {
    return consumer.assignedPartitions.reduce((sum, pId) => {
      return sum + (consumer.offsets[pId] ?? 0);
    }, 0);
  }

  return (
    <div className="border border-j-border rounded p-3 bg-j-bg">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[11px] text-j-text-secondary uppercase tracking-wider">
          Consumer Group — group-1
        </span>
        <button
          onClick={onAddConsumer}
          disabled={consumers.length >= 6}
          className="font-mono text-[10px] text-[#1e40af] hover:text-[#1e3a8a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          + Agregar
        </button>
      </div>

      <div className="space-y-2">
        {consumers.map((consumer) => {
          const lag = getTotalLag(consumer);
          const processed = getTotalProcessed(consumer);
          const isSelected = selectedConsumer === consumer.id;
          const isIdle = consumer.assignedPartitions.length === 0;

          return (
            <button
              key={consumer.id}
              onClick={() => onSelectConsumer(consumer.id)}
              className={`w-full text-left px-3 py-2.5 border rounded transition-all ${
                isSelected
                  ? 'border-[#1e40af] bg-blue-50'
                  : 'border-j-border hover:border-j-text-tertiary'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: consumer.color }}
                  />
                  <span className="font-mono text-[11px] text-j-text">
                    {consumer.id}
                  </span>
                  {isIdle && (
                    <span className="font-mono text-[9px] text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                      IDLE
                    </span>
                  )}
                </div>
                {consumers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveConsumer(consumer.id);
                    }}
                    className="font-mono text-[10px] text-j-text-tertiary hover:text-red-500 transition-colors bg-transparent border-none p-0"
                    aria-label="Remove consumer"
                  >
                    x
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-j-text-tertiary">
                  particiones: [{consumer.assignedPartitions.join(', ')}]
                </span>
                <span className="font-mono text-[10px] text-green-600">
                  procesados: {processed}
                </span>
                {lag > 0 && (
                  <span
                    className={`font-mono text-[10px] ${
                      lag > 10
                        ? 'text-red-600'
                        : lag > 4
                          ? 'text-amber-600'
                          : 'text-blue-600'
                    }`}
                  >
                    lag: {lag}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Event Log
// ---------------------------------------------------------------------------

function EventLog({ events }: { events: Array<{ timestamp: number; message: string; type: 'produce' | 'consume' | 'rebalance' | 'system' }> }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const typeColors: Record<string, string> = {
    produce: 'text-[#1e40af]',
    consume: 'text-green-600',
    rebalance: 'text-amber-600',
    system: 'text-j-text-tertiary',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-j-border flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-j-text-secondary uppercase tracking-wider">
          Event Log
        </span>
        <span className="font-mono text-[10px] text-j-text-tertiary">
          {events.length} entries
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {events.length === 0 ? (
          <p className="font-mono text-[11px] text-j-text-tertiary italic py-2">
            Sin eventos aun. Produce un mensaje para comenzar.
          </p>
        ) : (
          events.slice(-50).map((entry) => (
            <div key={`event-${entry.timestamp}`} className="flex gap-2 py-0.5">
              <span className="font-mono text-[9px] text-j-text-tertiary shrink-0 w-16">
                {new Date(entry.timestamp).toLocaleTimeString('es', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className={`font-mono text-[10px] ${typeColors[entry.type]}`}>
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Stats Bar
// ---------------------------------------------------------------------------

function StatsBar({
  state,
}: {
  state: BrokerState;
}) {
  const totalEvents = state.partitions.reduce((s, p) => s + p.events.length, 0);
  const totalConsumed = state.consumers.reduce(
    (s, c) =>
      s +
      c.assignedPartitions.reduce((cs, pId) => cs + (c.offsets[pId] ?? 0), 0),
    0
  );
  const totalLag = totalEvents - totalConsumed;
  const activeConsumers = state.consumers.filter((c) => c.assignedPartitions.length > 0).length;

  return (
    <div className="flex items-center gap-6 px-4 py-2 border-b border-j-border bg-j-bg shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-j-text-tertiary uppercase tracking-wider">
          Total eventos:
        </span>
        <span className="font-mono text-[11px] text-j-text">{totalEvents}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-j-text-tertiary uppercase tracking-wider">
          Consumidos:
        </span>
        <span className="font-mono text-[11px] text-green-600">{totalConsumed}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-j-text-tertiary uppercase tracking-wider">
          Lag total:
        </span>
        <span
          className={`font-mono text-[11px] ${
            totalLag > 15
              ? 'text-red-600'
              : totalLag > 5
                ? 'text-amber-600'
                : 'text-j-text'
          }`}
        >
          {totalLag}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-j-text-tertiary uppercase tracking-wider">
          Particiones:
        </span>
        <span className="font-mono text-[11px] text-j-text">{state.partitions.length}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-j-text-tertiary uppercase tracking-wider">
          Consumidores:
        </span>
        <span className="font-mono text-[11px] text-j-text">
          {activeConsumers}/{state.consumers.length}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Controls Panel
// ---------------------------------------------------------------------------

function ControlsPanel({
  selectedConsumer,
  autoMode,
  onProduce,
  onAdvanceConsumer,
  onAdvanceAll,
  onRewindConsumer,
  onAddPartition,
  onToggleAuto,
  onReset,
}: {
  selectedConsumer: string | null;
  autoMode: boolean;
  onProduce: () => void;
  onAdvanceConsumer: () => void;
  onAdvanceAll: () => void;
  onRewindConsumer: () => void;
  onAddPartition: () => void;
  onToggleAuto: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
      <button
        onClick={onProduce}
        className="px-3 py-1.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-mono text-[10px] tracking-wider rounded transition-colors"
      >
        Producir
      </button>
      <button
        onClick={onAdvanceConsumer}
        disabled={!selectedConsumer}
        className="px-3 py-1.5 border border-j-border font-mono text-[10px] tracking-wider rounded transition-colors hover:border-green-500 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-j-text-secondary"
      >
        Avanzar offset
      </button>
      <button
        onClick={onAdvanceAll}
        className="px-3 py-1.5 border border-j-border font-mono text-[10px] tracking-wider rounded transition-colors hover:border-green-500 hover:text-green-600 text-j-text-secondary"
      >
        Avanzar todos
      </button>
      <button
        onClick={onRewindConsumer}
        disabled={!selectedConsumer}
        className="px-3 py-1.5 border border-j-border font-mono text-[10px] tracking-wider rounded transition-colors hover:border-amber-500 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-j-text-secondary"
      >
        Rewind -3
      </button>

      <div className="w-px h-4 bg-j-border" />

      <button
        onClick={onAddPartition}
        className="px-3 py-1.5 border border-j-border font-mono text-[10px] tracking-wider rounded transition-colors hover:border-[#1e40af] hover:text-[#1e40af] text-j-text-secondary"
      >
        + Particion
      </button>
      <button
        onClick={onToggleAuto}
        className={`px-3 py-1.5 font-mono text-[10px] tracking-wider rounded transition-colors border ${
          autoMode
            ? 'bg-[#1e40af] text-white border-[#1e40af]'
            : 'border-j-border text-j-text-secondary hover:border-[#1e40af] hover:text-[#1e40af]'
        }`}
      >
        {autoMode ? 'Parar auto' : 'Auto produce'}
      </button>

      <div className="ml-auto">
        <button
          onClick={onReset}
          className="px-3 py-1.5 border border-j-border font-mono text-[10px] tracking-wider rounded transition-colors hover:border-red-400 hover:text-red-500 text-j-text-tertiary"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Flow Diagram
// ---------------------------------------------------------------------------

function FlowDiagram({
  partitions,
  consumers,
}: {
  partitions: Partition[];
  consumers: Consumer[];
}) {
  return (
    <div className="border border-j-border rounded p-3 bg-j-bg">
      <span className="font-mono text-[11px] text-j-text-secondary uppercase tracking-wider mb-3 block">
        Flujo del sistema
      </span>

      <div className="flex items-start gap-2">
        {/* Producers */}
        <div className="shrink-0 space-y-1">
          <span className="font-mono text-[9px] text-j-text-tertiary uppercase block mb-1">
            Producers
          </span>
          {PRODUCER_NAMES.map((name) => (
            <div
              key={name}
              className="border border-j-border rounded px-2 py-1 font-mono text-[9px] text-j-text-secondary"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center h-full pt-6 shrink-0">
          <div className="w-8 h-px bg-[#1e40af]" />
          <span className="font-mono text-[8px] text-[#1e40af]">key hash</span>
        </div>

        {/* Partitions */}
        <div className="shrink-0 space-y-1">
          <span className="font-mono text-[9px] text-j-text-tertiary uppercase block mb-1">
            Partitions
          </span>
          {partitions.map((p) => {
            const consumer = consumers.find(
              (c) => c.status === 'active' && c.assignedPartitions.includes(p.id)
            );
            return (
              <div
                key={p.id}
                className="border rounded px-2 py-1 font-mono text-[9px] flex items-center gap-1.5"
                style={{
                  borderColor: consumer ? consumer.color + '60' : undefined,
                  backgroundColor: consumer ? consumer.color + '08' : undefined,
                }}
              >
                <span className="text-j-text">P{p.id}</span>
                <span className="text-j-text-tertiary">
                  [{p.events.length}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center h-full pt-6 shrink-0">
          <div className="w-8 h-px bg-green-500" />
          <span className="font-mono text-[8px] text-green-600">pull</span>
        </div>

        {/* Consumers */}
        <div className="shrink-0 space-y-1">
          <span className="font-mono text-[9px] text-j-text-tertiary uppercase block mb-1">
            Consumers
          </span>
          {consumers.map((c) => (
            <div
              key={c.id}
              className="border rounded px-2 py-1 font-mono text-[9px] flex items-center gap-1.5"
              style={{
                borderColor: c.color + '60',
                backgroundColor: c.color + '08',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              <span className="text-j-text">{c.id}</span>
              {c.assignedPartitions.length === 0 && (
                <span className="text-amber-500 text-[8px]">idle</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: StreamPlayground
// ---------------------------------------------------------------------------

export function StreamPlayground() {
  const [state, setState] = useState<BrokerState>(createInitialState);
  const [selectedConsumer, setSelectedConsumer] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [eventLog, setEventLog] = useState<
    Array<{ timestamp: number; message: string; type: 'produce' | 'consume' | 'rebalance' | 'system' }>
  >([]);

  const addLogEntry = useCallback(
    (message: string, type: 'produce' | 'consume' | 'rebalance' | 'system') => {
      setEventLog((prev) => [...prev.slice(-100), { timestamp: Date.now(), message, type }]);
    },
    []
  );

  // -- Produce event --
  const handleProduce = useCallback(() => {
    const { key, value, producerId } = generateEvent();

    setState((prev) => {
      const numPartitions = prev.partitions.length;
      const targetPartition = hashKey(key, numPartitions);

      const newPartitions = prev.partitions.map((p) => {
        if (p.id !== targetPartition) return p;
        const newEvent: StreamEvent = {
          offset: p.events.length,
          timestamp: Date.now(),
          key,
          value,
          producerId,
        };
        return { ...p, events: [...p.events, newEvent] };
      });

      return {
        ...prev,
        partitions: newPartitions,
        totalProduced: prev.totalProduced + 1,
      };
    });

    const targetPartition = hashKey(key, state.partitions.length);
    addLogEntry(
      `${producerId} -> P${targetPartition}: ${key}`,
      'produce'
    );
  }, [state.partitions.length, addLogEntry]);

  // -- Advance consumer offset --
  const handleAdvanceConsumer = useCallback(() => {
    if (!selectedConsumer) return;

    setState((prev) => {
      const consumer = prev.consumers.find((c) => c.id === selectedConsumer);
      if (!consumer) return prev;

      let advanced = false;
      const newOffsets = { ...consumer.offsets };

      for (const pId of consumer.assignedPartitions) {
        const partition = prev.partitions.find((p) => p.id === pId);
        if (!partition) continue;
        const currentOffset = newOffsets[pId] ?? 0;
        if (currentOffset < partition.events.length) {
          newOffsets[pId] = currentOffset + 1;
          advanced = true;
          break; // advance one event at a time
        }
      }

      if (!advanced) return prev;

      const newConsumers = prev.consumers.map((c) =>
        c.id === selectedConsumer ? { ...c, offsets: newOffsets } : c
      );

      return {
        ...prev,
        consumers: newConsumers,
        totalConsumed: prev.totalConsumed + 1,
      };
    });

    addLogEntry(`${selectedConsumer} avanza offset`, 'consume');
  }, [selectedConsumer, addLogEntry]);

  // -- Advance all consumers --
  const handleAdvanceAll = useCallback(() => {
    setState((prev) => {
      let anyAdvanced = false;
      const newConsumers = prev.consumers.map((c) => {
        const newOffsets = { ...c.offsets };
        for (const pId of c.assignedPartitions) {
          const partition = prev.partitions.find((p) => p.id === pId);
          if (!partition) continue;
          const currentOffset = newOffsets[pId] ?? 0;
          if (currentOffset < partition.events.length) {
            newOffsets[pId] = currentOffset + 1;
            anyAdvanced = true;
          }
        }
        return { ...c, offsets: newOffsets };
      });

      if (!anyAdvanced) return prev;

      return {
        ...prev,
        consumers: newConsumers,
      };
    });

    addLogEntry('Todos los consumidores avanzan', 'consume');
  }, [addLogEntry]);

  // -- Rewind consumer --
  const handleRewindConsumer = useCallback(() => {
    if (!selectedConsumer) return;

    setState((prev) => {
      const consumer = prev.consumers.find((c) => c.id === selectedConsumer);
      if (!consumer) return prev;

      const newOffsets = { ...consumer.offsets };
      for (const pId of consumer.assignedPartitions) {
        const currentOffset = newOffsets[pId] ?? 0;
        newOffsets[pId] = Math.max(0, currentOffset - 3);
      }

      const newConsumers = prev.consumers.map((c) =>
        c.id === selectedConsumer ? { ...c, offsets: newOffsets } : c
      );

      return { ...prev, consumers: newConsumers };
    });

    addLogEntry(`${selectedConsumer} rewind -3 (re-procesamiento)`, 'system');
  }, [selectedConsumer, addLogEntry]);

  // -- Add consumer --
  const handleAddConsumer = useCallback(() => {
    setState((prev) => {
      if (prev.consumers.length >= 6) return prev;

      const newConsumer: Consumer = {
        id: `consumer-${++consumerCounter}`,
        groupId: 'group-1',
        assignedPartitions: [],
        offsets: Object.fromEntries(prev.partitions.map((p) => [p.id, 0])),
        color: CONSUMER_COLORS[prev.consumers.length % CONSUMER_COLORS.length],
        status: 'active',
      };

      const newConsumers = assignPartitions(prev.partitions, [
        ...prev.consumers,
        newConsumer,
      ]);

      return { ...prev, consumers: newConsumers };
    });

    addLogEntry('Nuevo consumidor agregado — rebalanceo', 'rebalance');
  }, [addLogEntry]);

  // -- Remove consumer --
  const handleRemoveConsumer = useCallback(
    (id: string) => {
      setState((prev) => {
        const filtered = prev.consumers.filter((c) => c.id !== id);
        if (filtered.length === 0) return prev;
        const rebalanced = assignPartitions(prev.partitions, filtered);
        return { ...prev, consumers: rebalanced };
      });

      if (selectedConsumer === id) {
        setSelectedConsumer(null);
      }

      addLogEntry(`${id} removido — rebalanceo`, 'rebalance');
    },
    [selectedConsumer, addLogEntry]
  );

  // -- Add partition --
  const handleAddPartition = useCallback(() => {
    setState((prev) => {
      if (prev.partitions.length >= 8) return prev;

      const newPartition: Partition = {
        id: prev.partitions.length,
        events: [],
      };

      const newPartitions = [...prev.partitions, newPartition];

      // Initialize offsets for all consumers for the new partition
      const consumersWithNewOffset = prev.consumers.map((c) => ({
        ...c,
        offsets: { ...c.offsets, [newPartition.id]: 0 },
      }));

      const rebalanced = assignPartitions(newPartitions, consumersWithNewOffset);

      return { ...prev, partitions: newPartitions, consumers: rebalanced };
    });

    addLogEntry('Nueva particion agregada — rebalanceo', 'rebalance');
  }, [addLogEntry]);

  // -- Toggle auto mode --
  const handleToggleAuto = useCallback(() => {
    setAutoMode((prev) => !prev);
  }, []);

  // -- Reset --
  const handleReset = useCallback(() => {
    setState(createInitialState());
    setSelectedConsumer(null);
    setAutoMode(false);
    setEventLog([]);
    addLogEntry('Sistema reiniciado', 'system');
  }, [addLogEntry]);

  // -- Select consumer --
  const handleSelectConsumer = useCallback((id: string) => {
    setSelectedConsumer((prev) => (prev === id ? null : id));
  }, []);

  // -- Auto produce interval --
  useEffect(() => {
    if (autoMode) {
      autoRef.current = setInterval(() => {
        const { key, value, producerId } = generateEvent();

        setState((prev) => {
          const numPartitions = prev.partitions.length;
          const targetPartition = hashKey(key, numPartitions);

          const newPartitions = prev.partitions.map((p) => {
            if (p.id !== targetPartition) return p;
            const newEvent: StreamEvent = {
              offset: p.events.length,
              timestamp: Date.now(),
              key,
              value,
              producerId,
            };
            return { ...p, events: [...p.events, newEvent] };
          });

          return {
            ...prev,
            partitions: newPartitions,
            totalProduced: prev.totalProduced + 1,
          };
        });

        const targetPartition = hashKey(key, 3); // approximate
        addLogEntry(`[auto] ${producerId} -> P${targetPartition}: ${key}`, 'produce');
      }, 800);
    } else {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    }

    return () => {
      if (autoRef.current) {
        clearInterval(autoRef.current);
        autoRef.current = null;
      }
    };
  }, [autoMode, addLogEntry]);

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <StatsBar state={state} />

      {/* Main area */}
      <div className="flex-1 min-h-0">
        <PlaygroundLayout
          accentColor={ACCENT}
          disableTutor
          lessons={
            <LessonGuide
              onReset={handleReset}
              onProduce={handleProduce}
              onAdvanceConsumer={handleAdvanceConsumer}
              onRewindConsumer={handleRewindConsumer}
              onAddConsumer={handleAddConsumer}
              onAddPartition={handleAddPartition}
              onToggleAuto={handleToggleAuto}
            />
          }
          bottomPanel={<EventLog events={eventLog} />}
          bottomPanelHeight="h-44"
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {/* Flow diagram */}
              <FlowDiagram
                partitions={state.partitions}
                consumers={state.consumers}
              />

              {/* Partitioned log */}
              <PartitionVisualizer
                partitions={state.partitions}
                consumers={state.consumers}
              />

              {/* Consumer group */}
              <ConsumerGroupPanel
                consumers={state.consumers}
                partitions={state.partitions}
                selectedConsumer={selectedConsumer}
                onSelectConsumer={handleSelectConsumer}
                onAddConsumer={handleAddConsumer}
                onRemoveConsumer={handleRemoveConsumer}
              />
            </div>

            {/* Controls */}
            <div className="shrink-0 border-t border-j-border">
              <ControlsPanel
                selectedConsumer={selectedConsumer}
                autoMode={autoMode}
                onProduce={handleProduce}
                onAdvanceConsumer={handleAdvanceConsumer}
                onAdvanceAll={handleAdvanceAll}
                onRewindConsumer={handleRewindConsumer}
                onAddPartition={handleAddPartition}
                onToggleAuto={handleToggleAuto}
                onReset={handleReset}
              />
            </div>
          </div>
        </PlaygroundLayout>
      </div>
    </div>
  );
}
