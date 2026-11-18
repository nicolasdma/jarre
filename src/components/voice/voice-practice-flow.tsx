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
 * - >=70% leads on to the next step; below it "rehearse again" leads and the next
 *   step stays a quiet link (nothing is locked: the steps open from the index)
 * - Score is NOT saved to evaluations
 */

import { useEffect, useCallback, useState } from 'react';
import { useUnifiedVoiceSession, type PracticeResult } from './use-unified-voice-session';
import { useAudioLevel } from './use-audio-level';
import { useTutorFrequency } from './use-tutor-frequency';
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
  practiceTitle: { es: 'Ensayar con el tutor', en: 'Rehearse with the tutor' },
  introDesc: {
    es: 'Te pregunto sobre la lección y te ayudo si te trabás. No es un examen: es para practicar en voz alta.',
    en: 'I ask you about the lesson and help when you get stuck. It is not an exam: it is practice out loud.',
  },
  conceptsToPractice: { es: 'De qué vamos a hablar', en: 'What we will talk about' },
  startPractice: { es: 'Empezar', en: 'Start' },
  preferText: { es: 'Prefiero escribir', en: 'I prefer writing' },
  yourTurn: { es: 'Tu turno', en: 'Your turn' },
  thinking: { es: 'Pensando...', en: 'Thinking...' },
  speaking: { es: 'Habla el tutor…', en: 'The tutor is speaking…' },
  endSession: { es: 'Terminar', en: 'End session' },
  escToEnd: { es: 'Esc para terminar', en: 'Esc to end' },
  scoring: { es: 'Armando tu devolución…', en: 'Putting your feedback together…' },
  scoringEstimate: { es: 'Unos 15 segundos', en: 'About 15 seconds' },
  resultsTitle: { es: 'Cómo te fue', en: 'How it went' },
  overallScore: { es: 'Resultado', en: 'Result' },
  readyForEval: { es: 'Listo para seguir', en: 'Ready to move on' },
  needsMorePractice: { es: 'Conviene practicar un poco más', en: 'Worth a bit more practice' },
  concept: { es: 'Tema', en: 'Topic' },
  feedback: { es: 'Qué mejorar', en: 'What to improve' },
  neededHelp: { es: 'Necesitó ayuda', en: 'Needed help' },
  independent: { es: 'Sin ayuda', en: 'No help' },
  understood: { es: 'Comprendido', en: 'Understood' },
  notUnderstood: { es: 'No comprendido', en: 'Not understood' },
  continueToEval: { es: 'Siguiente: evaluación por voz', en: 'Next: voice evaluation' },
  reviewMaterial: { es: 'Volver a leer', en: 'Read it again' },
  practiceAgain: { es: 'Ensayar de nuevo', en: 'Rehearse again' },
  maxDuration: { es: 'Unos 7 minutos', en: 'About 7 minutes' },
  moveOnAnyway: { es: 'Seguir igual', en: 'Move on anyway' },
  consolidation: { es: 'Para fijarlo', en: 'To make it stick' },
  idealAnswer: { es: 'Respuesta ideal', en: 'Ideal answer' },
  whatToReview: { es: 'Qué repasar', en: 'What to review' },
  lastResultTitle: { es: 'Último resultado', en: 'Last result' },
} as const;

function t(key: keyof typeof tr, lang: Language): string {
  return tr[key]?.[lang] || tr[key]?.en || key;
}

/**
 * After a result, one primary action: the next step when it went well,
 * rehearsing again when not (the next step then stays a quiet link).
 */
function ResultActions({
  passed,
  language,
  onComplete,
  onAgain,
  onReviewMaterial,
  onSwitchToText,
}: {
  passed: boolean;
  language: Language;
  onComplete: () => void;
  onAgain: () => void;
  onReviewMaterial?: () => void;
  onSwitchToText: () => void;
}) {
  const primary = 'min-h-[44px] font-mono text-[10px] tracking-[0.15em] px-6 py-2 uppercase transition-colors bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover';
  const secondary = 'min-h-[44px] font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors';
  const quiet = 'min-h-[44px] font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2';
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-j-border pt-10">
      {passed ? (
        <>
          <button type="button" onClick={onComplete} className={primary}>
            {t('continueToEval', language)} →
          </button>
          <button type="button" onClick={onAgain} className={secondary}>
            {t('practiceAgain', language)}
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={onAgain} className={primary}>
            {t('practiceAgain', language)}
          </button>
          {onReviewMaterial && (
            <button type="button" onClick={onReviewMaterial} className={secondary}>
              {t('reviewMaterial', language)}
            </button>
          )}
          <button type="button" onClick={onComplete} className={quiet}>
            {t('moveOnAnyway', language)} →
          </button>
        </>
      )}
      <button type="button" onClick={onSwitchToText} className={quiet}>
        {t('preferText', language)}
      </button>
    </div>
  );
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

  const { state, tutorState, error, elapsed, result, transcript, stream, playbackAnalyser } = session;
  const practiceResult = result?.mode === 'practice' ? result.practiceResult : null;
  const audioLevel = useAudioLevel(stream);
  const frequencyBands = useTutorFrequency(playbackAnalyser);

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
          <ResultActions
            passed={passed}
            language={language}
            onComplete={onComplete}
            onAgain={session.start}
            onSwitchToText={onSwitchToText}
          />
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

        <p className="font-mono text-[10px] text-j-text-tertiary mb-6">
          {t('maxDuration', language)}
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
        frequencyBands={frequencyBands}
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
        <ResultActions
          passed={passed}
          language={language}
          onComplete={onComplete}
          onAgain={session.start}
          onReviewMaterial={onReviewMaterial}
          onSwitchToText={onSwitchToText}
        />
      </div>
    );
  }

  return null;
}
