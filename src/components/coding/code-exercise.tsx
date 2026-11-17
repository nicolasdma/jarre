'use client';

/**
 * One code exercise inside a reading section: the problem, the editor with
 * the exercise's starter, Run (the file and its console.log) and Test (the
 * example and hidden tests), all in a sandboxed Web Worker. The draft is
 * kept in the browser; passing every test marks the exercise done and opens
 * the complexity step (time and space, said or picked; complexity-check.tsx).
 * The reference solution opens after a first test run.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { CodingExercise as Exercise, CodingProblem } from '@/lib/coding/format';
import type { RunResult } from '@/lib/coding/harness';
import { runInWorker } from '@/lib/coding/run-in-worker';
import { CodeEditor } from './code-editor';
import { RunOutput, summarizeRun } from './run-output';
import { ProblemStatement } from './problem-statement';
import { clearDraft, loadDraft, saveDraft } from './coding-store';
import { ComplexityCheck } from './complexity-check';

interface CodeExerciseProps {
  resourceId: string;
  problem: CodingProblem;
  exercise: Exercise;
  solved: boolean;
  onSolved: () => void;
}

const LEVEL_LABEL: Record<Exercise['level'], string> = { guided: 'Guiado', blank: 'En blanco' };

export function CodeExercise({ resourceId, problem, exercise, solved, onSolved }: CodeExerciseProps) {
  const [code, setCode] = useState(exercise.starter);
  const [result, setResult] = useState<RunResult | null>(null);
  const [label, setLabel] = useState<string>('');
  const [running, setRunning] = useState(false);
  const [tested, setTested] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const draft = loadDraft(resourceId, exercise.id);
    if (draft) setCode(draft);
  }, [resourceId, exercise.id]);

  const change = useCallback(
    (next: string) => {
      setCode(next);
      saveDraft(resourceId, exercise.id, next);
    },
    [resourceId, exercise.id],
  );

  const allTests = useMemo(() => `${problem.example_tests}\n${problem.tests}`, [problem]);

  const run = useCallback(
    async (withTests: boolean) => {
      setRunning(true);
      const r = await runInWorker({ code, tests: withTests ? allTests : undefined, exportNames: problem.exports });
      setResult(r);
      setLabel(withTests ? 'Tests (ejemplos y casos ocultos)' : 'Salida de tu código');
      setRunning(false);
      if (withTests) {
        setTested(true);
        const summary = summarizeRun(r);
        const allPass = r.ok && summary.total > 0 && summary.passed === summary.total;
        setPassed(allPass);
        if (allPass && !solved) onSolved();
      }
    },
    [code, allTests, problem.exports, solved, onSolved],
  );

  return (
    <div className="space-y-4" data-testid="code-exercise">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={cn('font-mono text-[10px] uppercase tracking-[0.15em]', exercise.level === 'guided' ? 'text-j-warm' : 'text-j-accent')}>
          {LEVEL_LABEL[exercise.level]}
        </span>
        {solved && <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-success">✓ Todos los tests</span>}
      </div>

      <div className="space-y-2 text-sm leading-relaxed text-j-text-secondary [&_code]:bg-j-bg-alt [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_strong]:text-j-text">
        <ReactMarkdown>{exercise.instructions}</ReactMarkdown>
      </div>

      <details className="border border-j-border px-3 py-2" open={exercise.level === 'blank'}>
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">El enunciado</summary>
        <div className="pt-3">
          <ProblemStatement problem={problem} />
        </div>
      </details>

      <CodeEditor value={code} onChange={change} onRun={() => void run(true)} height="360px" ariaLabel={`Editor: ${exercise.title}`} />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run(true)}
          disabled={running}
          className="min-h-[44px] bg-j-accent px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-on-accent disabled:opacity-60"
        >
          Probar <span className="normal-case opacity-70">(⌘↵)</span>
        </button>
        <button
          type="button"
          onClick={() => void run(false)}
          disabled={running}
          className="min-h-[44px] border border-j-border-input px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text hover:border-j-accent disabled:opacity-60"
        >
          Correr
        </button>
        <button
          type="button"
          onClick={() => {
            change(exercise.starter);
            clearDraft(resourceId, exercise.id);
            setResult(null);
          }}
          className="min-h-[44px] px-3 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-tertiary hover:text-j-text"
        >
          Reiniciar
        </button>
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          disabled={!tested && !solved}
          title={!tested && !solved ? 'Probá tus tests primero' : undefined}
          className="ml-auto min-h-[44px] px-3 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-tertiary hover:text-j-text disabled:cursor-not-allowed disabled:opacity-40"
        >
          {showSolution ? 'Ocultar solución' : 'Ver solución'}
        </button>
      </div>

      <RunOutput result={result} running={running} label={label} />

      {problem.complexity && (passed || solved) && (
        <ComplexityCheck resourceId={resourceId} checkId={exercise.id} check={problem.complexity} />
      )}

      {showSolution && <SolutionPanel problem={problem} />}
    </div>
  );
}

export function SolutionPanel({ problem }: { problem: CodingProblem }) {
  return (
    <div className="space-y-3 border border-j-border bg-j-bg-alt p-3" data-testid="solution-panel">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
        Solución de referencia · {problem.solution.time} tiempo · {problem.solution.space} espacio
      </p>
      <p className="text-sm text-j-text" lang="en">
        {problem.solution.approach}
      </p>
      <pre className="overflow-x-auto bg-j-bg-white p-3 font-mono text-xs leading-relaxed text-j-text">{problem.solution.code}</pre>
      {problem.pitfalls.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Errores típicos</p>
          <ul className="list-disc pl-5 text-sm text-j-text-secondary" lang="en">
            {problem.pitfalls.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
