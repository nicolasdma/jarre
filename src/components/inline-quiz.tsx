'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

type InlineQuizFormat = 'mc' | 'tf' | 'mc2';

interface InlineQuizData {
  id: string;
  format: InlineQuizFormat;
  questionText: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
  justificationHint?: string;
}

interface InlineQuizProps {
  quiz: InlineQuizData;
  /** When defined (even null), overrides localStorage state for review mode */
  overrideState?: { selectedOption: string; isCorrect: boolean; justification?: string } | null;
  /** Called instead of localStorage save when in review mode */
  onAnswer?: (quizId: string, selectedOption: string, isCorrect: boolean, justification?: string) => void;
}

type QuizState = 'unanswered' | 'mc_answered' | 'justified' | 'answered';

// ============================================================================
// Persistence helpers
// ============================================================================

function loadSavedAnswer(quizId: string): { selectedOption: string; isCorrect: boolean; justification?: string } | null {
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

function saveAnswer(quizId: string, selectedOption: string, isCorrect: boolean, justification?: string): void {
  try {
    localStorage.setItem(`jarre-quiz-${quizId}`, JSON.stringify({ selectedOption, isCorrect, justification }));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ============================================================================
// Component
// ============================================================================

export function InlineQuiz({ quiz, overrideState, onAnswer }: InlineQuizProps) {
  const isOverrideMode = overrideState !== undefined;
  const isMc2 = quiz.format === 'mc2';

  const [state, setState] = useState<QuizState>('unanswered');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [justification, setJustification] = useState('');

  // Restore state
  useEffect(() => {
    if (isOverrideMode) {
      if (overrideState) {
        setSelectedOption(overrideState.selectedOption);
        setIsCorrect(overrideState.isCorrect);
        if (overrideState.justification) setJustification(overrideState.justification);
        setState(overrideState.justification ? 'answered' : 'answered');
      } else {
        setSelectedOption(null);
        setIsCorrect(false);
        setJustification('');
        setState('unanswered');
      }
    } else {
      const saved = loadSavedAnswer(quiz.id);
      if (saved) {
        setSelectedOption(saved.selectedOption);
        setIsCorrect(saved.isCorrect);
        if (saved.justification) setJustification(saved.justification);
        // For mc2: if saved has justification → fully answered, else mc_answered
        if (isMc2 && !saved.justification) {
          setState('mc_answered');
        } else {
          setState('answered');
        }
      }
    }
  }, [quiz.id, isOverrideMode, overrideState, isMc2]);

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = selectedOption === quiz.correctAnswer;
    setIsCorrect(correct);

    if (isMc2) {
      // mc2: go to mc_answered, wait for justification
      setState('mc_answered');
      // Don't call onAnswer yet — wait for justification
      if (!isOverrideMode) {
        saveAnswer(quiz.id, selectedOption, correct);
      }
    } else {
      setState('answered');
      if (onAnswer) {
        onAnswer(quiz.id, selectedOption, correct);
      } else {
        saveAnswer(quiz.id, selectedOption, correct);
      }
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

  const handleJustificationSave = () => {
    if (!justification.trim() || !selectedOption) return;
    setState('answered');
    if (onAnswer) {
      onAnswer(quiz.id, selectedOption, isCorrect, justification.trim());
    } else {
      saveAnswer(quiz.id, selectedOption, isCorrect, justification.trim());
    }
  };

  // MC/MC2 show states (mc2 uses mc rendering for the option selection phase)
  const isMcFormat = quiz.format === 'mc' || quiz.format === 'mc2';
  const mcIsAnswered = state !== 'unanswered';

  const getOptionClasses = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200';

    if (state === 'unanswered') {
      if (selectedOption === label) {
        return `${base} border-j-accent bg-white`;
      }
      return `${base} border-j-border bg-white hover:border-j-warm cursor-pointer`;
    }

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
      <div className="flex items-center gap-2 mb-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-warm uppercase">
          Verifica tu comprensión
        </p>
        {isMc2 && (
          <span className="font-mono text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
            + Justificación
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm text-j-text leading-relaxed mb-5">
        {quiz.questionText}
      </p>

      {/* MC / MC2 Mode */}
      {isMcFormat && quiz.options && (
        <div className="space-y-2 mb-4">
          {quiz.options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                if (state === 'unanswered') setSelectedOption(option.label);
              }}
              disabled={mcIsAnswered}
              className={getOptionClasses(option.label)}
            >
              <span className={getRadioClasses(option.label)}>
                {mcIsAnswered && option.label === quiz.correctAnswer && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-white" />
                )}
                {mcIsAnswered &&
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
            disabled={state !== 'unanswered'}
            className={getTfButtonClasses('true')}
          >
            Verdadero
          </button>
          <button
            type="button"
            onClick={() => {
              if (state === 'unanswered') handleTrueFalse('false');
            }}
            disabled={state !== 'unanswered'}
            className={getTfButtonClasses('false')}
          >
            Falso
          </button>
        </div>
      )}

      {/* Submit button (MC/MC2 only, before answering) */}
      {isMcFormat && state === 'unanswered' && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Verificar
        </button>
      )}

      {/* MC2: Justification phase */}
      {isMc2 && state === 'mc_answered' && (
        <div className="mt-4 border border-j-border bg-white p-4 space-y-3">
          <p className="font-mono text-[10px] tracking-[0.2em] text-purple-600 dark:text-purple-400 uppercase">
            ¿Por qué esa es la respuesta correcta?
          </p>
          <p className="text-xs text-j-text-tertiary leading-relaxed">
            Explicar tu razonamiento consolida lo aprendido, incluso si elegiste bien.
          </p>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Escribe tu justificación..."
            rows={3}
            autoFocus
            className="w-full border border-j-border-input bg-white p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
          />
          <button
            type="button"
            onClick={handleJustificationSave}
            disabled={!justification.trim()}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar justificación
          </button>
        </div>
      )}

      {/* Result + Explanation (for mc/tf: after answered; for mc2: after justified) */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          (quiz.format !== 'mc2' && mcIsAnswered && quiz.format !== 'tf') ||
          (quiz.format === 'tf' && state === 'answered') ||
          (quiz.format === 'mc2' && (state === 'justified' || state === 'answered'))
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

            {/* MC2: Show justification comparison */}
            {isMc2 && state === 'answered' && justification && (
              <div className="mt-3 space-y-3">
                <div className="border border-j-border p-3 bg-white">
                  <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                    Tu justificación
                  </p>
                  <p className="text-sm text-j-text">{justification}</p>
                </div>
                {quiz.justificationHint && (
                  <div className="border border-purple-200 dark:border-purple-800 p-3 bg-purple-50 dark:bg-purple-950">
                    <p className="font-mono text-[9px] tracking-[0.15em] text-purple-600 dark:text-purple-400 uppercase mb-1">
                      Comparación
                    </p>
                    <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                      {quiz.justificationHint}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
