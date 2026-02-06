'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CommandTerminal, type TerminalLine } from './command-terminal';
import { StateInspector, type EngineState } from './state-inspector';
import { LessonGuide } from './lesson-guide';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function EnginePlayground() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLine = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line]);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/playground/storage-engine/state');
      if (!res.ok) {
        if (res.status === 503) {
          setStatus('disconnected');
          return;
        }
        return;
      }
      const data = await res.json();
      setEngineState(data);
      setStatus('connected');
    } catch {
      setStatus('disconnected');
    }
  }, []);

  // Poll engine state
  useEffect(() => {
    fetchState();
    pollRef.current = setInterval(fetchState, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchState]);

  const executeCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    addLine({ type: 'input', text: trimmed });

    if (trimmed.toLowerCase() === 'clear') {
      setLines([]);
      return;
    }

    try {
      const res = await fetch('/api/playground/storage-engine/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLine({ type: 'error', text: data.error });
        return;
      }

      const formatted = formatRespResponse(data.response);
      for (const line of formatted) {
        addLine(line);
      }

      // Refresh state after any command
      fetchState();
    } catch {
      addLine({ type: 'error', text: 'Failed to connect to API' });
    }
  }, [addLine, fetchState]);

  const currentBackend = engineState?.backend?.name ?? 'append-log';

  return (
    <div className="h-full flex">
      {/* Left: Lesson Guide */}
      <div className="flex-[2] shrink-0 border-r border-[#e8e6e0] overflow-hidden">
        <LessonGuide
          onRunCommand={executeCommand}
          currentBackend={currentBackend}
        />
      </div>

      {/* Center: Terminal */}
      <div className="flex-[4] min-w-0 border-r border-[#e8e6e0]">
        <CommandTerminal
          lines={lines}
          onCommand={executeCommand}
          status={status}
        />
      </div>

      {/* Right: State Inspector */}
      <div className="flex-[3] min-w-0 overflow-y-auto">
        <StateInspector state={engineState} status={status} />
      </div>
    </div>
  );
}

/**
 * Parse a raw RESP response into formatted terminal lines.
 */
function formatRespResponse(raw: string): TerminalLine[] {
  if (!raw) return [{ type: 'output', text: '(empty response)' }];

  const type = raw[0];

  switch (type) {
    case '+': {
      const value = raw.substring(1, raw.indexOf('\r\n'));
      return [{ type: 'success', text: value }];
    }
    case '-': {
      const value = raw.substring(1, raw.indexOf('\r\n'));
      return [{ type: 'error', text: `(error) ${value}` }];
    }
    case ':': {
      const value = raw.substring(1, raw.indexOf('\r\n'));
      return [{ type: 'output', text: `(integer) ${value}` }];
    }
    case '$': {
      const lineEnd = raw.indexOf('\r\n');
      const length = parseInt(raw.substring(1, lineEnd), 10);
      if (length === -1) return [{ type: 'output', text: '(nil)' }];
      const value = raw.substring(lineEnd + 2, lineEnd + 2 + length);
      // Multi-line values (like INFO or INSPECT)
      if (value.includes('\n') || value.includes('\r\n')) {
        return value
          .split(/\r?\n/)
          .filter(l => l.length > 0)
          .map(l => ({ type: 'output' as const, text: l }));
      }
      return [{ type: 'output', text: `"${value}"` }];
    }
    case '*': {
      const lineEnd = raw.indexOf('\r\n');
      const count = parseInt(raw.substring(1, lineEnd), 10);
      if (count === -1) return [{ type: 'output', text: '(nil)' }];
      if (count === 0) return [{ type: 'output', text: '(empty array)' }];
      // Parse array elements
      const elements = parseArrayElements(raw, lineEnd + 2, count);
      return elements.map((el, i) => ({
        type: 'output' as const,
        text: `${i + 1}) ${el}`,
      }));
    }
    default:
      return [{ type: 'output', text: raw.trim() }];
  }
}

function parseArrayElements(raw: string, offset: number, count: number): string[] {
  const results: string[] = [];
  let pos = offset;

  for (let i = 0; i < count && pos < raw.length; i++) {
    const type = raw[pos];
    const lineEnd = raw.indexOf('\r\n', pos);
    if (lineEnd === -1) break;

    if (type === '$') {
      const length = parseInt(raw.substring(pos + 1, lineEnd), 10);
      if (length === -1) {
        results.push('(nil)');
        pos = lineEnd + 2;
      } else {
        const value = raw.substring(lineEnd + 2, lineEnd + 2 + length);
        results.push(`"${value}"`);
        pos = lineEnd + 2 + length + 2;
      }
    } else if (type === ':') {
      const value = raw.substring(pos + 1, lineEnd);
      results.push(`(integer) ${value}`);
      pos = lineEnd + 2;
    } else if (type === '+') {
      const value = raw.substring(pos + 1, lineEnd);
      results.push(value);
      pos = lineEnd + 2;
    } else {
      results.push(raw.substring(pos, lineEnd));
      pos = lineEnd + 2;
    }
  }

  return results;
}
