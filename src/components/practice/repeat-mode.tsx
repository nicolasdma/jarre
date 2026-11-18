'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KeyTerm } from '@/lib/practice/key-terms';
import { pronunciationFor, wordsToPractice } from '@/lib/practice/pronunciation';
import { PASS_SCORE } from '@/lib/practice/phrase-drill';
import { alignWords } from '@/lib/practice/scoring';
import { AudioBar, Chip, PrimaryButton, Stat } from './controls';
import { useMicPrimer } from '@/components/help/first-time';
import { useShowRespelling } from './show-respelling';
import { TargetLegend, TargetText } from './target-text';
import { PracticeWords, subjectFor, WordHelpPopover } from './word-help';
import { useMissedRespellings } from './use-missed-respellings';
import type { DrillAudio } from './use-drill-audio';
import type { PracticeDrill } from './types';
import { RECOGNITION_ERRORS as ERRORS, recognitionError, useRecognitionCtor, type Recognition } from './recognition';

const noSubscribe = () => () => {};
const canRecordMic = () => typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
const isIosDevice = () => /iPhone|iPad|iPod/.test(navigator.userAgent);


/**
 * Escuchar y repetir: play the model audio, then speak. SpeechRecognition
 * (en-US, interim results) marks each target word; MediaRecorder optionally
 * keeps the take so it can be played next to the model.
 *
 * The text never moves: words are only colored, extra words go under it. Key
 * terms the recognizer cannot know (Supabase, Centrobill) count as said when
 * it writes a known sound-alike, flagged to check by ear. Tap any word to
 * hear it; after an attempt, the words to drill. After a take below the
 * bar, its missed words are written as they sound until a take passes.
 */
