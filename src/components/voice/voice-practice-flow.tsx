'use client';

/**
 * Jarre - Voice Practice Flow (Socratic Guided Practice)
 *
 * Complete UI for voice-based guided practice.
 * 4 phases: INTRO → SESSION → SCORING → RESULTS
 *
 * Unlike VoiceEvaluationFlow:
 * - 7 min max (vs 10)
 * - Results show neededHelp/understood indicators per concept
 * - Gate: >=70% unlocks evaluation, <70% shows "practice again" or "review material"
 * - Score is NOT saved to evaluations
 */

import { useEffect, useCallback, useState } from 'react';
import { useUnifiedVoiceSession, type PracticeResult } from './use-unified-voice-session';
import { useAudioLevel } from './use-audio-level';
import {
  VoiceConnectingPhase,
  VoiceActivePhase,
  VoiceScoringPhase,
  VoiceErrorPhase,
} from './voice-session-phases';
import { SectionLabel } from '@/components/ui/section-label';
import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface Concept {
  id: string;
  name: string;
  canonical_definition: string;
}

interface Props {
  language: Language;
  resourceId: string;
  concepts: Concept[];
  onComplete: () => void;
  onSwitchToText: () => void;
  onReviewMaterial: () => void;
  lastPracticeResult?: PracticeResult | null;
  lastPracticeDate?: string | null;
}

// ============================================================================
// Translations
// ============================================================================

const tr = {
  practiceTitle: { es: 'Practica guiada', en: 'Guided practice' },
  introDesc: {
    es: 'Vamos a repasar juntos estos conceptos. Te voy a guiar — esto NO es la evaluacion final.',
    en: 'Let\'s review these concepts together. I\'ll guide you — this is NOT the final evaluation.',
  },
  conceptsToPractice: { es: 'Conceptos a practicar', en: 'Concepts to practice' },
  startPractice: { es: 'Comenzar practica', en: 'Start practice' },
  preferText: { es: 'Prefiero escribir', en: 'I prefer writing' },
  yourTurn: { es: 'Tu turno — habla', en: 'Your turn — speak' },
  thinking: { es: 'Pensando...', en: 'Thinking...' },
  speaking: { es: 'Mentor hablando...', en: 'Mentor speaking...' },
  endSession: { es: 'Terminar', en: 'End session' },
  escToEnd: { es: 'Esc para terminar', en: 'Esc to end' },
  scoring: { es: 'Analizando tu practica...', en: 'Analyzing your practice...' },
  scoringEstimate: { es: 'Esto suele tomar ~15 segundos', en: 'This usually takes ~15 seconds' },
  resultsTitle: { es: 'Resultado de la practica', en: 'Practice Results' },
  overallScore: { es: 'Puntuacion General', en: 'Overall Score' },
  readyForEval: { es: 'Listo para la evaluacion', en: 'Ready for evaluation' },
  needsMorePractice: { es: 'Necesitas mas practica', en: 'Needs more practice' },
  concept: { es: 'Concepto', en: 'Concept' },
  feedback: { es: 'Retroalimentacion', en: 'Feedback' },
  neededHelp: { es: 'Necesito guia', en: 'Needed guidance' },
  independent: { es: 'Independiente', en: 'Independent' },
  understood: { es: 'Comprendido', en: 'Understood' },
  notUnderstood: { es: 'No comprendido', en: 'Not understood' },
  continueToEval: { es: 'Continuar a evaluacion', en: 'Continue to evaluation' },
  reviewMaterial: { es: 'Repasar material', en: 'Review material' },
  practiceAgain: { es: 'Practicar de nuevo', en: 'Practice again' },
  maxDuration: { es: 'Maximo 7 minutos', en: 'Maximum 7 minutes' },
  gateMessage: {
    es: 'Necesitas >=70% para avanzar a la evaluacion',
    en: 'You need >=70% to advance to the evaluation',
  },
  consolidation: { es: 'Consolidacion', en: 'Consolidation' },
  idealAnswer: { es: 'Respuesta ideal', en: 'Ideal answer' },
  whatToReview: { es: 'Que repasar', en: 'What to review' },
  lastResultTitle: { es: 'Ultimo resultado', en: 'Last result' },
} as const;

function t(key: keyof typeof tr, lang: Language): string {
  return tr[key]?.[lang] || tr[key]?.en || key;
}

// ============================================================================
// Simplified Consolidation for Practice
// ============================================================================

interface ConsolidationItem {
  conceptName: string;
  idealAnswer: string;
  divergence: string;
  connections: string;
  reviewSuggestion: string;
}

