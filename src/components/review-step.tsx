'use client';

import { useState, useEffect, useCallback } from 'react';
import { InlineQuiz } from './inline-quiz';
import { ConfidenceIndicator, type ConfidenceLevel } from './confidence-indicator';
import { t, type Language } from '@/lib/translations';
import type { InlineQuiz as InlineQuizType } from '@/types';
import type { ReviewStepState } from '@/lib/learn-progress';

// ============================================================================
// Types
// ============================================================================

interface Section {
  id: string;
  conceptId: string;
  sectionTitle: string;
  sortOrder: number;
}

interface BankQuestion {
  questionId: string;
  conceptId: string;
  conceptName: string;
  sectionId: string | null;
  questionText: string;
  expectedAnswer: string;
  type: string;
  difficulty: number;
}

interface ReviewStepProps {
  language: Language;
  resourceId: string;
  sections: Section[];
  quizzesBySectionId: Record<string, InlineQuizType[]>;
  initialState?: ReviewStepState;
  onStateChange: (state: ReviewStepState) => void;
  onComplete: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ReviewStep({
  language,
  resourceId,
  sections,
  quizzesBySectionId,
  initialState,
  onStateChange,
  onComplete,
}: ReviewStepProps) {
  const [reviewState, setReviewState] = useState<ReviewStepState>(
    initialState ?? { inlineAnswers: {}, bankAnswers: {} }
  );
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track which bank questions are currently being evaluated
  const [evaluating, setEvaluating] = useState<Set<string>>(new Set());
  // Track which bank questions are in "retry" mode (textarea open for re-answer)
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  // Track current textarea values for bank questions
  const [bankInputs, setBankInputs] = useState<Record<string, string>>({});
  // Track confidence per bank question
  const [bankConfidence, setBankConfidence] = useState<Record<string, ConfidenceLevel>>({});

  // Fetch all bank questions for this resource
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/review/by-resource?resourceId=${resourceId}`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        setBankQuestions(data.questions || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [resourceId]);

  // Group bank questions by sectionId
  const bankBySectionId: Record<string, BankQuestion[]> = {};
  for (const q of bankQuestions) {
    // Match by sectionId directly, or fall back to matching concept → section
    const sectionId = q.sectionId
      ?? sections.find((s) => s.conceptId === q.conceptId)?.id
      ?? null;
    if (sectionId) {
      const arr = bankBySectionId[sectionId] ?? [];
      arr.push(q);
      bankBySectionId[sectionId] = arr;
    }
  }

  // Count total and answered questions
  const totalInline = Object.values(quizzesBySectionId).flat().length;
  const totalBank = bankQuestions.length;
  const totalQuestions = totalInline + totalBank;
  const answeredInline = Object.keys(reviewState.inlineAnswers).length;
  const answeredBank = Object.keys(reviewState.bankAnswers).length;
  const answeredTotal = answeredInline + answeredBank;

  // Persist state changes
  const updateState = useCallback(
    (next: ReviewStepState) => {
      setReviewState(next);
      onStateChange(next);
    },
    [onStateChange]
  );

  // Handle inline quiz answer (override mode)
  const handleInlineAnswer = useCallback(
    (quizId: string, selectedOption: string, isCorrect: boolean) => {
      const next: ReviewStepState = {
        ...reviewState,
        inlineAnswers: {
          ...reviewState.inlineAnswers,
          [quizId]: { selectedOption, isCorrect },
        },
      };
      updateState(next);
    },
    [reviewState, updateState]
  );

  // Submit a bank question answer for DeepSeek evaluation
  const handleBankSubmit = useCallback(
    async (questionId: string) => {
      const answer = bankInputs[questionId]?.trim();
      if (!answer) return;

      setEvaluating((prev) => new Set(prev).add(questionId));

      try {
        const res = await fetch('/api/review/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, userAnswer: answer }),
        });

        if (!res.ok) throw new Error('Failed to evaluate');
        const data = await res.json();

        const next: ReviewStepState = {
          ...reviewState,
          bankAnswers: {
            ...reviewState.bankAnswers,
            [questionId]: {
              userAnswer: answer,
              score: data.score,
              isCorrect: data.isCorrect,
              feedback: data.feedback,
              dimensionScores: data.dimensionScores,
            },
          },
        };
        updateState(next);
        setRetrying((prev) => {
          const s = new Set(prev);
          s.delete(questionId);
          return s;
        });
      } catch (err) {
        console.error('[ReviewStep] Bank submit error:', err);
      } finally {
        setEvaluating((prev) => {
          const s = new Set(prev);
          s.delete(questionId);
          return s;
        });
      }
    },
    [bankInputs, reviewState, updateState]
  );

  // Retry a bank question
  const handleRetry = useCallback((questionId: string) => {
    setRetrying((prev) => new Set(prev).add(questionId));
    setBankInputs((prev) => ({ ...prev, [questionId]: '' }));
  }, []);

  // Handle confidence selection for a bank question (fire-and-forget to backend)
  const handleBankConfidence = useCallback(
    (questionId: string, level: ConfidenceLevel) => {
      setBankConfidence((prev) => ({ ...prev, [questionId]: level }));
      const savedAnswer = reviewState.bankAnswers[questionId];
      if (savedAnswer) {
        fetch('/api/review/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId,
            userAnswer: savedAnswer.userAnswer,
            confidence: level,
          }),
        }).catch(() => {});
      }
    },
    [reviewState.bankAnswers]
  );

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

  return (
    <div className="py-16">
      {/* Header */}
      <header className="mb-12">
        {/* Step label — hidden on lg+ where sidebar shows it */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-px bg-j-accent" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              {t('learn.step.review', language)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-light text-j-text">
            {t('learn.review.subtitle', language)}
          </h2>
          <span className="font-mono text-[10px] text-j-text-tertiary">
            {answeredTotal}/{totalQuestions} {t('learn.review.progress', language)}
          </span>
        </div>
      </header>

      {/* Sections with questions */}
      <div className="space-y-12">
        {sections.map((section) => {
          const inlineQuizzes = quizzesBySectionId[section.id] || [];
          const sectionBankQuestions = bankBySectionId[section.id] || [];

          if (inlineQuizzes.length === 0 && sectionBankQuestions.length === 0) {
            return null;
          }

          return (
            <div key={section.id}>
              {/* Section title */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase font-medium">
                  {String(section.sortOrder + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-j-text">
                  {section.sectionTitle}
                </span>
              </div>

              {/* Inline quizzes (MC/TF) — reset for review */}
              {inlineQuizzes.length > 0 && (
                <div className="space-y-4 mb-6">
                  {inlineQuizzes.map((quiz) => (
                    <div key={quiz.id}>
                      <span className="inline-block font-mono text-[9px] tracking-[0.15em] text-j-warm uppercase mb-2">
                        {t('learn.review.inline', language)}
                      </span>
                      <InlineQuiz
                        quiz={{
                          id: quiz.id,
                          format: quiz.format,
                          questionText: quiz.questionText,
                          options: quiz.options,
                          correctAnswer: quiz.correctAnswer,
                          explanation: quiz.explanation,
                        }}
                        overrideState={reviewState.inlineAnswers[quiz.id] ?? null}
                        onAnswer={handleInlineAnswer}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Bank questions (open-ended, DeepSeek evaluated) */}
              {sectionBankQuestions.map((q) => {
                const savedAnswer = reviewState.bankAnswers[q.questionId];
                const isEvaluating = evaluating.has(q.questionId);
                const isRetryMode = retrying.has(q.questionId);
                const showResult = savedAnswer && !isRetryMode;

                return (
                  <div
                    key={q.questionId}
                    className="bg-j-bg-alt border border-j-border border-l-2 border-l-j-accent p-6 mb-4"
                  >
                    {/* Tag */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-[9px] tracking-[0.15em] text-j-accent uppercase">
                        {t('learn.review.openEnded', language)}
                      </span>
                      <span className="font-mono text-[9px] text-j-text-tertiary">
                        {language === 'es' ? 'Dif' : 'Diff'}: {q.difficulty}
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-sm text-j-text leading-relaxed mb-4">
                      {q.questionText}
                    </p>

                    {/* Show previous result */}
                    {showResult && (
                      <div className="space-y-3">
                        {/* Dimension dots */}
                        {savedAnswer.dimensionScores && (
                          <div className="flex gap-3">
                            {Object.entries(savedAnswer.dimensionScores).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className="font-mono text-[9px] text-j-text-tertiary uppercase">{key}</span>
                                <span className="text-[10px]">
                                  {[0, 1].map((dotIndex) => (
                                    <span
                                      key={dotIndex}
                                      className={dotIndex < value ? 'text-j-accent' : 'text-j-border-input'}
                                    >
                                      {dotIndex < value ? '●' : '○'}
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
                            {savedAnswer.isCorrect
                              ? t('review.correct', language)
                              : t('review.incorrect', language)}
                          </span>
                        </div>

                        {savedAnswer.feedback && (
                          <p className="text-sm text-j-text-secondary leading-relaxed">
                            {savedAnswer.feedback}
                          </p>
                        )}

                        <div className="border border-j-border p-3 bg-white">
                          <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                            {language === 'es' ? 'Tu respuesta' : 'Your answer'}
                          </p>
                          <p className="text-sm text-j-text">{savedAnswer.userAnswer}</p>
                        </div>

                        {/* Confidence indicator */}
                        <ConfidenceIndicator
                          language={language}
                          onSelect={(level) => handleBankConfidence(q.questionId, level)}
                          selected={bankConfidence[q.questionId] ?? null}
                        />

                        <button
                          onClick={() => handleRetry(q.questionId)}
                          className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 uppercase hover:border-j-accent transition-colors"
                        >
                          {t('learn.review.retry', language)}
                        </button>
                      </div>
                    )}

                    {/* Input area (initial or retry) */}
                    {!showResult && (
                      <div className="space-y-3">
                        <textarea
                          value={bankInputs[q.questionId] ?? ''}
                          onChange={(e) =>
                            setBankInputs((prev) => ({
                              ...prev,
                              [q.questionId]: e.target.value,
                            }))
                          }
                          placeholder={
                            language === 'es' ? 'Escribe tu respuesta...' : 'Write your answer...'
                          }
                          rows={3}
                          className="w-full border border-j-border-input bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.metaKey) {
                              handleBankSubmit(q.questionId);
                            }
                          }}
                        />

                        <button
                          onClick={() => handleBankSubmit(q.questionId)}
                          disabled={!bankInputs[q.questionId]?.trim() || isEvaluating}
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
          );
        })}
      </div>

      {/* CTA to continue to Apply */}
      <div className="mt-12 pt-12 border-t border-j-border text-center">
        <button
          onClick={onComplete}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
        >
          {t('learn.continueToEvaluate', language)} →
        </button>
      </div>
    </div>
  );
}
