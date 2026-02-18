'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface CardTrueFalseProps {
  content: {
    statement: string;
    isTrue: boolean;
  };
  back: {
    explanation: string;
  };
  onSubmit: (answer: boolean) => void;
  isSubmitting: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * True/False card: shows a statement, user picks True or False,
 * then reveals whether they were correct plus an explanation.
 */
export function CardTrueFalse({
  content,
  back,
  onSubmit,
  isSubmitting,
}: CardTrueFalseProps) {
  const [selected, setSelected] = useState<boolean | null>(null);
  const answered = selected !== null;
  const isCorrect = answered && selected === content.isTrue;

  const handleSelect = (value: boolean) => {
    if (answered || isSubmitting) return;
    setSelected(value);
    onSubmit(value);
  };

  const getButtonClass = (value: boolean): string => {
    const base =
      'flex-1 py-4 px-6 border font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-200 min-h-[56px]';

    if (!answered) {
      return `${base} border-j-border bg-[var(--j-bg)] text-j-text hover:border-j-warm cursor-pointer`;
    }

    // After answering
    if (value === content.isTrue) {
      return `${base} bg-j-accent-light border-j-accent text-j-accent`;
    }
    if (selected === value && value !== content.isTrue) {
      return `${base} bg-j-error-bg border-j-error text-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] text-j-text-tertiary opacity-50`;
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-6">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        True or False
      </p>

      <p className="text-sm text-j-text leading-relaxed mb-6">
        {content.statement}
      </p>

      {/* True / False buttons */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleSelect(true)}
          disabled={answered || isSubmitting}
          className={getButtonClass(true)}
        >
          True
        </button>
        <button
          type="button"
          onClick={() => handleSelect(false)}
          disabled={answered || isSubmitting}
          className={getButtonClass(false)}
        >
          False
        </button>
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
