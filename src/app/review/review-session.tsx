'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { t, type Language } from '@/lib/translations';
import type { ReviewCard, ReviewSubmitResponse } from '@/types';

type SessionPhase = 'start' | 'card' | 'feedback' | 'summary';

interface ReviewSessionProps {
  dueCount: number;
  totalCards: number;
  language: Language;
}

interface CompletedCard {
  card: ReviewCard;
  result: ReviewSubmitResponse;
}

export function ReviewSession({ dueCount, totalCards, language }: ReviewSessionProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionPhase>('start');
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ReviewSubmitResponse | null>(null);
  const [completed, setCompleted] = useState<CompletedCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/review/due');
      if (!response.ok) throw new Error('Failed to fetch cards');
      const data = await response.json();

      if (data.cards.length === 0) {
        setError(t('review.noPending', language));
        return;
      }

      setCards(data.cards);
      setCurrentIndex(0);
      setPhase('card');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const submitAnswer = useCallback(async () => {
    if (!answer.trim() || !cards[currentIndex]) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: cards[currentIndex].questionId,
          userAnswer: answer.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');
      const result: ReviewSubmitResponse = await response.json();

      setCurrentResult(result);
      setCompleted((prev) => [...prev, { card: cards[currentIndex], result }]);
      setPhase('feedback');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [answer, cards, currentIndex]);

  const nextCard = useCallback(() => {
    setAnswer('');
    setCurrentResult(null);

    if (currentIndex + 1 >= cards.length) {
      setPhase('summary');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPhase('card');
    }
  }, [currentIndex, cards.length]);

  const difficultyLabel = (d: number) => {
    const labels = { 1: '●', 2: '●●', 3: '●●●' };
    return labels[d as keyof typeof labels] || '●';
  };

  // Start screen
  if (phase === 'start') {
    return (
      <div className="text-center py-16">
        {dueCount > 0 ? (
          <>
            <p className="text-6xl font-light text-[#4a5d4a] mb-4">{dueCount}</p>
            <p className="text-[#7a7a6e] mb-2">{t('review.pendingCards', language)}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-8">
              {totalCards} total
            </p>
            <button
              onClick={startSession}
              disabled={isLoading}
              className="font-mono text-sm tracking-[0.1em] bg-[#4a5d4a] text-[#f5f4f0] px-8 py-3 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
            >
              {isLoading ? t('common.loading', language) : t('review.startReview', language)}
            </button>
          </>
        ) : (
          <>
            <p className="text-2xl font-light text-[#4a5d4a] mb-4">✓</p>
            <p className="text-[#7a7a6e]">{t('review.noPending', language)}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-8 font-mono text-[11px] tracking-[0.15em] text-[#7a7a6e] uppercase hover:text-[#4a5d4a] transition-colors"
            >
              {t('review.backToDashboard', language)}
            </button>
          </>
        )}
        {error && <p className="mt-4 text-sm text-[#7d6b6b]">{error}</p>}
      </div>
    );
  }

  // Card display
  if (phase === 'card') {
    const card = cards[currentIndex];
    return (
      <div>
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
            {currentIndex + 1} {t('review.cardOf', language)} {cards.length}
          </span>
          <div className="flex-1 mx-4 h-px bg-[#e8e6e0] relative">
            <div
              className="absolute left-0 top-0 h-full bg-[#4a5d4a] transition-all duration-300"
              style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e]">
            {difficultyLabel(card.difficulty)}
          </span>
        </div>

        {/* Concept tag */}
        <div className="mb-6">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#4a5d4a] uppercase border border-[#4a5d4a] px-2 py-1">
            {card.conceptName}
          </span>
          {card.streak > 0 && (
            <span className="ml-3 font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e]">
              {t('review.streak', language)}: {card.streak}
            </span>
          )}
        </div>

        {/* Question */}
        <div className="mb-8 p-6 bg-white border border-[#e8e6e0]">
          <p className="text-lg text-[#2c2c2c] leading-relaxed">{card.questionText}</p>
        </div>

        {/* Answer input */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('review.answerPlaceholder', language)}
          rows={4}
          className="w-full p-4 border border-[#e8e6e0] bg-white text-[#2c2c2c] placeholder-[#c4c2b8] font-mono text-sm focus:outline-none focus:border-[#4a5d4a] transition-colors resize-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && answer.trim()) {
              submitAnswer();
            }
          }}
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={submitAnswer}
            disabled={!answer.trim() || isLoading}
            className="font-mono text-sm tracking-[0.1em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
          >
            {isLoading ? t('review.evaluating', language) : t('review.verify', language)}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-[#7d6b6b]">{error}</p>}
      </div>
    );
  }

  // Feedback display
  if (phase === 'feedback' && currentResult) {
    const isLast = currentIndex + 1 >= cards.length;
    return (
      <div>
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
            {currentIndex + 1} {t('review.cardOf', language)} {cards.length}
          </span>
          <div className="flex-1 mx-4 h-px bg-[#e8e6e0] relative">
            <div
              className="absolute left-0 top-0 h-full bg-[#4a5d4a] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Score badge */}
        <div className="text-center mb-8">
          <span className={`text-5xl font-light ${
            currentResult.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'
          }`}>
            {currentResult.score}
          </span>
          <span className="text-[#9c9a8e] text-lg">%</span>
          <p className={`mt-2 font-mono text-[10px] tracking-[0.2em] uppercase ${
            currentResult.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'
          }`}>
            {currentResult.isCorrect ? t('review.correct', language) : t('review.incorrect', language)}
          </p>
        </div>

        {/* Feedback */}
        <div className="space-y-4 mb-8">
          <div className="p-4 bg-white border border-[#e8e6e0]">
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-2">
              Feedback
            </p>
            <p className="text-sm text-[#2c2c2c] leading-relaxed">{currentResult.feedback}</p>
          </div>

          {!currentResult.isCorrect && (
            <div className="p-4 bg-[#f8f7f4] border border-[#e8e6e0]">
              <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-2">
                {t('review.expectedAnswer', language)}
              </p>
              <p className="text-sm text-[#2c2c2c] leading-relaxed">{currentResult.expectedAnswer}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-[#9c9a8e]">
            <span className="font-mono">
              {t('review.nextReview', language)}: {currentResult.intervalDays}d
            </span>
            <span className="font-mono uppercase">{currentResult.rating}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={nextCard}
            className="font-mono text-sm tracking-[0.1em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
          >
            {isLast ? t('review.finish', language) : t('review.next', language)}
          </button>
        </div>
      </div>
    );
  }

  // Summary screen
  if (phase === 'summary') {
    const correctCount = completed.filter((c) => c.result.isCorrect).length;
    const incorrectCount = completed.length - correctCount;

    return (
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-[#2c2c2c] mb-2">
          {t('review.sessionComplete', language)}
        </h2>

        <div className="grid grid-cols-2 gap-8 max-w-xs mx-auto my-12">
          <div>
            <p className="text-4xl font-light text-[#4a5d4a]">{correctCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('review.correctCount', language)}
            </p>
          </div>
          <div>
            <p className="text-4xl font-light text-[#7d6b6b]">{incorrectCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('review.incorrectCount', language)}
            </p>
          </div>
        </div>

        {/* Per-card results */}
        <div className="text-left max-w-md mx-auto mb-12">
          {completed.map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#e8e6e0]">
              <span className={`text-sm ${c.result.isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'}`}>
                {c.result.isCorrect ? '✓' : '✗'}
              </span>
              <span className="text-sm text-[#2c2c2c] flex-1 truncate">
                {c.card.conceptName}
              </span>
              <span className="font-mono text-xs text-[#9c9a8e]">
                {c.result.score}% · {c.result.intervalDays}d
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="font-mono text-[11px] tracking-[0.15em] text-[#7a7a6e] uppercase hover:text-[#2c2c2c] transition-colors px-4 py-2"
          >
            {t('review.backToDashboard', language)}
          </button>
          <button
            onClick={() => router.refresh()}
            className="font-mono text-sm tracking-[0.1em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
          >
            {t('review.startReview', language)}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
