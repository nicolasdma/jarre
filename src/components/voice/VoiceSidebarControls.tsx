'use client';

import { useState } from 'react';
import { Square } from 'lucide-react';
import { TranscriptLine } from './transcript-line';
import type { UnifiedSessionState } from './use-unified-voice-session';
import type { Language } from '@/lib/translations';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

interface VoiceSidebarControlsProps {
  state: UnifiedSessionState;
  elapsed: number;
  error: string | null;
  transcript: TranscriptEntry[];
  language: Language;
  onStop: () => void;
  onRetry: () => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceSidebarControls({
  state,
  elapsed,
  error,
  transcript,
  language,
  onStop,
  onRetry,
  onClose,
}: VoiceSidebarControlsProps) {
  const isEs = language === 'es';
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const isActive = state === 'active';
  const isDone = state === 'done';
  const isError = state === 'error';
  const isConnecting = state === 'idle' || state === 'loading' || state === 'connecting';

  const stateLabels: Record<string, { es: string; en: string }> = {
    idle: { es: 'Preparando...', en: 'Preparing...' },
    loading: { es: 'Cargando contexto...', en: 'Loading context...' },
    connecting: { es: 'Conectando...', en: 'Connecting...' },
    active: { es: 'Conversando', en: 'Exploring' },
    scoring: { es: 'Evaluando...', en: 'Scoring...' },
    summarizing: { es: 'Resumiendo...', en: 'Summarizing...' },
    done: { es: 'Sesión terminada', en: 'Session ended' },
    error: { es: 'Error', en: 'Error' },
  };

  const lastLine = transcript.length > 0 ? transcript[transcript.length - 1] : null;

  return (
    <div className="px-3 pb-3 space-y-3">
      {/* Timer + state */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-2xl font-light text-j-text tabular-nums">
          {formatTime(elapsed)}
        </p>
        <p className={`font-mono text-xs ${isError ? 'text-j-error' : 'text-j-text-tertiary'}`}>
          {stateLabels[state]?.[isEs ? 'es' : 'en'] || state}
        </p>
      </div>

      {/* Error message */}
      {isError && error && (
        <p className="text-xs text-j-error">{error}</p>
      )}

      {/* Transcript */}
      {isActive && (
        <TranscriptLine
          lastLine={lastLine}
          fullTranscript={transcript}
          expanded={transcriptExpanded}
          onToggle={() => setTranscriptExpanded((prev) => !prev)}
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {(isActive || isConnecting) && (
          <button
            onClick={onStop}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-j-error/10 border border-j-error/50 text-j-error rounded font-mono text-xs uppercase tracking-[0.1em] hover:bg-j-error/20 transition-colors"
          >
            <Square size={12} fill="currentColor" />
            {isEs ? 'Terminar' : 'End'}
          </button>
        )}

        {isDone && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-j-border text-j-text-secondary rounded font-mono text-xs uppercase tracking-[0.1em] hover:border-j-accent hover:text-j-accent transition-colors"
          >
            {isEs ? 'Cerrar' : 'Close'}
          </button>
        )}

        {isError && (
          <>
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2.5 bg-j-accent/10 border border-j-accent/50 text-j-accent rounded font-mono text-xs uppercase hover:bg-j-accent/20 transition-colors"
            >
              {isEs ? 'Reintentar' : 'Retry'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-j-border text-j-text-secondary rounded font-mono text-xs uppercase hover:border-j-accent transition-colors"
            >
              {isEs ? 'Cerrar' : 'Close'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
