'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';

export interface TerminalLine {
  type: 'input' | 'output' | 'success' | 'error' | 'info';
  text: string;
}

interface CommandTerminalProps {
  lines: TerminalLine[];
  onCommand: (command: string) => void;
  status: 'connecting' | 'connected' | 'disconnected';
}

const HISTORY_MAX = 100;

export function CommandTerminal({ lines, onCommand, status }: CommandTerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    onCommand(trimmed);

    // Add to history (avoid duplicates at the end)
    setHistory(prev => {
      const next = prev[prev.length - 1] === trimmed
        ? prev
        : [...prev.slice(-HISTORY_MAX + 1), trimmed];
      return next;
    });
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1
        ? history.length - 1
        : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      }
      return;
    }

    // Ctrl+L to clear
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onCommand('clear');
    }
  };

  const statusColor = {
    connecting: 'text-[#c4a07a]',
    connected: 'text-[#4a5d4a]',
    disconnected: 'text-[#a05050]',
  }[status];

  const statusLabel = {
    connecting: 'connecting...',
    connected: 'connected',
    disconnected: 'engine offline',
  }[status];

  return (
    <div
      className="h-full flex flex-col bg-[#1a1a1a] cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal header */}
      <div className="px-4 py-2 border-b border-[#333] flex items-center justify-between shrink-0">
        <span className="font-mono text-[11px] text-[#888] tracking-wider uppercase">
          Terminal
        </span>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
            status === 'connected' ? 'bg-[#4a5d4a]' :
            status === 'disconnected' ? 'bg-[#a05050]' :
            'bg-[#c4a07a]'
          }`} />
          <span className={`font-mono text-[10px] ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Output area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        {lines.length === 0 && (
          <div className="text-[#555] font-mono text-xs leading-relaxed">
            <p>Jarre Storage Engine — DDIA Ch.3 playground</p>
            <p className="mt-1">
              Try: <span className="text-[#c4a07a]">SET name nicolas</span>
              {' '}then{' '}
              <span className="text-[#c4a07a]">GET name</span>
            </p>
            <p className="mt-1 text-[#444]">
              Commands: SET, GET, DEL, PING, DBSIZE, INFO, INSPECT, DEBUG BACKEND
            </p>
          </div>
        )}

        {lines.map((line, i) => (
          <div key={i} className="font-mono text-xs leading-relaxed">
            {line.type === 'input' ? (
              <span>
                <span className="text-[#4a5d4a]">{'> '}</span>
                <span className="text-[#e0e0d0]">{line.text}</span>
              </span>
            ) : line.type === 'success' ? (
              <span className="text-[#4a5d4a]">{line.text}</span>
            ) : line.type === 'error' ? (
              <span className="text-[#c07070]">{line.text}</span>
            ) : line.type === 'info' ? (
              <span className="text-[#888]">{line.text}</span>
            ) : (
              <span className="text-[#d0d0c0]">{line.text}</span>
            )}
          </div>
        ))}
      </div>

      {/* Input line */}
      <div className="px-4 py-2 border-t border-[#333] flex items-center gap-2 shrink-0">
        <span className="text-[#4a5d4a] font-mono text-xs">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-[#e0e0d0] font-mono text-xs outline-none placeholder:text-[#444]"
          placeholder={status === 'disconnected' ? 'Engine offline — run: npm run engine' : 'Type a command...'}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
