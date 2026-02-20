'use client';

import { useEffect, useCallback } from 'react';
import { useVoiceSession } from './use-voice-session';
import { VoiceAuraOverlay } from './voice-aura';
import { useAudioLevel } from './use-audio-level';
import { useTutorFrequency } from './use-tutor-frequency';
import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface VoicePanelProps {
  sectionId: string;
  sectionContent: string;
  sectionTitle: string;
  language: Language;
  onSessionComplete?: () => void;
  onSkip?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================================
// Mic button with pulse ring animation
// ============================================================================

function MicButton({ onClick, disabled, language }: {
  onClick: () => void;
  disabled: boolean;
  language: Language;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative w-16 h-16 flex items-center justify-center rounded-full bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={language === 'es' ? 'Iniciar sesión de voz' : 'Start voice session'}
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full border-2 border-j-accent animate-ping opacity-20 group-hover:opacity-40 group-disabled:animate-none group-disabled:opacity-0" />

      {disabled ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="1" width="6" height="11" rx="3" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}

// ============================================================================
// Component
// ============================================================================

export function VoicePanel({
  sectionId,
  sectionContent,
  sectionTitle,
  language,
  onSessionComplete,
  onSkip,
}: VoicePanelProps) {
  const {
    connectionState,
    tutorState,
    error,
    elapsed,
    connect,
    disconnect,
    stream,
    playbackAnalyser,
  } = useVoiceSession({ sectionId, sectionContent, sectionTitle, language, onSessionComplete });

  const audioLevel = useAudioLevel(stream);
  const frequencyBands = useTutorFrequency(playbackAnalyser);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Keyboard shortcut: Escape to disconnect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && connectionState === 'connected') {
        handleDisconnect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectionState, handleDisconnect]);

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isReconnecting = connectionState === 'reconnecting';

  // ---- Idle state: CTA to start ----
  if (!isConnected && !isConnecting && !isReconnecting) {
    return (
      <div className="flex flex-col items-center py-10">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
          {language === 'es' ? 'Antes del quiz' : 'Before the quiz'}
        </p>
        <p className="text-sm text-j-text-secondary mb-6 text-center max-w-sm">
          {language === 'es'
            ? 'Conversá con el tutor sobre lo que leíste. Te va a desafiar con preguntas.'
            : 'Talk to the tutor about what you read. They\'ll challenge you with questions.'}
        </p>

        <MicButton onClick={connect} disabled={false} language={language} />

        <p className="font-mono text-[10px] text-j-text-tertiary mt-4">
          {language === 'es' ? 'Toca para hablar' : 'Tap to speak'}
        </p>

        {error && (
          <p className="text-xs text-j-error mt-3 max-w-xs text-center">{error}</p>
        )}

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-6 font-mono text-[10px] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
          >
            {language === 'es' ? 'Saltar al quiz' : 'Skip to quiz'}
          </button>
        )}
      </div>
    );
  }

  // ---- Connecting state ----
  if (isConnecting) {
    return (
      <div className="flex flex-col items-center py-10">
        <MicButton onClick={() => {}} disabled={true} language={language} />
        <p className="font-mono text-[10px] text-j-text-tertiary mt-4 animate-pulse">
          {language === 'es' ? 'Conectando...' : 'Connecting...'}
        </p>
      </div>
    );
  }

  // ---- Connected / Reconnecting state: live session ----
  const statusLabel = (() => {
    if (isReconnecting) {
      return language === 'es' ? 'Reconectando...' : 'Reconnecting...';
    }
    switch (tutorState) {
      case 'listening': return language === 'es' ? 'Tu turno — hablá' : 'Your turn — speak';
      case 'thinking': return language === 'es' ? 'Pensando...' : 'Thinking...';
      case 'speaking': return language === 'es' ? 'Tutor hablando...' : 'Tutor speaking...';
      default: return '';
    }
  })();

  return (
    <VoiceAuraOverlay
      state={isReconnecting ? 'thinking' : tutorState}
      audioLevel={audioLevel}
      frequencyBands={frequencyBands}
      className="flex flex-col items-center py-8"
    >
      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="mb-4 px-3 py-1.5 rounded-full bg-j-warm/10 border border-j-warm/20">
          <p className="font-mono text-[10px] text-j-warm animate-pulse">
            {language === 'es' ? 'Reconectando...' : 'Reconnecting...'}
          </p>
        </div>
      )}

      {/* Status + timer */}
      <div className="flex items-center gap-3 mb-5">
        <span className={`font-mono text-[10px] tracking-[0.1em] ${
          tutorState === 'speaking'
            ? 'text-j-accent'
            : tutorState === 'listening'
              ? 'text-j-warm'
              : 'text-j-text-tertiary'
        }`}>
          {statusLabel}
        </span>
        <span className="text-j-border">·</span>
        <span className="font-mono text-[10px] text-j-text-tertiary tabular-nums">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Stop button */}
      <button
        type="button"
        onClick={handleDisconnect}
        className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-j-error/30 text-j-error hover:bg-j-error hover:text-white hover:border-j-error transition-all duration-200"
        aria-label={language === 'es' ? 'Terminar sesión' : 'End session'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      </button>

      <p className="font-mono text-[10px] text-j-text-tertiary mt-3">
        {language === 'es' ? 'Esc para terminar' : 'Esc to end'}
      </p>

      {/* Error */}
      {error && (
        <p className="text-xs text-j-error mt-3 max-w-xs text-center">{error}</p>
      )}
    </VoiceAuraOverlay>
  );
}
