'use client';

/**
 * One drill with every way to practice it: listen, copy, repeat
 * and sentence by sentence. Lives inside the learn view, under the section the drill
 * belongs to and in the lesson's Practice step; best scores are kept per
 * device (best-scores.ts).
 */

import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { recordScore, recordShadowed, type BestScores, type DrillBest } from './best-scores';
import { ListenMode } from './listen-mode';
import { RepeatMode } from './repeat-mode';
import { SentenceMode } from './sentence-mode';
import { CopyMode, type CopyResult } from './copy-mode';
import { useDrillAudio } from './use-drill-audio';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { DRILL_MODES, type DrillMode, type PracticeDrill } from './types';

interface DrillTrainerProps {
  resourceId: string;
  drill: PracticeDrill;
  /** The lesson's key terms: sound-alikes for the recognizer, respellings. */
  keyTerms: readonly KeyTerm[];
  mode: DrillMode;
  onModeChange: (mode: DrillMode) => void;
  onScores: (scores: BestScores) => void;
  scores: BestScores;
  /** Previous and next drill, when the trainer walks a list. */
  onPrev?: () => void;
  onNext?: () => void;
  /** "3/8" or similar, shown between the arrows. */
  position?: string;
}

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && (el as HTMLInputElement).type !== 'checkbox') || (el as HTMLElement).isContentEditable;
}

export function bestLine(best: DrillBest | undefined): string | null {
  if (!best) return null;
  const parts: string[] = [];
  if (best.copy) parts.push(`copiar ${best.copy.score}%${best.copy.wpm ? ` · ${best.copy.wpm} wpm` : ''}`);
  if (best.repeat) parts.push(`repetir ${best.repeat.score}%`);
  if (best.sentences) parts.push(`frases ${best.sentences.score}% a la primera`);
  else if (best.shadowed) parts.push(`frase por frase ×${best.shadowed}`);
  return parts.length ? parts.join(' · ') : null;
}

/** A drill counts as practiced once any mode has a result. */
export function isPracticed(best: DrillBest | undefined): boolean {
  return !!best && !!(best.copy || best.repeat || best.sentences || best.shadowed);
}

export function DrillTrainer({ resourceId, drill, keyTerms, mode, onModeChange, onScores, scores, onPrev, onNext, position }: DrillTrainerProps) {
  const audio = useDrillAudio(drill.audioUrl, drill.textEn);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      // Frase por frase has its own keys (Space: listen to the sentence).
      if (e.key === ' ' && mode !== 'sentences' && document.activeElement?.closest('[data-drill-trainer]')) {
        e.preventDefault();
        audio.toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audio, mode]);

  const onCopyResult = useCallback(
    (r: CopyResult) => onScores(recordScore(resourceId, drill.slug, 'copy', r.accuracy, r.wpm)),
    [drill.slug, onScores, resourceId],
  );
  const onRepeatScore = useCallback((score: number) => onScores(recordScore(resourceId, drill.slug, 'repeat', score)), [drill.slug, onScores, resourceId]);
  const onSentences = useCallback(
    (firstTry: number | null) =>
      onScores(firstTry === null ? recordShadowed(resourceId, drill.slug) : recordScore(resourceId, drill.slug, 'sentences', firstTry)),
    [drill.slug, onScores, resourceId],
  );
  const next = onNext ?? (() => {});
  const best = bestLine(scores[drill.slug]);

  return (
    <div className="space-y-4" data-drill-trainer data-testid="drill-trainer">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-j-text" data-testid="drill-title">{drill.title}</p>
          {best && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-accent">Mejor: {best}</p>}
          {!drill.audioUrl && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Voz del navegador</p>}
        </div>
        {(onPrev || onNext) && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Drill anterior"
              className="flex h-11 w-11 items-center justify-center border border-j-border-input text-j-text-secondary hover:border-j-accent disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            {position && <span className="w-12 text-center font-mono text-[11px] tabular-nums text-j-text-secondary">{position}</span>}
            <button type="button" onClick={onNext} disabled={!onNext} aria-label="Drill siguiente"
              className="flex h-11 w-11 items-center justify-center border border-j-border-input text-j-text-secondary hover:border-j-accent disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <nav className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Modo de práctica">
        {DRILL_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'min-h-[40px] shrink-0 border px-3 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors',
              mode === m.id ? 'border-j-accent bg-j-accent text-j-text-on-accent' : 'border-j-border-input text-j-text-secondary hover:border-j-accent',
            )}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {mode === 'listen' && <ListenMode key={drill.slug} drill={drill} audio={audio} />}
      {mode === 'copy' && <CopyMode key={`copy-${drill.slug}`} drill={drill} audio={audio} onResult={onCopyResult} onNext={next} />}
      {mode === 'repeat' && <RepeatMode key={drill.slug} drill={drill} audio={audio} terms={keyTerms} onScore={onRepeatScore} />}
      {mode === 'sentences' && <SentenceMode key={drill.slug} drill={drill} audio={audio} terms={keyTerms} onFinished={onSentences} />}
    </div>
  );
}
