'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVoiceSession } from './use-voice-session';
import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface VoicePanelProps {
  sectionContent: string;
  sectionTitle: string;
  language: Language;
  onClose: () => void;
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
// Waveform visualizer (simple canvas bars)
// ============================================================================

function WaveformIndicator({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BAR_COUNT = 5;
    const BAR_WIDTH = 3;
    const GAP = 2;
    const MAX_HEIGHT = 20;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < BAR_COUNT; i++) {
        const height = isActive
          ? MAX_HEIGHT * (0.3 + 0.7 * Math.abs(Math.sin(Date.now() / 200 + i * 0.8)))
          : 4;

        const x = i * (BAR_WIDTH + GAP);
        const y = (canvas.height - height) / 2;

        ctx.fillStyle = isActive
          ? 'var(--j-accent, #6b7280)'
          : 'var(--j-text-tertiary, #9ca3af)';
        ctx.fillRect(x, y, BAR_WIDTH, height);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={5 * 3 + 4 * 2} // BAR_COUNT * BAR_WIDTH + (BAR_COUNT-1) * GAP
      height={24}
      className="opacity-80"
    />
  );
}

// ============================================================================
// Component
// ============================================================================

export function VoicePanel({
  sectionContent,
  sectionTitle,
  language,
  onClose,
}: VoicePanelProps) {
  const {
    connectionState,
    tutorState,
    error,
    elapsed,
    connect,
    disconnect,
  } = useVoiceSession({ sectionContent, sectionTitle, language });

  const handleDisconnect = useCallback(() => {
    disconnect();
    onClose();
  }, [disconnect, onClose]);

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

  const statusLabel = (() => {
    if (isConnecting) return language === 'es' ? 'Conectando...' : 'Connecting...';
    if (!isConnected) return language === 'es' ? 'Click para conectar' : 'Click to connect';
    switch (tutorState) {
      case 'listening': return language === 'es' ? 'Tu turno — hablá' : 'Your turn — speak';
      case 'thinking': return language === 'es' ? 'Pensando...' : 'Thinking...';
      case 'speaking': return language === 'es' ? 'Tutor hablando...' : 'Tutor speaking...';
      default: return '';
    }
  })();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Error message */}
      {error && (
        <div className="bg-j-error-bg border border-j-error text-j-error px-3 py-2 text-xs max-w-xs">
          {error}
        </div>
      )}

      {/* Main panel */}
      <div className="bg-j-bg-white border border-j-border shadow-lg flex items-center gap-3 px-4 py-3">
        {/* Waveform */}
        <WaveformIndicator isActive={tutorState === 'speaking' || tutorState === 'listening'} />

        {/* Status */}
        <div className="flex flex-col min-w-[100px]">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            {language === 'es' ? 'Tutor de voz' : 'Voice tutor'}
          </span>
          <span className={`font-mono text-[10px] ${
            tutorState === 'speaking'
              ? 'text-j-accent'
              : tutorState === 'listening' && isConnected
                ? 'text-j-warm'
                : 'text-j-text-secondary'
          }`}>
            {statusLabel}
          </span>
        </div>

        {/* Timer */}
        {isConnected && (
          <span className="font-mono text-[10px] text-j-text-tertiary tabular-nums">
            {formatTime(elapsed)}
          </span>
        )}

        {/* Connect / Disconnect button */}
        {!isConnected ? (
          <button
            type="button"
            onClick={connect}
            disabled={isConnecting}
            className="w-10 h-10 flex items-center justify-center border border-j-border-input text-j-text-secondary hover:text-j-accent hover:border-j-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={language === 'es' ? 'Iniciar sesión de voz' : 'Start voice session'}
          >
            {isConnecting ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            ) : (
              /* Microphone icon */
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="1" width="6" height="11" rx="3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDisconnect}
            className="w-10 h-10 flex items-center justify-center border border-j-error text-j-error hover:bg-j-error-bg transition-colors"
            aria-label={language === 'es' ? 'Desconectar' : 'Disconnect'}
          >
            {/* Square stop icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        )}

        {/* Close panel button (only when disconnected) */}
        {!isConnected && !isConnecting && (
          <button
            type="button"
            onClick={onClose}
            className="text-j-text-tertiary hover:text-j-text transition-colors text-sm"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* Desktop-only hint */}
      {!isConnected && !isConnecting && (
        <span className="font-mono text-[9px] text-j-text-tertiary tracking-[0.1em]">
          ESC {language === 'es' ? 'para cerrar' : 'to close'}
        </span>
      )}
    </div>
  );
}
