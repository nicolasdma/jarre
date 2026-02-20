'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useUnifiedVoiceSession } from './use-unified-voice-session';
import { VoiceAuraOverlay } from './voice-aura';
import { TranscriptLine } from './transcript-line';
import { useAudioLevel } from './use-audio-level';
import { useTutorFrequency } from './use-tutor-frequency';
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

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function VoiceSessionContent({
  mode,
  onClose,
  language,
  debateTopic,
}: VoiceSessionOverlayProps) {
  const isEs = language === 'es';
  const autoStarted = useRef(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const session = useUnifiedVoiceSession({
    mode,
    language,
    debateTopic,
  });

  const audioLevel = useAudioLevel(session.stream);
  const frequencyBands = useTutorFrequency(session.playbackAnalyser);

  useEffect(() => {
    if (!autoStarted.current) {
      autoStarted.current = true;
      session.start();
    }
  }, []);

  const { state, transcript } = session;
  const lastLine = transcript.length > 0 ? transcript[transcript.length - 1] : null;

  const stateLabels: Record<string, { es: string; en: string }> = {
    idle: { es: 'Preparando...', en: 'Preparing...' },
    loading: { es: 'Cargando contexto...', en: 'Loading context...' },
    connecting: { es: 'Conectando...', en: 'Connecting...' },
    active: { es: mode === 'debate' ? 'Debatiendo' : 'Conversando', en: mode === 'debate' ? 'Debating' : 'Exploring' },
    done: { es: 'Sesión terminada', en: 'Session ended' },
    error: { es: 'Error', en: 'Error' },
  };

  const isActive = state === 'active';
  const isDone = state === 'done';
  const isError = state === 'error';
  const isConnecting = state === 'idle' || state === 'loading' || state === 'connecting';

  return (
    <VoiceAuraOverlay
      state={isConnecting ? 'thinking' : session.tutorState}
      audioLevel={audioLevel}
      frequencyBands={frequencyBands}
      active={isConnecting || isActive}
      className="fixed inset-0 z-50 bg-j-bg"
    >
      <div className="flex flex-col items-center justify-center min-h-screen">
        {/* Close button */}
        <button
          onClick={() => {
            if (isActive) session.stop();
            onClose();
          }}
          className="absolute top-6 right-6 p-3 text-j-text-tertiary hover:text-j-text transition-colors z-10"
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
          <p className="text-sm text-j-error mb-8 max-w-md w-full px-4 sm:px-0 text-center">{session.error}</p>
        )}

        {/* Transcript line */}
        {isActive && (
          <div className="w-full max-w-md w-full px-4 sm:px-0 mb-8">
            <TranscriptLine
              lastLine={lastLine}
              fullTranscript={transcript}
              expanded={transcriptExpanded}
              onToggle={() => setTranscriptExpanded(prev => !prev)}
            />
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
          <p className="absolute bottom-8 font-mono text-xs text-j-text-tertiary max-w-md w-full px-4 sm:px-0 text-center">
            &quot;{debateTopic.position}&quot;
          </p>
        )}
      </div>
    </VoiceAuraOverlay>
  );
}

export function VoiceSessionOverlay(props: VoiceSessionOverlayProps) {
  return <VoiceSessionContent {...props} />;
}
