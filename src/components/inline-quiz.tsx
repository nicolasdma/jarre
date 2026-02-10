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

export function InlineQuiz({ quiz }: InlineQuizProps) {
  const [state, setState] = useState<QuizState>('unanswered');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Restore saved answer after hydration (localStorage is client-only)
  useEffect(() => {
    const saved = loadSavedAnswer(quiz.id);
    if (saved) {
      setSelectedOption(saved.selectedOption);
      setIsCorrect(saved.isCorrect);
      setState('answered');
    }
  }, [quiz.id]);

  const handleSubmit = () => {
    if (!selectedOption) return;
    const correct = selectedOption === quiz.correctAnswer;
    setIsCorrect(correct);
    setState('answered');
    saveAnswer(quiz.id, selectedOption, correct);
  };

  const handleTrueFalse = (value: 'true' | 'false') => {
    setSelectedOption(value);
    const correct = value === quiz.correctAnswer;
    setIsCorrect(correct);
    setState('answered');
    saveAnswer(quiz.id, value, correct);
  };

  const getOptionClasses = (label: string): string => {
    const base =
      'flex items-center gap-3 w-full border p-3 text-left transition-all duration-200';

    if (state === 'unanswered') {
      if (selectedOption === label) {
        return `${base} border-[#4a5d4a] bg-white`;
      }
      return `${base} border-[#e8e6e0] bg-white hover:border-[#c4a07a] cursor-pointer`;
    }

    // Answered state
    if (label === quiz.correctAnswer) {
      return `${base} bg-[#e8f0e8] border-[#4a5d4a]`;
    }
    if (selectedOption === label && label !== quiz.correctAnswer) {
      return `${base} bg-[#f0e8e8] border-[#7d6b6b]`;
    }
    return `${base} border-[#e8e6e0] bg-white opacity-50`;
  };

  const getRadioClasses = (label: string): string => {
    const base =
      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200';

    if (state === 'unanswered') {
      if (selectedOption === label) {
        return `${base} border-[#4a5d4a]`;
      }
      return `${base} border-[#d4d0c8]`;
    }

    // Answered state
    if (label === quiz.correctAnswer) {
      return `${base} border-[#4a5d4a] bg-[#4a5d4a]`;
    }
    if (selectedOption === label && label !== quiz.correctAnswer) {
      return `${base} border-[#7d6b6b] bg-[#7d6b6b]`;
    }
    return `${base} border-[#d4d0c8]`;
  };

  const getTfButtonClasses = (value: 'true' | 'false'): string => {
    const base =
      'flex-1 py-3 px-4 font-mono text-[11px] tracking-[0.15em] uppercase border transition-all duration-200';

    if (state === 'unanswered') {
      return `${base} border-[#e8e6e0] bg-white text-[#2c2c2c] hover:border-[#c4a07a] cursor-pointer`;
    }

    // Answered state
    if (value === quiz.correctAnswer) {
      return `${base} bg-[#e8f0e8] border-[#4a5d4a] text-[#4a5d4a]`;
    }
    if (selectedOption === value && value !== quiz.correctAnswer) {
      return `${base} bg-[#f0e8e8] border-[#7d6b6b] text-[#7d6b6b]`;
    }
    return `${base} border-[#e8e6e0] bg-white text-[#9c9a8e] opacity-50`;
  };

  return (
    <div className="bg-[#f5f4f0] border border-[#e8e6e0] border-l-2 border-l-[#c4a07a] p-6 my-8">
      {/* Header */}
      <p className="font-mono text-[10px] tracking-[0.2em] text-[#c4a07a] uppercase mb-4">
        Verifica tu comprensión
      </p>

      {/* Question */}
      <p className="text-sm text-[#2c2c2c] leading-relaxed mb-5">
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
                  <span className="block w-1.5 h-1.5 rounded-full bg-[#4a5d4a]" />
                )}
              </span>
              <span className="font-mono text-[11px] tracking-[0.1em] text-[#9c9a8e] flex-shrink-0">
                {option.label}.
              </span>
              <span className="text-sm text-[#2c2c2c]">{option.text}</span>
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
          className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
            {/* Correct / Incorrect indicator */}
            <p
              className={`font-mono text-[11px] tracking-[0.15em] uppercase mb-2 ${
                isCorrect ? 'text-[#4a5d4a]' : 'text-[#7d6b6b]'
              }`}
            >
              {isCorrect ? '\u2713 Correcto' : '\u2717 Incorrecto'}
            </p>

            {/* Explanation panel */}
            <div className="p-4 bg-white border border-[#e8e6e0]">
              <p className="text-sm text-[#7a7a6e] leading-relaxed">
                {quiz.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
