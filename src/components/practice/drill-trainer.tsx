'use client';

/**
 * One drill with every way to practice it: listen, copy, repeat,
 * sentence by sentence, and last, answer from the question alone. Lives inside the learn view, under the section the drill
 * belongs to and in the lesson's Practice step; best scores are kept per
 * device (best-scores.ts).
 */

import { useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { recordListened, recordRecall, recordScore, recordShadowed, type BestScores, type DrillBest } from './best-scores';
import { drillModes, isModeApproved } from '@/lib/practice/drill-progress';
import { ListenMode } from './listen-mode';
import { RecallMode } from './recall-mode';
import { dueLabel, type RecallRating } from '@/lib/practice/recall';
import { RepeatMode } from './repeat-mode';
import { SentenceMode } from './sentence-mode';
import { CopyMode, type CopyResult } from './copy-mode';
import { useDrillAudio } from './use-drill-audio';
import type { KeyTerm } from '@/lib/practice/key-terms';
import type { SentencesResult } from '@/lib/practice/phrase-drill';
import { DRILL_MODES, type DrillMode, type PracticeDrill } from './types';

interface DrillTrainerProps {
  resourceId: string;
  drill: PracticeDrill;
  /** The interviewer's English question for this drill, if the lesson has one. */
  ask?: string;
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
  /** Pregunta → respuesta: go to the next drill due for review, if any. */
  onNextDue?: () => void;
}

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'SELECT' || (tag === 'INPUT' && (el as HTMLInputElement).type !== 'checkbox') || (el as HTMLElement).isContentEditable;
}

export function bestLine(best: DrillBest | undefined): string | null {
  if (!best) return null;
  const parts: string[] = [];
  if (best.copy) parts.push(`copiar ${best.copy.score} %`);
  if (best.repeat) parts.push(`repetir ${best.repeat.score} %`);
  if (best.sentencesWell) parts.push(`frase por frase ${best.sentencesWell.score} % bien${best.sentences ? `, ${best.sentences.score} % a la primera` : ''}`);
  else if (best.sentences) parts.push(`frase por frase ${best.sentences.score} % a la primera`);
  else if (best.shadowed) parts.push(`frase por frase ×${best.shadowed}`);
  if (best.recall) parts.push(`sin mirar ${best.recall.got} de ${best.recall.tries} · repaso ${dueLabel(best.recall)}`);
  return parts.length ? parts.join(' · ') : null;
}

/** A drill counts as practiced once any mode has a result. */
export function isPracticed(best: DrillBest | undefined): boolean {
  return !!best && !!(best.listened || best.copy || best.repeat || best.sentences || best.sentencesWell || best.shadowed || best.recall);
}

export function DrillTrainer({ resourceId, drill, ask, keyTerms, mode, onModeChange, onScores, scores, onPrev, onNext, position, onNextDue }: DrillTrainerProps) {
  const audio = useDrillAudio(drill.audioUrl, drill.textEn);
  const tabsRef = useRef<HTMLElement>(null);

  // On a phone the mode tabs scroll sideways: keep the chosen one in view
  // (Pregunta → respuesta, the last, starts out of view).
  useEffect(() => {
    const nav = tabsRef.current;
    const tab = nav?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!nav || !tab) return;
    const n = nav.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    if (t.left < n.left || t.right > n.right) nav.scrollLeft += t.left - n.left - (n.width - t.width) / 2;
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      // Frase por frase and Pregunta → respuesta have their own keys.
      if (e.key === ' ' && mode !== 'sentences' && mode !== 'recall' && document.activeElement?.closest('[data-drill-trainer]')) {
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
    (result: SentencesResult | null) => {
      if (!result) return onScores(recordShadowed(resourceId, drill.slug));
      recordScore(resourceId, drill.slug, 'sentences', result.firstTry);
      onScores(recordScore(resourceId, drill.slug, 'sentencesWell', result.saidWell));
    },
    [drill.slug, onScores, resourceId],
  );
  const onListened = useCallback(() => onScores(recordListened(resourceId, drill.slug)), [drill.slug, onScores, resourceId]);
  const onRecall = useCallback(
    (rating: RecallRating) => onScores(recordRecall(resourceId, drill.slug, rating)),
    [drill.slug, onScores, resourceId],
  );
  const next = onNext ?? (() => {});
  const best = bestLine(scores[drill.slug]);
  const modes = drillModes(audio.available);

  return (
    <div className="space-y-4" data-drill-trainer data-testid="drill-trainer">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-j-text" data-testid="drill-title">{drill.title}</p>
          {best && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-accent">Tu mejor intento: {best}</p>}
          {!drill.audioUrl && <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Voz automática (sin grabación)</p>}
        </div>
        {(onPrev || onNext) && (
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Frase anterior"
              className="flex h-11 w-11 items-center justify-center border border-j-border-input text-j-text-secondary hover:border-j-accent disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            {position && <span className="w-12 text-center font-mono text-[11px] tabular-nums text-j-text-secondary">{position}</span>}
            <button type="button" onClick={onNext} disabled={!onNext} aria-label="Frase siguiente"
              className="flex h-11 w-11 items-center justify-center border border-j-border-input text-j-text-secondary hover:border-j-accent disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <nav ref={tabsRef} className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Modo de práctica">
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
            {modes.includes(m.id) && isModeApproved(scores[drill.slug], m.id) && (
              <span className={cn('ml-1.5', mode !== m.id && 'text-j-success')} title="Aprobado" data-testid="mode-approved">
                <span aria-hidden>✓</span>
                <span className="sr-only"> (aprobado)</span>
              </span>
            )}
          </button>
        ))}
      </nav>

      {mode === 'listen' && <ListenMode key={drill.slug} drill={drill} audio={audio} onListened={onListened} />}
      {mode === 'copy' && <CopyMode key={`copy-${drill.slug}`} drill={drill} audio={audio} onResult={onCopyResult} onNext={next} />}
      {mode === 'repeat' && <RepeatMode key={drill.slug} drill={drill} audio={audio} terms={keyTerms} onScore={onRepeatScore} />}
      {mode === 'sentences' && <SentenceMode key={drill.slug} drill={drill} audio={audio} terms={keyTerms} onFinished={onSentences} />}
      {mode === 'recall' && (
        <RecallMode
          key={`recall-${drill.slug}`}
          resourceId={resourceId}
          drill={drill}
          ask={ask}
          audio={audio}
          record={scores[drill.slug]?.recall}
          onRate={onRecall}
          onNext={onNext}
          onNextDue={onNextDue}
        />
      )}
    </div>
  );
}
