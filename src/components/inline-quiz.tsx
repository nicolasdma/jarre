'use client';

import { useState, useEffect, useMemo } from 'react';

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
// Deterministic shuffle (seeded by quiz ID for stable ordering)
// ============================================================================

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 0x100000000;
  };
}

function shuffleOptions(
  options: { label: string; text: string }[],
  correctAnswer: string,
  quizId: string
): { shuffled: { label: string; text: string }[]; mappedCorrect: string } {
  const labels = ['A', 'B', 'C', 'D'];
  const rng = seededRandom(quizId);

  // Fisher-Yates shuffle with seeded random
  const indices = options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Build shuffled options with fresh labels
  const shuffled = indices.map((origIdx, newIdx) => ({
    label: labels[newIdx],
    text: options[origIdx].text,
  }));

  // Map correct answer(s) to new labels — supports both "B" and "[A,B,D]"
  const isMulti = correctAnswer.startsWith('[');
  if (isMulti) {
    const origLabels = correctAnswer.replace(/[\[\]\s]/g, '').split(',');
    const newLabels = origLabels.map(lbl => {
      const origIdx = options.findIndex(o => o.label === lbl);
      const newIdx = indices.indexOf(origIdx);
      return labels[newIdx];
    });
    newLabels.sort();
    const mappedCorrect = `[${newLabels.join(',')}]`;
    return { shuffled, mappedCorrect };
  }

  const origCorrectIdx = options.findIndex(o => o.label === correctAnswer);
  const newCorrectIdx = indices.indexOf(origCorrectIdx);
  const mappedCorrect = labels[newCorrectIdx];

  return { shuffled, mappedCorrect };
}

// ============================================================================
// Component
// ============================================================================

