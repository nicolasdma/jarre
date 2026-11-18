'use client';

/**
 * The lesson's spoken-English practice inside the learn view: each section
 * shows its drills right under the reading, the Practice step walks every
 * drill by group, and the side navigation shows the groups and what is
 * practiced. One state for all of it (selected drill, mode, best scores),
 * shared through context so the reading sections do not re-render on every
 * practice click.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';
import { groupDrills, type DrillGroup } from '@/lib/lessons/drill-groups';
import { loadBestScores, type BestScores } from './best-scores';
import { DrillTrainer } from './drill-trainer';
import { isRecallDue } from '@/lib/practice/recall';
import { drillModes, drillProgress, type DrillProgress } from '@/lib/practice/drill-progress';
import type { DrillMode, PracticeDrill } from './types';
import type { KeyTerm } from '@/lib/practice/key-terms';

interface LessonPracticeValue {
  resourceId: string;
  drills: PracticeDrill[];
  /** The lesson's key terms (lesson JSON `interview.key_terms`). */
  keyTerms: readonly KeyTerm[];
  /** The interviewer's English question per drill slug, when the lesson has one. */
  asks: Readonly<Record<string, string>>;
  groups: DrillGroup<PracticeDrill>[];
  scores: BestScores;
  setScores: (scores: BestScores) => void;
  /** The drill the Practice step shows (and the nav highlights). */
  selectedSlug: string | null;
  mode: DrillMode;
  setMode: (mode: DrillMode) => void;
  select: (slug: string, mode?: DrillMode) => void;
  /** The drill opened inline under a reading section, if any. */
  openSlug: string | null;
  setOpenSlug: (slug: string | null) => void;
  /** Approved modes of a drill (lib/practice/drill-progress.ts). */
  progressOf: (drill: PracticeDrill) => DrillProgress;
}

const NO_ASKS: Readonly<Record<string, string>> = {};
const noSubscribe = () => () => {};

const LessonPracticeContext = createContext<LessonPracticeValue | null>(null);

export function useLessonPractice(): LessonPracticeValue | null {
  return useContext(LessonPracticeContext);
}

interface LessonPracticeProviderProps {
  resourceId: string;
  drills: PracticeDrill[];
  keyTerms: readonly KeyTerm[];
  asks?: Readonly<Record<string, string>>;
  sections: { conceptId: string; title: string }[];
  initialSlug?: string | null;
  initialMode?: DrillMode | null;
  children: React.ReactNode;
}

export function LessonPracticeProvider({ resourceId, drills, keyTerms, asks = NO_ASKS, sections, initialSlug, initialMode, children }: LessonPracticeProviderProps) {
  const groups = useMemo(() => groupDrills(drills, sections), [drills, sections]);
  const [scores, setScores] = useState<BestScores>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    () => (initialSlug && drills.some((d) => d.slug === initialSlug) ? initialSlug : groups[0]?.drills[0]?.slug ?? null),
  );
  const [mode, setMode] = useState<DrillMode>(initialMode ?? 'listen');
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  // A drill with no recording plays in the browser voice; with neither, Escuchar and Frase por frase are not there.
  const hasVoice = useSyncExternalStore(noSubscribe, () => 'speechSynthesis' in window, () => true);

  useEffect(() => {
    setScores(loadBestScores(resourceId));
  }, [resourceId]);

  const progressOf = useCallback(
    (d: PracticeDrill) => drillProgress(scores[d.slug], drillModes(Boolean(d.audioUrl) || hasVoice)),
    [scores, hasVoice],
  );

  const select = useCallback((slug: string, nextMode?: DrillMode) => {
    setSelectedSlug(slug);
    if (nextMode) setMode(nextMode);
  }, []);

  const value = useMemo(
    () => ({ resourceId, drills, keyTerms, asks, groups, scores, setScores, selectedSlug, mode, setMode, select, openSlug, setOpenSlug, progressOf }),
    [resourceId, drills, keyTerms, asks, groups, scores, selectedSlug, mode, select, openSlug, progressOf],
  );
  return <LessonPracticeContext.Provider value={value}>{children}</LessonPracticeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Under a reading section
// ---------------------------------------------------------------------------

/**
 * Where a phrase stands, in words: "sin empezar", "en curso" (the approved
 * modes in the title) or "hecha" in the success color.
 */
function ProgressCount({ p }: { p: DrillProgress }) {
  if (!p.started) {
    return (
      <span className="shrink-0 font-mono text-[10px] text-j-text-tertiary" data-testid="drill-pending">
        sin empezar
      </span>
    );
  }
  return (
    <span
      className={cn('shrink-0 font-mono text-[10px]', p.complete ? 'text-j-success' : 'text-j-text-tertiary')}
      title={modesTitle(p)}
      data-testid="drill-progress"
    >
      {p.complete ? 'hecha' : 'en curso'}
    </span>
  );
}

