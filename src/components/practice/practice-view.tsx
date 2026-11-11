'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadBestScores, recordScore, recordShadowed, type BestScores, type DrillBest } from './best-scores';
import { ListenMode } from './listen-mode';
import { RepeatMode } from './repeat-mode';
import { ShadowMode } from './shadow-mode';
import { TypeMode, type TypeResult } from './type-mode';
import { useDrillAudio } from './use-drill-audio';
import { PRACTICE_MODES, type PracticeDrill, type PracticeMode } from './types';

interface PracticeViewProps {
  resourceId: string;
  resourceTitle: string;
  drills: PracticeDrill[];
  initialSlug?: string;
  initialMode: PracticeMode;
  embed: boolean;
}

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && (el as HTMLInputElement).type !== 'checkbox') || (el as HTMLElement).isContentEditable;
}

function bestLine(best: DrillBest | undefined): string | null {
  if (!best) return null;
  const parts: string[] = [];
  if (best.copy) parts.push(`copiar ${best.copy.score}%${best.copy.wpm ? ` · ${best.copy.wpm} wpm` : ''}`);
  if (best.dictation) parts.push(`dictado ${best.dictation.score}%`);
  if (best.repeat) parts.push(`repetir ${best.repeat.score}%`);
  if (best.shadowed) parts.push(`shadowing ×${best.shadowed}`);
  return parts.length ? parts.join(' · ') : null;
}

export function PracticeView({ resourceId, resourceTitle, drills, initialSlug, initialMode, embed }: PracticeViewProps) {
  const [index, setIndex] = useState(() => Math.max(0, drills.findIndex((d) => d.slug === initialSlug)));
  const [mode, setMode] = useState<PracticeMode>(initialMode);
  const [scores, setScores] = useState<BestScores>({});
  const drill = drills[index];
  const audio = useDrillAudio(drill?.audioUrl ?? null, drill?.textEn ?? '');

  useEffect(() => {
    setScores(loadBestScores(resourceId));
  }, [resourceId]);

  // Keep the position in the URL so a reload (or a shared link) lands on the same drill and mode.
  useEffect(() => {
    if (!drill) return;
    const url = new URL(window.location.href);
    url.searchParams.set('drill', drill.slug);
    url.searchParams.set('mode', mode);
    window.history.replaceState(null, '', url);
  }, [drill, mode]);

  const go = useCallback((delta: number) => {
    setIndex((i) => Math.min(drills.length - 1, Math.max(0, i + delta)));
  }, [drills.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      if (e.key === ' ') {
        e.preventDefault();
        audio.toggle();
      } else if (e.key === 'Enter' && (document.activeElement === document.body || document.activeElement === null)) {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowRight') {
        go(1);
      } else if (e.key === 'ArrowLeft') {
        go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audio, go]);

  const onTypeResult = useCallback((r: TypeResult) => {
    if (!drill) return;
    setScores(mode === 'dictation'
      ? recordScore(resourceId, drill.slug, 'dictation', r.wordScore)
      : recordScore(resourceId, drill.slug, 'copy', r.accuracy, r.wpm));
  }, [drill, mode, resourceId]);

  const onRepeatScore = useCallback((score: number) => {
    if (drill) setScores(recordScore(resourceId, drill.slug, 'repeat', score));
  }, [drill, resourceId]);

  const onShadowed = useCallback(() => {
    if (drill) setScores(recordShadowed(resourceId, drill.slug));
  }, [drill, resourceId]);

  if (!drill) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg px-6 text-center">
        <p className="text-j-text-secondary">Este recurso todavía no tiene ejercicios de práctica.</p>
      </div>
    );
  }

  const best = bestLine(scores[drill.slug]);
  const withAudio = drills.filter((d) => d.audioUrl).length;

  return (
    <div className="min-h-screen bg-j-bg" data-testid="practice-view">
      <div className="sticky top-0 z-20 border-b border-j-border bg-j-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {!embed && (
            <Link href={`/learn/${resourceId}`} className="shrink-0 text-sm text-j-text-tertiary hover:text-j-text" aria-label="Volver a la lección">
              ←
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-j-text-tertiary">Práctica</p>
            <p className="truncate text-sm font-medium text-j-text">{resourceTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="Drill anterior"
              className="flex h-10 w-10 items-center justify-center border border-j-border-input text-j-text-secondary hover:border-j-accent disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span className="w-14 text-center font-mono text-[11px] tabular-nums text-j-text-secondary" data-testid="drill-counter">
              {index + 1}/{drills.length}
            </span>
            <button type="button" onClick={() => go(1)} disabled={index === drills.length - 1} aria-label="Drill siguiente"
              className="flex h-10 w-10 items-center justify-center border border-j-border-input text-j-text-secondary hover:border-j-accent disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-2xl gap-1 overflow-x-auto px-4 pb-3" role="tablist" aria-label="Modo de práctica">
          {PRACTICE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'min-h-[40px] shrink-0 border px-3 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors',
                mode === m.id ? 'border-j-accent bg-j-accent text-j-text-on-accent' : 'border-j-border-input text-j-text-secondary hover:border-j-accent',
              )}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <div className="space-y-2">
          <select
            value={drill.slug}
            onChange={(e) => setIndex(drills.findIndex((d) => d.slug === e.target.value))}
            aria-label="Elegir drill"
            className="w-full border border-j-border-input bg-j-bg-white px-3 py-2 text-sm text-j-text"
          >
            {drills.map((d, i) => (
              <option key={d.slug} value={d.slug}>
                {i + 1}. {d.title}{d.audioUrl ? '' : ' (voz del navegador)'}
              </option>
            ))}
          </select>
          <h1 className="text-2xl font-bold text-j-text" data-testid="drill-title">{drill.title}</h1>
          {best && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-accent">Mejor: {best}</p>}
        </div>

        {mode === 'listen' && <ListenMode key={drill.slug} drill={drill} audio={audio} />}
        {mode === 'copy' && <TypeMode key={`copy-${drill.slug}`} drill={drill} audio={audio} hidden={false} onResult={onTypeResult} onNext={() => go(1)} />}
        {mode === 'dictation' && <TypeMode key={`dict-${drill.slug}`} drill={drill} audio={audio} hidden onResult={onTypeResult} onNext={() => go(1)} />}
        {mode === 'repeat' && <RepeatMode key={drill.slug} drill={drill} audio={audio} onScore={onRepeatScore} />}
        {mode === 'shadow' && <ShadowMode key={drill.slug} drill={drill} audio={audio} onFinished={onShadowed} />}

        <p className="border-t border-j-border pt-4 font-mono text-[10px] leading-relaxed text-j-text-tertiary">
          Espacio: reproducir o pausar · Enter: revisar o siguiente · ← →: drill anterior o siguiente · {withAudio}/{drills.length} con audio
        </p>
      </main>
    </div>
  );
}
