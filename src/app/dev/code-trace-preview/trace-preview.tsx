'use client';

import { useEffect, useState } from 'react';
import { TRACE_INDEX } from '@/lib/code-trace/registry';
import type { TraceDef } from '@/lib/code-trace/trace';
import { CodeTrace } from '@/components/code-trace/code-trace';
import { TraceLauncher } from '@/components/code-trace/trace-launcher';

export function TracePreview({ id, example, step, dialog }: { id: string | null; example: number; step: number; dialog: boolean }) {
  const entry = TRACE_INDEX.find((e) => e.id === id) ?? TRACE_INDEX[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [def, setDef] = useState<TraceDef<any, any> | null>(null);

  useEffect(() => {
    let live = true;
    void entry.load().then((m) => {
      if (live) setDef(m.default);
    });
    return () => {
      live = false;
    };
  }, [entry]);

  return (
    <div className="min-h-screen bg-j-bg px-4 py-6 text-j-text md:px-8">
      <nav className="mb-4 flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap" aria-label="Problemas con recorrido">
        {TRACE_INDEX.map((e) => (
          <a
            key={e.id}
            href={`?id=${e.id}${dialog ? '&dialog=1' : ''}`}
            className={'shrink-0 rounded border px-2 py-0.5 font-mono text-[11px] ' + (e.id === entry.id ? 'border-j-accent bg-j-accent text-j-text-on-accent' : 'border-j-border text-j-text-secondary')}
          >
            {e.id}
          </a>
        ))}
      </nav>
      {def && (
        <div className="mx-auto max-w-[1120px]">
          <h1 className="mb-1 text-xl font-light">{def.title}</h1>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{def.pattern}</p>
          {dialog ? (
            <div className="max-w-[680px]">
              <pre className="overflow-x-auto rounded-lg border border-j-border bg-j-bg-white p-3 font-mono text-xs">{def.code}</pre>
              <TraceLauncher code={def.code} />
            </div>
          ) : (
            <CodeTrace key={def.id} def={def} initialExample={example} initialStep={step} />
          )}
        </div>
      )}
    </div>
  );
}
