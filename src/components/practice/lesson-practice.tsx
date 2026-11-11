'use client';

/**
 * The lesson's spoken-English practice inside the learn view: each section
 * shows its drills right under the reading, the Practice step walks every
 * drill by group, and the side navigation shows the groups and what is
 * practiced. One state for all of it (selected drill, mode, best scores),
 * shared through context so the reading sections do not re-render on every
 * practice click.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { groupDrills, type DrillGroup } from '@/lib/lessons/drill-groups';
import { loadBestScores, type BestScores } from './best-scores';
import { DrillTrainer, isPracticed } from './drill-trainer';
import type { DrillMode, PracticeDrill } from './types';

interface LessonPracticeValue {
  resourceId: string;
  drills: PracticeDrill[];
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
}

const LessonPracticeContext = createContext<LessonPracticeValue | null>(null);

export function useLessonPractice(): LessonPracticeValue | null {
  return useContext(LessonPracticeContext);
}

interface LessonPracticeProviderProps {
  resourceId: string;
  drills: PracticeDrill[];
  sections: { conceptId: string; title: string }[];
  initialSlug?: string | null;
  initialMode?: DrillMode | null;
  children: React.ReactNode;
}

export function LessonPracticeProvider({ resourceId, drills, sections, initialSlug, initialMode, children }: LessonPracticeProviderProps) {
  const groups = useMemo(() => groupDrills(drills, sections), [drills, sections]);
  const [scores, setScores] = useState<BestScores>({});
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    () => (initialSlug && drills.some((d) => d.slug === initialSlug) ? initialSlug : groups[0]?.drills[0]?.slug ?? null),
  );
  const [mode, setMode] = useState<DrillMode>(initialMode ?? 'listen');
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    setScores(loadBestScores(resourceId));
  }, [resourceId]);

  const select = useCallback((slug: string, nextMode?: DrillMode) => {
    setSelectedSlug(slug);
    if (nextMode) setMode(nextMode);
  }, []);

  const value = useMemo(
    () => ({ resourceId, drills, groups, scores, setScores, selectedSlug, mode, setMode, select, openSlug, setOpenSlug }),
    [resourceId, drills, groups, scores, selectedSlug, mode, select, openSlug],
  );
  return <LessonPracticeContext.Provider value={value}>{children}</LessonPracticeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Under a reading section
// ---------------------------------------------------------------------------

/** The section's drills, under its reading: one opens inline with every mode. */
export function SectionDrills({ conceptId }: { conceptId: string }) {
  const practice = useLessonPractice();
  if (!practice) return null;
  const group = practice.groups.find((g) => g.id === conceptId);
  if (!group) return null;
  const done = group.drills.filter((d) => isPracticed(practice.scores[d.slug])).length;

  return (
    <section className="mt-8 border-t border-j-border pt-6" aria-label="Decilo en inglés" data-testid="section-drills">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm">Decilo en inglés</p>
        <p className="font-mono text-[10px] tabular-nums text-j-text-tertiary">{done}/{group.drills.length} practicadas</p>
      </div>
      <ul className="space-y-2">
        {group.drills.map((d) => {
          const open = practice.openSlug === d.slug;
          return (
            <li key={d.slug} className={cn('border', open ? 'border-j-accent' : 'border-j-border')}>
              <button
                type="button"
                onClick={() => practice.setOpenSlug(open ? null : d.slug)}
                aria-expanded={open}
                className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-left hover:bg-j-bg-alt"
              >
                <span className={cn('w-4 shrink-0 text-xs', isPracticed(practice.scores[d.slug]) ? 'text-j-accent' : 'text-j-text-tertiary')}>
                  {isPracticed(practice.scores[d.slug]) ? '✓' : '·'}
                </span>
                <span className="min-w-0 flex-1 text-sm text-j-text">{d.title}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">{open ? 'Cerrar' : 'Practicar'}</span>
              </button>
              {open && (
                <div className="border-t border-j-border px-3 py-4">
                  <DrillTrainer
                    resourceId={practice.resourceId}
                    drill={d}
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

export function PracticeStep({ onInterview }: { onInterview?: () => void }) {
  const practice = useLessonPractice();
  if (!practice || practice.drills.length === 0) return null;
  const order = practice.groups.flatMap((g) => g.drills);
  const index = Math.max(0, order.findIndex((d) => d.slug === practice.selectedSlug));
  const drill = order[index];
  const group = practice.groups.find((g) => g.drills.includes(drill));
  const done = order.filter((d) => isPracticed(practice.scores[d.slug])).length;

  return (
    <div className="py-16" data-testid="practice-step">
      <header className="mb-8 space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-text-tertiary">
          Practicar · {done}/{order.length} practicadas
        </p>
        <h1 className="text-2xl font-bold text-j-text">Lo que vas a decir, en inglés</h1>
        <p className="text-sm text-j-text-secondary">
          Cada respuesta de la llamada: escuchala, copiala, tomala como dictado, repetila y hacé shadowing. Elegí cualquiera en el índice, o seguí con las flechas.
        </p>
        <select
          value={drill.slug}
          onChange={(e) => practice.select(e.target.value)}
          aria-label="Elegir drill"
          className="w-full border border-j-border-input bg-j-bg-white px-3 py-2 text-sm text-j-text lg:hidden"
        >
          {practice.groups.map((g) => (
            <optgroup key={g.id} label={g.title}>
              {g.drills.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {isPracticed(practice.scores[d.slug]) ? '✓ ' : ''}{d.title}
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
        mode={practice.mode}
        onModeChange={practice.setMode}
        scores={practice.scores}
        onScores={practice.setScores}
        onPrev={index > 0 ? () => practice.select(order[index - 1].slug) : undefined}
        onNext={index < order.length - 1 ? () => practice.select(order[index + 1].slug) : undefined}
        position={`${index + 1}/${order.length}`}
      />

      {onInterview && (
        <div className="mt-16 border-t border-j-border pt-10 text-center">
          <p className="mb-4 text-sm text-j-text-secondary">Cuando lo tengas, probalo en una llamada simulada.</p>
          <button
            type="button"
            onClick={onInterview}
            className="min-h-[44px] bg-j-accent px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-on-accent hover:bg-j-accent-hover"
          >
            Simulacro de entrevista →
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
              const done = isPracticed(practice.scores[d.slug]);
              return (
                <li key={d.slug}>
                  <button
                    type="button"
                    onClick={() => onPick(d.slug)}
                    title={d.title}
                    className={cn(
                      'w-full truncate px-4 py-1.5 text-left text-[12px] leading-snug transition-colors',
                      active ? 'bg-j-accent-light font-medium text-j-accent' : done ? 'text-j-text-secondary hover:text-j-text' : 'text-j-text-tertiary hover:text-j-text-secondary',
                    )}
                  >
                    {done && <span className="mr-1.5">&#10003;</span>}
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

/** "12/33 practicadas", for the navigation's step list. */
export function usePracticeProgress(): { done: number; total: number } | null {
  const practice = useLessonPractice();
  if (!practice || practice.drills.length === 0) return null;
  return {
    done: practice.drills.filter((d) => isPracticed(practice.scores[d.slug])).length,
    total: practice.drills.length,
  };
}
