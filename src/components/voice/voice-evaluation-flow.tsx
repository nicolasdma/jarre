'use client';

/**
 * Jarre - Voice Evaluation Flow
 *
 * Complete UI for voice-based Socratic evaluation.
 * 4 phases: INTRO → SESSION → SCORING → RESULTS
 *
 * Same props as EvaluationFlow for drop-in replacement.
 */

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useUnifiedVoiceSession } from './use-unified-voice-session';
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

interface Resource {
  id: string;
  title: string;
  type: string;
}

interface Props {
  resource: Resource;
  concepts: Concept[];
  userId: string;
  language: Language;
  onCancel?: () => void;
  /** Switch to text-based evaluation */
  onSwitchToText?: () => void;
}

// ============================================================================
// Rubric Summary (reused from evaluation-flow)
// ============================================================================

function RubricSummary({ responses }: { responses: Array<{ score: number }> }) {
  const totalQuestions = responses.length;
  if (totalQuestions === 0) return null;

  const avgScore = responses.reduce((sum, r) => sum + r.score, 0) / totalQuestions;
  const highScoreCount = responses.filter(r => r.score >= 80).length;
  const midScoreCount = responses.filter(r => r.score >= 50 && r.score < 80).length;

  const precisionDots = Math.min(5, Math.round((highScoreCount / totalQuestions) * 5));
  const completenessDots = Math.min(5, Math.round((avgScore / 100) * 5));
  const depthDots = Math.min(5, Math.round(((highScoreCount + midScoreCount * 0.5) / totalQuestions) * 5));

  const dimensions = [
    { label: 'Precision', dots: precisionDots },
    { label: 'Completitud', dots: completenessDots },
    { label: 'Profundidad', dots: depthDots },
  ];

  return (
    <div className="flex flex-col gap-2">
      {dimensions.map(({ label, dots }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase w-24 text-right">
            {label}
          </span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((dotLevel) => (
              <span
                key={`dot-${dotLevel}`}
                className={`text-xs ${dotLevel < dots ? 'text-j-accent' : 'text-j-border-input'}`}
              >
                {dotLevel < dots ? '\u25CF' : '\u25CB'}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Translations
// ============================================================================

const tr = {
  introTitle: { es: 'Evaluacion oral', en: 'Oral evaluation' },
  introDesc: {
    es: 'Vamos a tener una conversacion tecnica sobre estos conceptos. Habla naturalmente — no es un examen formal.',
    en: 'We\'ll have a technical conversation about these concepts. Speak naturally — this is not a formal exam.',
  },
  conceptsToEvaluate: { es: 'Conceptos a evaluar', en: 'Concepts to evaluate' },
  startEval: { es: 'Comenzar conversacion', en: 'Start conversation' },
  preferText: { es: 'Prefiero escribir', en: 'I prefer writing' },
  cancel: { es: 'Cancelar', en: 'Cancel' },
  yourTurn: { es: 'Tu turno — habla', en: 'Your turn — speak' },
  thinking: { es: 'Pensando...', en: 'Thinking...' },
  speaking: { es: 'Evaluador hablando...', en: 'Evaluator speaking...' },
  endSession: { es: 'Terminar', en: 'End session' },
  escToEnd: { es: 'Esc para terminar', en: 'Esc to end' },
  scoring: { es: 'Analizando tu conversacion...', en: 'Analyzing your conversation...' },
  scoringEstimate: { es: 'Esto suele tomar ~15 segundos', en: 'This usually takes ~15 seconds' },
  complete: { es: 'Evaluacion Completada', en: 'Evaluation Complete' },
  overallScore: { es: 'Puntuacion General', en: 'Overall Score' },
  excellent: { es: 'Excelente', en: 'Excellent' },
  feedback: { es: 'Retroalimentacion', en: 'Feedback' },
  concept: { es: 'Concepto', en: 'Concept' },
  backToLibrary: { es: 'Volver a la biblioteca', en: 'Back to library' },
  reviewMaterial: { es: 'Repasar material', en: 'Review material' },
  retryEval: { es: 'Volver a intentar', en: 'Try again' },
  discoveryMessage: {
    es: 'Las evaluaciones son herramientas de descubrimiento, no juicios',
    en: 'Evaluations are discovery tools, not judgments',
  },
  lowScoreEncouragement: {
    es: 'Cuando te sientas listo, volve a intentarlo — cada intento es aprendizaje',
    en: 'When you feel ready, try again — each attempt is learning',
  },
  dimensionBreakdown: { es: 'Desglose por dimension', en: 'Breakdown by dimension' },
  voiceEval: { es: 'Evaluacion por voz', en: 'Voice evaluation' },
  maxDuration: { es: 'Maximo 10 minutos', en: 'Maximum 10 minutes' },
  consolidation: { es: 'Consolidacion', en: 'Consolidation' },
  idealAnswer: { es: 'Respuesta ideal', en: 'Ideal answer' },
  whereDiverged: { es: 'Donde divergio tu razonamiento', en: 'Where your reasoning diverged' },
  connections: { es: 'Conexiones', en: 'Connections' },
  whatToReview: { es: 'Que repasar', en: 'What to review' },
  showConsolidation: { es: 'Ver consolidacion', en: 'Show consolidation' },
  hideConsolidation: { es: 'Ocultar consolidacion', en: 'Hide consolidation' },
} as const;

function t(key: keyof typeof tr, lang: Language): string {
  return tr[key]?.[lang] || tr[key]?.en || key;
}

// ============================================================================
// Consolidation Section
// ============================================================================

interface ConsolidationItem {
  conceptName: string;
  idealAnswer: string;
  divergence: string;
  connections: string;
  reviewSuggestion: string;
}

function ConsolidationSection({
  consolidation,
  language,
}: {
  consolidation: ConsolidationItem[];
  language: Language;
}) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="mt-8 border border-j-border p-6">
      <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-4">
        {t('consolidation', language)}
      </p>

      <div className="space-y-3">
        {consolidation.map((item, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <div key={`consolidation-${item.conceptName}`} className="border-l-2 border-j-border pl-4">
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full text-left flex items-center justify-between gap-2 py-1 group"
              >
                <span className="font-mono text-[10px] tracking-[0.1em] text-j-text-secondary uppercase group-hover:text-j-accent transition-colors">
                  {item.conceptName}
                </span>
                <span className="font-mono text-[10px] text-j-text-tertiary">
                  {isExpanded ? '\u25B2' : '\u25BC'}
                </span>
              </button>

              {isExpanded && (
                <div className="mt-3 space-y-4 pb-3">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-accent uppercase mb-1">
                      {t('idealAnswer', language)}
                    </p>
                    <p className="text-sm text-j-text-secondary leading-relaxed">
                      {item.idealAnswer}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-error uppercase mb-1">
                      {t('whereDiverged', language)}
                    </p>
                    <p className="text-sm text-j-text-secondary leading-relaxed">
                      {item.divergence}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                      {t('connections', language)}
                    </p>
                    <p className="text-sm text-j-text-secondary leading-relaxed">
                      {item.connections}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-1">
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

export function VoiceEvaluationFlow({
  resource,
  concepts,
  userId: _userId,
  language,
  onCancel,
  onSwitchToText,
}: Props) {
  const router = useRouter();

  const session = useUnifiedVoiceSession({
    mode: 'eval',
    language,
    resourceId: resource.id,
    concepts: concepts.map((c) => ({ id: c.id, name: c.name, definition: c.canonical_definition })),
  });

  const { state, tutorState, error, elapsed, result, transcript, stream, playbackAnalyser } = session;
  const evaluationResult = result?.mode === 'eval' ? result.evaluationResult : null;
  const audioLevel = useAudioLevel(stream);
  const frequencyBands = useTutorFrequency(playbackAnalyser);

  // Keyboard shortcut: Escape to disconnect during session
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

  // Toast on completion
  useEffect(() => {
    if (state === 'done' && evaluationResult?.saved) {
      toast.success(language === 'es' ? 'Evaluacion guardada' : 'Evaluation saved');
      if (evaluationResult.overallScore >= 80) {
        toast.success('+ 30 XP por evaluacion oral');
      }
    }
  }, [state, evaluationResult, language]);

  // ---- INTRO ----
  if (state === 'idle') {
    return (
      <div>
        <SectionLabel className="mb-8">
          {t('voiceEval', language)}
        </SectionLabel>

        <h2 className="text-xl font-light text-j-text mb-2">{resource.title}</h2>
        <p className="text-sm text-j-text-secondary mb-8 max-w-lg">
          {t('introDesc', language)}
        </p>

        <div className="mb-8">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-3">
            {t('conceptsToEvaluate', language)}
          </p>
          <ul className="space-y-1.5">
            {concepts.map((concept) => (
              <li key={concept.id} className="text-sm text-j-text-secondary flex items-center gap-2">
                <span className="w-1 h-1 bg-j-accent rounded-full" />
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
          {/* Mic button */}
          <button
            type="button"
            onClick={session.start}
            className="group relative w-16 h-16 flex items-center justify-center rounded-full bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover transition-all duration-300"
            aria-label={t('startEval', language)}
          >
            <span className="absolute inset-0 rounded-full border-2 border-j-accent animate-ping opacity-20 group-hover:opacity-40" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="11" rx="3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <div>
            <p className="font-mono text-[10px] text-j-text-secondary">
              {t('startEval', language)}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          {onSwitchToText && (
            <button
              type="button"
              onClick={onSwitchToText}
              className="font-mono text-[10px] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
            >
              {t('preferText', language)}
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="font-mono text-[10px] text-j-text-tertiary hover:text-j-text-secondary transition-colors underline underline-offset-2"
            >
              {t('cancel', language)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- CONNECTING ----
  if (state === 'connecting') {
    return <VoiceConnectingPhase language={language} />;
  }

  // ---- SESSION (conversing) ----
  if (state === 'active') {
    return (
      <VoiceActivePhase
        language={language}
        tutorState={tutorState}
        elapsed={elapsed}
        maxDurationSeconds={600}
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

  // ---- ERROR (scoring failed) ----
  if (state === 'error') {
    return (
      <VoiceErrorPhase
        error={error}
        language={language}
        onRetry={session.retryPostProcess}
        fallbackAction={onCancel ? { label: t('cancel', language), onClick: onCancel } : undefined}
      />
    );
  }

  // ---- RESULTS ----
  if (state === 'done' && evaluationResult) {
    const isHighScore = evaluationResult.overallScore >= 80;
    const isLowScore = evaluationResult.overallScore < 60;
    const hasConsolidation = evaluationResult.consolidation && evaluationResult.consolidation.length > 0;

    return (
      <div>
        <SectionLabel className="mb-8">
          {t('complete', language)}
        </SectionLabel>

        {/* Rubric dimensions */}
        <div className="border border-j-border p-6 mb-4">
          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-4">
            {t('dimensionBreakdown', language)}
          </p>
          <RubricSummary responses={evaluationResult.responses} />
        </div>

        {/* Score summary */}
        <div className={`border p-8 mb-4 ${isHighScore ? 'border-j-accent bg-j-accent/5' : 'border-j-border'}`}>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className={`text-4xl font-light ${
                evaluationResult.overallScore >= 60 ? 'text-j-accent' : 'text-j-error'
              }`}>
                {evaluationResult.overallScore}%
              </p>
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mt-1">
                {t('overallScore', language)}
              </p>
              {isHighScore && (
                <p className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase mt-2 animate-pulse">
                  {t('excellent', language)}
                </p>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-j-text-secondary leading-relaxed">
                {evaluationResult.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Discovery framing */}
        <p className="text-[10px] text-j-text-tertiary font-mono text-center mb-6">
          {t('discoveryMessage', language)}
        </p>

        {/* Low score encouragement */}
        {isLowScore && (
          <div className="border border-j-border bg-j-bg-alt p-6 mb-6">
            <p className="text-[10px] text-j-text-tertiary font-mono">
              {t('lowScoreEncouragement', language)}
            </p>
          </div>
        )}

        {/* Individual concept results */}
        <div className="space-y-6">
          {evaluationResult.responses.map((result, index) => (
            <div
              key={`eval-response-${result.questionIndex}`}
              className={`border-l-2 pl-6 ${
                result.isCorrect ? 'border-j-accent' : 'border-j-error'
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

              <div className="p-3">
                <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                  {t('feedback', language)}
                </p>
                <p className="text-sm text-j-text-secondary leading-relaxed">{result.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Consolidation section */}
        {hasConsolidation && (
          <ConsolidationSection
            consolidation={evaluationResult.consolidation}
            language={language}
          />
        )}

        {/* Action buttons */}
        <div className="flex gap-4 mt-10 pt-10 border-t border-j-border">
          {isHighScore ? (
            <button
              onClick={() => router.push('/library')}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {t('backToLibrary', language)}
            </button>
          ) : isLowScore ? (
            <>
              <button
                onClick={() => onCancel ? onCancel() : router.push(`/learn/${resource.id}`)}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
              >
                {t('reviewMaterial', language)}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('retryEval', language)}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/library')}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-4 py-2 uppercase hover:border-j-accent transition-colors"
              >
                {t('backToLibrary', language)}
              </button>
              <button
                onClick={() => onCancel ? onCancel() : router.push(`/learn/${resource.id}`)}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2 uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('reviewMaterial', language)}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
