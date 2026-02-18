'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnifiedReviewCard } from '@/types';
import { CardRecall } from './card-recall';
import { CardFillBlank } from './card-fill-blank';
import { CardTrueFalse } from './card-true-false';
import { CardConnect } from './card-connect';
import { CardScenarioMicro } from './card-scenario-micro';

// ============================================================================
// Types
// ============================================================================

interface CardRouterProps {
  card: UnifiedReviewCard;
  intervals: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  onRate: (rating: 'wrong' | 'hard' | 'good' | 'easy') => void;
  onSubmitDeterministic: (answer: string) => void;
  onSubmitOpen: (answer: string) => void;
  isSubmitting: boolean;
}

// ============================================================================
// Sub-components for question-bank sources
// ============================================================================

/**
 * Open-ended question: textarea + submit button.
 */
function QuestionOpen({
  card,
  onSubmitOpen,
  isSubmitting,
}: {
  card: UnifiedReviewCard;
  onSubmitOpen: (answer: string) => void;
  isSubmitting: boolean;
}) {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim() || isSubmitting || submitted) return;
    setSubmitted(true);
    onSubmitOpen(answer.trim());
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-6">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        {card.conceptName}
      </p>

      <p className="text-sm text-j-text leading-relaxed mb-5">
        {card.content.question as string ?? card.content.questionText as string ?? ''}
      </p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={submitted || isSubmitting}
        placeholder="Write your answer..."
        rows={4}
        className="w-full border border-j-border-input bg-[var(--j-bg)] p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none disabled:opacity-60 mb-3"
      />

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      )}

      {submitted && (
        <p className="font-mono text-[9px] tracking-[0.15em] text-j-accent uppercase">
          Answer submitted — awaiting evaluation...
        </p>
      )}
    </div>
  );
}

/**
 * Multiple-choice question from question_bank.
 */
