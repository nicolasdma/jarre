'use client';

/**
 * "Ver paso a paso": a learner-paced trace of a reference solution.
 *
 * What the screen shows, and why (2026-11-18 research, sources below):
 * - The code with the line this step is about highlighted, next to a picture
 *   of the state (Python Tutor: code on one side, frames and objects on the
 *   other, one highlighted line per step; VisuAlgo: the pseudocode line lit
 *   while the drawing changes).
 * - One idea per step and one caption per step, in plain Spanish, placed next
 *   to the drawing (Mayer's segmenting and spatial-contiguity principles;
 *   VisuAlgo's status line). The caption is also the text alternative: it is
 *   announced, the drawings are decorative.
 * - What changed is marked (the entry just written flashes once, the cell the
 *   step looks at is outlined) so the eye goes to the state diff, not to
 *   re-reading everything.
 * - The learner drives: back and forward, a scrubber, play with a speed, and
 *   switching examples (Hundhausen, Douglas & Stasko 2002: how learners engage
 *   with an algorithm visualization matters more than what it shows; Bret
 *   Victor's "Learnable Programming": make the flow and the state visible and
 *   let the reader move through time).
 * - Steps come from per-problem generators that state their own state (like
 *   algorithm-visualizer.org's tracers), tested against the real solution.
 *
 * Sources: Guo, "Online Python Tutor", SIGCSE 2013
 * (https://pg.ucsd.edu/publications/Online-Python-Tutor-web-based-program-visualization_SIGCSE-2013.pdf);
 * https://visualgo.net; https://github.com/algorithm-visualizer/tracers.js;
 * Hundhausen, Douglas & Stasko, "A Meta-Study of Algorithm Visualization
 * Effectiveness", JVLC 13(3) 2002; https://worrydream.com/LearnableProgramming/.
 *
 * Keyboard (with focus anywhere inside): ← → step, space play/pause, Home/End.
 * Reduced motion: no flash, no smooth scrolling; playing still works (it is
 * the learner's choice).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { buildTrace, type TraceDef } from '@/lib/code-trace/trace';
import { codeViews } from '@/lib/code-trace/js-lines';
import { readCodeVariantPref, writeCodeVariantPref, type CodeVariant } from '@/lib/coding/code-tabs-pref';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import { VizView } from './viz-views';
import styles from './code-trace.module.css';

const SPEEDS = [
  { label: '0.5×', ms: 2600 },
  { label: '1×', ms: 1500 },
  { label: '2×', ms: 750 },
] as const;

export interface CodeTraceProps {
  // Generators are typed per problem; the player only runs them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: TraceDef<any, any>;
  initialExample?: number;
  initialStep?: number;
  /** Focus the player on mount (the dialog does; an inline preview does not). */
  autoFocus?: boolean;
}

