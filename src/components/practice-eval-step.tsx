'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionLabel } from '@/components/ui/section-label';
import { t, type Language } from '@/lib/translations';
import type { PracticeEvalState, PracticeEvalAnswer } from '@/lib/learn-progress';
import type { ReviewSubmitResponse } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface BankQuestion {
  questionId: string;
  conceptId: string;
  conceptName: string;
  questionText: string;
  expectedAnswer: string;
  type: string;
  difficulty: number;
}

interface PracticeEvalStepProps {
  language: Language;
  resourceId: string;
  conceptIds: string[];
  initialState?: PracticeEvalState;
  onStateChange: (state: PracticeEvalState) => void;
  onComplete: () => void;
}

// ============================================================================
// Scaffolding configuration
// ============================================================================

const SCAFFOLD_CONFIG = {
  1: {
    label: { es: 'Con guía', en: 'Guided' },
    description: {
      es: 'Tienes pistas sobre qué dimensiones evaluar en tu respuesta.',
      en: 'You have hints about which dimensions to address in your answer.',
    },
  },
  2: {
    label: { es: 'Con rúbrica', en: 'With rubric' },
    description: {
      es: 'Puedes ver las dimensiones de evaluación antes de responder.',
      en: 'You can see the evaluation dimensions before answering.',
    },
  },
  3: {
    label: { es: 'Sin ayuda', en: 'Unassisted' },
    description: {
      es: 'Igual que la evaluación final — sin pistas ni rúbrica.',
      en: 'Same as the final evaluation — no hints or rubric.',
    },
  },
} as const;

// Dimension hints for scaffold level 1
const DIMENSION_HINTS: Record<string, { es: string; en: string }> = {
  scenario: {
    es: 'Tu respuesta debería incluir: (1) diagnóstico del problema, (2) solución propuesta, (3) razonamiento causal.',
    en: 'Your answer should include: (1) problem diagnosis, (2) proposed solution, (3) causal reasoning.',
  },
  limitation: {
    es: 'Tu respuesta debería incluir: (1) descripción precisa, (2) limitaciones específicas, (3) alternativa concreta.',
    en: 'Your answer should include: (1) precise description, (2) specific limitations, (3) concrete alternative.',
  },
  error_spot: {
    es: 'Tu respuesta debería incluir: (1) identificar el error exacto, (2) corrección, (3) justificación con principios.',
    en: 'Your answer should include: (1) identify the exact error, (2) correction, (3) justification with principles.',
  },
  comparison: {
    es: 'Tu respuesta debería incluir: (1) precisión sobre ambos conceptos, (2) distinción central, (3) escenarios de uso.',
    en: 'Your answer should include: (1) accuracy about both concepts, (2) central distinction, (3) usage scenarios.',
  },
};

