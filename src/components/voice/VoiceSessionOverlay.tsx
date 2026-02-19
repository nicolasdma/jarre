'use client';

import { useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';
import { useVoiceFreeformSession } from './use-voice-freeform-session';
import { useVoiceDebateSession } from './use-voice-debate-session';
import type { Language } from '@/lib/translations';

interface VoiceSessionOverlayProps {
  mode: 'freeform' | 'debate';
  onClose: () => void;
  language: Language;
  debateTopic?: {
    topic: string;
    position: string;
    conceptIds: string[];
  };
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function VoiceSessionContent({
  mode,
  onClose,
  language,
  debateTopic,
}: VoiceSessionOverlayProps) {
  const isEs = language === 'es';
  const autoStarted = useRef(false);

  const freeform = useVoiceFreeformSession({ language });
  const debate = useVoiceDebateSession({
    debateTopic: debateTopic || { topic: '', position: '', conceptIds: [] },
    language,
  });

  const session = mode === 'freeform' ? freeform : debate;
  const state = mode === 'freeform' ? freeform.state : debate.state;

  useEffect(() => {
    if (!autoStarted.current) {
      autoStarted.current = true;
      session.start();
    }
  }, []);

  const stateLabels: Record<string, { es: string; en: string }> = {
    idle: { es: 'Preparando...', en: 'Preparing...' },
    loading: { es: 'Cargando contexto...', en: 'Loading context...' },
    connecting: { es: 'Conectando...', en: 'Connecting...' },
    exploring: { es: 'Conversando', en: 'Exploring' },
    debating: { es: 'Debatiendo', en: 'Debating' },
    done: { es: 'Sesión terminada', en: 'Session ended' },
    error: { es: 'Error', en: 'Error' },
  };

  const isActive = state === 'exploring' || state === 'debating';
  const isDone = state === 'done';
  const isError = state === 'error';
  const isConnecting = state === 'idle' || state === 'loading' || state === 'connecting';

  return (
    <div className="fixed inset-0 z-50 bg-j-bg flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={() => {
          if (isActive) session.stop();
          onClose();
        }}
        className="absolute top-6 right-6 p-3 text-j-text-tertiary hover:text-j-text transition-colors"
      >
        <X size={24} />
      </button>

      {/* Mode label */}
      <p className="font-mono text-[10px] tracking-[0.3em] text-j-text-tertiary uppercase mb-8">
        {mode === 'freeform'
          ? (isEs ? 'Sesión Libre' : 'Freeform Session')
          : (isEs ? 'Debate' : 'Debate')}
      </p>

      {/* Timer */}
      <p className="font-mono text-6xl font-light text-j-text mb-4">
        {formatTime(session.elapsed)}
      </p>

      {/* State label */}
      <p className={`font-mono text-sm mb-12 ${isError ? 'text-j-error' : 'text-j-text-secondary'}`}>
        {stateLabels[state]?.[isEs ? 'es' : 'en'] || state}
      </p>

      {/* Error message */}
      {isError && session.error && (
        <p className="text-sm text-j-error mb-8 max-w-md text-center">{session.error}</p>
      )}

      {/* Waveform animation */}
      {isActive && (
        <div className="flex items-center gap-1 mb-12">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-j-accent rounded-full animate-pulse"
              style={{
                height: `${16 + Math.random() * 24}px`,
                animationDelay: `${i * 150}ms`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}

      {/* Connecting spinner */}
      {isConnecting && (
        <div className="mb-12">
          <Mic size={32} className="text-j-accent animate-pulse" />
        </div>
      )}

      {/* Stop button */}
      {isActive && (
        <button
          onClick={() => session.stop()}
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
            onClick={() => session.start()}
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

      {/* Debate topic */}
      {mode === 'debate' && debateTopic && (
        <p className="absolute bottom-8 font-mono text-xs text-j-text-tertiary max-w-md text-center">
          &quot;{debateTopic.position}&quot;
        </p>
      )}
    </div>
  );
}

export function VoiceSessionOverlay(props: VoiceSessionOverlayProps) {
  return <VoiceSessionContent {...props} />;
}
