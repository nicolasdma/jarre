'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface CardScenarioMicroProps {
  content: {
    scenario: string;
    options: { label: string; text: string }[];
  };
  back: {
    correct: string;
    explanation: string;
  };
  onSubmit: (selected: string) => void;
  isSubmitting: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Multiple-choice mini-scenario card.
 * Shows a scenario with MC options. After selection, highlights
 * correct/incorrect and shows explanation.
 */
export function CardScenarioMicro({
  content,
  back,
  onSubmit,
  isSubmitting,
}: CardScenarioMicroProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const isCorrect = answered && selected === back.correct;

  const handleSelect = (label: string) => {
    if (answered || isSubmitting) return;
    setSelected(label);
    onSubmit(label);
  };

  const getOptionClass = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200 min-h-[44px]';

    if (!answered) {
      return `${base} border-j-border bg-[var(--j-bg)] hover:border-j-warm cursor-pointer`;
    }

    // Correct answer always highlighted
    if (label === back.correct) {
      return `${base} bg-j-accent-light border-j-accent`;
    }
    // User's wrong selection
    if (selected === label && label !== back.correct) {
      return `${base} bg-j-error-bg border-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] opacity-50`;
  };

  const getRadioClass = (label: string): string => {
    const base =
      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200';

    if (!answered) {
      return `${base} border-j-border-input`;
    }
    if (label === back.correct) {
      return `${base} border-j-accent bg-j-accent`;
    }
    if (selected === label && label !== back.correct) {
      return `${base} border-j-error bg-j-error`;
    }
    return `${base} border-j-border-input`;
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-6">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        Scenario
      </p>

      {/* Scenario text */}
      <p className="text-sm text-j-text leading-relaxed mb-5">
        {content.scenario}
      </p>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {content.options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleSelect(option.label)}
            disabled={answered || isSubmitting}
            className={getOptionClass(option.label)}
          >
            <span className={getRadioClass(option.label)}>
              {answered && option.label === back.correct && (
                <span className="block w-1.5 h-1.5 rounded-full bg-[var(--j-bg)]" />
              )}
              {answered && selected === option.label && option.label !== back.correct && (
                <span className="block w-1.5 h-1.5 rounded-full bg-[var(--j-bg)]" />
              )}
            </span>
            <span className="font-mono text-[11px] tracking-[0.1em] text-j-text-tertiary flex-shrink-0">
              {option.label}.
            </span>
            <span className="text-sm text-j-text">{option.text}</span>
          </button>
        ))}
      </div>

      {/* Result + Explanation */}
      <AnimatePresence>
        {answered && (
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
                {back.explanation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
