'use client';

import { X } from 'lucide-react';
import type { UnifiedSessionState } from './use-unified-voice-session';
import type { Language } from '@/lib/translations';

interface MobileVoiceOverlayProps {
  state: UnifiedSessionState;
  elapsed: number;
  error: string | null;
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

export function MobileVoiceOverlay({
  state,
  elapsed,
  error,
  language,
  onStop,
  onRetry,
  onClose,
}: MobileVoiceOverlayProps) {
  const isEs = language === 'es';

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

  return (
    <div className="fixed inset-0 z-50 bg-j-bg flex flex-col items-center justify-center lg:hidden">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 text-j-text-tertiary hover:text-j-text transition-colors"
      >
        <X size={24} />
      </button>

      {/* Mode label */}
      <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-8">
        {isEs ? 'Sesión Libre' : 'Freeform Session'}
      </p>

      {/* Timer */}
      <p className="font-mono text-6xl font-light text-j-text mb-4 tabular-nums">
        {formatTime(elapsed)}
      </p>

      {/* State label */}
      <p className={`font-mono text-sm mb-12 ${isError ? 'text-j-error' : 'text-j-text-secondary'}`}>
        {stateLabels[state]?.[isEs ? 'es' : 'en'] || state}
      </p>

      {/* Error message */}
      {isError && error && (
        <p className="text-sm text-j-error mb-8 max-w-md px-4 text-center">{error}</p>
      )}

      {/* Stop button */}
      {(isActive || isConnecting) && (
        <button
          onClick={onStop}
          className="px-8 py-4 bg-j-error/10 border border-j-error text-j-error rounded-full font-mono text-sm uppercase tracking-[0.15em] hover:bg-j-error/20 transition-colors"
        >
          {isEs ? 'Terminar sesión' : 'End session'}
        </button>
      )}

      {/* Done state */}
      {isDone && (
        <button
          onClick={onClose}
          className="px-8 py-4 bg-j-accent/10 border border-j-accent text-j-accent rounded font-mono text-sm uppercase tracking-[0.15em] hover:bg-j-accent/20 transition-colors"
        >
          {isEs ? 'Cerrar' : 'Close'}
        </button>
      )}

      {/* Error retry */}
      {isError && (
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-j-accent/10 border border-j-accent text-j-accent rounded font-mono text-sm uppercase hover:bg-j-accent/20 transition-colors"
          >
            {isEs ? 'Reintentar' : 'Retry'}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-j-border text-j-text-secondary rounded font-mono text-sm uppercase hover:border-j-accent transition-colors"
          >
            {isEs ? 'Cerrar' : 'Close'}
          </button>
        </div>
      )}
    </div>
  );
}