export function CodeTrace({ def, initialExample = 0, initialStep = 0, autoFocus = false }: CodeTraceProps) {
  const reduced = useReducedMotion();
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  const [example, setExample] = useState(() => Math.min(Math.max(initialExample, 0), def.examples.length - 1));
  const trace = useMemo(() => buildTrace(def, def.examples[example].args), [def, example]);
  const steps = trace.steps;
  const [index, setIndex] = useState(() => Math.min(Math.max(initialStep, 0), steps.length - 1));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  // Mounted only on the client (a dialog opened by a click, or the dev preview after loading), so the stored choice can be read up front.
  const [variant, setVariant] = useState<CodeVariant>(() => (typeof window === 'undefined' ? 'js' : readCodeVariantPref()));
  const views = useMemo(() => codeViews(def.code), [def.code]);

  useEffect(() => {
    if (autoFocus) rootRef.current?.focus();
  }, [autoFocus]);

  const last = steps.length - 1;
  const step = steps[Math.min(index, last)];
  const showJs = variant === 'js' && views.js !== null;
  const lines = showJs ? views.js! : views.ts;
  const activeLine = step.line === null ? null : showJs ? views.tsToJs(step.line) : step.line;

  const go = useCallback((n: number) => setIndex(Math.min(Math.max(n, 0), last)), [last]);

  // Autoplay: one step per tick; reaching the last step is the same as pausing.
  const isPlaying = playing && index < last;
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setTimeout(() => setIndex((i) => Math.min(i + 1, last)), SPEEDS[speed].ms);
    return () => window.clearTimeout(id);
  }, [isPlaying, index, last, speed]);

  // Keep the highlighted line in view inside the code panel only (never scroll the page).
  useEffect(() => {
    const panel = codeRef.current;
    if (!panel || activeLine === null) return;
    const el = panel.querySelector<HTMLElement>(`[data-line="${activeLine}"]`);
    if (!el) return;
    const top = el.offsetTop - panel.clientHeight / 2 + el.clientHeight / 2;
    panel.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
  }, [activeLine, reduced]);

  const pickExample = (n: number) => {
    setPlaying(false);
    setExample(n);
    setIndex(0);
  };
  const togglePlay = () => {
    if (isPlaying) {
      setPlaying(false);
      return;
    }
    if (index >= last) setIndex(0);
    setPlaying(true);
  };
  const selectVariant = (v: CodeVariant) => {
    setVariant(v);
    writeCodeVariantPref(v);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const inControl = target.closest('input, select, [role="tab"]');
    if (e.key === 'ArrowRight' && !inControl) {
      e.preventDefault();
      setPlaying(false);
      go(index + 1);
    } else if (e.key === 'ArrowLeft' && !inControl) {
      e.preventDefault();
      setPlaying(false);
      go(index - 1);
    } else if (e.key === ' ' && !target.closest('button, input, select')) {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'Home' && !inControl) {
      e.preventDefault();
      go(0);
    } else if (e.key === 'End' && !inControl) {
      e.preventDefault();
      go(last);
    }
  };

  const btnBase =
    'inline-flex h-10 min-w-10 items-center justify-center rounded border px-2 transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-j-accent';
  const btn = `${btnBase} border-j-border bg-j-bg-white text-j-text hover:bg-j-bg-hover`;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={'outline-none ' + (reduced ? styles.reduced : '')}
      data-testid="code-trace"
      aria-roledescription="recorrido paso a paso"
      aria-label={`${def.title}: paso a paso`}
    >
      {def.examples.length > 1 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Ejemplo">
          {def.examples.map((ex, n) => (
            <button
              key={n}
              type="button"
              aria-pressed={n === example}
              onClick={() => pickExample(n)}
              className={
                'shrink-0 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ' +
                (n === example ? 'border-j-accent bg-j-accent text-j-text-on-accent' : 'border-j-border bg-j-bg-white text-j-text-secondary hover:text-j-text')
              }
              lang="en"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <div className={styles.caption}>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">
            Paso {index + 1} de {steps.length}
          </p>
          <p aria-live="polite" className="min-h-[3.2em] text-[15px] leading-snug text-j-text" data-testid="code-trace-caption">
            {step.caption}
          </p>
        </div>

        <div className={styles.state + ' space-y-3 rounded-lg border border-j-border bg-j-bg-alt p-3'} data-testid="code-trace-state">
          {step.viz.map((v, n) => (
            <VizView key={`${example}-${n}-${v.kind}`} v={v} />
          ))}
        </div>

        <div className={styles.code + ' min-w-0'}>
          {views.js !== null && (
            <div role="tablist" aria-label="Variante del código" className="flex gap-1 border-b border-j-border">
              {(['js', 'ts'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={variant === v}
                  aria-controls={`${baseId}-code`}
                  onClick={() => selectVariant(v)}
                  className={
                    'min-h-[32px] px-3 font-mono text-[10px] uppercase tracking-[0.15em] ' +
                    (variant === v ? 'border-b-2 border-j-accent text-j-text' : 'border-b-2 border-transparent text-j-text-tertiary hover:text-j-text')
                  }
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <div
            ref={codeRef}
            id={`${baseId}-code`}
            className="relative max-h-[38vh] overflow-auto rounded-b-lg border border-t-0 border-j-border bg-j-bg-white py-2 font-mono text-[12px] leading-[1.6] md:max-h-[60vh]"
            lang="en"
            aria-label="Código de la solución"
          >
            {lines.map((text, i) => {
              const n = i + 1;
              const on = n === activeLine;
              return (
                <div
                  key={i}
                  data-line={n}
                  aria-current={on ? 'step' : undefined}
                  className={'flex min-w-max border-l-[3px] pr-3 ' + (on ? 'border-j-warm-dark bg-j-highlight' : 'border-transparent')}
                >
                  <span className="w-8 shrink-0 select-none pr-2 text-right text-j-text-tertiary">{n}</span>
                  <span className="whitespace-pre text-j-text">{text || ' '}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 mt-3 flex flex-wrap items-center gap-2 border-t border-j-border bg-j-bg py-2" role="group" aria-label="Controles del recorrido">
        <button type="button" className={btn} onClick={() => { setPlaying(false); go(0); }} aria-label="Volver al principio" title="Volver al principio">
          <RotateCcw size={16} aria-hidden />
        </button>
        <button type="button" className={btn} onClick={() => { setPlaying(false); go(index - 1); }} disabled={index === 0} aria-label="Paso anterior" title="Paso anterior (←)">
          <SkipBack size={16} aria-hidden />
        </button>
        <button
          type="button"
          className={`${btnBase} min-w-14 border-j-accent bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          title={isPlaying ? 'Pausar (espacio)' : 'Reproducir (espacio)'}
          data-testid="code-trace-play"
        >
          {isPlaying ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        </button>
        <button type="button" className={btn} onClick={() => { setPlaying(false); go(index + 1); }} disabled={index === last} aria-label="Paso siguiente" title="Paso siguiente (→)" data-testid="code-trace-next">
          <SkipForward size={16} aria-hidden />
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            go(Number(e.target.value));
          }}
          aria-label="Paso"
          aria-valuetext={`Paso ${index + 1} de ${steps.length}`}
          className="order-first h-8 w-full basis-full accent-[var(--j-accent)] md:order-none md:h-10 md:w-auto md:min-w-[8rem] md:flex-1 md:basis-auto"
        />
        <label className="ml-auto flex items-center gap-1 font-mono text-[11px] text-j-text-secondary md:ml-0">
          <span className="sr-only">Velocidad</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-10 rounded border border-j-border bg-j-bg-white px-2 font-mono text-[12px] text-j-text"
            aria-label="Velocidad"
          >
            {SPEEDS.map((s, n) => (
              <option key={s.label} value={n}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 hidden font-mono text-[10px] text-j-text-tertiary md:block">← → pasos · espacio reproduce · Home/End</p>
    </div>
  );
}
