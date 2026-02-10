'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

type InlineQuizFormat = 'mc' | 'tf';

interface InlineQuizData {
  id: string;
  format: InlineQuizFormat;
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
}

interface InlineQuizProps {
  quiz: InlineQuizData;
  /** When defined (even null), overrides localStorage state for review mode */
  overrideState?: { selectedOption: string; isCorrect: boolean } | null;
  /** Called instead of localStorage save when in review mode */
  onAnswer?: (quizId: string, selectedOption: string, isCorrect: boolean) => void;
}

type QuizState = 'unanswered' | 'answered';

// ============================================================================
// Component
// ============================================================================

function loadSavedAnswer(quizId: string): { selectedOption: string; isCorrect: boolean } | null {
  try {
    const raw = localStorage.getItem(`jarre-quiz-${quizId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.selectedOption === 'string' && typeof parsed.isCorrect === 'boolean') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveAnswer(quizId: string, selectedOption: string, isCorrect: boolean): void {
  try {
    localStorage.setItem(`jarre-quiz-${quizId}`, JSON.stringify({ selectedOption, isCorrect }));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function InlineQuiz({ quiz, overrideState, onAnswer }: InlineQuizProps) {
  const isOverrideMode = overrideState !== undefined;
  const [state, setState] = useState<QuizState>('unanswered');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Restore state: override mode uses overrideState prop, normal mode uses localStorage
  useEffect(() => {
    if (isOverrideMode) {
      if (overrideState) {
        setSelectedOption(overrideState.selectedOption);
        setIsCorrect(overrideState.isCorrect);
        setState('answered');
      } else {
        setSelectedOption(null);
        setIsCorrect(false);
        setState('unanswered');
      }
    } else {
      const saved = loadSavedAnswer(quiz.id);
      if (saved) {
        setSelectedOption(saved.selectedOption);
        setIsCorrect(saved.isCorrect);
        setState('answered');
      }
    }
  }, [quiz.id, isOverrideMode, overrideState]);

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = selectedOption === quiz.correctAnswer;
    setIsCorrect(correct);
    setState('answered');
    if (onAnswer) {
      onAnswer(quiz.id, selectedOption, correct);
    } else {
      saveAnswer(quiz.id, selectedOption, correct);
    }
  };

  const handleTrueFalse = (value: 'true' | 'false') => {
    setSelectedOption(value);
    const correct = value === quiz.correctAnswer;
    setIsCorrect(correct);
    setState('answered');
    if (onAnswer) {
      onAnswer(quiz.id, value, correct);
    } else {
      saveAnswer(quiz.id, value, correct);
    }
  };

  const getOptionClasses = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200';

    if (state === 'unanswered') {
      if (selectedOption === label) {
        return `${base} border-j-accent bg-white`;
      }
      return `${base} border-j-border bg-white hover:border-j-warm cursor-pointer`;
    }

    // Answered state
    if (label === quiz.correctAnswer) {
      return `${base} bg-j-accent-light border-j-accent`;
    }
    if (selectedOption === label && label !== quiz.correctAnswer) {
      return `${base} bg-j-error-bg border-j-error`;
    }
    return `${base} border-j-border bg-white opacity-50`;
  };

  const getRadioClasses = (label: string): string => {
    const base =
      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200';

    if (state === 'unanswered') {
      if (selectedOption === label) {
        return `${base} border-j-accent`;
      }
      return `${base} border-j-border-input`;
    }

    // Answered state
    if (label === quiz.correctAnswer) {
      return `${base} border-j-accent bg-j-accent`;
    }
    if (selectedOption === label && label !== quiz.correctAnswer) {
      return `${base} border-j-error bg-j-error`;
    }
    return `${base} border-j-border-input`;
  };

  const getTfButtonClasses = (value: 'true' | 'false'): string => {
    const base =
      'flex-1 py-3 px-4 font-mono text-[11px] tracking-[0.15em] uppercase border transition-all duration-200';

    if (state === 'unanswered') {
      return `${base} border-j-border bg-white text-j-text hover:border-j-warm cursor-pointer`;
    }

    // Answered state
    if (value === quiz.correctAnswer) {
      return `${base} bg-j-accent-light border-j-accent text-j-accent`;
    }
    if (selectedOption === value && value !== quiz.correctAnswer) {
      return `${base} bg-j-error-bg border-j-error text-j-error`;
    }
    return `${base} border-j-border bg-white text-j-text-tertiary opacity-50`;
  };

  return (
    <div className="bg-j-bg-alt border border-j-border border-l-2 border-l-j-warm p-6 my-8">
      {/* Header */}
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase mb-4">
        Verifica tu comprensión
      </p>

      {/* Question */}
      <p className="text-sm text-j-text leading-relaxed mb-5">
        {quiz.questionText}
      </p>

      {/* MC Mode */}
      {quiz.format === 'mc' && quiz.options && (
        <div className="space-y-2 mb-4">
          {quiz.options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                if (state === 'unanswered') setSelectedOption(option.label);
              }}
              disabled={state === 'answered'}
              className={getOptionClasses(option.label)}
            >
              <span className={getRadioClasses(option.label)}>
                {state === 'answered' && option.label === quiz.correctAnswer && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-white" />
                )}
                {state === 'answered' &&
                  selectedOption === option.label &&
                  option.label !== quiz.correctAnswer && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                {state === 'unanswered' && selectedOption === option.label && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-j-accent" />
                )}
              </span>
              <span className="font-mono text-[11px] tracking-[0.1em] text-j-text-tertiary flex-shrink-0">
                {option.label}.
              </span>
              <span className="text-sm text-j-text">{option.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* TF Mode */}
      {quiz.format === 'tf' && (
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              if (state === 'unanswered') handleTrueFalse('true');
            }}
            disabled={state === 'answered'}
            className={getTfButtonClasses('true')}
          >
            Verdadero
          </button>
          <button
            type="button"
            onClick={() => {
              if (state === 'unanswered') handleTrueFalse('false');
            }}
            disabled={state === 'answered'}
            className={getTfButtonClasses('false')}
          >
            Falso
          </button>
        </div>
      )}

      {/* Submit button (MC only, before answering) */}
      {quiz.format === 'mc' && state === 'unanswered' && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Verificar
        </button>
      )}

      {/* Result + Explanation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          state === 'answered'
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4">
            {/* Result indicator — growth-oriented vocabulary */}
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
                {isCorrect ? '\u2713 Bien hecho' : '\u26A0 \u00a1Casi!'}
              </p>
              <p className="text-sm text-j-text-secondary leading-relaxed">
                {quiz.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
