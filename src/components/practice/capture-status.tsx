'use client';

import { useEffect, useState } from 'react';
import type { CapturePhase } from './recognition';

export interface Capture {
  phase: CapturePhase;
  /** When this phase started (Date.now()). */
  since: number;
}

function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Where a take of the server recognizer is (recognition.ts): a red dot and
 * the time while the mic records, then "Transcribiendo…" until the text is
 * back. The browser's recognizer never reports a phase, so this never shows
 * on desktop Chrome.
 */
export function CaptureStatus({ capture, hint }: { capture: Capture; hint?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (capture.phase !== 'recording') return;
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [capture.phase, capture.since]);

  if (capture.phase === 'transcribing') {
    return (
      <span className="text-j-text-secondary" data-testid="capture-status" data-capture="transcribing">
        Transcribiendo…
      </span>
    );
  }
  return (
    <span className="text-j-error" data-testid="capture-status" data-capture="recording">
      <span className="animate-pulse" aria-hidden>●</span> Grabando <span className="tabular-nums">{clock(now - capture.since)}</span>
      {hint ? ` · ${hint}` : ''}
    </span>
  );
}
