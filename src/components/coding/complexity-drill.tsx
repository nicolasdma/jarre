'use client';

/**
 * "Decí el Big-O": short TypeScript fragments under a reading section, one
 * open at a time. For each one the learner says (or picks) the time and space
 * complexity and gets the correction with its reason and the sentence to say
 * (complexity-check.tsx). What was answered is kept in the browser.
 */

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { ComplexityDrill } from '@/lib/coding/format';
import { ComplexityCheck } from './complexity-check';
import { loadComplexity, type ComplexityResult } from './coding-store';
import { useCodeTabsEnabled } from './code-tabs-context';
import { CodeTabsBlock } from './code-tabs-lazy';

const checkIdOf = (itemId: string) => `bigo-${itemId}`;
const allRight = (r: ComplexityResult | undefined) => Boolean(r && r.right.time && r.right.space && r.right.brute !== false);

export function ComplexityDrillView({ resourceId, drill }: { resourceId: string; drill: ComplexityDrill }) {
  const codeTabs = useCodeTabsEnabled();
  const [open, setOpen] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ComplexityResult>>({});
  useEffect(() => setResults(loadComplexity(resourceId)), [resourceId]);

  const right = drill.items.filter((i) => allRight(results[checkIdOf(i.id)])).length;

  return (
    <section className="mt-8 border-t border-j-border pt-6" aria-label={drill.title} data-testid="complexity-drill">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm">{drill.title}</p>
        <p className="font-mono text-[10px] tabular-nums text-j-text-tertiary">
          {right}/{drill.items.length} bien
        </p>
      </div>
      <div className="mb-3 space-y-2 text-sm leading-relaxed text-j-text-secondary [&_code]:bg-j-bg-alt [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_strong]:text-j-text">
        <ReactMarkdown>{drill.instructions}</ReactMarkdown>
      </div>
      <ul className="space-y-2">
        {drill.items.map((item, n) => {
          const isOpen = open === item.id;
          const result = results[checkIdOf(item.id)];
          const mark = result ? (allRight(result) ? '✓' : '✗') : '·';
          const next = drill.items[n + 1];
          return (
            <li key={item.id} className={cn('border', isOpen ? 'border-j-accent' : 'border-j-border')}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left hover:bg-j-bg-alt"
              >
                <span className={cn('w-4 shrink-0 text-xs', !result ? 'text-j-text-tertiary' : allRight(result) ? 'text-j-accent' : 'text-j-error')}>{mark}</span>
                <span className="min-w-0 flex-1 text-sm text-j-text">
                  {n + 1}. {item.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">{isOpen ? 'Cerrar' : 'Abrir'}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-j-border p-3">
                  {codeTabs ? (
                    <CodeTabsBlock code={item.code} lang="ts" />
                  ) : (
                    <pre className="overflow-x-auto border border-j-border bg-j-bg-white p-3 font-mono text-xs leading-relaxed text-j-text">{item.code}</pre>
                  )}
                  <ComplexityCheck
                    resourceId={resourceId}
                    checkId={checkIdOf(item.id)}
                    check={item}
                    prompt="¿Qué Big-O tiene este código? Decilo en voz alta en inglés (tiempo y espacio), o elegilo."
                    onAnswered={(r) => setResults((all) => ({ ...all, [checkIdOf(item.id)]: r }))}
                  />
                  {next && (
                    <button
                      type="button"
                      onClick={() => setOpen(next.id)}
                      className="min-h-[40px] font-mono text-[10px] uppercase tracking-[0.15em] text-j-accent"
                    >
                      Siguiente: {next.title} →
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
