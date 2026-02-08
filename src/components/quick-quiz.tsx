'use client';

import { useState, useCallback } from 'react';
import { t, type Language } from '@/lib/translations';
import type { ReviewSubmitResponse } from '@/types';

interface QuickQuizProps {
  language: Language;
}

type Phase = 'idle' | 'loading' | 'question' | 'evaluating' | 'result';

interface QuestionData {
  questionId: string;
  conceptName: string;
  questionText: string;
  difficulty: number;
}

export function QuickQuiz({ language }: QuickQuizProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
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
      const res = await fetch('/api/review/random');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.details || body.error || 'No questions available');
      }
      const data = await res.json();
      setQuestion(data);
      setPhase('question');
    } catch (err) {
      setError((err as Error).message);
      setPhase('idle');
    }
  }, []);

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

  const handleClose = () => {
    setIsOpen(false);
    setPhase('idle');
    setQuestion(null);
    setAnswer('');
    setResult(null);
    setError(null);
  };

  // Floating bubble (collapsed)
  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); fetchQuestion(); }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#4a5d4a] text-[#f5f4f0] flex items-center justify-center hover:bg-[#3d4d3d] transition-all hover:scale-105 shadow-lg"
        title={t('quiz.start', language)}
      >
        <span className="font-mono text-lg">?</span>
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[70vh] bg-[#faf9f6] border border-[#d4d0c8] shadow-xl flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e6e0]">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
          {t('quiz.title', language)}
        </span>
        <button
          onClick={handleClose}
          className="text-[#9c9a8e] hover:text-[#2c2c2c] transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Panel content */}
      <div className="p-4 overflow-y-auto flex-1">
        {/* Loading */}
        {phase === 'loading' && (
          <p className="text-sm text-[#9c9a8e]">{t('common.loading', language)}</p>
        )}

        {/* Idle with error */}
        {phase === 'idle' && (
          <div>
            <button
              onClick={fetchQuestion}
              className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors"
            >
              {t('quiz.start', language)}
            </button>
            {error && <p className="mt-3 text-xs text-[#7d6b6b]">{error}</p>}
          </div>
        )}

        {/* Question */}
        {phase === 'question' && question && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.1em] text-[#4a5d4a] border border-[#d4d0c8] px-2 py-0.5">
                {question.conceptName}
              </span>
              <span className="text-[10px] text-[#9c9a8e]">
                {'●'.repeat(question.difficulty)}
              </span>
            </div>

            <p className="text-sm text-[#2c2c2c] leading-relaxed">{question.questionText}</p>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t('review.answerPlaceholder', language)}
              rows={3}
              className="w-full border border-[#d4d0c8] bg-white p-3 text-sm text-[#2c2c2c] placeholder-[#9c9a8e] focus:outline-none focus:border-[#4a5d4a] resize-none"
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
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
              >
                {t('review.verify', language)}
              </button>
              <button
                onClick={() => fetchQuestion()}
                className="font-mono text-[10px] tracking-[0.15em] border border-[#d4d0c8] text-[#7a7a6e] px-3 py-2 uppercase hover:border-[#4a5d4a] transition-colors"
              >
                {language === 'es' ? 'Saltar' : 'Skip'}
              </button>
            </div>

            {error && <p className="text-xs text-[#7d6b6b]">{error}</p>}
          </div>
        )}

        {/* Evaluating */}
        {phase === 'evaluating' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-[#4a5d4a] animate-spin" />
            <p className="text-sm text-[#9c9a8e]">{t('review.evaluating', language)}</p>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-light ${result.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'}`}>
                {result.score}%
              </span>
              <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${result.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'}`}>
                {result.isCorrect ? t('review.correct', language) : t('review.incorrect', language)}
              </span>
            </div>

            <p className="text-sm text-[#7a7a6e] leading-relaxed">{result.feedback}</p>

            {!result.isCorrect && (
              <div className="border border-[#e8e6e0] p-3 bg-white">
                <p className="font-mono text-[9px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-1">
                  {t('review.expectedAnswer', language)}
                </p>
                <p className="text-sm text-[#2c2c2c]">{result.expectedAnswer}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={fetchQuestion}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('quiz.another', language)}
              </button>
              <button
                onClick={handleClose}
                className="font-mono text-[10px] tracking-[0.15em] border border-[#d4d0c8] text-[#7a7a6e] px-3 py-2 uppercase hover:border-[#4a5d4a] transition-colors"
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
