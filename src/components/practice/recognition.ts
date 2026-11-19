'use client';

/**
 * Speech recognition for the modes that listen: Repetir, Frase por frase and
 * Pregunta → respuesta. One interface, two engines:
 *
 * - the browser's (Web Speech API), where it works: desktop Chrome, as before;
 * - the server's (server-recognition.ts: the take is recorded and Gemini
 *   writes it down), where it does not: every iOS browser (Chrome and the
 *   others answer `not-allowed`/`service-not-allowed`, Safari's depends on
 *   Siri and on the owner's iPhone never returned a word), browsers with no
 *   recognizer (Firefox), and a browser whose recognizer refuses while the
 *   microphone itself works (the switch is made on that first refusal and
 *   kept for the page).
 *
 * `?stt=server` or `?stt=native` forces one engine for that page load.
 */

import { useSyncExternalStore } from 'react';
import { ServerRecognition, canRecordAudio, isIosDevice } from './server-recognition';

interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionAlternative }
export interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
/** Where a server take is: the mic records, then the text is on its way. */
export type CapturePhase = 'recording' | 'transcribing';
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
  /** Server engine only (the browser's never calls it): recording, then transcribing. */
  onphase?: ((phase: CapturePhase) => void) | null;
  /** Server engine only: the recorded take, when it stops. */
  onaudio?: ((clip: Blob) => void) | null;
  /** Server engine only: end the take on its own after this much quiet following speech (0: never). */
  endOnSilenceMs?: number;
}
export type RecognitionCtor = new () => Recognition;

export type RecognizerRoute = 'native' | 'server' | 'none';

export interface RecognizerEnv {
  hasNative: boolean;
  ios: boolean;
  canRecord: boolean;
  /** The browser's recognizer refused on this page while the mic worked. */
  nativeBroken: boolean;
  override: 'native' | 'server' | null;
}

/** Which engine the next take uses. Pure, for tests. */
export function chooseRecognizer(env: RecognizerEnv): RecognizerRoute {
  const fallback: RecognizerRoute = env.hasNative ? 'native' : 'none';
  if (env.override === 'native') return env.hasNative ? 'native' : env.canRecord ? 'server' : 'none';
  if (env.override === 'server' || env.ios || !env.hasNative || env.nativeBroken) {
    return env.canRecord ? 'server' : fallback;
  }
  return 'native';
}

/**
 * After the browser's recognizer refused, whether to try the mic for the
 * server engine. A blocked mic stays an honest "blocked"; a dismissed prompt
 * (permission still `prompt`) is not asked again.
 */
export function shouldTryServerAfter(error: string, permission: PermissionState | 'unknown'): boolean {
  if (permission === 'denied') return false;
  if (error === 'service-not-allowed') return true;
  if (error === 'not-allowed') return permission === 'granted' || permission === 'unknown';
  return false;
}

export const FALLBACK_ERRORS = new Set(['not-allowed', 'service-not-allowed']);

// ---------------------------------------------------------------------------
// Page state: the engine in use, and the switch after a refusal
// ---------------------------------------------------------------------------

let nativeBroken = false;
const listeners = new Set<() => void>();

