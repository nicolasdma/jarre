'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  RECALL_RATINGS,
  RECALL_SECONDS,
  dueLabel,
  initialRecallState,
  isRecallSeconds,
  recallKey,
  recallPrompt,
  recallReducer,
  remainingFraction,
  remainingSeconds,
  type RecallRating,
  type RecallRecord,
} from '@/lib/practice/recall';
import { AudioBar, Chip, PrimaryButton } from './controls';
import type { DrillAudio } from './use-drill-audio';
import type { PracticeDrill } from './types';

const SECONDS_KEY = 'jarre-recall-seconds';
const RATING_LABEL: Record<RecallRating, string> = { got: 'La tenía', partial: 'A medias', missed: 'No salió' };

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'INPUT' || (el as HTMLElement).isContentEditable;
}

/**
 * Pregunta → respuesta: the drill's question alone, a countdown to answer it
 * aloud, then its recording with the text, and a rating that schedules the
 * next review (recall.ts). Space starts, skips the countdown and then
 * plays/pauses; 1·2·3 or arrows pick a rating, Enter rates and then moves on.
 */
export function RecallMode({
  drill,
  ask,
  audio,
  record,
  onRate,
  onNext,
  onNextDue,
}: {
  drill: PracticeDrill;
  /** The interviewer's English question, when the lesson links one to this drill. */
  ask?: string;
  audio: DrillAudio;
  /** The drill's last rating here, if any. */
  record: RecallRecord | undefined;
  onRate: (rating: RecallRating) => void;
  onNext?: () => void;
  /** The next drill due for review, when there is one. */
  onNextDue?: () => void;
}) {
  const [state, dispatch] = useReducer(recallReducer, undefined, () => initialRecallState());
  const [now, setNow] = useState(() => Date.now());
  const [showEs, setShowEs] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const prompt = recallPrompt(drill.title, ask);

  // The chosen length is remembered on this device.
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(SECONDS_KEY));
      if (isRecallSeconds(saved)) dispatch({ type: 'seconds', seconds: saved });
    } catch {
      // No storage: the default length.
    }
  }, []);

  // The countdown clock, only while it runs.
  useEffect(() => {
    if (state.phase !== 'thinking') return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: 'tick', now: t });
    }, 100);
    return () => window.clearInterval(id);
  }, [state.phase]);

  // The answer plays as soon as the countdown ends (or is skipped), once.
  const { restart, pause, setLoop, loop } = audio;
  useEffect(() => {
    if (state.phase !== 'answer') return;
    if (loop) setLoop(false);
    restart();
    // Only on entering the answer: loop and the audio's identity are not triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const start = useCallback(() => {
    audio.prime();
    const t = Date.now();
    setNow(t);
    setShowEs(false);
    dispatch({ type: 'start', now: t });
  }, [audio]);

  const rate = useCallback(
    (rating?: RecallRating) => {
      const chosen = rating ?? state.selected;
      dispatch({ type: 'rate', rating: chosen });
      onRate(chosen);
    },
    [onRate, state.selected],
  );

  const again = useCallback(() => {
    pause();
    dispatch({ type: 'again' });
  }, [pause]);

  const next = onNextDue ?? onNext;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement;
      if (isTyping(active)) return;
      const ours = !active || active === document.body || Boolean(rootRef.current?.contains(active));
      if (!ours) return;
      // A focused button already does its own thing on Enter.
      if (e.key === 'Enter' && active instanceof HTMLButtonElement) return;
      const key = recallKey(state.phase, e.key);
      if (!key) return;
      e.preventDefault();
      switch (key.do) {
        case 'start': start(); break;
        case 'skip': dispatch({ type: 'skip', now: Date.now() }); break;
        case 'toggle-audio': audio.toggle(); break;
        case 'select': dispatch({ type: 'select', rating: key.rating }); break;
        case 'move': dispatch({ type: 'move', by: key.by }); break;
        case 'rate': rate(); break;
        case 'next': next?.(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audio, next, rate, start, state.phase]);

  const left = remainingSeconds(state, now);
  const fraction = remainingFraction(state, now);
  const hidden = state.phase === 'ready' || state.phase === 'thinking';

  return (
    <div ref={rootRef} className="space-y-6" data-mode="recall" data-phase={state.phase}>
      <div className="border border-j-border bg-j-bg-white px-4 py-5 sm:px-6">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em]">
          <span className="text-j-warm-dark">Pregunta</span>
          {prompt.tag && <span className="text-j-text-tertiary">{prompt.tag}</span>}
          {prompt.target && <span className="text-j-text-tertiary">objetivo {prompt.target}</span>}
        </div>
        <p
          className="text-xl font-semibold leading-snug text-j-text sm:text-2xl"
          lang={prompt.source === 'ask' ? 'en' : 'es'}
          data-testid="recall-prompt"
          data-source={prompt.source}
        >
          {prompt.question}
        </p>
        {prompt.topic && <p className="mt-1 text-sm text-j-text-tertiary" lang="es">{prompt.topic}</p>}
        <p className="mt-2 text-sm text-j-text-secondary">Respondé en voz alta, en inglés, sin mirar.</p>
      </div>

      {state.phase === 'ready' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Tiempo</span>
            {RECALL_SECONDS.map((s) => (
              <Chip
                key={s}
                active={state.seconds === s}
                onClick={() => {
                  dispatch({ type: 'seconds', seconds: s });
                  try {
                    localStorage.setItem(SECONDS_KEY, String(s));
                  } catch {
                    // Not remembered, still used.
                  }
                }}
              >
                {s} s
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={start} className="px-6">Empezar · {state.seconds} s</PrimaryButton>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Espacio</span>
          </div>
          {record && (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">
              Última vez: {RATING_LABEL[record.last]} · repaso {dueLabel(record)}
            </p>
          )}
        </div>
      )}

      {state.phase === 'thinking' && (
        <div className="space-y-4" aria-live="off">
          <div className="flex items-end justify-between gap-4">
            <p
              className={cn(
                'font-mono text-7xl font-semibold leading-none tabular-nums sm:text-8xl',
                left <= 5 ? 'text-j-warm-dark' : 'text-j-text',
              )}
              data-testid="recall-countdown"
              role="timer"
              aria-label={`${left} segundos`}
            >
              {left}
              <span className="ml-1 text-2xl text-j-text-tertiary sm:text-3xl">s</span>
            </p>
            <p className="pb-2 text-right font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Hablando…</p>
          </div>
          <div className="h-1.5 bg-j-border">
            <div className={cn('h-1.5', left <= 5 ? 'bg-j-warm' : 'bg-j-accent')} style={{ width: `${fraction * 100}%` }} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={() => dispatch({ type: 'skip', now: Date.now() })}>Ya está → la respuesta</PrimaryButton>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Espacio</span>
          </div>
        </div>
      )}

      {!hidden && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm-dark">La respuesta</p>
            {state.answeredAfter !== null && (
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">
                {state.answeredAfter >= state.seconds ? `se terminaron los ${state.seconds} s` : `respondiste en ${state.answeredAfter} s`}
              </p>
            )}
          </div>
          <AudioBar audio={audio} showLoop={false} />
          <p className="text-lg leading-relaxed text-j-text-body sm:text-xl" lang="en" data-testid="recall-answer">{drill.textEn}</p>
          {drill.textEs && (
            <div className="space-y-3">
              <Chip active={showEs} onClick={() => setShowEs((v) => !v)}>
                {showEs ? 'Ocultar traducción' : 'Ver traducción'}
              </Chip>
              {showEs && (
                <p className="border-l-2 border-j-warm pl-4 text-base leading-relaxed text-j-text-em" lang="es">{drill.textEs}</p>
              )}
            </div>
          )}
        </div>
      )}

      {state.phase === 'answer' && (
        <div className="space-y-2 border-t border-j-border pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">¿Cómo te salió?</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cómo te salió">
            {RECALL_RATINGS.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={state.selected === r.id}
                onClick={() => rate(r.id)}
                onFocus={() => dispatch({ type: 'select', rating: r.id })}
                data-rating={r.id}
                className={cn(
                  'flex min-h-[52px] flex-col items-center justify-center gap-0.5 border px-2 py-2 text-sm transition-colors',
                  state.selected === r.id
                    ? 'border-j-accent bg-j-accent-light font-medium text-j-accent'
                    : 'border-j-border-input text-j-text-secondary hover:border-j-accent hover:text-j-accent',
                )}
              >
                <span>{r.label}</span>
                <span className="hidden font-mono text-[9px] text-j-text-tertiary sm:inline">{r.key}</span>
              </button>
            ))}
          </div>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary sm:block">
            1 · 2 · 3 elegir · Enter calificar · Espacio pausa
          </p>
        </div>
      )}

      {state.phase === 'rated' && (
        <div className="space-y-4 border-t border-j-border pt-5" data-testid="recall-rated">
          <p className="text-sm text-j-text">
            <span className="font-medium">{state.rated && RATING_LABEL[state.rated]}</span>
            {record && <span className="text-j-text-secondary"> · vuelve {dueLabel(record)}</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {next && (
              <PrimaryButton onClick={next}>{onNextDue ? 'Siguiente para repasar →' : 'Siguiente →'}</PrimaryButton>
            )}
            <Chip active={false} onClick={again}>Otra vez</Chip>
            {next && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Enter</span>}
          </div>
        </div>
      )}
    </div>
  );
}
