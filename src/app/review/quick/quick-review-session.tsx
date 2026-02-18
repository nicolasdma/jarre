'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CardRouter } from '@/components/review/card-router';
import { ErrorMessage } from '@/components/error-message';
import { categorizeError } from '@/lib/utils/categorize-error';
import type { Language } from '@/lib/translations';
import type { UnifiedReviewCard, ReviewSubmitResponse } from '@/types';

interface QuickReviewSessionProps {
  language: Language;
}

interface CompletedCard {
  card: UnifiedReviewCard;
  result: ReviewSubmitResponse;
}

export function QuickReviewSession({ language }: QuickReviewSessionProps) {
  const router = useRouter();
  const [cards, setCards] = useState<UnifiedReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState<CompletedCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'card' | 'summary'>('loading');

  // Fetch cards on mount
  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch('/api/review/quick?count=10');
        if (!response.ok) throw new Error('Failed to fetch cards');
        const data = await response.json();

        if (data.cards.length === 0) {
          setError(language === 'es'
            ? 'No hay conceptos desbloqueados para repasar'
            : 'No unlocked concepts to review');
          setPhase('summary');
          return;
        }

        setCards(data.cards);
        setPhase('card');
      } catch (err) {
        const categorized = categorizeError(err);
        setError(categorized.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCards();
  }, [language]);

  const handleRate = useCallback(async (rating: 'wrong' | 'hard' | 'good' | 'easy') => {
    const card = cards[currentIndex];
    if (!card) return;

    setIsSubmitting(true);
    try {
      const body = card.source === 'card'
        ? { cardId: card.sourceId, selfRating: rating }
        : { questionId: card.sourceId, userAnswer: rating }; // fallback

      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to submit');
      const result = await response.json();

      setCompleted(prev => [...prev, { card, result }]);

      if (currentIndex + 1 >= cards.length) {
        setPhase('summary');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      const categorized = categorizeError(err);
      setError(categorized.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [cards, currentIndex]);

  const handleSubmitDeterministic = useCallback(async (answer: string) => {
    const card = cards[currentIndex];
    if (!card) return;

    setIsSubmitting(true);
    try {
      const body = card.source === 'card'
        ? { cardId: card.sourceId, selectedAnswer: answer }
        : { questionId: card.sourceId, selectedAnswer: answer };

      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to submit');
      const result = await response.json();

      setCompleted(prev => [...prev, { card, result }]);

      if (currentIndex + 1 >= cards.length) {
        setPhase('summary');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      const categorized = categorizeError(err);
      setError(categorized.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [cards, currentIndex]);

  const handleSubmitOpen = useCallback(async (answer: string) => {
    const card = cards[currentIndex];
    if (!card) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: card.sourceId, userAnswer: answer }),
      });

      if (!response.ok) throw new Error('Failed to submit');
      const result = await response.json();

      setCompleted(prev => [...prev, { card, result }]);

      if (currentIndex + 1 >= cards.length) {
        setPhase('summary');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      const categorized = categorizeError(err);
      setError(categorized.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [cards, currentIndex]);

  if (phase === 'loading' || isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-j-text-secondary animate-pulse">
          {language === 'es' ? 'Cargando tarjetas...' : 'Loading cards...'}
        </p>
      </div>
    );
  }

  if (phase === 'summary') {
    const correctCount = completed.filter(c => c.result.isCorrect).length;
    return (
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-j-text mb-2">
          {language === 'es' ? 'Repaso completado' : 'Review complete'}
        </h2>
        <div className="grid grid-cols-2 gap-8 max-w-xs mx-auto my-12">
          <div>
            <p className="text-4xl font-light text-j-accent">{correctCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {language === 'es' ? 'Correctas' : 'Correct'}
            </p>
          </div>
          <div>
            <p className="text-4xl font-light text-j-error">{completed.length - correctCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {language === 'es' ? 'Incorrectas' : 'Incorrect'}
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="font-mono text-[11px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-text transition-colors px-4 py-2"
          >
            {language === 'es' ? 'Dashboard' : 'Dashboard'}
          </button>
          <button
            onClick={() => router.refresh()}
            className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
          >
            {language === 'es' ? 'Otra ronda' : 'Another round'}
          </button>
        </div>
        {error && <div className="mt-4"><ErrorMessage message={error} variant="block" /></div>}
      </div>
    );
  }

  const card = cards[currentIndex];
  if (!card) return null;

  // Default intervals for FSRS preview (approximate)
  const defaultIntervals = { again: 1, hard: 3, good: 8, easy: 15 };

  return (
    <div>
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-8">
        <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
          {currentIndex + 1} / {cards.length}
        </span>
        <div className="flex-1 mx-4 h-px bg-j-border relative">
          <div
            className="absolute left-0 top-0 h-full bg-j-accent transition-all duration-300"
            style={{ width: `${(currentIndex / cards.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase border border-j-accent px-2 py-1">
          {card.conceptName}
        </span>
      </div>

      <CardRouter
        card={card}
        intervals={defaultIntervals}
        onRate={handleRate}
        onSubmitDeterministic={handleSubmitDeterministic}
        onSubmitOpen={handleSubmitOpen}
        isSubmitting={isSubmitting}
      />

      {error && <div className="mt-4"><ErrorMessage message={error} variant="block" /></div>}
    </div>
  );
}
