'use client';

/**
 * A lesson code block with its step-by-step trace, in the page flow.
 *
 * Wraps the block exactly as the lesson renders it (`children`). When the
 * registry has a trace for this exact code (src/lib/code-trace/registry.ts),
 * a "Ver paso a paso" button sits under the block; opening it turns the block
 * itself into the trace's code view (the same code and JS | TS choice, with
 * the current line lit) followed by the caption, the state and the controls.
 * "Cerrar" puts the plain block back. Nothing else on the page moves or hides.
 * No trace for this code: renders `children` untouched.
 *
 * The player and the problem's generator load only when the learner opens it
 * (and are warmed on hover); until they arrive the plain block stays on screen.
 */

import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Footprints } from 'lucide-react';
import { findTrace } from '@/lib/code-trace/registry';
import type { TraceDef } from '@/lib/code-trace/trace';

const CodeTrace = lazy(() => import('./code-trace').then((m) => ({ default: m.CodeTrace })));

export function TracedCode({ code, children, buttonClassName = 'mt-2' }: { code: string; children: ReactNode; buttonClassName?: string }) {
  const entry = useMemo(() => findTrace(code), [code]);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [def, setDef] = useState<TraceDef<any, any> | null>(null);
  const [failed, setFailed] = useState(false);

  if (!entry) return <>{children}</>;

  const show = () => {
    setOpen(true);
    setFailed(false);
    if (!def) {
      entry
        .load()
        .then((m) => setDef(m.default))
        .catch(() => setFailed(true));
    }
  };

  if (open && def) {
    return (
      <div className="mb-6" data-testid="traced-code-open">
        <Suspense fallback={children}>
          <CodeTrace def={def} autoFocus onClose={() => setOpen(false)} />
        </Suspense>
      </div>
    );
  }

  return (
    <>
      {children}
      <button
        type="button"
        onClick={show}
        onPointerEnter={() => void import('./code-trace')}
        aria-expanded={open}
        className={`${buttonClassName} inline-flex min-h-[40px] items-center gap-2 rounded border border-j-accent px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-j-accent transition-colors hover:bg-j-accent hover:text-j-text-on-accent`}
        data-testid="trace-launcher"
      >
        <Footprints size={14} aria-hidden />
        {open && !failed ? 'Cargando…' : 'Ver paso a paso'}
      </button>
      {failed && <p className="mt-1 text-xs text-j-text-secondary">No se pudo cargar el recorrido. Probá de nuevo.</p>}
    </>
  );
}
