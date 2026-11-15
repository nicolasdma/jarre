'use client';

/**
 * Frase por frase: one phrase plays and stops, the mic opens for that phrase
 * only, and only that phrase is scored. Said well (≥ PASS_SCORE, key terms
 * through their sound-alikes), the next phrase plays by itself; if not, the
 * missed words come with their voice and respelling, and after a beat the
 * phrase plays again and the mic reopens, in a loop until it passes or the
 * learner skips it (owner, 2026-11-15). A summary at the end says which phrases needed
 * retries.
 *
 * The turns are the drill's " / " phrases (its sentences when it has no
 * marks). Every transition is in src/lib/practice/phrase-drill.ts; this
 * component runs each phase's effect (play, listen, the beat after a pass).
 *
 * Phrase audio: the stored timings of each phrase (exact, measured offline:
 * phrase-segments.ts); without them the recording is cut at the pauses found
 * in it, and the page says the cuts are approximate (use-sentence-spans.ts);
 * without a recording, the browser voice reads the phrase. Replaces the old
 * free-running shadowing, which had no turn taking ("va a su ritmo y ya",
 * owner, 2026-11-11).
 */

import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Check, ChevronLeft, Ear, Mic, Play, RotateCcw, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KeyTerm } from '@/lib/practice/key-terms';
import {
  firstTryPercent,
  initialPhraseState,
  phraseDrillReducer,
  practicePhrases,
  scorePhrase,
  type PhraseResult,
} from '@/lib/practice/phrase-drill';
import { hasPhraseMarks } from '@/lib/practice/phrase-segments';
import { wordsToPractice } from '@/lib/practice/pronunciation';
import { alignWords } from '@/lib/practice/scoring';
import { Chip, SpeechLabel } from './controls';
import { recognitionError, useRecognitionCtor, type Recognition } from './recognition';
import { TargetLegend, TargetText } from './target-text';
import { PracticeWords, subjectFor, WordHelpPopover } from './word-help';
import { useSentenceSegments } from './use-sentence-spans';
import type { DrillAudio, PlaybackRate } from './use-drill-audio';
import type { PracticeDrill } from './types';

export { PASS_SCORE } from '@/lib/practice/phrase-drill';

/** Quiet after the last recognized word that ends the turn. */
const END_OF_TURN_MS = 1600;
/** Nothing heard at all: give the turn back. */
const NO_SPEECH_MS = 8000;
/** The beat between a phrase said well and the next one. */
const ADVANCE_MS = 1100;
/** A phrase said below the bar plays again by itself after this beat (time to see the missed words), and the mic
 *  reopens: a loop until it passes (owner, 2026-11-15). "Saltear" leaves it. Silence stops the loop: nobody there. */
const LOOP_MS = 1800;

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'INPUT' || (el as HTMLElement).isContentEditable;
}

function BigButton({
  onClick,
  children,
  primary,
  disabled,
  testId,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        'flex min-h-[48px] items-center justify-center gap-2 px-4 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40',
        primary
          ? 'bg-j-accent text-j-text-on-accent hover:bg-j-accent-hover'
          : 'border border-j-border-input text-j-text-secondary hover:border-j-accent hover:text-j-accent',
      )}
    >
      {children}
    </button>
  );
}