export function RepeatMode({
  drill,
  audio,
  terms,
  onScore,
}: {
  drill: PracticeDrill;
  audio: DrillAudio;
  /** The lesson's key terms (sound-alikes and respellings). */
  terms: readonly KeyTerm[];
  onScore: (score: number) => void;
}) {
  // Browser capabilities: null/false on the server, read once on the client (no hydration mismatch).
  const Ctor = useRecognitionCtor();
  const canRecord = useSyncExternalStore(noSubscribe, canRecordMic, () => false);
  const isIos = useSyncExternalStore(noSubscribe, isIosDevice, () => false);
  // iOS gives the mic to the last capture, which would starve the recognizer.
  const [keepTakeChoice, setKeepTake] = useState<boolean | null>(null);
  const keepTake = keepTakeChoice ?? (canRecord && !isIos);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const recRef = useRef<Recognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalRef = useRef('');

  const heard = `${finalText} ${interim}`.trim();
  const alignment = useMemo(
    () => alignWords(drill.textEn, heard, { terms, pendingTail: listening }),
    [drill.textEn, heard, terms, listening],
  );
  // The words missed on the last take below the bar, written as they sound until a take passes.
  const missedSay = useMissedRespellings(drill.textEn, alignment.words, terms);
  const [showRespelling, setShowRespelling] = useShowRespelling();
  const [help, setHelp] = useState<{ index: number; el: HTMLElement } | null>(null);
  const hasRespellings = useMemo(
    () => alignment.words.some((w) => w.term !== null && pronunciationFor(w.word, terms[w.term] ?? null)?.say),
    [alignment.words, terms],
  );

  const stopCapture = () => {
    recRef.current?.stop();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
  };

  useEffect(() => () => {
    recRef.current?.abort();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => () => {
    if (takeUrl) URL.revokeObjectURL(takeUrl);
  }, [takeUrl]);

  const mic = useMicPrimer();
  const start = async () => {
    setError(null);
    setDone(false);
    setFinalText('');
    setInterim('');
    finalRef.current = '';
    audio.pause();
    if (takeUrl) setTakeUrl(null);

    if (keepTake && canRecord) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          if (chunks.length) setTakeUrl(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
        };
        recorder.start();
        recorderRef.current = recorder;
      } catch {
        setError(ERRORS['not-allowed']);
      }
    }

    if (!Ctor) {
      setListening(true);
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current = `${finalRef.current} ${r[0].transcript}`.trim();
        else interimText += ` ${r[0].transcript}`;
      }
      setFinalText(finalRef.current);
      setInterim(interimText.trim());
    };
    rec.onerror = (e) => {
      if (e.error !== 'aborted') setError(recognitionError(e.error));
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
      setDone(true);
      const said = finalRef.current;
      if (said) missedSay.noteAttempt(said, alignWords(drill.textEn, said, { terms }).score >= PASS_SCORE);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError('No pude iniciar el reconocimiento de voz.');
    }
  };

  const stop = () => {
    stopCapture();
    if (!Ctor) {
      setListening(false);
      setDone(true);
    }
  };

  // Report the score once per take, when the recognizer has finished.
  const reportedRef = useRef(false);
  useEffect(() => {
    if (listening) reportedRef.current = false;
    if (done && Ctor && finalText && !reportedRef.current) {
      reportedRef.current = true;
      onScore(alignWords(drill.textEn, finalText, { terms }).score);
    }
  }, [done, listening, finalText, Ctor, drill.textEn, terms, onScore]);

  return (
    <div className="space-y-5" data-mode="repeat">
      <AudioBar audio={audio} showLoop={false} />

      {!Ctor && (
        <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark" data-testid="no-recognition">
          Este navegador no tiene reconocimiento de voz (Web Speech API), así que no puedo marcar las palabras.
          Usá Chrome o Safari. {canRecord ? 'Igual podés grabarte y escucharte al lado del modelo.' : ''}
        </p>
      )}

      {/* Everything in this row is always there (the indicator only turns invisible), so the text below never jumps. */}
      <div className="flex flex-wrap items-center gap-2">
        {!listening ? (
          <PrimaryButton onClick={() => mic.run(() => void start())} className="flex min-w-[8.5rem] items-center justify-center gap-2">
            <Mic size={14} /> {Ctor ? 'Repetir en voz alta' : 'Grabarme'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={stop} className="flex min-w-[8.5rem] items-center justify-center gap-2 bg-j-error hover:bg-j-error">
            <Square size={14} /> Terminar
          </PrimaryButton>
        )}
        {canRecord && Ctor && (
          <Chip active={keepTake} onClick={() => setKeepTake(!keepTake)} disabled={listening} title="Guardar tu grabación para escucharla">
            Guardar mi grabación
          </Chip>
        )}
        {hasRespellings && (
          <Chip active={showRespelling} onClick={() => setShowRespelling(!showRespelling)} title="Cómo suenan los nombres y términos clave">
            Cómo se pronuncia
          </Chip>
        )}
        <span className={cn('font-mono text-[11px] text-j-error', !listening && 'invisible')} aria-hidden={!listening}>● escuchando…</span>
      </div>

      {mic.prompt}

      <TargetText
        words={alignment.words}
        terms={terms}
        colored={Boolean(Ctor && (heard || done))}
        showRespelling={showRespelling}
        replaced={missedSay.replaced}
        activeIndex={help?.index ?? null}
        onWord={(index, el) => setHelp(help?.index === index ? null : { index, el })}
      />
      <WordHelpPopover
        anchor={help?.el ?? null}
        subject={help ? subjectFor(alignment, help.index, terms, Boolean(Ctor && (heard || done))) : null}
        onClose={() => setHelp(null)}
        speakDisabled={listening}
        onBeforeSpeak={audio.pause}
      />

      {error && <p className="text-sm text-j-error">{error}</p>}

      {Ctor && (heard || done) && (
        <>
          <TargetLegend words={alignment.words} extras={alignment.extras} showExtras={!listening} />
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Puntaje" value={`${alignment.score}%`} />
            <Stat label="Palabras" value={`${alignment.said}/${alignment.total}`} />
          </div>
          {done && !listening && (
            <PracticeWords items={wordsToPractice(alignment, terms)} terms={terms} onBeforeSpeak={audio.pause} />
          )}
        </>
      )}

      {takeUrl && (
        <div className="space-y-2 border border-j-border bg-j-bg-white p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">Tu toma</p>
          <audio controls src={takeUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
