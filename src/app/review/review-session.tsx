'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewPrediction } from '@/components/review-prediction';
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

// ============================================================================
// Dimension Dots Component
// ============================================================================

/**
 * Dimension score dots: 0=○○, 1=●○, 2=●●
 * Each dimension shows its key name + 2 dots representing 0-2 score.
 */
function DimensionDots({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(scores).map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary uppercase w-24 text-right">
            {key}
          </span>
          <div className="flex gap-0.5">
            {[0, 1].map((dotIndex) => (
              <span
                key={dotIndex}
                className={`text-sm ${dotIndex < value ? 'text-j-accent' : 'text-j-border-input'}`}
              >
                {dotIndex < value ? '●' : '○'}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact dots for summary rows: 2 dots per dimension */
function CompactDimensionDots({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="flex gap-1.5">
      {Object.values(scores).map((value, i) => (
        <span key={i} className="text-[10px]">
          {[0, 1].map((dotIndex) => (
            <span
              key={dotIndex}
              className={dotIndex < value ? 'text-j-accent' : 'text-j-border-input'}
            >
              {dotIndex < value ? '●' : '○'}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

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
  const [showReasoning, setShowReasoning] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);

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
      setShowReasoning(false);
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
    setShowReasoning(false);

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
            <p className="text-6xl font-light text-j-accent mb-4">{dueCount}</p>
            <p className="text-j-text-secondary mb-2">{t('review.pendingCards', language)}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-8">
              {totalCards} total
            </p>

            {/* Metacognitive prediction before starting */}
            <div className="max-w-md mx-auto mb-8">
              <ReviewPrediction
                language={language}
                totalQuestions={dueCount}
                onPredict={setPrediction}
                initialPrediction={prediction ?? undefined}
              />
            </div>

            <button
              onClick={startSession}
              disabled={isLoading}
              className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-8 py-3 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
            >
              {isLoading ? t('common.loading', language) : t('review.startReview', language)}
            </button>
          </>
        ) : (
          <>
            <p className="text-2xl font-light text-j-accent mb-4">✓</p>
            <p className="text-j-text-secondary">{t('review.noPending', language)}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-8 font-mono text-[11px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-accent transition-colors"
            >
              {t('review.backToDashboard', language)}
            </button>
          </>
        )}
        {error && <p className="mt-4 text-sm text-j-error">{error}</p>}
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
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            {currentIndex + 1} {t('review.cardOf', language)} {cards.length}
          </span>
          <div className="flex-1 mx-4 h-px bg-j-border relative">
            <div
              className="absolute left-0 top-0 h-full bg-j-accent transition-all duration-300"
              style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary">
            {difficultyLabel(card.difficulty)}
          </span>
        </div>

        {/* Concept tag */}
        <div className="mb-6">
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase border border-j-accent px-2 py-1">
            {card.conceptName}
          </span>
          {card.streak > 0 && (
            <span className="ml-3 font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary">
              {t('review.streak', language)}: {card.streak}
            </span>
          )}
        </div>

        {/* Question */}
        <div className="mb-8 p-6 bg-white border border-j-border">
          <p className="text-lg text-j-text leading-relaxed">{card.questionText}</p>
        </div>

        {/* Answer input */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('review.answerPlaceholder', language)}
          rows={4}
          className="w-full p-4 border border-j-border bg-white text-j-text placeholder-[#c4c2b8] font-mono text-sm focus:outline-none focus:border-j-accent transition-colors resize-none"
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
            className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? t('review.evaluating', language) : t('review.verify', language)}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-j-error">{error}</p>}
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
          <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
            {currentIndex + 1} {t('review.cardOf', language)} {cards.length}
          </span>
          <div className="flex-1 mx-4 h-px bg-j-border relative">
            <div
              className="absolute left-0 top-0 h-full bg-j-accent transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Dimension scores or fallback score */}
        <div className="text-center mb-8">
          {currentResult.dimensionScores ? (
            <div className="inline-flex flex-col items-center gap-4">
              <DimensionDots scores={currentResult.dimensionScores} />
              <p className={`font-mono text-[10px] tracking-[0.2em] uppercase ${
                currentResult.isCorrect ? 'text-j-accent' : 'text-j-error'
              }`}>
                {currentResult.isCorrect ? t('review.correct', language) : t('review.incorrect', language)}
              </p>
            </div>
          ) : (
            <>
              <span className={`text-5xl font-light ${
                currentResult.isCorrect ? 'text-j-accent' : 'text-j-error'
              }`}>
                {currentResult.score}
              </span>
              <span className="text-j-text-tertiary text-lg">%</span>
              <p className={`mt-2 font-mono text-[10px] tracking-[0.2em] uppercase ${
                currentResult.isCorrect ? 'text-j-accent' : 'text-j-error'
              }`}>
                {currentResult.isCorrect ? t('review.correct', language) : t('review.incorrect', language)}
              </p>
            </>
          )}
        </div>

        {/* Feedback */}
        <div className="space-y-4 mb-8">
          <div className="p-4 bg-white border border-j-border">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
              Feedback
            </p>
            <p className="text-sm text-j-text leading-relaxed">{currentResult.feedback}</p>
          </div>

          {/* Collapsible reasoning */}
          {currentResult.reasoning && (
            <div className="border border-j-border">
              <button
                type="button"
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-j-bg-hover transition-colors"
              >
                <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
                  {t('review.showAnalysis', language)}
                </span>
                <span className="text-j-text-tertiary text-xs">{showReasoning ? '−' : '+'}</span>
              </button>
              {showReasoning && (
                <div className="px-3 pb-3 border-t border-j-border">
                  <p className="text-xs text-j-text-secondary leading-relaxed mt-2 whitespace-pre-wrap">
                    {currentResult.reasoning}
                  </p>
                </div>
              )}
            </div>
          )}

          {!currentResult.isCorrect && (
            <div className="p-4 bg-j-bg-hover border border-j-border">
              <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
                {t('review.expectedAnswer', language)}
              </p>
              <p className="text-sm text-j-text leading-relaxed">{currentResult.expectedAnswer}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-j-text-tertiary">
            <span className="font-mono">
              {t('review.nextReview', language)}: {currentResult.intervalDays}d
            </span>
            <span className="font-mono uppercase">{currentResult.rating}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={nextCard}
            className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
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
        <h2 className="text-3xl font-bold text-j-text mb-2">
          {t('review.sessionComplete', language)}
        </h2>

        <div className="grid grid-cols-2 gap-8 max-w-xs mx-auto my-12">
          <div>
            <p className="text-4xl font-light text-j-accent">{correctCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('review.correctCount', language)}
            </p>
          </div>
          <div>
            <p className="text-4xl font-light text-j-error">{incorrectCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('review.incorrectCount', language)}
            </p>
          </div>
        </div>

        {/* Prediction comparison */}
        {prediction != null && (
          <div className="max-w-md mx-auto mb-8">
            <ReviewPrediction
              language={language}
              totalQuestions={completed.length}
              onPredict={() => {}}
              initialPrediction={prediction}
              actualCorrect={correctCount}
            />
          </div>
        )}

        {/* Per-card results */}
        <div className="text-left max-w-md mx-auto mb-12">
          {completed.map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-j-border">
              <span className={`text-sm ${c.result.isCorrect ? 'text-j-accent' : 'text-j-error'}`}>
                {c.result.isCorrect ? '✓' : '✗'}
              </span>
              <span className="text-sm text-j-text flex-1 truncate">
                {c.card.conceptName}
              </span>
              {c.result.dimensionScores ? (
                <CompactDimensionDots scores={c.result.dimensionScores} />
              ) : (
                <span className="font-mono text-xs text-j-text-tertiary">
                  {c.result.score}%
                </span>
              )}
              <span className="font-mono text-xs text-j-text-tertiary">
                {c.result.intervalDays}d
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="font-mono text-[11px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-text transition-colors px-4 py-2"
          >
            {t('review.backToDashboard', language)}
          </button>
          <button
            onClick={() => router.refresh()}
            className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
          >
            {t('review.startReview', language)}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