function modesTitle(p: DrillProgress): string {
  return `${p.done} de ${p.total} formas de practicar aprobadas`;
}

/** The section's drills, under its reading: one opens inline with every mode. */
export function SectionDrills({ conceptId }: { conceptId: string }) {
  const practice = useLessonPractice();
  if (!practice) return null;
  const group = practice.groups.find((g) => g.id === conceptId);
  if (!group) return null;
  const complete = group.drills.filter((d) => practice.progressOf(d).complete).length;

  return (
    <section className="mt-8 border-t border-j-border pt-6" aria-label="Para decir en inglés" data-testid="section-drills">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm">Para decir en inglés</p>
        <p className="font-mono text-[10px] tabular-nums text-j-text-tertiary" data-testid="section-complete">
          {phrasesLine(group.drills.length, complete)}
        </p>
      </div>
      <ul className="space-y-2">
        {group.drills.map((d) => {
          const open = practice.openSlug === d.slug;
          return (
            <li key={d.slug} id={`drill-${d.slug}`} className={cn('border', open ? 'border-j-accent' : 'border-j-border')}>
              <button
                type="button"
                onClick={() => practice.setOpenSlug(open ? null : d.slug)}
                aria-expanded={open}
                className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left hover:bg-j-bg-alt"
              >
                <span className="min-w-0 flex-1 text-sm text-j-text">{d.title}</span>
                {!d.audioUrl && <AutoVoiceTag />}
                <ProgressCount p={practice.progressOf(d)} />
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">{open ? 'Cerrar' : 'Practicar'}</span>
              </button>
              {open && (
                <div className="border-t border-j-border px-3 py-4">
                  <DrillTrainer
                    resourceId={practice.resourceId}
                    drill={d}
                    ask={practice.asks[d.slug]}
                    keyTerms={practice.keyTerms}
                    mode={practice.mode}
                    onModeChange={practice.setMode}
                    scores={practice.scores}
                    onScores={practice.setScores}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The Practice step
// ---------------------------------------------------------------------------

/**
 * The Practice step ("Decirlo"). `onNext` goes on to the next step in order
 * (the voice tutor); `presentation` words it for a talk instead of a call.
 */
export function PracticeStep({ onNext, presentation = false }: { onNext?: () => void; presentation?: boolean }) {
  const practice = useLessonPractice();
  if (!practice || practice.drills.length === 0) return null;
  const order = practice.groups.flatMap((g) => g.drills);
  const index = Math.max(0, order.findIndex((d) => d.slug === practice.selectedSlug));
  const drill = order[index];
  const group = practice.groups.find((g) => g.drills.includes(drill));
  const complete = order.filter((d) => practice.progressOf(d).complete).length;
  // Pregunta → respuesta reviews: drills whose recall is due today, in lesson order.
  const due = order.filter((d) => isRecallDue(practice.scores[d.slug]?.recall));
  const nextDue = [...order.slice(index + 1), ...order.slice(0, index)].find((d) => due.includes(d));
  const reviewing = practice.mode === 'recall';

  return (
    <div className="py-16" data-testid="practice-step">
      <header className="mb-8 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-text-tertiary">
          Decirlo · {complete} de {order.length}
        </p>
        <h1 className="text-2xl font-bold text-j-text">{presentation ? 'Tus frases, en inglés' : 'Tus respuestas, en inglés'}</h1>
        <p className="text-sm text-j-text-secondary" data-testid="practice-intro">
          {presentation
            ? 'Cada frase de la presentación: escuchala, copiala, repetila entera o de a partes, y al final decila sin mirar. Elegí cualquiera en el índice o seguí con las flechas.'
            : 'Cada respuesta de la llamada: escuchala, copiala, repetila entera o frase por frase, y al final respondela solo con la pregunta. Elegí cualquiera en el índice o seguí con las flechas.'}
        </p>
        {due.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border border-j-warm bg-j-warm-light px-3 py-2" data-testid="recall-due">
            <p className="flex-1 text-sm text-j-text">
              {dueLine(due.length, presentation)}
            </p>
            <button
              type="button"
              onClick={() => practice.select(due.includes(drill) ? drill.slug : due[0].slug, 'recall')}
              className="min-h-[40px] bg-j-accent px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-on-accent hover:bg-j-accent-hover"
            >
              Repasar ahora
            </button>
          </div>
        )}
        <select
          value={drill.slug}
          onChange={(e) => practice.select(e.target.value)}
          aria-label={presentation ? 'Elegir frase' : 'Elegir respuesta'}
          className="w-full border border-j-border-input bg-j-bg-white px-3 py-2 text-sm text-j-text lg:hidden"
        >
          {practice.groups.map((g) => (
            <optgroup key={g.id} label={g.title}>
              {g.drills.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {optionPrefix(practice.progressOf(d))}{d.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </header>

      {group && <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-j-warm">{group.title}</p>}
      <DrillTrainer
        key={drill.slug}
        resourceId={practice.resourceId}
        drill={drill}
        ask={practice.asks[drill.slug]}
        keyTerms={practice.keyTerms}
        mode={practice.mode}
        onModeChange={practice.setMode}
        scores={practice.scores}
        onScores={practice.setScores}
        onPrev={index > 0 ? () => practice.select(order[index - 1].slug) : undefined}
        onNext={index < order.length - 1 ? () => practice.select(order[index + 1].slug) : undefined}
        position={`${index + 1}/${order.length}`}
        onNextDue={reviewing && nextDue ? () => practice.select(nextDue.slug) : undefined}
      />

      {onNext && (
        <div className="mt-16 border-t border-j-border pt-10 text-center">
          <p className="mb-4 text-sm text-j-text-secondary">Cuando las tengas, ensayalas con el tutor de voz.</p>
          <button
            type="button"
            onClick={onNext}
            className="min-h-[44px] bg-j-accent px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-on-accent hover:bg-j-accent-hover"
            data-testid="practice-next"
          >
            Siguiente: ensayar con el tutor →
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// In the side navigation
// ---------------------------------------------------------------------------

/** Drill groups and what is practiced, for the lesson's side navigation. */
export function PracticeNav({ onPick }: { onPick: (slug: string) => void }) {
  const practice = useLessonPractice();
  if (!practice || practice.drills.length === 0) return null;
  return (
    <div className="mb-6" data-testid="practice-nav">
      {practice.groups.map((g) => (
        <div key={g.id} className="mb-3">
          <p className="mb-1 truncate px-4 font-mono text-[9px] uppercase tracking-[0.2em] text-j-text-tertiary" title={g.title}>
            {g.title}
          </p>
          <ul className="space-y-0.5">
            {g.drills.map((d) => {
              const active = d.slug === practice.selectedSlug;
              const p = practice.progressOf(d);
              return (
                <li key={d.slug}>
                  <button
                    type="button"
                    onClick={() => onPick(d.slug)}
                    title={d.title}
                    className={cn(
                      'w-full truncate px-4 py-1.5 text-left text-[12px] leading-snug transition-colors',
                      active ? 'bg-j-accent-light font-medium text-j-accent' : p.started ? 'text-j-text-secondary hover:text-j-text' : 'text-j-text-tertiary hover:text-j-text-secondary',
                    )}
                  >
                    {p.started && (
                      <span className={cn('mr-1.5 font-mono text-[10px] tabular-nums', p.complete ? 'text-j-success' : 'text-j-text-tertiary')} title={modesTitle(p)}>
                        {p.complete ? '✓' : `${p.done}/${p.total}`}
                      </span>
                    )}
                    {isRecallDue(practice.scores[d.slug]?.recall) && (
                      <span className="mr-1.5 text-j-warm-dark" title="Para repasar hoy">↻</span>
                    )}
                    {d.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** "12/33": drills with every mode approved, for the navigation's step list. */
export function usePracticeProgress(): { done: number; total: number } | null {
  const practice = useLessonPractice();
  if (!practice || practice.drills.length === 0) return null;
  return {
    done: practice.drills.filter((d) => practice.progressOf(d).complete).length,
    total: practice.drills.length,
  };
}

/** "4 frases", or "1 de 4 hechas" once any is done. */
function phrasesLine(total: number, done: number): string {
  if (done === 0) return total === 1 ? '1 frase' : `${total} frases`;
  return `${done} de ${total} ${done === 1 && total === 1 ? 'hecha' : 'hechas'}`;
}

/** "3 frases para repasar hoy" (a talk) or "3 respuestas para repasar hoy" (a call). */
function dueLine(count: number, presentation: boolean): string {
  const noun = presentation ? (count === 1 ? 'frase' : 'frases') : count === 1 ? 'respuesta' : 'respuestas';
  return `${count} ${noun} para repasar hoy`;
}

/** A phrase with no recording plays in the device's voice: said once, on that phrase only. */
function AutoVoiceTag() {
  return (
    <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-j-text-tertiary" title="Esta frase no tiene grabación: la lee una voz automática">
      voz automática
    </span>
  );
}

/** The drill picker on a phone: "✓ " complete, "3/5 " started, nothing pending. */
function optionPrefix(p: DrillProgress): string {
  if (p.complete) return '✓ ';
  return p.started ? `${p.done}/${p.total} ` : '';
}
