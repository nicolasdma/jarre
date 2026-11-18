'use client';

/**
 * The "Ver paso a paso" button under a solution's code, and the dialog it
 * opens. Renders nothing unless the registry has a trace for this exact code
 * (src/lib/code-trace/registry.ts), so it can sit under any code block. The
 * player and the problem's generator load only on click.
 *
 * A native <dialog> opened with showModal(): focus moves in and is kept there,
 * Esc closes, the page behind is inert, and focus returns to the button.
 * Full screen on a phone, a large panel on a desktop.
 */

import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Footprints, X } from 'lucide-react';
import { findTrace } from '@/lib/code-trace/registry';
import type { TraceDef } from '@/lib/code-trace/trace';

const CodeTrace = lazy(() => import('./code-trace').then((m) => ({ default: m.CodeTrace })));

export function TraceLauncher({ code, className = 'mt-2' }: { code: string; className?: string }) {
  const entry = useMemo(() => findTrace(code), [code]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [def, setDef] = useState<TraceDef<any, any> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  if (!entry) return null;

  const show = () => {
    setOpen(true);
    if (!def) {
      entry
        .load()
        .then((m) => setDef(m.default))
        .catch(() => setFailed(true));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        onPointerEnter={() => void import('./code-trace')}
        className={`${className} inline-flex min-h-[40px] items-center gap-2 rounded border border-j-accent px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-j-accent transition-colors hover:bg-j-accent hover:text-j-text-on-accent`}
        data-testid="trace-launcher"
      >
        <Footprints size={14} aria-hidden />
        Ver paso a paso
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        aria-label={`${entry.id}: paso a paso`}
        className="m-0 max-h-none w-full max-w-none bg-j-bg p-0 text-j-text backdrop:bg-black/40 max-md:h-full md:m-auto md:max-h-[92vh] md:w-[min(1120px,94vw)] md:rounded-xl md:border md:border-j-border"
      >
        {open && (
          <div className="flex flex-col max-md:h-full md:max-h-[92vh]">
            <div className="flex items-center justify-between gap-3 border-b border-j-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-j-text">{def?.title ?? 'Paso a paso'}</p>
                {def && <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{def.pattern}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-j-border text-j-text hover:bg-j-bg-hover"
                aria-label="Cerrar"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
              {failed ? (
                <p className="py-8 text-sm text-j-text-secondary">No se pudo cargar el recorrido. Probá de nuevo.</p>
              ) : def ? (
                <Suspense fallback={<p className="py-8 font-mono text-xs text-j-text-tertiary">Cargando…</p>}>
                  <CodeTrace def={def} autoFocus />
                </Suspense>
              ) : (
                <p className="py-8 font-mono text-xs text-j-text-tertiary">Cargando…</p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