function QuestionMC({
  card,
  onSubmitDeterministic,
  isSubmitting,
}: {
  card: UnifiedReviewCard;
  onSubmitDeterministic: (answer: string) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correctAnswer = card.correctAnswer ?? '';
  const isCorrect = answered && selected === correctAnswer;

  const handleSelect = (label: string) => {
    if (answered || isSubmitting) return;
    setSelected(label);
    onSubmitDeterministic(label);
  };

  const getOptionClass = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200 min-h-[44px]';

    if (!answered) {
      return `${base} border-j-border bg-[var(--j-bg)] hover:border-j-warm cursor-pointer`;
    }
    if (label === correctAnswer) {
      return `${base} bg-j-accent-light border-j-accent`;
    }
    if (selected === label && label !== correctAnswer) {
      return `${base} bg-j-error-bg border-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] opacity-50`;
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-6">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        {card.conceptName}
      </p>

      <p className="text-sm text-j-text leading-relaxed mb-5">
        {card.content.question as string ?? card.content.questionText as string ?? ''}
      </p>

      <div className="space-y-2 mb-4">
        {(card.options ?? []).map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleSelect(option.label)}
            disabled={answered || isSubmitting}
            className={getOptionClass(option.label)}
          >
            <span className="font-mono text-[11px] tracking-[0.1em] text-j-text-tertiary flex-shrink-0">
              {option.label}.
            </span>
            <span className="text-sm text-j-text">{option.text}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {answered && card.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`p-4 border ${
                isCorrect
                  ? 'bg-j-success-bg border-j-accent'
                  : 'bg-j-error-bg border-j-error'
              }`}
            >
              <p
                className={`font-mono text-[11px] tracking-[0.15em] uppercase mb-2 ${
                  isCorrect ? 'text-j-accent' : 'text-j-error'
                }`}
              >
                {isCorrect ? 'Correct' : 'Incorrect'}
              </p>
              <p className="text-sm text-j-text-secondary leading-relaxed">
                {card.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * True/False question from question_bank.
 */
function QuestionTF({
  card,
  onSubmitDeterministic,
  isSubmitting,
}: {
  card: UnifiedReviewCard;
  onSubmitDeterministic: (answer: string) => void;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const correctAnswer = card.correctAnswer ?? '';
  const isCorrect = answered && selected === correctAnswer;

  const handleSelect = (value: string) => {
    if (answered || isSubmitting) return;
    setSelected(value);
    onSubmitDeterministic(value);
  };

  const getButtonClass = (value: string): string => {
    const base =
      'flex-1 py-4 px-6 border font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-200 min-h-[56px]';

    if (!answered) {
      return `${base} border-j-border bg-[var(--j-bg)] text-j-text hover:border-j-warm cursor-pointer`;
    }
    if (value === correctAnswer) {
      return `${base} bg-j-accent-light border-j-accent text-j-accent`;
    }
    if (selected === value && value !== correctAnswer) {
      return `${base} bg-j-error-bg border-j-error text-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] text-j-text-tertiary opacity-50`;
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-6">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        {card.conceptName}
      </p>

      <p className="text-sm text-j-text leading-relaxed mb-6">
        {card.content.question as string ?? card.content.questionText as string ?? ''}
      </p>

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleSelect('true')}
          disabled={answered || isSubmitting}
          className={getButtonClass('true')}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => handleSelect('false')}
          disabled={answered || isSubmitting}
          className={getButtonClass('false')}
        >
          False
        </button>
      </div>

      <AnimatePresence>
        {answered && card.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className={`p-4 border ${
                isCorrect
                  ? 'bg-j-success-bg border-j-accent'
                  : 'bg-j-error-bg border-j-error'
              }`}
            >
              <p
                className={`font-mono text-[11px] tracking-[0.15em] uppercase mb-2 ${
                  isCorrect ? 'text-j-accent' : 'text-j-error'
                }`}
              >
                {isCorrect ? 'Correct' : 'Incorrect'}
              </p>
              <p className="text-sm text-j-text-secondary leading-relaxed">
                {card.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Router Component
// ============================================================================

/**
 * Routes a UnifiedReviewCard to the correct card component based on
 * its source (question_bank vs concept_cards) and format/cardType.
 */
export function CardRouter({
  card,
  intervals,
  onRate,
  onSubmitDeterministic,
  onSubmitOpen,
  isSubmitting,
}: CardRouterProps) {
  // --- Question bank source ---
  if (card.source === 'question') {
    switch (card.format) {
      case 'open':
        return (
          <QuestionOpen
            card={card}
            onSubmitOpen={onSubmitOpen}
            isSubmitting={isSubmitting}
          />
        );
      case 'mc':
        return (
          <QuestionMC
            card={card}
            onSubmitDeterministic={onSubmitDeterministic}
            isSubmitting={isSubmitting}
          />
        );
      case 'tf':
        return (
          <QuestionTF
            card={card}
            onSubmitDeterministic={onSubmitDeterministic}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return (
          <QuestionOpen
            card={card}
            onSubmitOpen={onSubmitOpen}
            isSubmitting={isSubmitting}
          />
        );
    }
  }

  // --- Concept card source ---
  if (card.source === 'card') {
    switch (card.cardType) {
      case 'recall':
        return (
          <CardRecall
            content={card.content as { prompt: string }}
            back={card.back as { definition: string; keyPoints?: string[]; whyItMatters?: string }}
            intervals={intervals}
            onRate={onRate}
            conceptName={card.conceptName}
            isSubmitting={isSubmitting}
          />
        );
      case 'fill_blank':
        return (
          <CardFillBlank
            content={card.content as { template: string; blanks: string[] }}
            back={card.back as { blanks: string[]; explanation: string }}
            onSubmit={(answers) => onSubmitDeterministic(JSON.stringify(answers))}
            isSubmitting={isSubmitting}
          />
        );
      case 'true_false':
        return (
          <CardTrueFalse
            content={card.content as { statement: string; isTrue: boolean }}
            back={card.back as { explanation: string }}
            onSubmit={(answer) => onSubmitDeterministic(String(answer))}
            isSubmitting={isSubmitting}
          />
        );
      case 'connect':
        return (
          <CardConnect
            content={card.content as { conceptA: string; conceptB: string; prompt: string }}
            back={card.back as { connection: string }}
            intervals={intervals}
            onRate={onRate}
            isSubmitting={isSubmitting}
          />
        );
      case 'scenario_micro':
        return (
          <CardScenarioMicro
            content={card.content as { scenario: string; options: { label: string; text: string }[] }}
            back={card.back as { correct: string; explanation: string }}
            onSubmit={onSubmitDeterministic}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return (
          <div className="border border-j-error bg-j-error-bg p-6">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-error uppercase">
              Unknown card type: {card.cardType}
            </p>
          </div>
        );
    }
  }

  // Fallback: unknown source
  return (
    <div className="border border-j-error bg-j-error-bg p-6">
      <p className="font-mono text-[10px] tracking-[0.15em] text-j-error uppercase">
        Unknown card source: {card.source}
      </p>
    </div>
  );
}
