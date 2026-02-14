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

interface LlmResult {
  overallResult: 'correct' | 'partial' | 'incorrect';
  justificationScore: number;
  dimensionScores: Record<string, number>;
  feedback: string;
}

interface SavedAnswer {
  selectedOption: string;
  isCorrect: boolean;
  justification?: string;
  llmResult?: LlmResult;
}

interface InlineQuizProps {
  quiz: InlineQuizData;
  /** When defined (even null), overrides localStorage state for review mode */
  overrideState?: { selectedOption: string; isCorrect: boolean; justification?: string } | null;
  /** Called instead of localStorage save when in review mode */
  onAnswer?: (quizId: string, selectedOption: string, isCorrect: boolean, justification?: string) => void;
}

type QuizState = 'unanswered' | 'mc_answered' | 'evaluating' | 'answered';

// ============================================================================
// Dimension display names
// ============================================================================

const DIMENSION_LABELS: Record<string, string> = {
  reasoning: 'Razonamiento',
  precision: 'Precisión',
  relevance: 'Relevancia',
};

// ============================================================================
// Persistence helpers
// ============================================================================

function loadSavedAnswer(quizId: string): SavedAnswer | null {
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

function saveAnswer(quizId: string, data: SavedAnswer): void {
  try {
    localStorage.setItem(`jarre-quiz-${quizId}`, JSON.stringify(data));
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
  const [llmResult, setLlmResult] = useState<LlmResult | null>(null);

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
        setLlmResult(null);
        setState('unanswered');
      }
    } else {
      const saved = loadSavedAnswer(quiz.id);
      if (saved) {
        setSelectedOption(saved.selectedOption);
        setIsCorrect(saved.isCorrect);
        if (saved.justification) setJustification(saved.justification);
        if (saved.llmResult) setLlmResult(saved.llmResult);
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
        saveAnswer(quiz.id, { selectedOption, isCorrect: correct });
      }
    } else {
      setState('answered');
      if (onAnswer) {
        onAnswer(quiz.id, selectedOption, correct);
      } else {
        saveAnswer(quiz.id, { selectedOption, isCorrect: correct });
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
      saveAnswer(quiz.id, { selectedOption: value, isCorrect: correct });
    }
  };

  const handleJustificationSave = async () => {
    if (!justification.trim() || !selectedOption) return;

    const trimmedJustification = justification.trim();

    // For override mode (review), skip LLM evaluation
    if (onAnswer) {
      setState('answered');
      onAnswer(quiz.id, selectedOption, isCorrect, trimmedJustification);
      return;
    }

    // MC2: call LLM evaluation endpoint
    setState('evaluating');

    try {
      const response = await fetch('/api/quiz/evaluate-justification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          questionText: quiz.questionText,
          options: quiz.options,
          correctAnswer: quiz.correctAnswer,
          selectedAnswer: selectedOption,
          explanation: quiz.explanation,
          justification: trimmedJustification,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const result: LlmResult = {
        overallResult: data.overallResult,
        justificationScore: data.justificationScore,
        dimensionScores: data.dimensionScores,
        feedback: data.feedback,
      };

      setLlmResult(result);
      // Update isCorrect based on combined result
      const combinedCorrect = result.overallResult !== 'incorrect';
      setIsCorrect(combinedCorrect);
      setState('answered');
      saveAnswer(quiz.id, {
        selectedOption,
        isCorrect: combinedCorrect,
        justification: trimmedJustification,
        llmResult: result,
      });
    } catch (error) {
      // Fallback: use deterministic MC result, don't block the user
      console.warn('[InlineQuiz] LLM evaluation failed, falling back to deterministic:', error);
      setState('answered');
      saveAnswer(quiz.id, {
        selectedOption,
        isCorrect,
        justification: trimmedJustification,
      });
    }
  };

  // MC/MC2 show states (mc2 uses mc rendering for the option selection phase)
  const isMcFormat = quiz.format === 'mc' || quiz.format === 'mc2';
  const mcIsAnswered = state !== 'unanswered';

  const getOptionClasses = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200 min-h-[44px]';

    if (state === 'unanswered') {
      if (selectedOption === label) {
        return `${base} border-j-accent bg-[var(--j-bg)]`;
      }
      return `${base} border-j-border bg-[var(--j-bg)] hover:border-j-warm cursor-pointer`;
    }

    if (label === quiz.correctAnswer) {
      return `${base} bg-j-accent-light border-j-accent`;
    }
    if (selectedOption === label && label !== quiz.correctAnswer) {
      return `${base} bg-j-error-bg border-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] opacity-50`;
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
      'flex-1 py-3 px-4 font-mono text-[11px] tracking-[0.15em] uppercase border transition-all duration-200 min-h-[44px]';

    if (state === 'unanswered') {
      return `${base} border-j-border bg-[var(--j-bg)] text-j-text hover:border-j-warm cursor-pointer`;
    }

    if (value === quiz.correctAnswer) {
      return `${base} bg-j-accent-light border-j-accent text-j-accent`;
    }
    if (selectedOption === value && value !== quiz.correctAnswer) {
      return `${base} bg-j-error-bg border-j-error text-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] text-j-text-tertiary opacity-50`;
  };

  // Determine result display based on llmResult or deterministic
  const getResultConfig = () => {
    if (llmResult) {
      switch (llmResult.overallResult) {
        case 'correct':
          return {
            icon: '\u2713',
            label: 'Bien hecho',
            bgClass: 'bg-j-success-bg border-j-accent',
            textClass: 'text-j-accent',
          };
        case 'partial':
          return {
            icon: '\u25D0',
            label: 'Comprensión parcial',
            bgClass: 'bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700',
            textClass: 'text-purple-700 dark:text-purple-300',
          };
        case 'incorrect':
          return {
            icon: '\u26A0',
            label: 'Aún no',
            bgClass: 'bg-j-error-bg border-j-error',
            textClass: 'text-j-error',
          };
      }
    }
    // Deterministic fallback
    return isCorrect
      ? { icon: '\u2713', label: 'Bien hecho', bgClass: 'bg-j-success-bg border-j-accent', textClass: 'text-j-accent' }
      : { icon: '\u26A0', label: '\u00a1Casi!', bgClass: 'bg-j-error-bg border-j-error', textClass: 'text-j-error' };
  };

  const showResult =
    (quiz.format !== 'mc2' && mcIsAnswered && quiz.format !== 'tf') ||
    (quiz.format === 'tf' && state === 'answered') ||
    (quiz.format === 'mc2' && state === 'answered');

  const resultConfig = getResultConfig();

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
        <div className="space-y-2 mb-4" role="radiogroup" aria-label="Opciones de respuesta">
          {quiz.options.map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={selectedOption === option.label}
              onClick={() => {
                if (state === 'unanswered') setSelectedOption(option.label);
              }}
              disabled={mcIsAnswered}
              className={getOptionClasses(option.label)}
            >
              <span className={getRadioClasses(option.label)}>
                {mcIsAnswered && option.label === quiz.correctAnswer && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-[var(--j-bg)]" />
                )}
                {mcIsAnswered &&
                  selectedOption === option.label &&
                  option.label !== quiz.correctAnswer && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-[var(--j-bg)]" />
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
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 min-h-[44px] uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Verificar
        </button>
      )}

      {/* MC2: Justification phase */}
      {isMc2 && state === 'mc_answered' && (
        <div className="mt-4 border border-j-border bg-[var(--j-bg)] p-4 space-y-3">
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
            className="w-full border border-j-border-input bg-[var(--j-bg)] p-3 text-sm text-j-text placeholder-j-text-tertiary focus:outline-none focus:border-j-accent resize-none"
          />
          <button
            type="button"
            onClick={handleJustificationSave}
            disabled={!justification.trim()}
            className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 min-h-[44px] uppercase hover:bg-j-accent-hover transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Evaluar justificación
          </button>
        </div>
      )}

      {/* MC2: Evaluating spinner */}
      {isMc2 && state === 'evaluating' && (
        <div className="mt-4 border border-j-border bg-[var(--j-bg)] p-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-j-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              Evaluando tu justificación...
            </p>
          </div>
        </div>
      )}

      {/* Result + Explanation */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          showResult
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4">
            {/* Result indicator */}
            <div className={`p-4 border ${resultConfig.bgClass}`}>
              <p className={`font-mono text-[11px] tracking-[0.15em] uppercase mb-2 ${resultConfig.textClass}`}>
                {resultConfig.icon} {resultConfig.label}
              </p>

              {/* LLM feedback or static explanation */}
              {llmResult ? (
                <div className="space-y-3">
                  <p className="text-sm text-j-text-secondary leading-relaxed">
                    {llmResult.feedback}
                  </p>
                  {/* Dimension score badges */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(llmResult.dimensionScores).map(([key, score]) => (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] uppercase px-2 py-1 border ${
                          score === 2
                            ? 'border-j-accent bg-j-accent-light text-j-accent'
                            : score === 1
                              ? 'border-j-warm bg-amber-50 dark:bg-amber-950 text-j-warm'
                              : 'border-j-border bg-j-bg-alt text-j-text-tertiary'
                        }`}
                      >
                        {DIMENSION_LABELS[key] || key} {score}/2
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-j-text-secondary leading-relaxed">
                  {quiz.explanation}
                </p>
              )}
            </div>

            {/* MC2: Show justification + hint (only when no LLM result / fallback) */}
            {isMc2 && state === 'answered' && justification && !llmResult && (
              <div className="mt-3 space-y-3">
                <div className="border border-j-border p-3 bg-[var(--j-bg)]">
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

            {/* MC2: Show reference explanation after LLM result */}
            {isMc2 && state === 'answered' && llmResult && (
              <div className="mt-3 border border-j-border p-3 bg-[var(--j-bg)]">
                <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
                  Explicación de referencia
                </p>
                <p className="text-sm text-j-text-secondary leading-relaxed">
                  {quiz.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
