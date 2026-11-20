'use client';

/** What a run printed and which tests passed, under the editor. */

import { cn } from '@/lib/utils';
import type { RunResult } from '@/lib/coding/harness';
import type { CodeLanguage } from '@/lib/coding/languages';

export function summarizeRun(r: RunResult): { passed: number; total: number } {
  const lessonTests = r.tests.filter((t) => !t.own);
  return { passed: lessonTests.filter((t) => t.pass).length, total: lessonTests.length };
}

export function RunOutput({ result, running, label, language }: { result: RunResult | null; running: boolean; label?: string; language?: CodeLanguage }) {
  if (running) {
    return (
      <p className="border border-j-border bg-j-bg-alt px-3 py-2 font-mono text-xs text-j-text-secondary" aria-live="polite">
        Corriendo…
      </p>
    );
  }
  if (!result) return null;
  const { passed, total } = summarizeRun(result);
  const own = result.tests.filter((t) => t.own);

  return (
    <div className="space-y-2 border border-j-border bg-j-bg-alt px-3 py-2 font-mono text-xs" aria-live="polite" data-testid="run-output">
      {label && <p className="text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{label}</p>}
      {result.compileError && (
        <p className="whitespace-pre-wrap text-j-error">
          No compila ({result.compileError.file === 'solution' ? 'tu código' : 'los tests'}
          {result.compileError.line ? `, línea ${result.compileError.line}` : ''}): {result.compileError.message}
        </p>
      )}
      {result.runtimeError && <p className="whitespace-pre-wrap text-j-error">{result.runtimeError}</p>}
      {total > 0 && (
        <p className={cn('font-medium', passed === total ? 'text-j-success' : 'text-j-error')}>
          {passed}/{total} tests pasan
        </p>
      )}
      {[...result.tests.filter((t) => !t.own), ...own].length > 0 && (
        <ul className="space-y-1">
          {[...result.tests.filter((t) => !t.own), ...own].map((t, i) => (
            <li key={i} className={cn(t.pass ? 'text-j-text-secondary' : 'text-j-text')}>
              <span className={t.pass ? 'text-j-success' : 'text-j-error'}>{t.pass ? '✓' : '✗'}</span> {t.own ? '(tuyo) ' : ''}
              {t.name}
              {!t.pass && t.error && <span className="block pl-4 text-j-error">{t.error}</span>}
            </li>
          ))}
        </ul>
      )}
      {result.logs.length > 0 && (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-j-border pt-2 text-j-text">{result.logs.join('\n')}</pre>
      )}
      {result.ok && total === 0 && own.length === 0 && result.logs.length === 0 && (
        <p className="text-j-text-tertiary">Corrió sin salida. Agregá un {language === 'python' ? 'print' : 'console.log'} o probá los tests.</p>
      )}
    </div>
  );
}
