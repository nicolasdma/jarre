'use client';

import { useState, useCallback, useEffect } from 'react';
import { t, type Language } from '@/lib/translations';
import type { ReviewSubmitResponse } from '@/types';

interface QuickQuizProps {
  language: Language;
  conceptIds: string[];
  onClose: () => void;
}

type Phase = 'loading' | 'question' | 'evaluating' | 'result' | 'revealed';

interface QuestionData {
  questionId: string;
  conceptName: string;
  questionText: string;
  expectedAnswer: string;
  difficulty: number;
}

export function QuickQuiz({ language, conceptIds, onClose }: QuickQuizProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ReviewSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setAnswer('');
    setResult(null);

    try {
      const params = new URLSearchParams();
      if (conceptIds.length > 0) params.set('concepts', conceptIds.join(','));
      if (question?.questionId) params.set('exclude', question.questionId);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/review/random${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'No questions available');
      }
      const data = await res.json();
      setQuestion(data);
      setPhase('question');
    } catch (err) {
      setError((err as Error).message);
      setPhase('question');
    }
  }, [conceptIds]);

  // Fetch first question on mount
  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const submitAnswer = useCallback(async () => {
    if (!answer.trim() || !question) return;

    setPhase('evaluating');
    setError(null);

    try {
      const res = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.questionId,
          userAnswer: answer.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate');
      const data: ReviewSubmitResponse = await res.json();
      setResult(data);
      setPhase('result');
    } catch (err) {
      setError((err as Error).message);
      setPhase('question');
    }
  }, [answer, question]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quiz rápido"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:w-[380px] max-h-[70vh] bg-j-bg border border-j-border-input shadow-xl flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-j-border">
        <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
          {t('quiz.title', language)}
        </span>
        <button
          onClick={onClose}
          aria-label="Cerrar quiz"
          className="text-j-text-tertiary hover:text-j-text transition-colors text-lg leading-none min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1">
        {/* Loading */}
        {phase === 'loading' && (
          <p className="text-sm text-j-text-tertiary">{t('common.loading', language)}</p>
        )}

        {/* Error without question */}
        {phase === 'question' && !question && error && (
          <div>
            <p className="text-xs text-j-error mb-3">{error}</p>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 min-h-[44px] uppercase hover:border-j-accent transition-colors"
            >
              {t('quiz.done', language)}
            </button>
          </div>
        )}

        {/* Question */}
        {phase === 'question' && question && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.1em] text-j-accent border border-j-border-input px-2 py-0.5">
                {question.conceptName}
              </span>
              <span className="text-[10px] text-j-text-tertiary">
                {'●'.repeat(question.difficulty)}
              </span>
            </div>

            <p className="text-sm text-j-text leading-relaxed">{question.questionText}</p>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t('review.answerPlaceholder', language)}
              rows={3}
              className="w-full border border-j-border-input bg-[var(--j-bg)] p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
              // eslint-disable-next-line jsx-a11y/no-autofocus -- Intentional: focus answer field when quiz question is presented
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey && answer.trim()) {
                  submitAnswer();
                }
              }}
            />

            <div className="flex gap-2">
              <button
                onClick={submitAnswer}
                disabled={!answer.trim()}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 min-h-[44px] uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
              >
                {t('review.verify', language)}
              </button>
              <button
                onClick={() => setPhase('revealed')}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 min-h-[44px] uppercase hover:border-j-accent transition-colors"
              >
                {t('quiz.showAnswer', language)}
              </button>
              <button
                onClick={fetchQuestion}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 min-h-[44px] uppercase hover:border-j-accent transition-colors"
              >
                {language === 'es' ? 'Saltar' : 'Skip'}
              </button>
            </div>

            {error && <p className="text-xs text-j-error">{error}</p>}
          </div>
        )}

        {/* Revealed answer (no DeepSeek call) */}
        {phase === 'revealed' && question && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.1em] text-j-accent border border-j-border-input px-2 py-0.5">
                {question.conceptName}
              </span>
            </div>

            <p className="text-sm text-j-text-secondary leading-relaxed">{question.questionText}</p>

            <div className="border border-j-border p-3 bg-[var(--j-bg)]">
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                {t('review.expectedAnswer', language)}
              </p>
              <p className="text-sm text-j-text leading-relaxed">{question.expectedAnswer}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchQuestion}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 min-h-[44px] uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('quiz.another', language)}
              </button>
              <button
                onClick={onClose}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 min-h-[44px] uppercase hover:border-j-accent transition-colors"
              >
                {t('quiz.done', language)}
              </button>
            </div>
          </div>
        )}

        {/* Evaluating */}
        {phase === 'evaluating' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-j-accent animate-spin" />
            <p className="text-sm text-j-text-tertiary">{t('review.evaluating', language)}</p>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-light ${result.isCorrect ? 'text-j-accent' : 'text-j-error'}`}>
                {result.score}%
              </span>
              <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${result.isCorrect ? 'text-j-accent' : 'text-j-error'}`}>
                {result.isCorrect ? t('review.correct', language) : t('review.incorrect', language)}
              </span>
            </div>

            <p className="text-sm text-j-text-secondary leading-relaxed">{result.feedback}</p>

            {!result.isCorrect && (
              <div className="border border-j-border p-3 bg-[var(--j-bg)]">
                <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                  {t('review.expectedAnswer', language)}
                </p>
                <p className="text-sm text-j-text">{result.expectedAnswer}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={fetchQuestion}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 min-h-[44px] uppercase hover:bg-j-accent-hover transition-colors"
              >
                {t('quiz.another', language)}
              </button>
              <button
                onClick={onClose}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 min-h-[44px] uppercase hover:border-j-accent transition-colors"
              >
                {t('quiz.done', language)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
