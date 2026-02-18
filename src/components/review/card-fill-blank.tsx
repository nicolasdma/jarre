'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface CardFillBlankProps {
  content: {
    template: string;
    blanks: string[];
  };
  back: {
    blanks: string[];
    explanation: string;
  };
  onSubmit: (answers: string[]) => void;
  isSubmitting: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

/** Split template by blank placeholder pattern `___` */
function splitTemplate(template: string): string[] {
  return template.split(/___/);
}

/** Normalize string for comparison (lowercase, trim whitespace) */
function normalize(s: string): string {
  return s.toLowerCase().trim();
}

// ============================================================================
// Component
// ============================================================================

/**
 * Fill-in-the-blank card: renders template text with inline input fields
 * replacing `___` placeholders. After submit, shows correctness per blank
 * and the full explanation.
 */
export function CardFillBlank({
  content,
  back,
  onSubmit,
  isSubmitting,
}: CardFillBlankProps) {
  const segments = useMemo(() => splitTemplate(content.template), [content.template]);
  const blankCount = content.blanks.length;

  const [answers, setAnswers] = useState<string[]>(() => Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (index: number, value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = () => {
    if (isSubmitting || submitted) return;
    setSubmitted(true);
    onSubmit(answers);
  };

  const allFilled = answers.every((a) => a.trim().length > 0);

  const getBlankResult = (index: number): 'correct' | 'incorrect' | null => {
    if (!submitted) return null;
    return normalize(answers[index]) === normalize(back.blanks[index])
      ? 'correct'
      : 'incorrect';
  };

  return (
    <div className="border border-j-border bg-j-bg-alt p-6">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        Fill in the blanks
      </p>

      {/* Template with inline inputs */}
      <div className="text-sm text-j-text leading-relaxed mb-6">
        {segments.map((segment, i) => (
          <span key={i}>
            {segment}
            {i < blankCount && (
              <span className="inline-block mx-1 align-bottom">
                <input
                  type="text"
                  value={answers[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  disabled={submitted || isSubmitting}
                  className={`
                    inline-block w-32 border-b-2 bg-transparent px-1 py-0.5
                    text-sm text-j-text font-mono
                    focus:outline-none transition-colors duration-200
                    disabled:opacity-60
                    ${
                      getBlankResult(i) === 'correct'
                        ? 'border-j-accent text-j-accent'
                        : getBlankResult(i) === 'incorrect'
                          ? 'border-j-error text-j-error'
                          : 'border-j-border-input focus:border-j-accent'
                    }
                  `}
                  placeholder={`blank ${i + 1}`}
                />
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Submit button */}
      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allFilled || isSubmitting}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Checking...' : 'Check'}
        </button>
      )}

      {/* Results */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-3"
          >
            {/* Correct answers */}
            <div className="border border-j-border bg-[var(--j-bg)] p-4">
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
                Correct answers
              </p>
              <div className="flex flex-wrap gap-2">
                {back.blanks.map((blank, i) => {
                  const result = getBlankResult(i);
                  return (
                    <span
                      key={i}
                      className={`
                        inline-flex items-center gap-1 font-mono text-[10px] px-2 py-1 border
                        ${
                          result === 'correct'
                            ? 'border-j-accent bg-j-accent-light text-j-accent'
                            : 'border-j-error bg-j-error-bg text-j-error'
                        }
                      `}
                    >
                      <span className="opacity-60">{i + 1}.</span> {blank}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div className="border border-j-border bg-[var(--j-bg)] p-4">
              <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
                Explanation
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
