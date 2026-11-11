'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Mic, Square } from 'lucide-react';
import { alignWords } from '@/lib/practice/scoring';
import { AudioBar, Chip, PrimaryButton, Stat } from './controls';
import { WordMarks } from './word-marks';
import type { DrillAudio } from './use-drill-audio';
import type { PracticeDrill } from './types';

// Minimal Web Speech API surface (not in every TS DOM lib; Chrome and Safari prefix it).
interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionAlternative }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};
const canRecordMic = () => typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
const isIosDevice = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

const ERRORS: Record<string, string> = {
  'not-allowed': 'El navegador bloqueó el micrófono. Habilitalo para este sitio y probá de nuevo.',
  'service-not-allowed': 'El reconocimiento de voz no está permitido en este navegador.',
  'no-speech': 'No te escuché. Probá de nuevo, un poco más cerca del micrófono.',
  'audio-capture': 'No encontré un micrófono.',
  network: 'El reconocimiento de voz necesita conexión.',
};

/**
 * Escuchar y repetir: play the model audio, then speak. SpeechRecognition
 * (en-US, interim results) marks each target word; MediaRecorder optionally
 * keeps the take so it can be played next to the model.
 */
export function RepeatMode({
  drill,
  audio,
  onScore,
}: {
  drill: PracticeDrill;
  audio: DrillAudio;
  onScore: (score: number) => void;
}) {
  // Browser capabilities: null/false on the server, read once on the client (no hydration mismatch).
  const Ctor = useSyncExternalStore(noSubscribe, recognitionCtor, () => null);
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
  const alignment = useMemo(() => alignWords(drill.textEn, heard), [drill.textEn, heard]);

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
      if (e.error !== 'aborted') setError(ERRORS[e.error] ?? `Error del reconocimiento: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      setInterim('');
      setDone(true);
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
      onScore(alignWords(drill.textEn, finalText).score);
    }
  }, [done, listening, finalText, Ctor, drill.textEn, onScore]);

  return (
    <div className="space-y-5" data-mode="repeat">
      <AudioBar audio={audio} showLoop={false} />

      {!Ctor && (
        <p className="border border-j-warm bg-j-warm-light px-3 py-2 text-sm text-j-warm-dark" data-testid="no-recognition">
          Este navegador no tiene reconocimiento de voz (Web Speech API), así que no puedo marcar las palabras.
          Usá Chrome o Safari. {canRecord ? 'Igual podés grabarte y escucharte al lado del modelo.' : ''}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!listening ? (
          <PrimaryButton onClick={start} className="flex items-center gap-2">
            <Mic size={14} /> {Ctor ? 'Hablar' : 'Grabarme'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={stop} className="flex items-center gap-2 bg-j-error hover:bg-j-error">
            <Square size={14} /> Terminar
          </PrimaryButton>
        )}
        {canRecord && Ctor && (
          <Chip active={keepTake} onClick={() => setKeepTake(!keepTake)} disabled={listening} title="Guardar tu toma para escucharla">
            Guardar mi toma
          </Chip>
        )}
        {listening && <span className="font-mono text-[11px] text-j-error">● escuchando…</span>}
      </div>

      {error && <p className="text-sm text-j-error">{error}</p>}

      {Ctor && (heard || done) ? (
        <WordMarks marks={alignment.marks} />
      ) : (
        <p className="text-lg leading-relaxed text-j-text-body" lang="en">{drill.textEn}</p>
      )}

      {Ctor && (heard || done) && (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Puntaje" value={`${alignment.score}%`} />
          <Stat label="Palabras" value={`${alignment.said}/${alignment.total}`} />
        </div>
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
