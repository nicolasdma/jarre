'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVoiceSession } from './use-voice-session';
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
// Waveform visualizer — wider for inline use
// ============================================================================

function WaveformVisualizer({ state }: { state: 'idle' | 'listening' | 'speaking' | 'thinking' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BAR_COUNT = 24;
    const BAR_WIDTH = 3;
    const GAP = 3;
    const MAX_HEIGHT = 32;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < BAR_COUNT; i++) {
        let height: number;
        let color: string;

        switch (state) {
          case 'speaking':
            height = MAX_HEIGHT * (0.2 + 0.8 * Math.abs(Math.sin(Date.now() / 150 + i * 0.6)));
            color = 'var(--j-accent, #6b7280)';
            break;
          case 'listening':
            height = MAX_HEIGHT * (0.15 + 0.3 * Math.abs(Math.sin(Date.now() / 400 + i * 0.4)));
            color = 'var(--j-warm, #d97706)';
            break;
          case 'thinking':
            height = MAX_HEIGHT * (0.1 + 0.2 * Math.abs(Math.sin(Date.now() / 600 + i * 0.3)));
            color = 'var(--j-text-tertiary, #9ca3af)';
            break;
          default:
            height = 3;
            color = 'var(--j-border, #e5e7eb)';
        }

        const x = i * (BAR_WIDTH + GAP);
        const y = (canvas.height - height) / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, height, 1.5);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [state]);

  const totalWidth = 24 * 3 + 23 * 3; // BAR_COUNT * BAR_WIDTH + (BAR_COUNT-1) * GAP

  return (
    <canvas
      ref={canvasRef}
      width={totalWidth}
      height={40}
      className="mx-auto"
    />
  );
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
}: VoicePanelProps) {
  const {
    connectionState,
    tutorState,
    error,
    elapsed,
    connect,
    disconnect,
  } = useVoiceSession({ sectionId, sectionContent, sectionTitle, language, onSessionComplete });

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

  // ---- Idle state: CTA to start ----
  if (!isConnected && !isConnecting) {
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

  // ---- Connected state: live session ----
  const statusLabel = (() => {
    switch (tutorState) {
      case 'listening': return language === 'es' ? 'Tu turno — hablá' : 'Your turn — speak';
      case 'thinking': return language === 'es' ? 'Pensando...' : 'Thinking...';
      case 'speaking': return language === 'es' ? 'Tutor hablando...' : 'Tutor speaking...';
      default: return '';
    }
  })();

  return (
    <div className="flex flex-col items-center py-8">
      {/* Waveform */}
      <WaveformVisualizer state={tutorState} />

      {/* Status + timer */}
      <div className="flex items-center gap-3 mt-4 mb-5">
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
    </div>
  );
}
