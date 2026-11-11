'use client';

/**
 * Frase por frase: one sentence plays and stops, the mic opens for that
 * sentence only, and it is scored on the spot. Said well (≥ PASS_SCORE, key
 * terms through their sound-alikes), it moves on by itself; if not, the
 * missed words come with their voice and respelling, and the learner repeats
 * it, listens again or skips. A summary at the end says which sentences
 * needed retries.
 *
 * Sentence audio: the recording is cut at the pauses found in it
 * (use-sentence-spans.ts); without a recording, the browser voice reads the
 * sentence. Replaces the old free-running shadowing, which had no turn taking
 * ("va a su ritmo y ya", owner, 2026-11-11).
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Check, Ear, Mic, Play, RotateCcw, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { wordsToPractice } from '@/lib/practice/pronunciation';
import { alignWords } from '@/lib/practice/scoring';
import { practiceSentences } from '@/lib/practice/sentence-timing';
import { Chip, SpeechLabel } from './controls';
import { recognitionError, useRecognitionCtor, type Recognition } from './recognition';
import { TargetLegend, TargetText } from './target-text';
import { PracticeWords, subjectFor, WordHelpPopover } from './word-help';
import { useSentenceSegments } from './use-sentence-spans';
import type { DrillAudio, PlaybackRate } from './use-drill-audio';
import type { PracticeDrill } from './types';

/** A sentence counts as said at this word score. */
export const PASS_SCORE = 85;
/** Quiet after the last recognized word that ends the turn. */
const END_OF_TURN_MS = 1600;
/** Nothing heard at all: give the turn back. */
const NO_SPEECH_MS = 8000;
/** The beat between a sentence said well and the next one. */
const ADVANCE_MS = 1100;

type Phase = 'ready' | 'playing' | 'listening' | 'passed' | 'result' | 'your-turn' | 'summary';

interface SentenceResult {
  tries: number;
  passed: boolean;
  best: number;
}

