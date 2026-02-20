'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { InlineQuiz } from '@/components/inline-quiz';
import { ReviewPrediction } from '@/components/review-prediction';
import { ErrorMessage } from '@/components/error-message';
import { CornerBrackets } from '@/components/ui/corner-brackets';
import { categorizeError } from '@/lib/utils/categorize-error';
import { t, type Language } from '@/lib/translations';
import type { UnifiedReviewCard, ReviewSubmitResponse } from '@/types';

type SessionPhase = 'start' | 'card' | 'feedback' | 'summary';

interface ReviewSessionProps {
  dueCount: number;
  totalCards: number;
  language: Language;
  reviewedToday: number;
}

interface CompletedCard {
  card: UnifiedReviewCard;
  result: ReviewSubmitResponse;
}

// ============================================================================
// Dimension Dots Component
// ============================================================================

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

function CompactDimensionDots({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="flex gap-1.5">
      {Object.entries(scores).map(([dimension, value]) => (
        <span key={dimension} className="text-[10px]">
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
// Format Badge
// ============================================================================

function FormatBadge({ format }: { format: string }) {
  const labels: Record<string, string> = {
    mc: 'Opcion multiple',
    tf: 'Verdadero/Falso',
    recall: 'Recall',
    fill_blank: 'Fill Blank',
    true_false: 'V/F',
    connect: 'Conexion',
    scenario_micro: 'Escenario',
  };
  const label = labels[format];
  if (!label) return null;
  return (
    <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 border border-j-warm text-j-warm">
      {label}
    </span>
  );
}

// ============================================================================
// Self-Rating Bar (FSRS: Again/Hard/Good/Easy)
// ============================================================================

function SelfRatingBar({
  onRate,
  disabled,
}: {
  onRate: (rating: 'wrong' | 'hard' | 'good' | 'easy') => void;
  disabled: boolean;
}) {
  const buttons = [
    { rating: 'wrong' as const, label: 'Again', color: 'text-j-error border-j-error hover:bg-j-error/10' },
    { rating: 'hard' as const, label: 'Hard', color: 'text-j-warm border-j-warm hover:bg-j-warm/10' },
    { rating: 'good' as const, label: 'Good', color: 'text-j-accent border-j-accent hover:bg-j-accent/10' },
    { rating: 'easy' as const, label: 'Easy', color: 'text-green-600 border-green-600 hover:bg-green-600/10' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 justify-center">
      {buttons.map((btn) => (
        <button
          key={btn.rating}
          onClick={() => onRate(btn.rating)}
          disabled={disabled}
          className={`font-mono text-[11px] tracking-[0.1em] uppercase px-3 sm:px-4 py-2.5 sm:py-2 border min-h-[44px] ${btn.color} transition-colors disabled:opacity-50`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ReviewSession({ dueCount, totalCards, language, reviewedToday }: ReviewSessionProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionPhase>('start');
  const [cards, setCards] = useState<UnifiedReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ReviewSubmitResponse | null>(null);
  const [completed, setCompleted] = useState<CompletedCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorAction, setErrorAction] = useState<'retry' | 'relogin' | 'wait' | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const pendingAnswerRef = useRef<{
    type: 'open'; answer: string
  } | {
    type: 'closed'; quizId: string; selectedOption: string; isCorrect: boolean
  } | {
    type: 'selfRating'; rating: 'wrong' | 'hard' | 'good' | 'easy'
  } | {
    type: 'deterministic'; answer: string
  } | null>(null);

  const handleCategorizedError = (err: unknown) => {
    const categorized = categorizeError(err);
    setError(categorized.message);
    setErrorAction(categorized.action);
  };

  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorAction(null);
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
      handleCategorizedError(err);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // Submit for question_bank open-ended answer
  const submitOpenAnswer = useCallback(async () => {
    if (!answer.trim() || !cards[currentIndex]) return;

    setIsLoading(true);
    setError(null);
    setErrorAction(null);
    pendingAnswerRef.current = { type: 'open', answer: answer.trim() };

    try {
      const card = cards[currentIndex];
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: card.sourceId,
          userAnswer: answer.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');
      const result: ReviewSubmitResponse = await response.json();

      setCurrentResult(result);
      setCompleted((prev) => [...prev, { card, result }]);
      setShowReasoning(false);
      setPhase('feedback');
      pendingAnswerRef.current = null;

      toast.success(language === 'es' ? 'Respuesta registrada' : 'Answer recorded');

      const newCount = completed.length + 1;
      if (newCount > 0 && newCount % 5 === 0 && newCount < cards.length) {
        toast(`${newCount} de ${cards.length} completadas — buen ritmo`);
      }
    } catch (err) {
      handleCategorizedError(err);
    } finally {
      setIsLoading(false);
    }
  }, [answer, cards, currentIndex, completed.length, language]);

  // Submit MC/TF answer (question_bank)
  const submitClosedAnswer = useCallback(async (
    quizId: string,
    selectedOption: string,
    isCorrect: boolean,
  ) => {
    const card = cards[currentIndex];
    if (!card) return;

    setIsLoading(true);
    setError(null);
    setErrorAction(null);
    pendingAnswerRef.current = { type: 'closed', quizId, selectedOption, isCorrect };

    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: card.sourceId,
          selectedAnswer: selectedOption,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');
      const result: ReviewSubmitResponse = await response.json();
      const finalResult = { ...result, isCorrect };

      setCurrentResult(finalResult);
      setCompleted((prev) => [...prev, { card, result: finalResult }]);
      setShowReasoning(false);
      setPhase('feedback');
      pendingAnswerRef.current = null;

      toast.success(language === 'es' ? 'Respuesta registrada' : 'Answer recorded');

      const newCount = completed.length + 1;
      if (newCount > 0 && newCount % 5 === 0 && newCount < cards.length) {
        toast(`${newCount} de ${cards.length} completadas — buen ritmo`);
      }
    } catch (err) {
      handleCategorizedError(err);
    } finally {
      setIsLoading(false);
    }
  }, [cards, currentIndex, completed.length, language]);

  // Submit self-rating for concept cards (recall, connect)
  const submitSelfRating = useCallback(async (rating: 'wrong' | 'hard' | 'good' | 'easy') => {
    const card = cards[currentIndex];
    if (!card) return;

    setIsLoading(true);
    setError(null);
    pendingAnswerRef.current = { type: 'selfRating', rating };

    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.sourceId,
          selfRating: rating,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit rating');
      const result: ReviewSubmitResponse = await response.json();

      setCurrentResult(result);
      setCompleted((prev) => [...prev, { card, result }]);
      setPhase('feedback');
      pendingAnswerRef.current = null;
    } catch (err) {
      handleCategorizedError(err);
    } finally {
      setIsLoading(false);
    }
  }, [cards, currentIndex]);

  // Submit deterministic answer for concept cards (true_false, fill_blank, scenario_micro)
  const submitDeterministicAnswer = useCallback(async (selectedAnswer: string) => {
    const card = cards[currentIndex];
    if (!card) return;

    setIsLoading(true);
    setError(null);
    pendingAnswerRef.current = { type: 'deterministic', answer: selectedAnswer };

    try {
      const response = await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.sourceId,
          selectedAnswer,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit');
      const result: ReviewSubmitResponse = await response.json();

      setCurrentResult(result);
      setCompleted((prev) => [...prev, { card, result }]);
      setPhase('feedback');
      pendingAnswerRef.current = null;
    } catch (err) {
      handleCategorizedError(err);
    } finally {
      setIsLoading(false);
    }
  }, [cards, currentIndex]);

  const retrySubmit = useCallback(async () => {
    const pending = pendingAnswerRef.current;
    if (!pending) return;

    if (pending.type === 'open') {
      setAnswer(pending.answer);
      await submitOpenAnswer();
    } else if (pending.type === 'closed') {
      await submitClosedAnswer(pending.quizId, pending.selectedOption, pending.isCorrect);
    } else if (pending.type === 'selfRating') {
      await submitSelfRating(pending.rating);
    } else if (pending.type === 'deterministic') {
      await submitDeterministicAnswer(pending.answer);
    }
  }, [submitOpenAnswer, submitClosedAnswer, submitSelfRating, submitDeterministicAnswer]);

  const nextCard = useCallback(() => {
    setAnswer('');
    setCurrentResult(null);
    setShowReasoning(false);
    setError(null);
    setErrorAction(null);
    setIsFlipped(false);

    if (currentIndex + 1 >= cards.length) {
      setPhase('summary');
      toast.success(language === 'es'
        ? 'Sesion de repaso completada — buen trabajo!'
        : 'Review session completed — good job!');
    } else {
      setCurrentIndex((prev) => prev + 1);
      setPhase('card');
    }
  }, [currentIndex, cards.length, language]);

  const difficultyLabel = (d: number) => {
    const labels = { 1: '●', 2: '●●', 3: '●●●' };
    return labels[d as keyof typeof labels] || '●';
  };

  // ==== START SCREEN ====
  if (phase === 'start') {
    return (
      <div className="text-center py-16">
        {dueCount > 0 ? (
          <>
            <motion.p
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
              className="text-6xl font-light text-j-accent mb-4"
            >
              {dueCount}
            </motion.p>
            <p className="text-j-text-secondary mb-2">{t('review.pendingCards', language)}</p>
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-8">
              {totalCards} total
            </p>

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
            {reviewedToday > 0 ? (
              <>
                <p className="text-j-text-secondary">
                  {language === 'es'
                    ? 'Ya completaste tu sesion de hoy. Descansa y vuelve manana.'
                    : 'You completed today\'s session. Rest and come back tomorrow.'}
                </p>
                <p className="mt-2 font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
                  {reviewedToday} {language === 'es' ? 'tarjetas revisadas hoy' : 'cards reviewed today'}
                </p>
              </>
            ) : (
              <p className="text-j-text-secondary">
                {language === 'es'
                  ? 'Aun no tienes tarjetas de repaso. Completa evaluaciones para generar tarjetas.'
                  : 'You don\'t have review cards yet. Complete evaluations to generate cards.'}
              </p>
            )}
            <button
              onClick={() => router.push('/')}
              className="mt-8 font-mono text-[11px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-accent transition-colors"
            >
              {t('review.backToDashboard', language)}
            </button>
          </>
        )}
        {error && (
          <div className="mt-4 max-w-md mx-auto">
            <ErrorMessage
              message={error}
              variant="block"
              onRetry={errorAction !== 'relogin' ? startSession : undefined}
            />
          </div>
        )}
      </div>
    );
  }

  // ==== CARD DISPLAY ====
  if (phase === 'card') {
    const card = cards[currentIndex];
    const isQuestionSource = card.source === 'question';
    const isQuestionClosed = isQuestionSource && (card.format === 'mc' || card.format === 'tf');
    const isQuestionOpen = isQuestionSource && card.format === 'open';

    // Concept card types
    const isRecall = card.source === 'card' && card.cardType === 'recall';
    const isConnect = card.source === 'card' && card.cardType === 'connect';
    const isTrueFalse = card.source === 'card' && card.cardType === 'true_false';
    const isFillBlank = card.source === 'card' && card.cardType === 'fill_blank';
    const isScenarioMicro = card.source === 'card' && card.cardType === 'scenario_micro';
    const isSelfRated = isRecall || isConnect;

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
          <div className="flex items-center gap-2">
            <FormatBadge format={card.format} />
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary">
              {difficultyLabel(card.difficulty)}
            </span>
          </div>
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

        {/* ---- Question Bank: MC/TF ---- */}
        {isQuestionClosed && (
          <div className="mb-4">
            <InlineQuiz
              quiz={{
                id: card.sourceId,
                format: card.format as 'mc' | 'tf',
                questionText: (card.content as { questionText: string }).questionText,
                options: card.options || null,
                correctAnswer: card.correctAnswer || '',
                explanation: card.explanation || '',
              }}
              onAnswer={submitClosedAnswer}
            />
            {isLoading && (
              <p className="mt-2 text-sm text-j-text-tertiary font-mono animate-pulse">
                {t('common.loading', language)}
              </p>
            )}
          </div>
        )}

        {/* ---- Question Bank: Open ---- */}
        {isQuestionOpen && (
          <>
            <div className="mb-8 p-6 bg-white border border-j-border dark:bg-j-bg-alt">
              <p className="text-lg text-j-text leading-relaxed">
                {(card.content as { questionText: string }).questionText}
              </p>
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t('review.answerPlaceholder', language)}
              rows={4}
              className="w-full p-4 border border-j-border bg-white dark:bg-j-bg-alt text-j-text placeholder-[#c4c2b8] font-mono text-sm focus:outline-none focus:border-j-accent transition-colors resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey && answer.trim()) {
                  submitOpenAnswer();
                }
              }}
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={submitOpenAnswer}
                disabled={!answer.trim() || isLoading}
                className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? t('review.evaluating', language) : t('review.verify', language)}
              </button>
            </div>
          </>
        )}

        {/* ---- Concept Card: Recall / Connect (flip + self-rate) ---- */}
        {isSelfRated && (
          <div>
            {!isFlipped ? (
              <div className="mb-8 p-6 bg-white border border-j-border dark:bg-j-bg-alt">
                {isRecall && (
                  <p className="text-lg text-j-text leading-relaxed">
                    {(card.content as { prompt: string }).prompt}
                  </p>
                )}
                {isConnect && (
                  <>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <span className="px-3 py-1 border border-j-accent text-j-accent font-mono text-sm">
                        {(card.content as { conceptA: string }).conceptA}
                      </span>
                      <span className="text-j-text-tertiary text-2xl">?</span>
                      <span className="px-3 py-1 border border-j-accent text-j-accent font-mono text-sm">
                        {(card.content as { conceptB: string }).conceptB}
                      </span>
                    </div>
                    <p className="text-lg text-j-text leading-relaxed text-center">
                      {(card.content as { prompt: string }).prompt}
                    </p>
                  </>
                )}

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="font-mono text-sm tracking-[0.1em] border border-j-border text-j-text-secondary px-6 py-2.5 uppercase hover:border-j-accent hover:text-j-accent transition-colors"
                  >
                    {language === 'es' ? 'Ver respuesta' : 'Show answer'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 p-6 bg-j-bg-hover border border-j-border">
                  {card.back && (
                    <>
                      {(card.back as { definition?: string }).definition && (
                        <p className="text-j-text leading-relaxed mb-3">
                          {(card.back as { definition: string }).definition}
                        </p>
                      )}
                      {(card.back as { keyPoints?: string[] }).keyPoints && (
                        <ul className="list-disc list-inside text-sm text-j-text-secondary space-y-1 mb-3">
                          {((card.back as { keyPoints: string[] }).keyPoints).map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      )}
                      {(card.back as { whyItMatters?: string }).whyItMatters && (
                        <p className="text-xs text-j-text-tertiary italic">
                          {(card.back as { whyItMatters: string }).whyItMatters}
                        </p>
                      )}
                      {(card.back as { connection?: string }).connection && (
                        <p className="text-j-text leading-relaxed">
                          {(card.back as { connection: string }).connection}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase text-center mb-4">
                  {language === 'es' ? 'Como fue tu recall?' : 'How was your recall?'}
                </p>
                <SelfRatingBar onRate={submitSelfRating} disabled={isLoading} />
              </div>
            )}
          </div>
        )}

        {/* ---- Concept Card: True/False ---- */}
        {isTrueFalse && (
          <div>
            <div className="mb-8 p-6 bg-white border border-j-border dark:bg-j-bg-alt">
              <p className="text-lg text-j-text leading-relaxed">
                {(card.content as { statement: string }).statement}
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => submitDeterministicAnswer('true')}
                disabled={isLoading}
                className="font-mono text-sm tracking-[0.1em] border border-green-600 text-green-600 px-8 py-3 uppercase hover:bg-green-600/10 transition-colors disabled:opacity-50"
              >
                {language === 'es' ? 'Verdadero' : 'True'}
              </button>
              <button
                onClick={() => submitDeterministicAnswer('false')}
                disabled={isLoading}
                className="font-mono text-sm tracking-[0.1em] border border-j-error text-j-error px-8 py-3 uppercase hover:bg-j-error/10 transition-colors disabled:opacity-50"
              >
                {language === 'es' ? 'Falso' : 'False'}
              </button>
            </div>
          </div>
        )}

        {/* ---- Concept Card: Fill Blank ---- */}
        {isFillBlank && (
          <div>
            <div className="mb-8 p-6 bg-white border border-j-border dark:bg-j-bg-alt">
              <p className="text-lg text-j-text leading-relaxed">
                {(card.content as { template: string }).template}
              </p>
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={language === 'es' ? 'Escribe las palabras que faltan...' : 'Type the missing words...'}
              rows={2}
              className="w-full p-4 border border-j-border bg-white dark:bg-j-bg-alt text-j-text placeholder-[#c4c2b8] font-mono text-sm focus:outline-none focus:border-j-accent transition-colors resize-none"
              autoFocus
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => submitDeterministicAnswer(answer.trim())}
                disabled={!answer.trim() || isLoading}
                className="font-mono text-sm tracking-[0.1em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
              >
                {isLoading ? t('common.loading', language) : t('review.verify', language)}
              </button>
            </div>
          </div>
        )}

        {/* ---- Concept Card: Scenario Micro (MC) ---- */}
        {isScenarioMicro && (
          <div>
            <div className="mb-6 p-6 bg-white border border-j-border dark:bg-j-bg-alt">
              <p className="text-lg text-j-text leading-relaxed">
                {(card.content as { scenario: string }).scenario}
              </p>
            </div>
            <div className="space-y-2">
              {(card.options || []).map((option) => (
                <button
                  key={option.label}
                  onClick={() => submitDeterministicAnswer(option.label)}
                  disabled={isLoading}
                  className="w-full text-left p-3 border border-j-border hover:border-j-accent transition-colors disabled:opacity-50"
                >
                  <span className="font-mono text-xs text-j-accent mr-2">{option.label}.</span>
                  <span className="text-sm text-j-text">{option.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <ErrorMessage
              message={error}
              variant="block"
              onRetry={errorAction !== 'relogin' ? retrySubmit : undefined}
            />
            {errorAction === 'relogin' && (
              <button
                onClick={() => router.push('/login')}
                className="mt-2 font-mono text-[10px] tracking-[0.15em] text-j-accent underline uppercase"
              >
                {language === 'es' ? 'Iniciar sesion' : 'Log in'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==== FEEDBACK DISPLAY ====
  if (phase === 'feedback' && currentResult) {
    const card = cards[currentIndex];
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

        {/* Score / Result */}
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
              <p className={`text-3xl font-light ${
                currentResult.isCorrect ? 'text-j-accent' : 'text-j-error'
              }`}>
                {currentResult.isCorrect ? '✓' : '✗'}
              </p>
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
          {currentResult.feedback && (
            <div className="p-4 bg-white dark:bg-j-bg-alt border border-j-border">
              <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
                Feedback
              </p>
              <p className="text-sm text-j-text leading-relaxed">{currentResult.feedback}</p>
            </div>
          )}

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

          {!currentResult.isCorrect && currentResult.expectedAnswer && (
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

  // ==== SUMMARY SCREEN ====
  if (phase === 'summary') {
    const correctCount = completed.filter((c) => c.result.isCorrect).length;
    const incorrectCount = completed.length - correctCount;

    return (
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-j-text mb-2">
          {t('review.sessionComplete', language)}
        </h2>

        <div className="relative grid grid-cols-2 gap-4 sm:gap-8 max-w-xs mx-auto my-8 sm:my-12 p-4 sm:p-6">
          <CornerBrackets size="md" className="border-j-border" />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-4xl font-light text-j-accent">{correctCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('review.correctCount', language)}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <p className="text-4xl font-light text-j-error">{incorrectCount}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('review.incorrectCount', language)}
            </p>
          </motion.div>
        </div>

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
            <div key={`${c.card.id}-${i}`} className="flex items-center gap-3 py-2 border-b border-j-border">
              <span className={`text-sm ${c.result.isCorrect ? 'text-j-accent' : 'text-j-error'}`}>
                {c.result.isCorrect ? '✓' : '✗'}
              </span>
              <span className="text-sm text-j-text flex-1 truncate">
                {c.card.conceptName}
              </span>
              <span className="font-mono text-[9px] tracking-[0.1em] text-j-text-tertiary uppercase">
                {c.card.format}
              </span>
              {c.result.dimensionScores ? (
                <CompactDimensionDots scores={c.result.dimensionScores} />
              ) : (
                <span className="font-mono text-xs text-j-text-tertiary">
                  {c.result.isCorrect ? '✓' : '✗'}
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
