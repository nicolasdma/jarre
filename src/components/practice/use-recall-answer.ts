'use client';

/**
 * Pregunta → respuesta: listens to the spoken answer and has it judged.
 *
 * The same browser recognizer as Repetir (recognition.ts, en-US, continuous)
 * runs while the countdown does; when the answer ends, its text goes to the
 * judge (recall-eval.ts, one request). Where there is no recognizer, the
 * microphone is blocked or the judge cannot be reached, `judgement` says so
 * and the mode is the self-rated one it was.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestRecallJudgement, type RecallJudgement } from '@/lib/practice/recall-eval';
import { recognitionError, useRecognitionCtor, type Recognition } from './recognition';

/** idle: nothing heard yet (or nothing to hear with). */
export type RecallAnswerStatus = 'idle' | 'listening' | 'evaluating' | 'done';

export interface RecallAnswer {
  /** The browser can listen at all. */
  canListen: boolean;
  status: RecallAnswerStatus;
  /** What the recognizer wrote, once the answer ended. */
  transcript: string;
  judgement: RecallJudgement | null;
  /** Why the microphone could not be used, in Spanish. */
  micError: string | null;
  /** Call from the tap or key that starts the countdown (the mic prompt needs the gesture). */
  start: () => void;
  /** The answer is over: stop listening and judge what was heard. */
  finish: (cutOff: boolean) => void;
  reset: () => void;
}

/** Errors after which listening again is pointless. */
const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture', 'network']);

export function useRecallAnswer(resourceId: string, drill: string): RecallAnswer {
  const Ctor = useRecognitionCtor();
  const [status, setStatus] = useState<RecallAnswerStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [judgement, setJudgement] = useState<RecallJudgement | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef('');
  /** True while the answer is still being given: a recognizer that ends on its own is started again. */
  const wantRef = useRef(false);
  const cutOffRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const drop = useCallback(() => {
    wantRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.abort();
    }
  }, []);

  useEffect(() => drop, [drop]);

  const judge = useCallback(() => {
    const said = finalRef.current.trim();
    setTranscript(said);
    setStatus('evaluating');
    const controller = new AbortController();
    abortRef.current = controller;
    void requestRecallJudgement({ resourceId, drill, transcript: said, cutOff: cutOffRef.current }, fetch, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setJudgement(result);
      setStatus('done');
    });
  }, [drill, resourceId]);

  const start = useCallback(() => {
    drop();
    finalRef.current = '';
    cutOffRef.current = false;
    setTranscript('');
    setJudgement(null);
    setMicError(null);
    if (!Ctor) {
      setStatus('idle');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current = `${finalRef.current} ${r[0].transcript}`.trim();
      }
    };
    rec.onerror = (e) => {
      if (!FATAL.has(e.error)) return;
      // No microphone, no judge: the mode goes on self-rated.
      wantRef.current = false;
      recRef.current = null;
      rec.onend = null;
      setMicError(recognitionError(e.error));
      setStatus('idle');
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      if (wantRef.current) {
        // Chrome ends a recognition after a pause: keep listening until the answer is over.
        try {
          rec.start();
          return;
        } catch {
          wantRef.current = false;
        }
      }
      recRef.current = null;
      judge();
    };
    recRef.current = rec;
    wantRef.current = true;
    try {
      rec.start();
      setStatus('listening');
    } catch {
      recRef.current = null;
      wantRef.current = false;
      setStatus('idle');
    }
  }, [Ctor, drop, judge]);

  const finish = useCallback((cutOff: boolean) => {
    const rec = recRef.current;
    if (!rec || !wantRef.current) return;
    wantRef.current = false;
    cutOffRef.current = cutOff;
    // stop(), not abort(): the words still in flight arrive before `onend`.
    rec.stop();
  }, []);

  const reset = useCallback(() => {
    drop();
    finalRef.current = '';
    setTranscript('');
    setJudgement(null);
    setMicError(null);
    setStatus('idle');
  }, [drop]);

  return { canListen: Boolean(Ctor), status, transcript, judgement, micError, start, finish, reset };
}