function markNativeBroken(): void {
  if (nativeBroken) return;
  nativeBroken = true;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nativeCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function overrideFromUrl(): RecognizerEnv['override'] {
  try {
    const value = new URLSearchParams(window.location.search).get('stt');
    return value === 'server' || value === 'native' ? value : null;
  } catch {
    return null;
  }
}

async function micPermission(): Promise<PermissionState | 'unknown'> {
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/** Opens the mic once and closes it: true when it works. */
async function micWorks(): Promise<boolean> {
  if (!canRecordAudio()) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export interface FallbackDeps {
  /** After a refusal: does the mic work, so the server engine can take over? */
  canUseServer: (error: string) => Promise<boolean>;
  Server: RecognitionCtor;
  onSwitch: () => void;
}

const defaultDeps: FallbackDeps = {
  canUseServer: async (error) => shouldTryServerAfter(error, await micPermission()) && micWorks(),
  Server: ServerRecognition,
  onSwitch: markNativeBroken,
};

/**
 * The browser's recognizer, unchanged while it works. When it refuses with
 * `not-allowed`/`service-not-allowed` and the mic itself opens, the same take
 * goes on with the server engine (and the page keeps it); otherwise the
 * refusal reaches the mode as it always did.
 */
export function withServerFallback(Native: RecognitionCtor, deps: FallbackDeps = defaultDeps): RecognitionCtor {
  return class NativeWithFallback implements Recognition {
    lang = 'en-US';
    continuous = false;
    interimResults = false;
    onresult: Recognition['onresult'] = null;
    onerror: Recognition['onerror'] = null;
    onend: Recognition['onend'] = null;
    onphase: Recognition['onphase'] = null;
    onaudio: Recognition['onaudio'] = null;
    endOnSilenceMs = 0;
    private inner: Recognition | null = null;
    private stopped = false;
    private aborted = false;

    start() {
      this.stopped = false;
      this.aborted = false;
      const rec = new Native();
      this.attach(rec, true);
      // Throws like the browser's when it cannot start: the modes catch it.
      rec.start();
    }

    stop() {
      this.stopped = true;
      this.inner?.stop();
    }

    abort() {
      this.aborted = true;
      this.inner?.abort();
    }

    private attach(rec: Recognition, native: boolean) {
      rec.lang = this.lang;
      rec.continuous = this.continuous;
      rec.interimResults = this.interimResults;
      if (!native) {
        rec.endOnSilenceMs = this.endOnSilenceMs;
        rec.onphase = (p) => {
          if (this.inner === rec) this.onphase?.(p);
        };
        rec.onaudio = (clip) => {
          if (this.inner === rec) this.onaudio?.(clip);
        };
      }
      this.inner = rec;
      let refused: { error: string } | null = null;
      rec.onresult = (e) => {
        if (this.inner === rec) this.onresult?.(e);
      };
      rec.onerror = (e) => {
        if (this.inner !== rec) return;
        if (native && FALLBACK_ERRORS.has(e.error)) refused = e;
        else this.onerror?.(e);
      };
      rec.onend = () => {
        if (this.inner !== rec) return;
        const error = refused;
        if (!error) {
          this.onend?.();
          return;
        }
        void deps.canUseServer(error.error).then((useServer) => {
          if (this.inner !== rec) return;
          if (useServer) deps.onSwitch();
          if (useServer && !this.stopped && !this.aborted) {
            const server = new deps.Server();
            this.attach(server, false);
            try {
              server.start();
              return;
            } catch {
              /* fall through: report the refusal */
            }
          }
          if (!this.aborted) this.onerror?.(error);
          this.onend?.();
        });
      };
    }
  };
}

const wrapped = new WeakMap<RecognitionCtor, RecognitionCtor>();

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const native = nativeCtor();
  const route = chooseRecognizer({
    hasNative: Boolean(native),
    ios: isIosDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    canRecord: canRecordAudio(),
    nativeBroken,
    override: overrideFromUrl(),
  });
  if (route === 'server') return ServerRecognition;
  if (route === 'native' && native) {
    let ctor = wrapped.get(native);
    if (!ctor) {
      ctor = withServerFallback(native);
      wrapped.set(native, ctor);
    }
    return ctor;
  }
  return null;
}

/** The recognizer's constructor; null on the server and where nothing can listen (no hydration mismatch). */
export function useRecognitionCtor(): RecognitionCtor | null {
  return useSyncExternalStore(subscribe, recognitionCtor, () => null);
}

/** The server engine records the take itself: a mode must not open a second capture next to it (iOS gives the mic to one). */
export function recordsItsOwnTake(Ctor: RecognitionCtor | null): boolean {
  return Boolean(Ctor && (Ctor as unknown as { server?: boolean }).server);
}

export const RECOGNITION_ERRORS: Record<string, string> = {
  'not-allowed': 'El navegador bloqueó el micrófono. Habilitalo para este sitio y probá de nuevo.',
  'mic-blocked-ios':
    'El navegador bloqueó el micrófono. En Safari: tocá «aA» en la barra › Configuración del sitio web › Micrófono › Permitir. En Chrome u otro navegador: Ajustes del iPhone › ese navegador › Micrófono. Después recargá la página.',
  'service-not-allowed': 'El reconocimiento de voz no está permitido en este navegador.',
  'no-speech': 'No te escuché. Probá de nuevo, un poco más cerca del micrófono.',
  'audio-capture': 'No encontré un micrófono.',
  network: 'El reconocimiento de voz necesita conexión.',
  'transcribe-network': 'No pude mandar tu audio para transcribirlo. Revisá la conexión y probá de nuevo.',
  'transcribe-failed': 'No pude transcribir lo que dijiste. Probá de nuevo.',
  'transcribe-limit': 'Llegaste al límite de transcripciones por ahora. Esperá un minuto y probá de nuevo.',
  'transcribe-too-long': 'La grabación quedó demasiado larga para transcribirla. Probá con una toma más corta.',
};

export function recognitionError(code: string): string {
  return RECOGNITION_ERRORS[code] ?? `Error del reconocimiento: ${code}`;
}
