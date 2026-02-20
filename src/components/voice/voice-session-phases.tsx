'use client';

/**
 * Jarre - Shared Voice Session Phase Components
 *
 * Reusable UI for connecting, active, scoring, and error phases
 * across all voice flows (eval, practice, teach).
 */

import { useState } from 'react';
import { TutorGlow } from './tutor-glow';
import { TranscriptLine } from './transcript-line';
import type { TutorState } from './use-voice-session';
import type { Language } from '@/lib/translations';

// ============================================================================
// Utilities
// ============================================================================

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============================================================================
// Types
// ============================================================================

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

interface StatusLabels {
  listening: string;
  thinking: string;
  speaking: string;
}

// ============================================================================
// Connecting Phase
// ============================================================================

interface ConnectingPhaseProps {
  language: Language;
  accentColor?: 'accent' | 'warm';
  className?: string;
}

export function VoiceConnectingPhase({
  language,
  accentColor = 'accent',
  className = 'py-16',
}: ConnectingPhaseProps) {
  const bgClass = accentColor === 'warm' ? 'bg-j-warm' : 'bg-j-accent text-j-text-on-accent';

  return (
    <div className={`${className} flex flex-col items-center gap-4`}>
      <div className={`w-16 h-16 flex items-center justify-center rounded-full ${bgClass} opacity-50`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-mono text-[10px] text-j-text-tertiary animate-pulse">
        {language === 'es' ? 'Conectando...' : 'Connecting...'}
      </p>
    </div>
  );
}

// ============================================================================
// Active Phase
// ============================================================================

interface ActivePhaseProps {
  language: Language;
  tutorState: TutorState;
  elapsed: number;
  maxDurationSeconds: number;
  transcript: TranscriptEntry[];
  audioLevel: number;
  error: string | null;
  statusLabels: StatusLabels;
  escLabel: string;
  onStop: () => void;
  className?: string;
  maxWidth?: string;
}

export function VoiceActivePhase({
  language: _language,
  tutorState,
  elapsed,
  maxDurationSeconds,
  transcript,
  audioLevel,
  error,
  statusLabels,
  escLabel,
  onStop,
  className = 'py-8',
  maxWidth = 'max-w-md',
}: ActivePhaseProps) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const statusLabel = (() => {
    switch (tutorState) {
      case 'listening': return statusLabels.listening;
      case 'thinking': return statusLabels.thinking;
      case 'speaking': return statusLabels.speaking;
      default: return '';
    }
  })();

  const lastLine = transcript.length > 0 ? transcript[transcript.length - 1] : null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-2 h-2 rounded-full ${
          tutorState === 'speaking' ? 'bg-j-accent animate-pulse' :
          tutorState === 'listening' ? 'bg-j-warm' :
          tutorState === 'thinking' ? 'bg-j-text-tertiary animate-pulse' :
          'bg-j-border'
        }`} />
        <span className={`font-mono text-[10px] tracking-[0.1em] ${
          tutorState === 'speaking'
            ? 'text-j-accent'
            : tutorState === 'listening'
              ? 'text-j-warm'
              : 'text-j-text-tertiary'
        }`}>
          {statusLabel}
        </span>
        <span className="text-j-border">&middot;</span>
        <span className="font-mono text-[10px] text-j-text-tertiary tabular-nums">
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-j-border rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-j-accent rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, (elapsed / maxDurationSeconds) * 100)}%` }}
        />
      </div>

      {/* Stop button */}
      <button
        type="button"
        onClick={onStop}
        className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-j-error/30 text-j-error hover:bg-j-error hover:text-white hover:border-j-error transition-all duration-200"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      </button>

      <p className="font-mono text-[10px] text-j-text-tertiary mt-3">
        {escLabel}
      </p>

      {error && (
        <p className="text-xs text-j-error mt-3 max-w-xs text-center">{error}</p>
      )}

      {/* Transcript */}
      <div className={`w-full ${maxWidth} mt-6`}>
        <TranscriptLine
          lastLine={lastLine}
          fullTranscript={transcript}
          expanded={transcriptExpanded}
          onToggle={() => setTranscriptExpanded(prev => !prev)}
        />
      </div>

      {/* Ambient glow */}
      <TutorGlow state={tutorState} audioLevel={audioLevel} />
    </div>
  );
}

// ============================================================================
// Scoring Phase
// ============================================================================

interface ScoringPhaseProps {
  label: string;
  estimate: string;
  className?: string;
}

export function VoiceScoringPhase({
  label,
  estimate,
  className = 'py-16',
}: ScoringPhaseProps) {
  return (
    <div className={`${className} flex flex-col items-center gap-4`}>
      <div className="h-5 w-5 border-2 border-j-border border-t-j-accent rounded-full animate-spin" />
      <p className="text-sm text-j-text-secondary">{label}</p>
      <p className="text-xs text-j-text-tertiary">{estimate}</p>
    </div>
  );
}

// ============================================================================
// Error Phase
// ============================================================================

interface ErrorPhaseProps {
  error: string | null;
  language: Language;
  onRetry: () => void;
  retryLabel?: string;
  fallbackAction?: { label: string; onClick: () => void };
  className?: string;
}

export function VoiceErrorPhase({
  error,
  language,
  onRetry,
  retryLabel,
  fallbackAction,
  className = 'py-16',
}: ErrorPhaseProps) {
  return (
    <div className={`${className} flex flex-col items-center gap-4`}>
      <p className="text-sm text-j-error">{error}</p>
      <p className="text-xs text-j-text-tertiary max-w-xs text-center">
        {language === 'es'
          ? 'La conversación está guardada. Podemos reintentar el análisis.'
          : 'The conversation is saved. We can retry the analysis.'}
      </p>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
        >
          {retryLabel || (language === 'es' ? 'Reintentar análisis' : 'Retry analysis')}
        </button>
        {fallbackAction && (
          <button
            type="button"
            onClick={fallbackAction.onClick}
            className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {fallbackAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
