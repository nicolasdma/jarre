'use client';

/**
 * Jarre - Voice Teach Flow
 *
 * UI for Level 3 → 4 "Teach the Tutor" sessions.
 * Student teaches a concept to a confused AI junior engineer.
 * Phases: INTRO → TEACHING → SCORING → RESULTS
 */

import { useEffect, useCallback, useState } from 'react';
import { useUnifiedVoiceSession } from './use-unified-voice-session';
import { TutorGlow } from './tutor-glow';
import { TranscriptLine } from './transcript-line';
import { useAudioLevel } from './use-audio-level';
import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface Props {
  conceptId: string;
  conceptName: string;
  conceptDefinition: string;
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
// Translations
// ============================================================================

const tr = {
  teachTitle: { es: 'Ensena este concepto', en: 'Teach this concept' },
  teachDesc: {
    es: 'Un ingeniero junior necesita que le expliques este concepto. Ensenarle bien demuestra dominio completo.',
    en: 'A junior engineer needs you to explain this concept. Teaching well demonstrates complete mastery.',
  },
  concept: { es: 'Concepto', en: 'Concept' },
  startTeaching: { es: 'Empezar a ensenar', en: 'Start teaching' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  maxDuration: { es: 'Maximo 8 minutos', en: 'Maximum 8 minutes' },
  yourTurn: { es: 'Tu turno — explica', en: 'Your turn — explain' },
  juniorAsking: { es: 'Junior preguntando...', en: 'Junior asking...' },
  juniorThinking: { es: 'Pensando...', en: 'Thinking...' },
  endSession: { es: 'Terminar', en: 'End session' },
  escToEnd: { es: 'Esc para terminar', en: 'Esc to end' },
  scoring: { es: 'Evaluando tu ensenanza...', en: 'Evaluating your teaching...' },
  scoringEstimate: { es: 'Esto suele tomar ~15 segundos', en: 'This usually takes ~15 seconds' },
  teachingScore: { es: 'Calidad de ensenanza', en: 'Teaching quality' },
  masteryAdvanced: { es: 'Nivel de maestria avanzado!', en: 'Mastery level advanced!' },
  levelUp: { es: 'Subiste a Nivel 4 — Ensenado', en: 'Advanced to Level 4 — Taught' },
  notAdvanced: {
    es: 'Necesitas >= 80% para avanzar a Nivel 4. Segui practicando!',
    en: 'You need >= 80% to advance to Level 4. Keep practicing!',
  },
  feedback: { es: 'Retroalimentacion', en: 'Feedback' },
  close: { es: 'Cerrar', en: 'Close' },
  tryAgain: { es: 'Intentar de nuevo', en: 'Try again' },
} as const;

function t(key: keyof typeof tr, lang: Language): string {
  return tr[key]?.[lang] || tr[key]?.en || key;
}

// ============================================================================
// Component
// ============================================================================

export function VoiceTeachFlow({
  conceptId,
  conceptName,
  conceptDefinition,
  language,
  onClose,
}: Props) {
  const session = useUnifiedVoiceSession({
    mode: 'teach',
    language,
    conceptForTeach: { id: conceptId, name: conceptName, definition: conceptDefinition },
  });

  const { state, tutorState, error, elapsed, result, transcript, stream } = session;
  const teachResult = result?.mode === 'teach' ? result.teachResult : null;
  const audioLevel = useAudioLevel(stream);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const handleDisconnect = useCallback(() => {
    session.stop();
  }, [session]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state === 'active') {
        handleDisconnect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleDisconnect]);

  // ---- INTRO ----
  if (state === 'idle') {
    return (
      <div className="p-6">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase mb-2">
          {t('teachTitle', language)}
        </p>

        <h3 className="text-lg font-medium text-j-text mb-3">{conceptName}</h3>

        <p className="text-sm text-j-text-secondary leading-relaxed mb-6 max-w-sm">
          {t('teachDesc', language)}
        </p>

        <p className="font-mono text-[10px] text-j-text-tertiary mb-4">
          {t('maxDuration', language)}
        </p>

        {error && (
          <p className="text-xs text-j-error mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={session.start}
            className="group relative w-14 h-14 flex items-center justify-center rounded-full bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-all duration-300"
            aria-label={t('startTeaching', language)}
          >
            <span className="absolute inset-0 rounded-full border-2 border-j-accent animate-ping opacity-20 group-hover:opacity-40" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="11" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 font-mono text-[10px] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
        >
          {t('cancel', language)}
        </button>
      </div>
    );
  }

  // ---- CONNECTING ----
  if (state === 'connecting') {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center rounded-full bg-j-accent text-j-text-on-accent opacity-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
        </div>
        <p className="font-mono text-[10px] text-j-text-tertiary animate-pulse">
          {language === 'es' ? 'Conectando...' : 'Connecting...'}
        </p>
      </div>
    );
  }

  // ---- TEACHING ----
  if (state === 'active') {
    const statusLabel = (() => {
      switch (tutorState) {
        case 'listening': return t('yourTurn', language);
        case 'thinking': return t('juniorThinking', language);
        case 'speaking': return t('juniorAsking', language);
        default: return '';
      }
    })();

    const lastLine = transcript.length > 0 ? transcript[transcript.length - 1] : null;

    return (
      <div className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-2 h-2 rounded-full ${
            tutorState === 'speaking' ? 'bg-j-accent animate-pulse' :
            tutorState === 'listening' ? 'bg-j-warm' :
            tutorState === 'thinking' ? 'bg-j-text-tertiary animate-pulse' :
            'bg-j-border'
          }`} />
          <span className={`font-mono text-[10px] tracking-[0.1em] ${
            tutorState === 'speaking' ? 'text-j-accent'
              : tutorState === 'listening' ? 'text-j-warm'
              : 'text-j-text-tertiary'
          }`}>
            {statusLabel}
          </span>
          <span className="text-j-border">&middot;</span>
          <span className="font-mono text-[10px] text-j-text-tertiary tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>

        <div className="w-40 h-1 bg-j-border rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-j-accent rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, (elapsed / 480) * 100)}%` }}
          />
        </div>

        <button
          type="button"
          onClick={handleDisconnect}
          className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-j-error/30 text-j-error hover:bg-j-error hover:text-white hover:border-j-error transition-all duration-200"
          aria-label={t('endSession', language)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="3" />
          </svg>
        </button>

        <p className="font-mono text-[10px] text-j-text-tertiary mt-2">
          {t('escToEnd', language)}
        </p>

        {error && (
          <p className="text-xs text-j-error mt-2 max-w-xs text-center">{error}</p>
        )}

        {/* Transcript line */}
        <div className="w-full max-w-sm mt-4">
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

  // ---- SCORING ----
  if (state === 'scoring') {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <div className="h-5 w-5 border-2 border-j-border border-t-j-accent rounded-full animate-spin" />
        <p className="text-sm text-j-text-secondary">{t('scoring', language)}</p>
        <p className="text-xs text-j-text-tertiary">{t('scoringEstimate', language)}</p>
      </div>
    );
  }

  // ---- ERROR ----
  if (state === 'error') {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <p className="text-sm text-j-error">{error}</p>
        <p className="text-xs text-j-text-tertiary max-w-xs text-center">
          {language === 'es'
            ? 'La conversación está guardada. Podemos reintentar el análisis.'
            : 'The conversation is saved. We can retry the analysis.'}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={session.retryPostProcess}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
          >
            {language === 'es' ? 'Reintentar análisis' : 'Retry analysis'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {t('close', language)}
          </button>
        </div>
      </div>
    );
  }

  // ---- RESULTS ----
  if (state === 'done' && teachResult) {
    const { overallScore, summary, masteryAdvanced } = teachResult;

    return (
      <div className="p-6">
        {/* Score */}
        <div className={`border p-6 mb-4 ${masteryAdvanced ? 'border-j-accent bg-j-accent/5' : 'border-j-border'}`}>
          <div className="text-center">
            <p className={`text-3xl font-light ${
              overallScore >= 80 ? 'text-j-accent' : overallScore >= 60 ? 'text-j-text' : 'text-j-error'
            }`}>
              {overallScore}%
            </p>
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
              {t('teachingScore', language)}
            </p>
          </div>
        </div>

        {/* Mastery advancement */}
        {masteryAdvanced ? (
          <div className="border border-j-accent bg-j-accent/5 p-4 mb-4 text-center">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase animate-pulse mb-1">
              {t('masteryAdvanced', language)}
            </p>
            <p className="text-sm text-j-text-secondary">
              {t('levelUp', language)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-j-text-tertiary font-mono text-center mb-4">
            {t('notAdvanced', language)}
          </p>
        )}

        {/* Summary */}
        <p className="text-sm text-j-text-secondary leading-relaxed mb-4">
          {summary}
        </p>

        {/* Per-concept feedback */}
        {teachResult.responses.map((result) => (
          <div key={`teach-response-${result.questionIndex}`} className="border-l-2 border-j-border pl-4 mb-4">
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
              {t('feedback', language)}
            </p>
            <p className="text-sm text-j-text-secondary leading-relaxed">{result.feedback}</p>
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-j-border">
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-5 py-2 uppercase hover:bg-j-accent-hover transition-colors"
          >
            {t('close', language)}
          </button>
          {!masteryAdvanced && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
            >
              {t('tryAgain', language)}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
