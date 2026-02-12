'use client';

import type { ExerciseResult } from '@/types';
import { EXERCISE_PASS_SCORE } from '@/lib/constants';

interface ExerciseResultDisplayProps {
  result: ExerciseResult;
  language: 'es' | 'en';
  onRetry: () => void;
  onContinue: () => void;
  isLast: boolean;
}

export function ExerciseResultDisplay({
  result,
  language,
  onRetry,
  onContinue,
  isLast,
}: ExerciseResultDisplayProps) {
  const passed = result.score >= EXERCISE_PASS_SCORE;

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-light ${passed ? 'text-j-accent' : 'text-j-error'}`}>
          {result.score}%
        </span>
        <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${passed ? 'text-j-accent' : 'text-j-error'}`}>
          {passed
            ? (language === 'es' ? 'Bien hecho' : 'Well done')
            : (language === 'es' ? 'Aun no' : 'Not yet')}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {!passed && (
          <button
            onClick={onRetry}
            className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 uppercase hover:border-j-accent transition-colors"
          >
            {language === 'es' ? 'Reintentar' : 'Retry'}
          </button>
        )}
        <button
          onClick={onContinue}
          className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
        >
          {isLast
            ? (language === 'es' ? 'Continuar' : 'Continue')
            : (language === 'es' ? 'Siguiente' : 'Next')}
        </button>
      </div>
    </div>
  );
}