export function SentenceMode({
  drill,
  audio,
  terms,
  onFinished,
}: {
  drill: PracticeDrill;
  audio: DrillAudio;
  terms: readonly KeyTerm[];
  /** At the end: % of phrases said well on the first try, or null without speech recognition. */
  onFinished: (firstTry: number | null) => void;
}) {
  const phrases = useMemo(() => practicePhrases(drill.textEn), [drill.textEn]);
  const marked = hasPhraseMarks(drill.textEn);
  const { segments, status } = useSentenceSegments(
    drill.audioUrl,
    drill.slug,
    phrases,
    audio.kind === 'file' ? audio.duration : 0,
    marked ? drill.segments : null,
  );
  const Ctor = useRecognitionCtor();

  const [state, dispatch] = useReducer(phraseDrillReducer, phrases.length, initialPhraseState);
  const { index, phase, results, run } = state;
  // What the mic heard and what went wrong, tagged with the turn they belong to.
  const [heardState, setHeard] = useState({ run: -1, text: '' });
  const [errorState, setError] = useState({ run: -1, text: '' });
  const heard = heardState.run === run ? heardState.text : '';
  const error = errorState.run === run ? errorState.text : null;
  const [help, setHelp] = useState<{ index: number; el: HTMLElement } | null>(null);

  // The effect of each phase. A new run (or leaving the phase) cancels the old one.
  const playSegment = audio.playSegment;
  const pauseAudio = audio.pause;
  const segmentsRef = useRef(segments);
  // The open recognizer, so "Listo" can end the turn.
  const recRef = useRef<Recognition | null>(null);
  const termsRef = useRef(terms);
  useEffect(() => {
    segmentsRef.current = segments;
    termsRef.current = terms;
  });

  const hasSegments = Boolean(segments);
  useEffect(() => {
    if (phase !== 'playing' || !hasSegments) return;
    const segs = segmentsRef.current;
    if (!segs) return;
    let live = true;
    void playSegment(segs[index]).then((ok) => {
      if (live) dispatch({ type: 'played', ok, canListen: Boolean(Ctor) });
    });
    return () => {
      live = false;
      pauseAudio();
    };
  }, [phase, run, index, hasSegments, playSegment, pauseAudio, Ctor]);

  useEffect(() => {
    if (phase !== 'listening' || !Ctor) return;
    let live = true;
    const timers: number[] = [];
    const clearTimers = () => timers.splice(0).forEach((t) => window.clearTimeout(t));
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const phrase = phrases[index];
    const rec: Recognition = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = '';
    let latest = '';
    const endTurn = () => {
      if (live) rec.stop();
    };
    rec.onresult = (e) => {
      let interim = '';
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const r = e.results[k];
        if (r.isFinal) finalText = `${finalText} ${r[0].transcript}`.trim();
        else interim += ` ${r[0].transcript}`;
      }
      latest = `${finalText} ${interim}`.trim();
      if (!live) return;
      setHeard({ run, text: latest });
      clearTimers();
      // The whole phrase said: no need to wait for the quiet.
      later(endTurn, scorePhrase(phrases, index, latest, termsRef.current) === 100 ? 250 : END_OF_TURN_MS);
    };
    rec.onerror = (e) => {
      if (live && e.error !== 'aborted' && e.error !== 'no-speech') setError({ run, text: recognitionError(e.error) });
    };
    rec.onend = () => {
      if (!live) return;
      clearTimers();
      if (!latest) {
        setError((prev) => (prev.run === run ? prev : { run, text: recognitionError('no-speech') }));
        dispatch({ type: 'silent' });
        return;
      }
      // Only this phrase is scored.
      dispatch({ type: 'scored', score: scorePhrase([phrase], 0, latest, termsRef.current) });
    };
    recRef.current = rec;
    later(endTurn, NO_SPEECH_MS);
    try {
      rec.start();
    } catch {
      later(() => {
        if (!live) return;
        setError({ run, text: 'No pude iniciar el reconocimiento de voz.' });
        dispatch({ type: 'silent' });
      }, 0);
    }
    return () => {
      live = false;
      clearTimers();
      if (recRef.current === rec) recRef.current = null;
      rec.onend = null;
      rec.onresult = null;
      rec.abort();
    };
  }, [phase, run, index, phrases, Ctor]);

  useEffect(() => {
    if (phase !== 'passed') return;
    const t = window.setTimeout(() => dispatch({ type: 'advance' }), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [phase, run]);

  // Said below the bar: the phrase plays again and the mic reopens, until it passes or is skipped. Not after
  // silence, a failed playback (no score) or while a word's help is open.
  const helpOpen = help !== null;
  const failedScore = phase === 'result' && !state.silent && state.score !== null;
  useEffect(() => {
    if (!failedScore || !Ctor || helpOpen) return;
    const t = window.setTimeout(() => dispatch({ type: 'replay' }), LOOP_MS);
    return () => window.clearTimeout(t);
  }, [failedScore, run, Ctor, helpOpen]);

  // The summary is reported once per pass through the drill.
  const reportedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });
  useEffect(() => {
    if (phase !== 'summary') {
      reportedRef.current = false;
      return;
    }
    if (reportedRef.current) return;
    reportedRef.current = true;
    onFinishedRef.current(Ctor ? firstTryPercent(results) : null);
  }, [phase, results, Ctor]);

  // Stop everything when the mode goes away.
  useEffect(() => () => pauseAudio(), [pauseAudio]);

  const phrase = phrases[index] ?? '';
  const alignment = useMemo(
    () => alignWords(phrase, heard, { terms, pendingTail: phase === 'listening' }),
    [phrase, heard, terms, phase],
  );

  const act = (e: Parameters<typeof dispatch>[0]) => {
    setHelp(null);
    dispatch(e);
  };
  const start = () => act({ type: 'start' });
  const next = () => act({ type: 'next' });
  const prev = () => act({ type: 'prev' });
  const replay = () => act({ type: 'replay' });
  const again = () => act({ type: 'again' });
  // Ends the turn now: the recognizer delivers what it has and its onend scores it.
  const stopListening = () => recRef.current?.stop();

  // Space: start, then listen again; Enter: done talking, then next; R: say it again; ←/→: previous/next phrase.
  const keysRef = useRef({ phase, start, next, prev, replay, again, stopListening, canRetry: Boolean(Ctor), canStart: hasSegments });
  useEffect(() => {
    keysRef.current = { phase, start, next, prev, replay, again, stopListening, canRetry: Boolean(Ctor), canStart: hasSegments };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      const k = keysRef.current;
      const idle = k.phase === 'ready' || k.phase === 'summary';
      if (idle && !k.canStart) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (idle) k.start();
        else k.replay();
      } else if (e.key === 'Enter') {
        if (idle) {
          e.preventDefault();
          k.start();
        } else if (k.phase === 'listening') {
          e.preventDefault();
          k.stopListening();
        } else if (k.phase === 'result' || k.phase === 'your-turn' || k.phase === 'passed') {
          e.preventDefault();
          k.next();
        }
      } else if ((e.key === 'r' || e.key === 'R') && k.canRetry && (k.phase === 'result' || k.phase === 'passed' || k.phase === 'your-turn')) {
        e.preventDefault();
        k.again();
      } else if (e.key === 'ArrowRight' && !idle) {
        e.preventDefault();
        k.next();
      } else if (e.key === 'ArrowLeft' && !idle) {
        e.preventDefault();
        k.prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!audio.available) {
    return (
      <p className="border border-dashed border-j-border px-3 py-3 font-mono text-[11px] text-j-text-tertiary" data-mode="sentences">
        Frase por frase necesita audio: este drill no tiene grabación y el navegador no tiene voz.
      </p>
    );
  }

  const colored = phase === 'passed' || phase === 'result' || (phase === 'listening' && heard !== '');
  const current = results[index];
  const missed = phase === 'result' ? wordsToPractice(alignment, terms) : [];
  const approximate = status === 'ready' || status === 'error';
  const unit = marked ? 'frase' : 'oración';

  return (
    <div className="space-y-5" data-mode="sentences" data-timing={status}>
      <p className="text-sm text-j-text-secondary" data-testid="sentences-instruction">
        Escuchá la frase, después decí solo esa frase. Cuando la digas bien, pasa a la siguiente.
      </p>
      {!Ctor && (
        <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark">
          Este navegador no reconoce voz: escuchá cada frase, decila y pasá con Siguiente. Usá Chrome o Safari para que te corrija.
        </p>
      )}
      {approximate && (
        <p className="border border-dashed border-j-border px-3 py-2 font-mono text-[10px] text-j-text-tertiary" data-testid="sentences-approximate">
          {status === 'error'
            ? `No pude analizar el audio: cada ${unit} se corta por aproximación y puede empezar o terminar un poco corrida.`
            : marked
              ? 'Este drill todavía no tiene los tiempos de cada frase: la corto en las pausas del audio, así que algún corte puede quedar corrido.'
              : 'Este drill no marca frases con " / ": va por oraciones, cortadas en las pausas del audio.'}
        </p>
      )}

      {phase === 'summary' ? (
        <Summary phrases={phrases} results={results} scored={Boolean(Ctor)} onRestart={start} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-secondary" data-testid="sentence-progress">
              Frase {index + 1} de {phrases.length}
            </p>
            <div className="flex items-center gap-1">
              {audio.kind === 'speech' && <SpeechLabel />}
              {([0.75, 1] as PlaybackRate[]).map((r) => (
                <Chip key={r} active={audio.rate === r} onClick={() => audio.setRate(r)} title={`Velocidad ${r}×`}>{r}×</Chip>
              ))}
            </div>
          </div>
          <ol className="flex gap-1" aria-label="Frases">
            {phrases.map((s, i) => {
              const r = results[i];
              return (
                <li key={i} className="flex-1">
                  <button
                    type="button"
                    onClick={() => act({ type: 'go', index: i })}
                    disabled={!segments}
                    title={s}
                    aria-label={`Frase ${i + 1}`}
                    aria-current={i === index}
                    className={cn(
                      'block h-2 w-full',
                      r.passed ? (r.tries > 1 ? 'bg-j-warm' : 'bg-j-success') : r.tries > 0 ? 'bg-j-error' : 'bg-j-border',
                      i === index && 'outline outline-2 outline-offset-2 outline-j-accent',
                    )}
                  />
                </li>
              );
            })}
          </ol>

          <div className="min-h-[1.5rem] font-mono text-[11px] uppercase tracking-[0.15em]" aria-live="polite" data-testid="sentence-status">
            {phase === 'ready' && <span className="text-j-text-tertiary">{segments ? 'Listo para empezar' : 'Preparando las frases…'}</span>}
            {phase === 'playing' && <span className="text-j-accent">▶ Escuchá…</span>}
            {phase === 'listening' && <span className="text-j-error">● Tu turno: decí esta frase</span>}
            {phase === 'passed' && <span className="text-j-success">✓ Bien · {state.score}%</span>}
            {phase === 'result' && <span className="text-j-error">{state.silent ? 'No te escuché' : state.score === null ? 'No pude reproducir la frase' : `${state.score}% · va de nuevo…`}</span>}
            {phase === 'your-turn' && <span className="text-j-accent">Tu turno: decila</span>}
          </div>

          <div data-testid="sentence-current">
            <TargetText
              words={alignment.words}
              terms={terms}
              colored={colored}
              activeIndex={help?.index ?? null}
              onWord={(i, el) => setHelp(help?.index === i ? null : { index: i, el })}
            />
          </div>
          <WordHelpPopover
            anchor={help?.el ?? null}
            subject={help ? subjectFor(alignment, help.index, terms, colored) : null}
            onClose={() => setHelp(null)}
            speakDisabled={phase === 'listening'}
            onBeforeSpeak={audio.pause}
          />
          {colored && <TargetLegend words={alignment.words} extras={alignment.extras} showExtras={phase !== 'listening'} />}
          {error && <p className="text-sm text-j-error">{error}</p>}

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {phase === 'ready' && (
              <BigButton primary onClick={start} disabled={!segments} testId="sentences-start">
                <Play size={14} /> Empezar · Espacio
              </BigButton>
            )}
            {phase === 'listening' && (
              <BigButton primary onClick={stopListening} testId="sentence-done">
                <Mic size={14} /> Listo · Enter
              </BigButton>
            )}
            {(phase === 'result' || phase === 'your-turn') && (
              <>
                {Ctor && (
                  <BigButton primary onClick={again} testId="sentence-again">
                    <RotateCcw size={14} /> Repetir frase · R
                  </BigButton>
                )}
                <BigButton onClick={replay} testId="sentence-replay">
                  <Ear size={14} /> Escuchar de nuevo · Espacio
                </BigButton>
                <BigButton onClick={next} testId="sentence-next">
                  <SkipForward size={14} /> {failedScore ? 'Saltear' : index + 1 < phrases.length ? 'Siguiente' : 'Terminar'} · Enter
                </BigButton>
              </>
            )}
            {phase === 'playing' && (
              <BigButton onClick={replay} testId="sentence-restart">
                <RotateCcw size={14} /> Desde el principio de la frase
              </BigButton>
            )}
            {phase === 'passed' && (
              <BigButton onClick={next} testId="sentence-next">
                <Check size={14} /> Siguiente · Enter
              </BigButton>
            )}
            {index > 0 && phase !== 'ready' && (
              <BigButton onClick={prev} testId="sentence-prev">
                <ChevronLeft size={14} /> Frase anterior · ←
              </BigButton>
            )}
          </div>

          {missed.length > 0 && <PracticeWords items={missed} terms={terms} onBeforeSpeak={audio.pause} />}
          {current && current.tries > 1 && phase === 'result' && (
            <p className="font-mono text-[10px] text-j-text-tertiary">Intento {current.tries} · mejor {current.best}%</p>
          )}
        </>
      )}
    </div>
  );
}

