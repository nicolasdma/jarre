'use client';

/**
 * Help that teaches by doing, the first time only (NN/g: contextual help in
 * the moment it is needed, easy to dismiss, beats a tutorial up front).
 *
 * - <Hint>: one line next to a control. Shown until "Entendido"; after that it
 *   shrinks to a "?" that brings it back. Seen per device (localStorage).
 * - useMicPrimer(): before the first use of the microphone, one line that says
 *   why it is asked, then the browser's own prompt. Once per device.
 */

import { useCallback, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

const SEEN_PREFIX = 'jarre-seen:';
const MIC_KEY = 'jarre-mic-primed';
const listeners = new Set<() => void>();

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    // Not remembered on this device: the help shows again next time, which is harmless.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether a first-time hint was already dismissed on this device (false on the server). */
export function useSeen(id: string): [boolean, (seen: boolean) => void] {
  const key = SEEN_PREFIX + id;
  const seen = useSyncExternalStore(subscribe, () => read(key), () => false);
  const set = useCallback((on: boolean) => write(key, on), [key]);
  return [seen, set];
}

export function Hint({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const [seen, setSeen] = useSeen(id);
  if (seen) {
    return (
      <button
        type="button"
        onClick={() => setSeen(false)}
        aria-label="Ver la ayuda"
        title="Ver la ayuda"
        className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full border border-j-border-input font-mono text-[11px] text-j-text-tertiary hover:border-j-accent hover:text-j-accent', className)}
        data-testid={`hint-reopen-${id}`}
      >
        ?
      </button>
    );
  }
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-j-warm pl-3', className)} data-testid={`hint-${id}`}>
      <p className="text-sm text-j-text-secondary">{children}</p>
      <button
        type="button"
        onClick={() => setSeen(true)}
        className="min-h-[32px] font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary underline underline-offset-4 hover:text-j-text"
      >
        Entendido
      </button>
    </div>
  );
}

/**
 * `run(start)`: starts right away once the line was accepted on this device;
 * the first time it shows `prompt` and starts on "Permitir el micrófono". The
 * start always runs inside a click, so the browser's own prompt and any audio
 * it plays keep the user's gesture.
 */
export function useMicPrimer(): { run: (start: () => void) => void; prompt: React.ReactNode } {
  const [pending, setPending] = useState<(() => void) | null>(null);

  const run = useCallback((start: () => void) => {
    if (read(MIC_KEY)) start();
    else setPending(() => start);
  }, []);

  const prompt = pending ? (
    <div className="space-y-3 border border-j-warm bg-j-warm-light px-4 py-3" role="dialog" aria-label="Micrófono" data-testid="mic-primer">
      <p className="text-sm text-j-text">
        Para escucharte necesito el micrófono. Tu navegador te va a pedir permiso. Nada se guarda sin que lo pidas.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const start = pending;
            setPending(null);
            write(MIC_KEY, true);
            start();
          }}
          className="min-h-[44px] bg-j-accent px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-on-accent hover:bg-j-accent-hover"
        >
          Permitir el micrófono
        </button>
        <button
          type="button"
          onClick={() => setPending(null)}
          className="min-h-[44px] px-3 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary hover:text-j-text"
        >
          Ahora no
        </button>
      </div>
    </div>
  ) : null;

  return { run, prompt };
}
