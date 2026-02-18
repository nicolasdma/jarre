'use client';

import { useState, useRef, useCallback } from 'react';
import type { Exercise, ExerciseResult } from '@/types';
import { SequenceExerciseComponent } from './sequence-exercise';
import { LabelExerciseComponent } from './label-exercise';
import { ConnectExerciseComponent } from './connect-exercise';
import { ExerciseResultDisplay } from './exercise-result';

interface ExerciseShellProps {
  exercises: Exercise[];
  onAllComplete: (results: ExerciseResult[]) => void;
  language: 'es' | 'en';
}

/**
 * Wrapper that renders exercises sequentially with title, instructions, result, and retry.
 */
export function ExerciseShell({ exercises, onAllComplete, language }: ExerciseShellProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const startTimeRef = useRef(Date.now());

  const exercise = exercises[currentIndex];

  const handleResult = useCallback((res: ExerciseResult) => {
    const ex = exercises[currentIndex];
    if (!ex) return;
    setResult(res);
    // Save result to DB (fire-and-forget)
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    fetch('/api/exercises/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: res.exerciseId,
        exerciseType: ex.type,
        conceptId: ex.conceptId,
        sectionId: ex.sectionId,
        score: res.score,
        isCorrect: res.isCorrect,
        details: res.details,
        timeSpentSeconds: timeSpent,
      }),
    }).catch(() => {});
  }, [exercises, currentIndex]);

  const handleNext = useCallback(() => {
    if (result) {
      const newResults = [...results, result];
      setResults(newResults);

      if (currentIndex + 1 >= exercises.length) {
        onAllComplete(newResults);
      } else {
        setCurrentIndex((i) => i + 1);
        setResult(null);
        startTimeRef.current = Date.now();
      }
    }
  }, [result, results, currentIndex, exercises.length, onAllComplete]);

  const handleRetry = useCallback(() => {
    setResult(null);
    startTimeRef.current = Date.now();
  }, []);

  if (!exercise) return null;

  return (
    <div className="bg-j-bg-alt border border-j-border p-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[9px] tracking-[0.15em] text-j-text-tertiary uppercase">
          {language === 'es' ? 'Ejercicio' : 'Exercise'} {currentIndex + 1}/{exercises.length}
        </span>
        <div className="flex gap-1">
          {exercises.map((ex, i) => (
            <div
              key={ex.id}
              className={`w-4 h-1 ${
                i < currentIndex ? 'bg-j-accent' : i === currentIndex ? 'bg-j-warm' : 'bg-j-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Title & instructions */}
      <h4 className="text-sm font-medium text-j-text mb-1">{exercise.title}</h4>
      <p className="text-xs text-j-text-secondary mb-4">{exercise.instructions}</p>

      {/* Exercise or result */}
      {result ? (
        <ExerciseResultDisplay
          result={result}
          language={language}
          onRetry={handleRetry}
          onContinue={handleNext}
          isLast={currentIndex + 1 >= exercises.length}
        />
      ) : (
        <>
          {exercise.type === 'sequence' && (
            <SequenceExerciseComponent exercise={exercise} onSubmit={handleResult} />
          )}
          {exercise.type === 'label' && (
            <LabelExerciseComponent exercise={exercise} onSubmit={handleResult} />
          )}
          {exercise.type === 'connect' && (
            <ConnectExerciseComponent exercise={exercise} onSubmit={handleResult} />
          )}
        </>
      )}
    </div>
  );
}