const TYPE_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  scenario: { label: 'Escenario', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  limitation: { label: 'Limitación', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  error_spot: { label: 'Error sutil', className: 'bg-red-50 text-red-700 border-red-200' },
  comparison: { label: 'Comparación', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

// ============================================================================
// Component
// ============================================================================

export function PracticeEvalStep({
  language,
  resourceId,
  conceptIds,
  initialState,
  onStateChange,
  onComplete,
}: PracticeEvalStepProps) {
  const [evalState, setEvalState] = useState<PracticeEvalState>(
    initialState ?? { answers: {}, currentScaffoldLevel: 1 }
  );
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [evaluating, setEvaluating] = useState<Set<string>>(new Set());

  const scaffoldLevel = evalState.currentScaffoldLevel;

  // Fetch 2-3 high-order questions for this resource
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const params = new URLSearchParams();
        params.set('resourceId', resourceId);
        params.set('types', 'scenario,limitation,error_spot');
        params.set('limit', '3');

        const res = await fetch(`/api/review/by-resource?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch practice questions');
        const data = await res.json();

        // Filter to only high-order types
        const highOrder = (data.questions || []).filter(
          (q: BankQuestion) => ['scenario', 'limitation', 'error_spot'].includes(q.type)
        );

        // If no high-order questions available, fall back to comparison
        if (highOrder.length === 0) {
          const allQuestions = data.questions || [];
          const comparisons = allQuestions.filter((q: BankQuestion) => q.type === 'comparison');
          setQuestions(comparisons.slice(0, 3));
        } else {
          setQuestions(highOrder.slice(0, 3));
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [resourceId]);

  const updateState = useCallback(
    (next: PracticeEvalState) => {
      setEvalState(next);
      onStateChange(next);
    },
    [onStateChange]
  );

  const handleSubmit = useCallback(
    async (questionId: string) => {
      const answer = inputs[questionId]?.trim();
      if (!answer) return;

      setEvaluating((prev) => new Set(prev).add(questionId));

      try {
        const res = await fetch('/api/review/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, userAnswer: answer }),
        });

        if (!res.ok) throw new Error('Failed to evaluate');
        const data: ReviewSubmitResponse = await res.json();

        const practiceAnswer: PracticeEvalAnswer = {
          questionId,
          userAnswer: answer,
          score: data.score,
          isCorrect: data.isCorrect,
          feedback: data.feedback,
          dimensionScores: data.dimensionScores,
          scaffoldLevel,
        };

        const next: PracticeEvalState = {
          ...evalState,
          answers: {
            ...evalState.answers,
            [questionId]: practiceAnswer,
          },
        };
        updateState(next);
      } catch (err) {
        console.error('[PracticeEval] Submit error:', err);
      } finally {
        setEvaluating((prev) => {
          const s = new Set(prev);
          s.delete(questionId);
          return s;
        });
      }
    },
    [inputs, evalState, scaffoldLevel, updateState]
  );

  const answeredCount = Object.keys(evalState.answers).length;
  const allAnswered = questions.length > 0 && answeredCount >= questions.length;

  // Calculate average score for scaffold level progression
  const avgScore = allAnswered
    ? Math.round(
        Object.values(evalState.answers).reduce((sum, a) => sum + (a.score ?? 0), 0) / answeredCount
      )
    : 0;

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-j-text-tertiary">{t('common.loading', language)}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-j-error">{error}</p>
      </div>
    );
  }

  // If no practice questions available, skip to evaluate
  if (questions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-j-text-secondary mb-4">
          {language === 'es'
            ? 'No hay preguntas de práctica disponibles. Continúa a la evaluación.'
            : 'No practice questions available. Continue to evaluation.'}
        </p>
        <button
          onClick={onComplete}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
        >
          {t('learn.step.evaluate', language)} →
        </button>
      </div>
    );
  }

  return (
    <div className="py-16">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <SectionLabel className="mb-0">
            {t('learn.step.practiceEval', language)}
          </SectionLabel>
        </div>

        <h2 className="text-xl font-light text-j-text mb-2">
          {language === 'es' ? 'Práctica de Evaluación' : 'Evaluation Practice'}
        </h2>
        <p className="text-sm text-j-text-secondary leading-relaxed mb-4">
          {language === 'es'
            ? 'Estas preguntas son del mismo tipo que la evaluación final. Practica responder con profundidad.'
            : 'These questions are the same type as the final evaluation. Practice answering with depth.'}
        </p>

        {/* Scaffold level indicator */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase">
            {language === 'es' ? 'Nivel' : 'Level'} {scaffoldLevel}/3
          </span>
          <span className="text-xs text-j-text-tertiary">
            {SCAFFOLD_CONFIG[scaffoldLevel].description[language]}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2">
          {answeredCount}/{questions.length} {language === 'es' ? 'respondidas' : 'answered'}
        </div>
      </header>

      {/* Questions */}
      <div className="space-y-8">
        {questions.map((q) => {
          const savedAnswer = evalState.answers[q.questionId];
          const isEvaluating = evaluating.has(q.questionId);
          const badge = TYPE_BADGE_CONFIG[q.type];

          return (
            <div
              key={q.questionId}
              className="bg-j-bg-alt border border-j-border border-l-2 border-l-j-warm p-6"
            >
              {/* Type badge + concept */}
              <div className="flex items-center gap-2 mb-3">
                {badge && (
                  <span className={`font-mono text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 border ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
                <span className="font-mono text-[9px] text-j-text-tertiary">
                  {q.conceptName}
                </span>
              </div>

              {/* Question */}
              <p className="text-sm text-j-text leading-relaxed mb-4">
                {q.questionText}
              </p>

              {/* Scaffold: dimension hints (level 1) */}
              {scaffoldLevel === 1 && !savedAnswer && DIMENSION_HINTS[q.type] && (
                <div className="border border-j-warm/30 bg-j-warm/5 p-3 mb-4">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-1">
                    {language === 'es' ? 'Pista' : 'Hint'}
                  </p>
                  <p className="text-xs text-j-text-secondary leading-relaxed">
                    {DIMENSION_HINTS[q.type][language]}
                  </p>
                </div>
              )}

              {/* Scaffold: rubric visible (level 2) */}
              {scaffoldLevel === 2 && !savedAnswer && (
                <div className="border border-j-border p-3 mb-4 bg-j-bg-white">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
                    {language === 'es' ? 'Dimensiones de evaluación' : 'Evaluation dimensions'}
                  </p>
                  <p className="text-xs text-j-text-secondary">
                    {DIMENSION_HINTS[q.type]?.[language] ?? (
                      language === 'es'
                        ? 'Precisión, completitud, y profundidad.'
                        : 'Precision, completeness, and depth.'
                    )}
                  </p>
                </div>
              )}

              {/* Result display */}
              {savedAnswer && (
                <div className="space-y-3 mb-4">
                  {savedAnswer.dimensionScores && (
                    <div className="flex gap-3">
                      {Object.entries(savedAnswer.dimensionScores).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-1">
                          <span className="font-mono text-[9px] text-j-text-tertiary uppercase">{key}</span>
                          <span className="text-[10px]">
                            {[0, 1].map((dotIndex) => (
                              <span
                                key={dotIndex}
                                className={dotIndex < (value ?? 0) ? 'text-j-accent' : 'text-j-border-input'}
                              >
                                {dotIndex < (value ?? 0) ? '●' : '○'}
                              </span>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
                        savedAnswer.isCorrect ? 'text-j-accent' : 'text-j-error'
                      }`}
                    >
                      {savedAnswer.score}% · {savedAnswer.isCorrect
                        ? (language === 'es' ? 'Bien hecho' : 'Well done')
                        : (language === 'es' ? 'Aún no' : 'Not yet')}
                    </span>
                  </div>

                  {savedAnswer.feedback && (
                    <p className="text-sm text-j-text-secondary leading-relaxed">
                      {savedAnswer.feedback}
                    </p>
                  )}

                  <div className="border border-j-border p-3 bg-j-bg-white">
                    <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                      {language === 'es' ? 'Tu respuesta' : 'Your answer'}
                    </p>
                    <p className="text-sm text-j-text">{savedAnswer.userAnswer}</p>
                  </div>
                </div>
              )}

              {/* Input area */}
              {!savedAnswer && (
                <div className="space-y-3">
                  <textarea
                    value={inputs[q.questionId] ?? ''}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, [q.questionId]: e.target.value }))
                    }
                    placeholder={
                      language === 'es' ? 'Escribe tu respuesta...' : 'Write your answer...'
                    }
                    rows={4}
                    className="w-full border border-j-border-input bg-j-bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey) {
                        handleSubmit(q.questionId);
                      }
                    }}
                  />

                  <button
                    onClick={() => handleSubmit(q.questionId)}
                    disabled={!inputs[q.questionId]?.trim() || isEvaluating}
                    className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
                  >
                    {isEvaluating
                      ? (language === 'es' ? 'Evaluando...' : 'Evaluating...')
                      : (language === 'es' ? 'Verificar' : 'Verify')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary + CTA */}
      {allAnswered && (
        <div className="mt-12 pt-12 border-t border-j-border">
          <div className="text-center mb-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-2">
              {language === 'es' ? 'Práctica completada' : 'Practice complete'}
            </p>
            <p className="text-2xl font-light text-j-text mb-2">
              {avgScore}%
            </p>
            <p className="text-sm text-j-text-secondary">
              {avgScore >= 70
                ? (language === 'es'
                  ? 'Buen desempeño. Estás preparado para la evaluación final.'
                  : 'Good performance. You\'re ready for the final evaluation.')
                : (language === 'es'
                  ? 'La evaluación final tiene el mismo formato. Revisa el feedback antes de continuar.'
                  : 'The final evaluation has the same format. Review the feedback before continuing.')}
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={onComplete}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {t('learn.step.evaluate', language)} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