const freshResults = (n: number): SentenceResult[] => Array.from({ length: n }, () => ({ tries: 0, passed: false, best: 0 }));

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
  /** At the end: % of sentences said well on the first try, or null without speech recognition. */
  onFinished: (firstTry: number | null) => void;
}) {
  const sentences = useMemo(() => practiceSentences(drill.textEn), [drill.textEn]);
  const { segments, status } = useSentenceSegments(drill.audioUrl, drill.slug, sentences, audio.kind === 'file' ? audio.duration : 0);
  const Ctor = useRecognitionCtor();

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [results, setResultsState] = useState<SentenceResult[]>(() => freshResults(sentences.length));
  // Read synchronously by the steps; the state is for rendering.
  const resultsRef = useRef(results);
  const setResults = (next: SentenceResult[]) => {
    resultsRef.current = next;
    setResultsState(next);
  };
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [help, setHelp] = useState<{ index: number; el: HTMLElement } | null>(null);

  // Every async step checks it is still the current run: any new action cancels the old one.
  const runRef = useRef(0);
  const recRef = useRef<Recognition | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  // `audio` is a new object every render; its pause is stable, so halt is too
  // and the unmount cleanup below does not fire on every render.
  const pauseAudio = audio.pause;
  const halt = useCallback(() => {
    runRef.current++;
    clearTimers();
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onend = null;
      rec.onresult = null;
      rec.abort();
    }
    pauseAudio();
  }, [pauseAudio]);

  useEffect(() => halt, [halt]);

  const sentence = sentences[index] ?? '';
  const alignment = useMemo(
    () => alignWords(sentence, heard, { terms, pendingTail: phase === 'listening' }),
    [sentence, heard, terms, phase],
  );

  const finish = (all: SentenceResult[]) => {
    setPhase('summary');
    if (!Ctor) {
      onFinished(null);
      return;
    }
    const firstTry = all.filter((r) => r.passed && r.tries === 1).length;
    onFinished(Math.round((firstTry / Math.max(1, all.length)) * 100));
  };

  // Declared before use through refs, so the steps can call each other.
  const playRef = useRef<(i: number) => void>(() => {});
  const listenRef = useRef<(i: number) => void>(() => {});

  const goTo = (i: number, all: SentenceResult[]) => {
    if (i >= sentences.length) {
      halt();
      finish(all);
      return;
    }
    setIndex(i);
    playRef.current(i);
  };

  const score = (i: number, text: string) => {
    const s = alignWords(sentences[i], text, { terms }).score;
    const next = resultsRef.current.map((r, k) =>
      k === i ? { tries: r.tries + 1, passed: r.passed || s >= PASS_SCORE, best: Math.max(r.best, s) } : r,
    );
    setResults(next);
    if (s >= PASS_SCORE) {
      setPhase('passed');
      const run = runRef.current;
      later(() => {
        if (runRef.current === run) goTo(i + 1, next);
      }, ADVANCE_MS);
    } else {
      setPhase('result');
    }
  };

  const listen = (i: number) => {
    halt();
    const run = runRef.current;
    setHelp(null);
    setError(null);
    setHeard('');
    if (!Ctor) {
      setPhase('your-turn');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = '';
    let latest = '';
    const endTurn = () => {
      if (runRef.current === run) rec.stop();
    };
    rec.onresult = (e) => {
      let interim = '';
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const r = e.results[k];
        if (r.isFinal) finalText = `${finalText} ${r[0].transcript}`.trim();
        else interim += ` ${r[0].transcript}`;
      }
      latest = `${finalText} ${interim}`.trim();
      if (runRef.current !== run) return;
      setHeard(latest);
      clearTimers();
      // Everything said: no need to wait for the quiet.
      if (alignWords(sentences[i], latest, { terms }).score === 100) later(endTurn, 250);
      else later(endTurn, END_OF_TURN_MS);
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech' && runRef.current === run) setError(recognitionError(e.error));
    };
    rec.onend = () => {
      if (runRef.current !== run) return;
      clearTimers();
      recRef.current = null;
      if (!latest) {
        setError(recognitionError('no-speech'));
        setPhase('result');
        return;
      }
      score(i, latest);
    };
    recRef.current = rec;
    later(endTurn, NO_SPEECH_MS);
    try {
      rec.start();
      setPhase('listening');
    } catch {
      setError('No pude iniciar el reconocimiento de voz.');
      setPhase('result');
    }
  };

  const play = (i: number) => {
    if (!segments) return;
    halt();
    const run = runRef.current;
    setHelp(null);
    setError(null);
    setHeard('');
    setPhase('playing');
    void audio.playSegment(segments[i]).then((ok) => {
      if (runRef.current !== run) return;
      if (ok) listenRef.current(i);
      else setPhase('result');
    });
  };

  const start = () => {
    const fresh = freshResults(sentences.length);
    setResults(fresh);
    goTo(0, fresh);
  };
  const next = () => goTo(index + 1, resultsRef.current);
  const replay = () => play(index);
  const again = () => listen(index);
  const stopListening = () => recRef.current?.stop();

  // Space: listen (again); Enter: next. Not while typing elsewhere.
  const keysRef = useRef({ phase, replay, next, start, stopListening });
  useLayoutEffect(() => {
    playRef.current = play;
    listenRef.current = listen;
    keysRef.current = { phase, replay, next, start, stopListening };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      const k = keysRef.current;
      if (e.key === ' ') {
        e.preventDefault();
        if (k.phase === 'ready' || k.phase === 'summary') k.start();
        else k.replay();
      } else if (e.key === 'Enter') {
        if (k.phase === 'ready' || k.phase === 'summary') {
          e.preventDefault();
          k.start();
        } else if (k.phase === 'listening') {
          e.preventDefault();
          k.stopListening();
        } else if (k.phase === 'result' || k.phase === 'your-turn' || k.phase === 'passed') {
          e.preventDefault();
          k.next();
        }
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

  return (
    <div className="space-y-5" data-mode="sentences">
      <p className="text-sm text-j-text-secondary" data-testid="sentences-instruction">
        Escuchá la frase, después decila vos. Cuando la digas bien, pasa a la siguiente.
      </p>
      {!Ctor && (
        <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark">
          Este navegador no reconoce voz: escuchá cada frase, decila y pasá con Siguiente. Usá Chrome o Safari para que te corrija.
        </p>
      )}

      {phase === 'summary' ? (
        <Summary sentences={sentences} results={results} scored={Boolean(Ctor)} onRestart={start} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-j-text-secondary" data-testid="sentence-progress">
              Frase {index + 1} de {sentences.length}
            </p>
            <div className="flex items-center gap-1">
              {audio.kind === 'speech' && <SpeechLabel />}
              {([0.75, 1] as PlaybackRate[]).map((r) => (
                <Chip key={r} active={audio.rate === r} onClick={() => audio.setRate(r)} title={`Velocidad ${r}×`}>{r}×</Chip>
              ))}
            </div>
          </div>
          <ol className="flex gap-1" aria-label="Frases">
            {sentences.map((s, i) => {
              const r = results[i];
              return (
                <li key={i} className="flex-1">
                  <button
                    type="button"
                    onClick={() => goTo(i, resultsRef.current)}
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
            {phase === 'listening' && <span className="text-j-error">● Tu turno: decila</span>}
            {phase === 'passed' && <span className="text-j-success">✓ Bien · {alignment.score}%</span>}
            {phase === 'result' && <span className="text-j-error">{heard ? `${alignment.score}% · probá de nuevo` : 'No te escuché'}</span>}
            {phase === 'your-turn' && <span className="text-j-accent">Tu turno: decila</span>}
          </div>

          {status === 'error' && (
            <p className="font-mono text-[10px] text-j-text-tertiary">No pude analizar el audio: los cortes entre frases son aproximados.</p>
          )}

          <TargetText
            words={alignment.words}
            terms={terms}
            colored={colored}
            activeIndex={help?.index ?? null}
            onWord={(i, el) => setHelp(help?.index === i ? null : { index: i, el })}
          />
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
              <BigButton primary onClick={stopListening}>
                <Mic size={14} /> Listo · Enter
              </BigButton>
            )}
            {(phase === 'result' || phase === 'your-turn') && (
              <>
                {Ctor && (
                  <BigButton primary onClick={again} testId="sentence-again">
                    <RotateCcw size={14} /> Repetir frase
                  </BigButton>
                )}
                <BigButton onClick={replay} testId="sentence-replay">
                  <Ear size={14} /> Escuchar de nuevo · Espacio
                </BigButton>
                <BigButton onClick={next} testId="sentence-next">
                  <SkipForward size={14} /> Siguiente · Enter
                </BigButton>
              </>
            )}
            {(phase === 'playing' || phase === 'passed') && (
              <BigButton onClick={phase === 'passed' ? next : replay}>
                {phase === 'passed' ? <><Check size={14} /> Siguiente · Enter</> : <><RotateCcw size={14} /> Desde el principio de la frase</>}
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
  sentences,
  results,
  scored,
  onRestart,
}: {
  sentences: string[];
  results: SentenceResult[];
  scored: boolean;
  onRestart: () => void;
}) {
  const firstTry = results.filter((r) => r.passed && r.tries === 1).length;
  return (
    <section className="space-y-4" data-testid="sentences-summary">
      <p className="text-base text-j-text">
        {scored ? `${firstTry} de ${sentences.length} frases a la primera.` : `Terminaste las ${sentences.length} frases.`}
      </p>
      {scored && (
        <ol className="space-y-2">
          {sentences.map((s, i) => {
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
