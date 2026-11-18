'use client';

/**
 * Frase por frase: one phrase plays and stops, the mic opens for that phrase
 * only, and only that phrase is scored. Said well (≥ PASS_SCORE, key terms
 * through their sound-alikes), the next phrase plays by itself; if not, the
 * missed words come with their voice and respelling, and after a beat the
 * phrase plays again and the mic reopens, in a loop until it passes or the
 * learner skips it (owner, 2026-11-15). Until it passes, the words missed on
 * the last try are written in the phrase as they sound
 * (use-missed-respellings.ts). Saltar (S, or →) leaves the phrase at any moment
 * of its turn, stops its audio and mic, and keeps it for the end: "Te quedaron
 * N frases" offers a pass over only those before the summary (owner,
 * 2026-11-18). A summary at the end says which phrases needed retries.
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
  saidWellPercent,
  initialPhraseState,
  leftoverPhrases,
  PASS_SCORE,
  phraseDrillReducer,
  practicePhrases,
  scorePhrase,
  type PhrasePhase,
  type PhraseResult,
  type SentencesResult,
} from '@/lib/practice/phrase-drill';
import { hasPhraseMarks } from '@/lib/practice/phrase-segments';
import { wordsToPractice } from '@/lib/practice/pronunciation';
import { alignWords } from '@/lib/practice/scoring';
import { Chip, SpeechLabel } from './controls';
import { recognitionError, useRecognitionCtor, type Recognition } from './recognition';
import { TargetLegend, TargetText } from './target-text';
import { PracticeWords, subjectFor, WordHelpPopover } from './word-help';
import { useSentenceSegments } from './use-sentence-spans';
import { useMissedRespellings } from './use-missed-respellings';
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
  label,
  shortcut,
}: {
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  testId?: string;
  /** Accessible name, when the visible text is not enough; it starts with the visible word. */
  label?: string;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      aria-label={label}
      aria-keyshortcuts={shortcut}
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
  /** At the end: % of phrases said well (any try) and on the first try, or null without speech recognition. */
  onFinished: (result: SentencesResult | null) => void;
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
  const { index, phase, results, run, queue } = state;
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
  const noteAttemptRef = useRef<(heard: string, passed: boolean) => void>(() => {});
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
      const score = scorePhrase([phrase], 0, latest, termsRef.current);
      // Below the bar, its missed words are written as they sound for the next try; a pass clears them.
      noteAttemptRef.current(latest, score >= PASS_SCORE);
      dispatch({ type: 'scored', score });
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

  // Reported once at each end: the leftover offer (the learner may stop there) and the summary after it. The
  // scores only keep the best, so a second report adds only what going over the skipped phrases earned.
  const reportedRef = useRef<PhrasePhase | null>(null);
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  });
  useEffect(() => {
    if (phase !== 'summary' && phase !== 'leftover') {
      reportedRef.current = null;
      return;
    }
    if (reportedRef.current === phase) return;
    reportedRef.current = phase;
    onFinishedRef.current(Ctor ? { saidWell: saidWellPercent(results), firstTry: firstTryPercent(results) } : null);
  }, [phase, results, Ctor]);

  // Stop everything when the mode goes away.
  useEffect(() => () => pauseAudio(), [pauseAudio]);

  const phrase = phrases[index] ?? '';
  const alignment = useMemo(
    () => alignWords(phrase, heard, { terms, pendingTail: phase === 'listening' }),
    [phrase, heard, terms, phase],
  );
  const missedSay = useMissedRespellings(phrase, alignment.words, terms);
  useEffect(() => {
    noteAttemptRef.current = missedSay.noteAttempt;
  });

  const act = (e: Parameters<typeof dispatch>[0]) => {
    setHelp(null);
    // Another phrase (or the drill again): the last attempt's words no longer apply.
    if (e.type === 'go' || e.type === 'next' || e.type === 'skip' || e.type === 'prev' || e.type === 'start' || e.type === 'review') {
      missedSay.clear();
    }
    dispatch(e);
  };
  const start = () => act({ type: 'start' });
  const next = () => act({ type: 'next' });
  // Leaving the phrase stops its audio and closes the mic: the effects of `playing` and `listening` clean up
  // when the phrase changes, and nothing of this turn is scored.
  const skip = () => act({ type: 'skip' });
  const review = () => act({ type: 'review' });
  const finish = () => act({ type: 'finish' });
  const prev = () => act({ type: 'prev' });
  const replay = () => act({ type: 'replay' });
  const again = () => act({ type: 'again' });
  // Ends the turn now: the recognizer delivers what it has and its onend scores it.
  const stopListening = () => recRef.current?.stop();

  // Space: start, then listen again; Enter: done talking, then next; R: say it again; S: skip this phrase;
  // ←/→: previous/next phrase (→ before the phrase was said well is a skip). At the leftover offer, Enter goes
  // over the skipped phrases.
  const canSkip = Boolean(Ctor);
  const keys = { phase, start, next, skip, prev, replay, again, review, stopListening, canRetry: Boolean(Ctor), canSkip, canStart: hasSegments };
  const keysRef = useRef(keys);
  useEffect(() => {
    keysRef.current = keys;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      const k = keysRef.current;
      if (k.phase === 'leftover') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          k.review();
        }
        return;
      }
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
      } else if ((e.key === 's' || e.key === 'S') && k.canSkip && (k.phase === 'playing' || k.phase === 'listening' || k.phase === 'result')) {
        e.preventDefault();
        k.skip();
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
        Frase por frase necesita audio: esta frase no tiene grabación y el navegador no tiene voz.
      </p>
    );
  }

  const colored = phase === 'passed' || phase === 'result' || (phase === 'listening' && heard !== '');
  const current = results[index];
  const missed = phase === 'result' ? wordsToPractice(alignment, terms) : [];
  // Cuts read from the audio's pauses are a detail for whoever writes the lesson; only a failed analysis is told.
  const approximate = status === 'error';
  const unit = marked ? 'frase' : 'oración';
  const left = leftoverPhrases(state);
  const skippedHere = (i: number) => state.skipped.includes(i) && !results[i].passed;
  // The turn of a phrase that a skip can leave: it is playing, listening, or waiting after a try below the bar.
  const skippable = canSkip && (phase === 'playing' || phase === 'listening' || phase === 'result');

  return (
    <div className="space-y-5" data-mode="sentences" data-timing={status}>
      <p className="text-sm text-j-text-secondary" data-testid="sentences-instruction">
        Escuchá la frase, después decí solo esa frase. Cuando la digas bien, pasa a la siguiente.
        {Ctor && ' Si te trabás, Saltar la deja para el final.'}
      </p>
      {!Ctor && (
        <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark">
          Este navegador no reconoce voz: escuchá cada frase, decila y pasá con Siguiente. Sin corrección no cuenta como aprobado: usá Chrome o Safari para que te corrija y sume.
        </p>
      )}
      {approximate && (
        <p className="border border-dashed border-j-border px-3 py-2 font-mono text-[10px] text-j-text-tertiary" data-testid="sentences-approximate">
          No pude analizar el audio: cada {unit} se corta por aproximación y puede empezar o terminar un poco corrida.
        </p>
      )}

      {phase === 'summary' ? (
        <Summary phrases={phrases} results={results} scored={Boolean(Ctor)} onRestart={start} />
      ) : phase === 'leftover' ? (
        <Leftover phrases={phrases} left={left} onReview={review} onFinish={finish} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-secondary" data-testid="sentence-progress">
              {queue
                ? `Repaso · frase ${index + 1} · ${queue.indexOf(index) + 1} de ${queue.length}`
                : `Frase ${index + 1} de ${phrases.length}`}
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
                    aria-label={`Frase ${i + 1}${skippedHere(i) ? ', salteada' : ''}`}
                    aria-current={i === index}
                    className="block w-full py-2"
                  >
                    {/* The bar stays 8px; the button around it is a 24px target. */}
                    <span
                      aria-hidden
                      className={cn(
                        'block h-2 w-full',
                        r.passed ? (r.tries > 1 ? 'bg-j-warm' : 'bg-j-success') : r.tries > 0 ? 'bg-j-error' : skippedHere(i) ? 'bg-j-warm-light' : 'bg-j-border',
                        i === index && 'outline outline-2 outline-offset-2 outline-j-accent',
                      )}
                    />
                  </button>
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
              replaced={missedSay.replaced}
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
                {!skippable && (
                  <BigButton onClick={next} testId="sentence-next">
                    <SkipForward size={14} /> {index + 1 < phrases.length ? 'Siguiente' : 'Terminar'} · Enter
                  </BigButton>
                )}
              </>
            )}
            {phase === 'playing' && (
              <BigButton onClick={replay} testId="sentence-restart">
                <RotateCcw size={14} /> Desde el principio de la frase
              </BigButton>
            )}
            {skippable && (
              <BigButton onClick={skip} testId="sentence-skip" label="Saltar esta frase: queda para repasar al final" shortcut="S">
                <SkipForward size={14} /> Saltar · S
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

/** The pass ended with skipped phrases not said well yet: go over only those, or leave them and see the summary. */
function Leftover({
  phrases,
  left,
  onReview,
  onFinish,
}: {
  phrases: string[];
  left: number[];
  onReview: () => void;
  onFinish: () => void;
}) {
  const n = left.length;
  return (
    <section className="space-y-4" data-testid="sentences-leftover" aria-live="polite">
      <p className="text-base text-j-text">
        {n === 1 ? 'Te quedó 1 frase' : `Te quedaron ${n} frases`}: ¿{n === 1 ? 'la repasamos' : 'las repasamos'}?
      </p>
      <ol className="space-y-2">
        {left.map((i) => (
          <li key={i} className="flex gap-3 border-l-2 border-j-warm pl-3 text-sm">
            <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-j-text-tertiary">Frase {i + 1}</span>
            <span className="min-w-0 text-j-text-secondary" lang="en">{phrases[i]}</span>
          </li>
        ))}
      </ol>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <BigButton primary onClick={onReview} testId="sentences-review">
          <RotateCcw size={14} /> {n === 1 ? 'Repasarla' : 'Repasarlas'} · Enter
        </BigButton>
        <BigButton onClick={onFinish} testId="sentences-finish">
          <Check size={14} /> Ver resumen
        </BigButton>
      </div>
    </section>
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
  const well = results.filter((r) => r.passed).length;
  return (
    <section className="space-y-4" data-testid="sentences-summary">
      <p className="text-base text-j-text">
        {scored ? `${well} de ${phrases.length} frases dichas bien · ${firstTry} a la primera.` : `Terminaste las ${phrases.length} frases.`}
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
