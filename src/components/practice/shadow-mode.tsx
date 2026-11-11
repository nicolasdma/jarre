'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { splitSentences } from '@/lib/practice/scoring';
import { Chip, PrimaryButton } from './controls';
import type { DrillAudio, PlaybackRate } from './use-drill-audio';
import type { PracticeDrill } from './types';

type Gap = 0 | 1 | 2 | 3 | 'sentence';
const GAPS: { id: Gap; label: string }[] = [
  { id: 0, label: '0 s' },
  { id: 1, label: '1 s' },
  { id: 2, label: '2 s' },
  { id: 3, label: '3 s' },
  { id: 'sentence', label: '= frase' },
];

function gapMs(gap: Gap, sentenceSec: number, rate: PlaybackRate): number {
  return gap === 'sentence' ? (sentenceSec / rate) * 1000 : gap * 1000;
}

/**
 * Shadowing: the audio plays sentence by sentence, the current sentence is
 * highlighted, and a pause after each one leaves room to say it. Sentence
 * timing is proportional to its length (no word alignment exists).
 */
export function ShadowMode({
  drill,
  audio,
  onFinished,
}: {
  drill: PracticeDrill;
  audio: DrillAudio;
  onFinished: () => void;
}) {
  const sentences = useMemo(() => splitSentences(drill.textEn), [drill.textEn]);
  const [gap, setGap] = useState<Gap>(2);
  const [current, setCurrent] = useState<number | null>(null);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'gap'>('idle');
  const runRef = useRef(0);

  useEffect(() => () => {
    runRef.current++;
  }, []);

  const stop = () => {
    runRef.current++;
    audio.pause();
    setPhase('idle');
  };

  const run = async (from: number, only = false) => {
    if (!audio.available || !audio.ready || audio.duration <= 0) return;
    const run = ++runRef.current;
    const total = audio.duration;
    for (let i = from; i < sentences.length; i++) {
      setCurrent(i);
      setPhase('playing');
      const s = sentences[i];
      const ok = await audio.playSegment(s.start * total, s.end * total);
      if (!ok || runRef.current !== run) return;
      const wait = gapMs(gap, (s.end - s.start) * total, audio.rate);
      if (wait > 0) {
        setPhase('gap');
        await new Promise((r) => setTimeout(r, wait));
        if (runRef.current !== run) return;
      }
      if (only) break;
    }
    setPhase('idle');
    if (!only) {
      setCurrent(null);
      onFinished();
    }
  };

  if (!audio.available) {
    return (
      <p className="border border-dashed border-j-border px-3 py-3 font-mono text-[11px] text-j-text-tertiary" data-mode="shadow">
        Shadowing necesita el audio, y este drill todavía no lo tiene.
      </p>
    );
  }

  return (
    <div className="space-y-5" data-mode="shadow">
      <div className="flex flex-wrap items-center gap-2">
        {phase === 'idle' ? (
          <PrimaryButton onClick={() => run(current ?? 0)} disabled={!audio.ready}>
            {current === null ? 'Empezar' : 'Seguir'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={stop}>Parar</PrimaryButton>
        )}
        {([0.75, 1] as PlaybackRate[]).map((r) => (
          <Chip key={r} active={audio.rate === r} onClick={() => audio.setRate(r)}>{r}×</Chip>
        ))}
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Pausa entre frases</p>
        <div className="flex flex-wrap gap-1">
          {GAPS.map((g) => (
            <Chip key={String(g.id)} active={gap === g.id} onClick={() => setGap(g.id)}>{g.label}</Chip>
          ))}
        </div>
      </div>

      <ol className="space-y-2" lang="en">
        {sentences.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => run(i, true)}
              data-current={i === current}
              className={cn(
                'w-full border-l-2 px-3 py-2 text-left text-base leading-relaxed transition-colors sm:text-lg',
                i === current
                  ? 'border-j-accent bg-j-accent-light text-j-text'
                  : 'border-transparent text-j-text-secondary hover:border-j-border',
              )}
            >
              {s.text}
              {i === current && phase === 'gap' && (
                <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.15em] text-j-accent">· tu turno</span>
              )}
            </button>
          </li>
        ))}
      </ol>
      <p className="font-mono text-[10px] text-j-text-tertiary">Tocá una frase para repetir solo esa.</p>
    </div>
  );
}
