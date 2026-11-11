'use client';

/**
 * The browser's speech recognition (Web Speech API), shared by the modes that
 * listen: Repetir and Frase por frase. Not in every TS DOM lib; Chrome and
 * Safari prefix it.
 */

import { useSyncExternalStore } from 'react';

interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionAlternative }
export interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
export interface Recognition {
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
export type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => {};

/** The recognizer's constructor; null on the server and where the browser has none (no hydration mismatch). */
export function useRecognitionCtor(): RecognitionCtor | null {
  return useSyncExternalStore(noSubscribe, recognitionCtor, () => null);
}

export const RECOGNITION_ERRORS: Record<string, string> = {
  'not-allowed': 'El navegador bloqueó el micrófono. Habilitalo para este sitio y probá de nuevo.',
  'service-not-allowed': 'El reconocimiento de voz no está permitido en este navegador.',
  'no-speech': 'No te escuché. Probá de nuevo, un poco más cerca del micrófono.',
  'audio-capture': 'No encontré un micrófono.',
  network: 'El reconocimiento de voz necesita conexión.',
};

export function recognitionError(code: string): string {
  return RECOGNITION_ERRORS[code] ?? `Error del reconocimiento: ${code}`;
}
