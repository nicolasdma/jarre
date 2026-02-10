'use client';

import { useState, useEffect, useRef } from 'react';
import type { EventLogEntry } from './replication-playground';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EventLogProps {
  events: EventLogEntry[];
}

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

type EventFilter = 'all' | 'writes' | 'reads' | 'violations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getEventIcon(type: EventLogEntry['type']): string {
  switch (type) {
    case 'write': return 'W';
    case 'read': return 'R';
    case 'replicate': return '>';
    case 'crash': return 'X';
    case 'recover': return '+';
    case 'partition': return '|';
    case 'heal': return '=';
    case 'violation': return '!';
  }
}

function getEventIconColor(type: EventLogEntry['type']): string {
  switch (type) {
    case 'write': return '#2d4a6a';
    case 'read': return '#4a5d4a';
    case 'replicate': return '#7a7a6e';
    case 'crash': return '#991b1b';
    case 'recover': return '#4a5d4a';
    case 'partition': return '#d97706';
    case 'heal': return '#4a5d4a';
    case 'violation': return '#991b1b';
  }
}

function getSeverityBg(severity: EventLogEntry['severity']): string {
  switch (severity) {
    case 'info': return '';
    case 'warning': return 'bg-[#fffbeb]';
    case 'error': return 'bg-[#fef2f2]';
  }
}

function formatRelativeTime(timestamp: number, baseTimestamp: number): string {
  const diff = timestamp - baseTimestamp;
  if (diff < 1000) return `+${diff}ms`;
  if (diff < 60000) return `+${(diff / 1000).toFixed(1)}s`;
  return `+${(diff / 60000).toFixed(1)}m`;
}

function matchesFilter(event: EventLogEntry, filter: EventFilter): boolean {
  switch (filter) {
    case 'all': return true;
    case 'writes': return event.type === 'write' || event.type === 'replicate';
    case 'reads': return event.type === 'read';
    case 'violations': return event.type === 'violation';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventLog({ events }: EventLogProps) {
  const [filter, setFilter] = useState<EventFilter>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const baseTimestamp = events.length > 0 ? events[0].timestamp : Date.now();

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const filteredEvents = events.filter(e => matchesFilter(e, filter));
  const violationCount = events.filter(e => e.type === 'violation').length;

  const filters: Array<{ key: EventFilter; label: string }> = [
    { key: 'all', label: 'Todo' },
    { key: 'writes', label: 'Escrituras' },
    { key: 'reads', label: 'Lecturas' },
    { key: 'violations', label: `Violaciones${violationCount > 0 ? ` (${violationCount})` : ''}` },
  ];

  return (
    <div className="h-full flex flex-col bg-j-bg">
      {/* Header */}
      <div className="px-5 py-3 border-b border-j-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
            Event Log
          </span>
          <span className="font-mono text-[10px] text-[#a0a090]">
            {events.length} evento{events.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2 py-0.5 font-mono text-[10px] rounded transition-colors ${
                filter === f.key
                  ? f.key === 'violations'
                    ? 'bg-[#991b1b] text-white'
                    : 'bg-[#2d4a6a] text-white'
                  : 'bg-[#f0efe8] text-j-text-secondary hover:bg-j-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        {filteredEvents.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="font-mono text-[11px] text-[#bbb]">
              {events.length === 0
                ? 'Inicia la simulacion para ver eventos'
                : 'No hay eventos para este filtro'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0efe8]">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className={`px-4 py-2 ${getSeverityBg(event.severity)} ${
                  event.type === 'violation' ? 'border-l-2 border-[#991b1b]' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: getEventIconColor(event.type) + '18' }}
                  >
                    <span
                      className="font-mono text-[9px] font-bold"
                      style={{ color: getEventIconColor(event.type) }}
                    >
                      {getEventIcon(event.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-mono text-[11px] leading-relaxed break-words ${
                      event.severity === 'error' ? 'text-[#991b1b]' : 'text-[#444]'
                    }`}>
                      {event.description}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="font-mono text-[9px] text-[#bbb] shrink-0 mt-0.5">
                    {formatRelativeTime(event.timestamp, baseTimestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {violationCount > 0 && (
        <div className="px-4 py-2 border-t border-j-border bg-[#fef2f2] shrink-0">
          <p className="font-mono text-[10px] text-[#991b1b]">
            {violationCount} violacion{violationCount !== 1 ? 'es' : ''} de consistencia detectada{violationCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