function PracticeConsolidation({
  consolidation,
  language,
}: {
  consolidation: ConsolidationItem[];
  language: Language;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="mt-6 border border-j-border p-4">
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-3">
        {t('consolidation', language)}
      </p>

      <div className="space-y-2">
        {consolidation.map((item, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <div key={`practice-consol-${item.conceptName}`} className="border-l-2 border-j-border pl-3">
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full text-left flex items-center justify-between gap-2 py-1 group"
              >
                <span className="font-mono text-[10px] text-j-text-secondary group-hover:text-j-warm transition-colors">
                  {item.conceptName}
                </span>
                <span className="font-mono text-[10px] text-j-text-tertiary">
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-3 pb-2">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-1">
                      {t('idealAnswer', language)}
                    </p>
                    <p className="text-sm text-j-text-secondary leading-relaxed">
                      {item.idealAnswer}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                      {t('whatToReview', language)}
                    </p>
                    <p className="text-sm text-j-text-secondary leading-relaxed">
                      {item.reviewSuggestion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function VoicePracticeFlow({
  language,
  resourceId,
  concepts,
  onComplete,
  onSwitchToText,
  onReviewMaterial,
  lastPracticeResult,
  lastPracticeDate,
}: Props) {
  const session = useUnifiedVoiceSession({
    mode: 'practice',
    language,
    resourceId,
    concepts: concepts.map((c) => ({ id: c.id, name: c.name, definition: c.canonical_definition })),
  });

  const { state, tutorState, error, elapsed, result, transcript, stream } = session;
  const practiceResult = result?.mode === 'practice' ? result.practiceResult : null;
  const audioLevel = useAudioLevel(stream);

  const handleDisconnect = useCallback(() => {
    session.stop();
  }, [session]);

  // Keyboard shortcut: Escape to disconnect during session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state === 'active') {
        handleDisconnect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, handleDisconnect]);

  // ---- INTRO (with optional last result) ----
  if (state === 'idle') {
    // Show previous result if available
    if (lastPracticeResult) {
      const passed = lastPracticeResult.passedGate;

      return (
        <div>
          <SectionLabel className="mb-8">
            {t('practiceTitle', language)}
          </SectionLabel>

          {/* Last result header */}
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-4">
            {t('lastResultTitle', language)}
            {lastPracticeDate && (
              <span className="ml-2 normal-case">
                — {new Date(lastPracticeDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            )}
          </p>

          {/* Score summary */}
          <div className={`border p-8 mb-4 ${passed ? 'border-j-accent bg-j-accent/5' : 'border-j-border'}`}>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className={`text-4xl font-light ${passed ? 'text-j-accent' : 'text-j-error'}`}>
                  {lastPracticeResult.overallScore}%
                </p>
                <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                  {t('overallScore', language)}
                </p>
                <p className={`font-mono text-[10px] tracking-[0.15em] uppercase mt-2 ${passed ? 'text-j-accent' : 'text-j-error'}`}>
                  {passed ? t('readyForEval', language) : t('needsMorePractice', language)}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-j-text-secondary leading-relaxed">
                  {lastPracticeResult.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Per-concept feedback */}
          <div className="space-y-6 mt-8">
            {lastPracticeResult.responses.map((r, index) => (
              <div
                key={`last-response-${r.questionIndex}`}
                className={`border-l-2 pl-6 ${r.understood ? 'border-j-accent' : 'border-j-error'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[10px] text-j-text-tertiary">
                    {t('concept', language)} {index + 1}
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.15em] text-j-text-secondary uppercase">
                    {concepts[index]?.name}
                  </span>
                  <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${r.isCorrect ? 'text-j-accent' : 'text-j-error'}`}>
                    {r.score}%
                  </span>
                </div>
                <div className="flex gap-3 mb-2">
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
                    r.neededHelp ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {r.neededHelp ? t('neededHelp', language) : t('independent', language)}
                  </span>
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
                    r.understood ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {r.understood ? t('understood', language) : t('notUnderstood', language)}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                    {t('feedback', language)}
                  </p>
                  <p className="text-sm text-j-text-secondary leading-relaxed">{r.feedback}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Consolidation */}
          {lastPracticeResult.consolidation && lastPracticeResult.consolidation.length > 0 && (
            <PracticeConsolidation
              consolidation={lastPracticeResult.consolidation}
              language={language}
            />
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
            {passed && (
              <button
                onClick={onComplete}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('continueToEval', language)} →
              </button>
            )}
            <button
              onClick={session.start}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-warm text-white px-6 py-2 uppercase hover:bg-j-warm/90 transition-colors"
            >
              {t('practiceAgain', language)}
            </button>
            <button
              onClick={onSwitchToText}
              className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
            >
              {t('preferText', language)}
            </button>
          </div>
        </div>
      );
    }

    // No previous result — show intro
    return (
      <div>
        <SectionLabel className="mb-8">
          {t('practiceTitle', language)}
        </SectionLabel>

        <p className="text-sm text-j-text-secondary mb-8 max-w-lg">
          {t('introDesc', language)}
        </p>

        <div className="mb-8">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-3">
            {t('conceptsToPractice', language)}
          </p>
          <ul className="space-y-1.5">
            {concepts.map((concept) => (
              <li key={concept.id} className="text-sm text-j-text-secondary flex items-center gap-2">
                <span className="w-1 h-1 bg-j-warm rounded-full" />
                {concept.name}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-[10px] text-j-text-tertiary mb-2">
          {t('maxDuration', language)}
        </p>
        <p className="font-mono text-[10px] text-j-text-tertiary mb-6">
          {t('gateMessage', language)}
        </p>

        {error && (
          <p className="text-xs text-j-error mb-4 max-w-xs">{error}</p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={session.start}
            className="group relative w-16 h-16 flex items-center justify-center rounded-full bg-j-warm text-white hover:bg-j-warm/90 transition-all duration-300"
            aria-label={t('startPractice', language)}
          >
            <span className="absolute inset-0 rounded-full border-2 border-j-warm animate-ping opacity-20 group-hover:opacity-40" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="11" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <div>
            <p className="font-mono text-[10px] text-j-text-secondary">
              {t('startPractice', language)}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={onSwitchToText}
            className="font-mono text-[10px] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
          >
            {t('preferText', language)}
          </button>
        </div>
      </div>
    );
  }

  // ---- CONNECTING ----
  if (state === 'connecting') {
    return <VoiceConnectingPhase language={language} accentColor="warm" />;
  }

  // ---- SESSION (practicing) ----
  if (state === 'active') {
    return (
      <VoiceActivePhase
        language={language}
        tutorState={tutorState}
        elapsed={elapsed}
        maxDurationSeconds={420}
        transcript={transcript}
        audioLevel={audioLevel}
        error={error}
        statusLabels={{
          listening: t('yourTurn', language),
          thinking: t('thinking', language),
          speaking: t('speaking', language),
        }}
        escLabel={t('escToEnd', language)}
        onStop={handleDisconnect}
      />
    );
  }

  // ---- SCORING ----
  if (state === 'scoring') {
    return (
      <VoiceScoringPhase
        label={t('scoring', language)}
        estimate={t('scoringEstimate', language)}
      />
    );
  }

  // ---- ERROR ----
  if (state === 'error') {
    return (
      <VoiceErrorPhase
        error={error}
        language={language}
        onRetry={session.retryPostProcess}
        fallbackAction={{ label: t('preferText', language), onClick: onSwitchToText }}
      />
    );
  }

  // ---- RESULTS ----
  if (state === 'done' && practiceResult) {
    const passed = practiceResult.passedGate;

    return (
      <div>
        <SectionLabel className="mb-8">
          {t('resultsTitle', language)}
        </SectionLabel>

        {/* Score summary */}
        <div className={`border p-8 mb-4 ${passed ? 'border-j-accent bg-j-accent/5' : 'border-j-border'}`}>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className={`text-4xl font-light ${
                passed ? 'text-j-accent' : 'text-j-error'
              }`}>
                {practiceResult.overallScore}%
              </p>
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                {t('overallScore', language)}
              </p>
              <p className={`font-mono text-[10px] tracking-[0.15em] uppercase mt-2 ${
                passed ? 'text-j-accent' : 'text-j-error'
              }`}>
                {passed ? t('readyForEval', language) : t('needsMorePractice', language)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-j-text-secondary leading-relaxed">
                {practiceResult.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Individual concept results */}
        <div className="space-y-6 mt-8">
          {practiceResult.responses.map((result, index) => (
            <div
              key={`response-${result.questionIndex}`}
              className={`border-l-2 pl-6 ${
                result.understood ? 'border-j-accent' : 'border-j-error'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[10px] text-j-text-tertiary">
                  {t('concept', language)} {index + 1}
                </span>
                <span className="font-mono text-[9px] tracking-[0.15em] text-j-text-secondary uppercase">
                  {concepts[index]?.name}
                </span>
                <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
                  result.isCorrect ? 'text-j-accent' : 'text-j-error'
                }`}>
                  {result.score}%
                </span>
              </div>

              {/* neededHelp / understood indicators */}
              <div className="flex gap-3 mb-2">
                <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
                  result.neededHelp
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-green-50 text-green-700'
                }`}>
                  {result.neededHelp ? t('neededHelp', language) : t('independent', language)}
                </span>
                <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
                  result.understood
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {result.understood ? t('understood', language) : t('notUnderstood', language)}
                </span>
              </div>

              <div className="p-3">
                <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                  {t('feedback', language)}
                </p>
                <p className="text-sm text-j-text-secondary leading-relaxed">{result.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Consolidation */}
        {practiceResult.consolidation && practiceResult.consolidation.length > 0 && (
          <PracticeConsolidation
            consolidation={practiceResult.consolidation}
            language={language}
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
          {passed ? (
            <button
              onClick={onComplete}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {t('continueToEval', language)} →
            </button>
          ) : (
            <>
              <button
                onClick={session.start}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-warm text-white px-6 py-2 uppercase hover:bg-j-warm/90 transition-colors"
              >
                {t('practiceAgain', language)}
              </button>
              <button
                onClick={onReviewMaterial}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
              >
                {t('reviewMaterial', language)}
              </button>
              <button
                onClick={onSwitchToText}
                className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
              >
                {t('preferText', language)}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
