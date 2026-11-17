'use client';

/**
 * Under a reading section, after "Decilo en inglés": the section's problem
 * written in code, guided first and then blank. One exercise open at a time.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useCoding } from './coding-context';
import { CodeExercise } from './code-exercise';

export function SectionExercises({ conceptId }: { conceptId: string }) {
  const coding = useCoding();
  const [open, setOpen] = useState<string | null>(null);
  if (!coding) return null;
  const problems = coding.config.problems.filter((p) => p.concept === conceptId && p.exercises.length > 0);
  if (!problems.length) return null;
  const exercises = problems.flatMap((p) => p.exercises.map((e) => ({ problem: p, exercise: e })));
  const done = exercises.filter(({ exercise }) => coding.solved[exercise.id]).length;

  return (
    <section className="mt-8 border-t border-j-border pt-6" aria-label="Escribilo en código" data-testid="section-exercises">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm">Escribilo en código</p>
        <p className="font-mono text-[10px] tabular-nums text-j-text-tertiary">
          {done}/{exercises.length} resueltos
        </p>
      </div>
      <ul className="space-y-2">
        {exercises.map(({ problem, exercise }) => {
          const isOpen = open === exercise.id;
          const solved = Boolean(coding.solved[exercise.id]);
          return (
            <li key={exercise.id} className={cn('border', isOpen ? 'border-j-accent' : 'border-j-border')}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : exercise.id)}
                aria-expanded={isOpen}
                className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left hover:bg-j-bg-alt"
              >
                <span className={cn('w-4 shrink-0 text-xs', solved ? 'text-j-accent' : 'text-j-text-tertiary')}>{solved ? '✓' : '·'}</span>
                <span className="min-w-0 flex-1 text-sm text-j-text">{exercise.title}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">{isOpen ? 'Cerrar' : 'Escribir'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-j-border p-3">
                  <CodeExercise
                    resourceId={coding.resourceId}
                    problem={problem}
                    exercise={exercise}
                    solved={solved}
                    onSolved={() => coding.markSolved(exercise.id)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