function Summary({
  phrases,
  results,
  scored,
  onRestart,
}: {
  phrases: string[];
  results: PhraseResult[];
  scored: boolean;
  onRestart: () => void;
}) {
  const firstTry = results.filter((r) => r.passed && r.tries === 1).length;
  return (
    <section className="space-y-4" data-testid="sentences-summary">
      <p className="text-base text-j-text">
        {scored ? `${firstTry} de ${phrases.length} frases a la primera.` : `Terminaste las ${phrases.length} frases.`}
      </p>
      {scored && (
        <ol className="space-y-2">
          {phrases.map((s, i) => {
            const r = results[i];
            const label = !r.passed ? (r.tries ? `salteada · mejor ${r.best}%` : 'salteada') : r.tries === 1 ? 'a la primera' : `${r.tries} intentos`;
            return (
              <li key={i} className="flex gap-3 border-l-2 border-j-border pl-3 text-sm">
                <span className={cn('w-28 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em]', !r.passed ? 'text-j-error' : r.tries === 1 ? 'text-j-success' : 'text-j-warm')}>
                  {label}
                </span>
                <span className="min-w-0 text-j-text-secondary" lang="en">{s}</span>
              </li>
            );
          })}
        </ol>
      )}
      <BigButton primary onClick={onRestart} testId="sentences-restart">
        <RotateCcw size={14} /> Otra vez · Enter
      </BigButton>
    </section>
  );
}
