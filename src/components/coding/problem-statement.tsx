'use client';

/** A problem as it is shown on screen: the statement, the examples and the constraints. */

import type { CodingProblem } from '@/lib/coding/format';

const DIFFICULTY: Record<CodingProblem['difficulty'], string> = { easy: 'Fácil', medium: 'Medio', hard: 'Difícil' };

export function ProblemStatement({ problem, showConstraints = true }: { problem: CodingProblem; showConstraints?: boolean }) {
  return (
    <div className="space-y-3 text-sm" lang="en">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
        {DIFFICULTY[problem.difficulty]} · {problem.pattern}
      </p>
      <p className="leading-relaxed text-j-text">{problem.statement}</p>
      {problem.examples.length > 0 && (
        <ul className="space-y-1.5">
          {problem.examples.map((e, i) => (
            <li key={i} className="border-l-2 border-j-border pl-3 font-mono text-xs text-j-text-secondary">
              <span className="text-j-text">{e.input}</span> → <span className="text-j-text">{e.output}</span>
              {e.note && <span className="block font-sans text-j-text-tertiary">{e.note}</span>}
            </li>
          ))}
        </ul>
      )}
      {showConstraints && problem.constraints.length > 0 && (
        <p className="font-mono text-xs text-j-text-tertiary">{problem.constraints.join(' · ')}</p>
      )}
    </div>
  );
}
