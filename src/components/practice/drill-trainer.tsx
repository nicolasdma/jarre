'use client';

/**
 * One drill (a phrase to say) in three guided steps: hear it, repeat it out
 * loud, say it without looking. Copiar and Frase por frase are there too, as
 * "more ways to practice". Lives in the lesson's Decirlo step; best scores are
 * kept per device (best-scores.ts).
 */

import { useCallback, useEffect } from 'react';
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
import { Hint } from '@/components/help/first-time';
import type { KeyTerm } from '@/lib/practice/key-terms';
import type { SentencesResult } from '@/lib/practice/phrase-drill';
import { EXTRA_MODES, GUIDED_MODES, modeLabel, type DrillMode, type PracticeDrill } from './types';

/** One line that says what to do in each step, right above it. */
const STEP_HINT: Record<DrillMode, string> = {
  listen: 'Escuchala entera una vez, leyendo el texto.',
  repeat: 'Decila en voz alta, entera: te marco en verde las palabras que dijiste.',
  recall: 'Ahora sin mirar el texto: decila de memoria, en voz alta.',
  copy: 'Escribila copiando el texto: ayuda a fijar cómo se escribe cada palabra.',
  sentences: '',
};

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
  const steps = GUIDED_MODES.filter((m) => drillModes(audio.available).includes(m));
  const stepIndex = steps.indexOf(mode);
  const nextStep = stepIndex >= 0 && stepIndex < steps.length - 1 ? steps[stepIndex + 1] : null;
  const approved = (m: DrillMode) => isModeApproved(scores[drill.slug], m);

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

      {/* The three steps, in order: a stepper, not five equal tabs. */}
      <nav className="grid grid-cols-3 gap-1" aria-label="Pasos de la frase" data-testid="drill-steps">
        {steps.map((m, i) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            aria-current={mode === m ? 'step' : undefined}
            className={cn(
              'flex min-h-[44px] items-center justify-center gap-1.5 border px-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
              mode === m ? 'border-j-accent bg-j-accent text-j-text-on-accent' : 'border-j-border-input text-j-text-secondary hover:border-j-accent',
            )}
          >
            <span className="tabular-nums">{i + 1}</span>
            <span className="truncate">{modeLabel(m)}</span>
            {approved(m) && (
              <span className={cn(mode !== m && 'text-j-success')} data-testid="mode-approved">
                <span aria-hidden>✓</span>
                <span className="sr-only"> (hecho)</span>
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* What to do in this step: a line the first time, a "?" after "Entendido". */}
      {STEP_HINT[mode] && (
        <Hint id={`decirlo-${mode}`} key={mode}>
          {STEP_HINT[mode]}
        </Hint>
      )}

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

      {nextStep && approved(mode) && (
        <div className="border-t border-j-border pt-4">
          <button
            type="button"
            onClick={() => onModeChange(nextStep)}
            className="min-h-[44px] bg-j-accent px-5 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-on-accent hover:bg-j-accent-hover"
            data-testid="next-step"
          >
            Listo: ahora {modeLabel(nextStep).toLowerCase()} →
          </button>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-j-border pt-4 text-sm text-j-text-tertiary" data-testid="more-ways">
        <span>Más formas de practicar:</span>
        {EXTRA_MODES.filter((m) => m.id !== 'sentences' || audio.available).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            aria-current={mode === m.id ? 'true' : undefined}
            className={cn(
              'min-h-[44px] underline underline-offset-4 transition-colors',
              mode === m.id ? 'text-j-accent' : 'text-j-text-secondary hover:text-j-text',
            )}
          >
            {m.label}
            {approved(m.id) && <span className="ml-1 text-j-success" aria-label="(aprobado)">✓</span>}
          </button>
        ))}
      </p>
    </div>
  );
}
