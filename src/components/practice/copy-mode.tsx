'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  accuracyPercent,
  copyFeedback,
  wordsPerMinute,
  type CharState,
  type CompareOptions,
} from '@/lib/practice/scoring';
import { Chip, PrimaryButton, Stat } from './controls';
import type { DrillAudio } from './use-drill-audio';
import type { PracticeDrill } from './types';

const CHAR_CLASS: Record<CharState, string> = {
  correct: 'text-j-text',
  wrong: 'bg-j-error-bg text-j-error underline decoration-j-error',
  pending: 'text-j-text-tertiary',
  neutral: 'text-j-text-tertiary',
};

export interface CopyResult {
  accuracy: number;
  wpm: number;
}

/**
 * Copiar: type the visible text, with live char feedback, accuracy and WPM.
 * Enter checks; Enter again goes to the next drill. Esc plays/pauses the audio.
 * (Dictado, the hidden-text variant, was removed on 2026-11-11: it scored
 * spelling, not what the owner practices.)
 */
export function CopyMode({
  drill,
  audio,
  onResult,
  onNext,
}: {
  drill: PracticeDrill;
  audio: DrillAudio;
  onResult: (result: CopyResult) => void;
  onNext: () => void;
}) {
  const [opts, setOpts] = useState<CompareOptions>({ caseInsensitive: false, ignorePunctuation: false });
  const [typed, setTyped] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<CopyResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const feedback = useMemo(() => copyFeedback(drill.textEn, typed, opts), [drill.textEn, typed, opts]);
  const targetChars = useMemo(() => Array.from(drill.textEn), [drill.textEn]);
  const caret = feedback.states.findIndex((s) => s === 'pending');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const finish = () => {
    if (result) return;
    const elapsed = startedAt ? Date.now() - startedAt : 0;
    const r: CopyResult = {
      accuracy: accuracyPercent(feedback),
      wpm: wordsPerMinute(feedback.typedLength, elapsed),
    };
    setResult(r);
    onResult(r);
  };

  // A copy typed perfectly to the end checks itself.
  useEffect(() => {
    if (!result && feedback.complete && feedback.correct === feedback.targetLength && feedback.extra === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish reads the same feedback
  }, [feedback, result]);

  const reset = () => {
    setTyped('');
    setStartedAt(null);
    setResult(null);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (result) onNext();
      else if (typed.trim()) finish();
    } else if (e.key === 'Escape' && audio.available) {
      e.preventDefault();
      audio.toggle();
    }
  };

  return (
    <div className="space-y-4" data-mode="copy">
      <p className="text-lg leading-relaxed sm:text-xl" lang="en" data-testid="copy-target">
        {targetChars.map((ch, i) => (
          <span
            key={i}
            data-state={feedback.states[i]}
            className={cn(CHAR_CLASS[feedback.states[i]], i === caret && !result && 'border-b-2 border-j-accent')}
          >
            {ch}
          </span>
          ))}
      </p>

      <div className="flex flex-wrap gap-2">
        <Chip active={opts.caseInsensitive} onClick={() => setOpts((o) => ({ ...o, caseInsensitive: !o.caseInsensitive }))}>
          Ignorar mayúsculas
        </Chip>
        <Chip active={opts.ignorePunctuation} onClick={() => setOpts((o) => ({ ...o, ignorePunctuation: !o.ignorePunctuation }))}>
          Ignorar puntuación
        </Chip>
      </div>

      <textarea
        ref={inputRef}
        value={typed}
        onChange={(e) => {
          if (result) return;
          if (!startedAt && e.target.value) setStartedAt(Date.now());
          setTyped(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        readOnly={Boolean(result)}
        rows={5}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        lang="en"
        aria-label="Copiá el texto"
        placeholder="Escribí el texto de arriba…"
        className="w-full resize-y border border-j-border-input bg-j-bg-white p-3 text-base leading-relaxed text-j-text outline-none focus:border-j-accent"
      />

      {!result && (
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton onClick={finish} disabled={!typed.trim()}>Revisar · Enter</PrimaryButton>
          <span className="font-mono text-[11px] tabular-nums text-j-text-tertiary">
            {feedback.correct}/{feedback.targetLength}
          </span>
        </div>
      )}

      {result && (
        <div className="space-y-4" data-testid="type-result">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Precisión" value={`${result.accuracy}%`} />
            <Stat label="WPM" value={String(result.wpm)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={onNext}>Siguiente · Enter</PrimaryButton>
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] border border-j-border-input px-4 font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-secondary hover:border-j-accent hover:text-j-accent"
            >
              Otra vez
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