export function InlineQuiz({ quiz, overrideState, onAnswer }: InlineQuizProps) {
  const isOverrideMode = overrideState !== undefined;
  const isMc2 = quiz.format === 'mc2';

  // Shuffle MC options deterministically per quiz ID
  const { shuffledOptions, shuffledCorrect } = useMemo(() => {
    if (quiz.options && quiz.options.length > 1) {
      const { shuffled, mappedCorrect } = shuffleOptions(quiz.options, quiz.correctAnswer, quiz.id);
      return { shuffledOptions: shuffled, shuffledCorrect: mappedCorrect };
    }
    return { shuffledOptions: quiz.options, shuffledCorrect: quiz.correctAnswer };
  }, [quiz.id, quiz.options, quiz.correctAnswer]);

  const [state, setState] = useState<QuizState>('unanswered');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
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
        // Restore mc2 selectedOptions set from saved "[A,B,D]" string
        if (isMc2 && overrideState.selectedOption?.startsWith('[')) {
          const labels = overrideState.selectedOption.replace(/[\[\]\s]/g, '').split(',');
          setSelectedOptions(new Set(labels));
        }
        setState(overrideState.justification ? 'answered' : 'answered');
      } else {
        setSelectedOption(null);
        setSelectedOptions(new Set());
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
        // Restore mc2 selectedOptions set from saved "[A,B,D]" string
        if (isMc2 && saved.selectedOption?.startsWith('[')) {
          const labels = saved.selectedOption.replace(/[\[\]\s]/g, '').split(',');
          setSelectedOptions(new Set(labels));
        }
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
    if (isMc2) {
      // mc2: compare selected set against correct set
      if (selectedOptions.size === 0) return;
      const selected = [...selectedOptions].sort().join(',');
      const correctLabels = shuffledCorrect.replace(/[\[\]\s]/g, '');
      const correct = selected === correctLabels;
      const selectedStr = `[${selected}]`;
      setSelectedOption(selectedStr);
      setIsCorrect(correct);
      setState('mc_answered');
      if (!isOverrideMode) {
        saveAnswer(quiz.id, { selectedOption: selectedStr, isCorrect: correct });
      }
    } else {
      if (!selectedOption) return;
      const correct = selectedOption === shuffledCorrect;
      setIsCorrect(correct);
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
    const correct = value === shuffledCorrect;
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
          options: shuffledOptions,
          correctAnswer: shuffledCorrect,
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

  // Parse correct labels set for mc2 answered-state styling
  const correctLabelsSet = useMemo(() => {
    if (!isMc2) return new Set<string>();
    return new Set(shuffledCorrect.replace(/[\[\]\s]/g, '').split(','));
  }, [isMc2, shuffledCorrect]);

  const isMcFormat = quiz.format === 'mc' || quiz.format === 'mc2';
  const mcIsAnswered = state !== 'unanswered';

  const getOptionClasses = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200 min-h-[44px]';

    if (state === 'unanswered') {
      const isSelected = isMc2 ? selectedOptions.has(label) : selectedOption === label;
      if (isSelected) {
        return `${base} border-j-accent bg-[var(--j-bg)]`;
      }
      return `${base} border-j-border bg-[var(--j-bg)] hover:border-j-warm cursor-pointer`;
    }

    // Answered state
    if (isMc2) {
      const isCorrectOption = correctLabelsSet.has(label);
      const wasSelected = selectedOptions.has(label);
      if (isCorrectOption) {
        return `${base} bg-j-accent-light border-j-accent`;
      }
      if (wasSelected && !isCorrectOption) {
        return `${base} bg-j-error-bg border-j-error`;
      }
      return `${base} border-j-border bg-[var(--j-bg)] opacity-50`;
    }

    if (label === shuffledCorrect) {
      return `${base} bg-j-accent-light border-j-accent`;
    }
    if (selectedOption === label && label !== shuffledCorrect) {
      return `${base} bg-j-error-bg border-j-error`;
    }
    return `${base} border-j-border bg-[var(--j-bg)] opacity-50`;
  };

  const getIndicatorClasses = (label: string): string => {
    // mc2 uses rounded-sm (checkbox-like), mc uses rounded-full (radio-like)
    const shape = isMc2 ? 'rounded-sm' : 'rounded-full';
    const base =
      `w-4 h-4 ${shape} border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200`;

    if (state === 'unanswered') {
      const isSelected = isMc2 ? selectedOptions.has(label) : selectedOption === label;
      if (isSelected) {
        return `${base} border-j-accent`;
      }
      return `${base} border-j-border-input`;
    }

    // Answered state
    if (isMc2) {
      const isCorrectOption = correctLabelsSet.has(label);
      const wasSelected = selectedOptions.has(label);
      if (isCorrectOption) {
        return `${base} border-j-accent bg-j-accent`;
      }
      if (wasSelected && !isCorrectOption) {
        return `${base} border-j-error bg-j-error`;
      }
      return `${base} border-j-border-input`;
    }

    if (label === shuffledCorrect) {
      return `${base} border-j-accent bg-j-accent`;
    }
    if (selectedOption === label && label !== shuffledCorrect) {
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

    if (value === shuffledCorrect) {
      return `${base} bg-j-accent-light border-j-accent text-j-accent`;
    }
    if (selectedOption === value && value !== shuffledCorrect) {
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
      {isMcFormat && shuffledOptions && (
        <div className="space-y-2 mb-4" role={isMc2 ? 'group' : 'radiogroup'} aria-label="Opciones de respuesta">
          {isMc2 && state === 'unanswered' && (
            <p className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase mb-1">
              Selecciona todas las que apliquen
            </p>
          )}
          {shuffledOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              role={isMc2 ? 'checkbox' : 'radio'}
              aria-checked={isMc2 ? selectedOptions.has(option.label) : selectedOption === option.label}
              onClick={() => {
                if (state !== 'unanswered') return;
                if (isMc2) {
                  setSelectedOptions(prev => {
                    const next = new Set(prev);
                    if (next.has(option.label)) {
                      next.delete(option.label);
                    } else {
                      next.add(option.label);
                    }
                    return next;
                  });
                } else {
                  setSelectedOption(option.label);
                }
              }}
              disabled={mcIsAnswered}
              className={getOptionClasses(option.label)}
            >
              <span className={getIndicatorClasses(option.label)}>
                {(() => {
                  const isSelected = isMc2 ? selectedOptions.has(option.label) : selectedOption === option.label;
                  const isCorrectOption = isMc2 ? correctLabelsSet.has(option.label) : option.label === shuffledCorrect;
                  const wasSelected = isMc2 ? selectedOptions.has(option.label) : selectedOption === option.label;

                  if (mcIsAnswered && isCorrectOption) {
                    return <span className="block w-1.5 h-1.5 rounded-full bg-[var(--j-bg)]" />;
                  }
                  if (mcIsAnswered && wasSelected && !isCorrectOption) {
                    return <span className="block w-1.5 h-1.5 rounded-full bg-[var(--j-bg)]" />;
                  }
                  if (state === 'unanswered' && isSelected) {
                    return <span className="block w-1.5 h-1.5 rounded-full bg-j-accent" />;
                  }
                  return null;
                })()}
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
          disabled={isMc2 ? selectedOptions.size === 0 : !selectedOption}
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
            // eslint-disable-next-line jsx-a11y/no-autofocus -- Intentional: focus justification field when user needs to explain their answer
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
