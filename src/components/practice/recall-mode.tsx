'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { withoutPhraseMarks } from '@/lib/practice/phrase-segments';
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
import { useRecallAnswer, type RecallAnswer } from './use-recall-answer';

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
 *
 * The answer is heard and judged against the drill's text by a lenient third
 * party (use-recall-answer.ts, recall-eval.ts): its grade comes preselected
 * above the answer, with what was said and what was missing, and the learner
 * can still change it before Enter. Without a recognizer, a microphone or the
 * judge, the learner rates as before.
 */
export function RecallMode({
  resourceId,
  drill,
  ask,
  audio,
  record,
  onRate,
  onNext,
  onNextDue,
}: {
  resourceId: string;
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
  const answer = useRecallAnswer(resourceId, drill.slug);
  /** The learner picked a rating themselves: the judge's no longer replaces it. */
  const touchedRef = useRef(false);
  /** The answer ended and the judge has not said anything yet. */
  const judging = answer.status === 'listening' || answer.status === 'evaluating';

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

  // The answer is over: stop listening before the recording plays, and have it judged.
  const { finish: finishAnswer, start: startAnswer } = answer;
  useEffect(() => {
    if (state.phase === 'answer') finishAnswer(state.answeredAfter !== null && state.answeredAfter >= state.seconds);
    // Only on entering the answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // The judge's grade comes preselected, unless the learner already chose.
  const judgedRating = answer.judgement?.kind === 'evaluated' ? answer.judgement.evaluation.rating : null;
  useEffect(() => {
    if (judgedRating && !touchedRef.current) dispatch({ type: 'select', rating: judgedRating });
  }, [judgedRating]);

  // The reference recording no longer plays on its own when the answer is
  // revealed (owner, 2026-11-18: it "aparece de la nada"): the learner plays it
  // from the AudioBar below. Loop is still cleared on reveal so a manual play
  // here does not repeat (Escuchar's loop is shared across modes).
  const { pause, setLoop, loop } = audio;
  useEffect(() => {
    if (state.phase === 'answer' && loop) setLoop(false);
    // Only on entering the answer: loop and the audio's identity are not triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const start = useCallback(() => {
    audio.prime();
    touchedRef.current = false;
    startAnswer();
    const t = Date.now();
    setNow(t);
    setShowEs(false);
    dispatch({ type: 'start', now: t });
  }, [audio, startAnswer]);

  const rate = useCallback(
    (rating?: RecallRating) => {
      const chosen = rating ?? state.selected;
      dispatch({ type: 'rate', rating: chosen });
      onRate(chosen);
    },
    [onRate, state.selected],
  );

  const { reset: resetAnswer } = answer;
  const again = useCallback(() => {
    pause();
    resetAnswer();
    touchedRef.current = false;
    dispatch({ type: 'again' });
  }, [pause, resetAnswer]);

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
        case 'select': touchedRef.current = true; dispatch({ type: 'select', rating: key.rating }); break;
        case 'move': touchedRef.current = true; dispatch({ type: 'move', by: key.by }); break;
        // While the judge is still out, Enter waits for it, unless the learner already chose.
        case 'rate': if (!judging || touchedRef.current) rate(); break;
        case 'next': next?.(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [audio, judging, next, rate, start, state.phase]);

  const left = remainingSeconds(state, now);
  const fraction = remainingFraction(state, now);
  const hidden = state.phase === 'ready' || state.phase === 'thinking';

  return (
    <div ref={rootRef} className="space-y-6" data-mode="recall" data-phase={state.phase}>
      {/* The prompt is what they must recall, so it is out of sight while they answer
          and during the countdown ("respondé sin mirar"); it returns with the result. */}
      {state.phase !== 'thinking' && (
        <div className="border border-j-border bg-j-bg-white px-4 py-5 sm:px-6" data-testid="recall-prompt-card">
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
      )}

      {/* Before starting, the English text to recite is on screen to review; it
          hides on Empezar (the countdown) and returns with the result. */}
      {state.phase === 'ready' && (
        <div className="space-y-3" data-testid="recall-review">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm-dark">El texto · leelo y después decilo sin mirar</p>
          <p className="text-lg leading-relaxed text-j-text-body sm:text-xl" lang="en">{withoutPhraseMarks(drill.textEn)}</p>
          {drill.textEs && (
            <div className="space-y-3">
              <Chip active={showEs} onClick={() => setShowEs((v) => !v)}>
                {showEs ? 'Ocultar el castellano' : 'Ver en castellano'}
              </Chip>
              {showEs && (
                <p className="border-l-2 border-j-warm pl-4 text-base leading-relaxed text-j-text-em" lang="es">{drill.textEs}</p>
              )}
            </div>
          )}
        </div>
      )}

      {state.phase === 'ready' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Tiempo para responder</span>
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
            <p
              className={cn(
                'pb-2 text-right font-mono text-[10px] uppercase tracking-[0.15em]',
                answer.status === 'listening' ? 'text-j-error' : 'text-j-text-tertiary',
              )}
              data-testid="recall-listening"
            >
              {answer.status === 'listening' ? '● Te escucho…' : 'Hablando…'}
            </p>
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

      {!hidden && <JudgePanel answer={answer} />}

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
          <p className="text-lg leading-relaxed text-j-text-body sm:text-xl" lang="en" data-testid="recall-answer">{withoutPhraseMarks(drill.textEn)}</p>
          {drill.textEs && (
            <div className="space-y-3">
              <Chip active={showEs} onClick={() => setShowEs((v) => !v)}>
                {showEs ? 'Ocultar el castellano' : 'Ver en castellano'}
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
                onFocus={() => {
                  touchedRef.current = true;
                  dispatch({ type: 'select', rating: r.id });
                }}
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
            {judgedRating ? '1 · 2 · 3 corregir · Enter calificar · Espacio pausa' : '1 · 2 · 3 elegir · Enter calificar · Espacio pausa'}
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
            <Chip active={false} onClick={again}>Volver a intentar</Chip>
            {next && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Enter</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function JudgeList({ title, items, mark, tone }: { title: string; items: string[]; mark: string; tone: string }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-snug text-j-text-body" lang="es">
            <span className={cn('shrink-0 font-mono', tone)} aria-hidden>{mark}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * What the judge says about the try, above the answer. Nothing when the
 * answer was not heard at all (no recognizer): the mode is then self-rated.
 */
function JudgePanel({ answer }: { answer: RecallAnswer }) {
  const { status, judgement, micError, transcript } = answer;
  if (micError) {
    return (
      <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark" data-testid="recall-judge" data-judge="mic">
        {micError} Mientras tanto te calificás vos.
      </p>
    );
  }
  if (status === 'idle') return null;
  if (status !== 'done' || !judgement) {
    return (
      <p className="border border-j-border px-3 py-2 text-sm text-j-text-secondary" aria-live="polite" data-testid="recall-judge" data-judge="pending">
        Evalúo lo que dijiste… Si no querés esperar, elegí vos con 1 · 2 · 3.
      </p>
    );
  }
  if (judgement.kind === 'unheard') {
    return (
      <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark" data-testid="recall-judge" data-judge="unheard">
        No llego a escuchar una respuesta, así que no hay evaluación. Calificate vos.
      </p>
    );
  }
  if (judgement.kind === 'unavailable') {
    return (
      <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark" data-testid="recall-judge" data-judge="unavailable">
        El evaluador no está disponible ahora. Calificate vos, como siempre.
      </p>
    );
  }
  const e = judgement.evaluation;
  return (
    <div className="space-y-4 border border-j-border bg-j-bg-white px-4 py-4 sm:px-6" aria-live="polite" data-testid="recall-judge" data-judge={e.rating}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-j-warm-dark">Evaluación</p>
        <p className="text-lg font-semibold text-j-text">{RATING_LABEL[e.rating]}</p>
        {!e.answered && <p className="text-sm text-j-text-secondary">No termina de contestar la pregunta.</p>}
      </div>
      <JudgeList title="Dijiste" items={e.said} mark="✓" tone="text-j-accent" />
      <JudgeList title="Te faltó" items={e.missing} mark="·" tone="text-j-warm-dark" />
      {e.tip && (
        <p className="border-l-2 border-j-warm pl-3 text-sm leading-snug text-j-text-em" lang="es">{e.tip}</p>
      )}
      {transcript && (
        <details className="text-sm text-j-text-secondary">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Lo que escuché</summary>
          <p className="mt-2 leading-relaxed" lang="en">{transcript}</p>
        </details>
      )}
    </div>
  );
}
