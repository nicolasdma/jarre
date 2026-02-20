'use client';

/**
 * Jarre - Transcript Line Component
 *
 * Hybrid transcript: last line always visible, expandable for full history.
 */

import { useRef, useEffect } from 'react';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

interface TranscriptLineProps {
  lastLine: TranscriptEntry | null;
  fullTranscript: TranscriptEntry[];
  expanded: boolean;
  onToggle: () => void;
}

export function TranscriptLine({
  lastLine,
  fullTranscript,
  expanded,
  onToggle,
}: TranscriptLineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when expanded and new entries arrive
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [expanded, fullTranscript.length]);

  if (!lastLine && fullTranscript.length === 0) return null;

  return (
    <div className="relative z-50">
      {/* Expanded transcript */}
      {expanded && (
        <div
          ref={scrollRef}
          className="max-h-48 overflow-y-auto bg-zinc-900/90 backdrop-blur-sm rounded-t-lg border border-zinc-700/50 border-b-0 px-4 py-3 space-y-2"
        >
          {fullTranscript.map((entry, i) => (
            <div
              key={i}
              className={`text-sm ${
                entry.role === 'user'
                  ? 'text-zinc-400'
                  : 'text-amber-200/90'
              }`}
            >
              <span className="text-xs text-zinc-500 mr-2">
                {entry.role === 'user' ? 'Vos' : 'Tutor'}
              </span>
              {entry.text}
            </div>
          ))}
        </div>
      )}

      {/* Last line + toggle */}
      <div
        className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-zinc-800/80 transition-colors"
        onClick={onToggle}
      >
        {lastLine && (
          <p
            className={`flex-1 text-sm truncate ${
              lastLine.role === 'user'
                ? 'text-zinc-400'
                : 'text-amber-200/90'
            }`}
          >
            {lastLine.text}
          </p>
        )}
        <button
          className="text-zinc-500 hover:text-zinc-300 text-xs shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {expanded ? '▲ cerrar' : '▼ expandir'}
        </button>
      </div>
    </div>
  );
}
