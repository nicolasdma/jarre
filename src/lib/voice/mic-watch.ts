/**
 * Jarre - Watches the microphone capture of a voice session.
 *
 * Until 2026-11-20 nothing listened to the capture itself: a track the
 * browser ended (the device unplugged or switched, the permission revoked), a
 * track muted by the system and a capture context the browser suspended all
 * looked the same from the session, silence, and none was written down. Here
 * each one is reported as it happens (the session puts it in its timeline),
 * a suspended context is resumed, and a capture that is gone for good is
 * handed back to the session to open again (`onLost`).
 */

export type MicWatchEvent = 'mic_ended' | 'mic_muted' | 'mic_unmuted' | 'mic_context';

/** The part of MediaStreamTrack this needs (a fake in tests). */
export interface WatchedTrack {
  readonly readyState: string;
  readonly muted: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/** The part of AudioContext this needs. */
export interface WatchedContext {
  readonly state: string;
  resume(): Promise<void>;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface MicWatchHandlers {
  onEvent: (kind: MicWatchEvent, data: Record<string, string | boolean>) => void;
  /** The track ended: this capture will never deliver audio again. Called once. */
  onLost: () => void;
}

/** Starts watching; returns the function that stops. */
export function watchMicCapture(track: WatchedTrack, context: WatchedContext, handlers: MicWatchHandlers): () => void {
  let lost = false;
  let stopped = false;
  const onEnded = () => {
    if (stopped || lost) return;
    lost = true;
    handlers.onEvent('mic_ended', {});
    handlers.onLost();
  };
  const onMute = () => {
    if (!stopped) handlers.onEvent('mic_muted', {});
  };
  const onUnmute = () => {
    if (!stopped) handlers.onEvent('mic_unmuted', {});
  };
  const onState = () => {
    if (stopped) return;
    const state = context.state;
    handlers.onEvent('mic_context', { state });
    // 'suspended', or Safari's 'interrupted': the capture stops until someone resumes it.
    if (state !== 'running' && state !== 'closed') void context.resume().catch(() => {});
  };
  track.addEventListener('ended', onEnded);
  track.addEventListener('mute', onMute);
  track.addEventListener('unmute', onUnmute);
  context.addEventListener('statechange', onState);
  // What already happened before anyone listened.
  if (track.readyState === 'ended') onEnded();
  else if (track.muted) onMute();
  if (context.state !== 'running') onState();
  return () => {
    stopped = true;
    track.removeEventListener('ended', onEnded);
    track.removeEventListener('mute', onMute);
    track.removeEventListener('unmute', onUnmute);
    context.removeEventListener('statechange', onState);
  };
}

/** How many times one session opens its microphone again before it only says so on screen. */
export const MAX_MIC_RESTARTS = 3;

/** Whether a session that does not hear may be replaced now (use-voice-session.ts, "A session that does not hear"). */
export function canReplaceDeafSession(s: {
  busy: boolean;
  count: number;
  max: number;
  /** The socket is open: while it is being replaced, what the learner says goes nowhere, and that is not deafness. */
  connected: boolean;
  /** This client is still the session's. */
  current: boolean;
  /** The session is ending or has ended. */
  ending: boolean;
}): boolean {
  return !s.busy && s.count < s.max && s.connected && s.current && !s.ending;
}

/** What the status line reads (use-voice-session.ts, MicStatus). */
export interface MicStatusFacts {
  track: 'none' | 'live' | 'muted' | 'ended';
  context: string;
  socket: string;
  socketDrops: number;
  lastCloseCode: number | null;
  deafRestarts: number;
  micRestarts: number;
  heardAgoMs: number | null;
}

const TRACK_LABEL = { none: 'mic sin abrir', live: 'mic abierto', muted: 'mic silenciado por el sistema', ended: 'mic cortado' } as const;
const SOCKET_LABEL: Record<string, string> = {
  connected: 'conectado',
  connecting: 'conectando',
  reconnecting: 'reconectando',
  disconnected: 'desconectado',
  error: 'sin conexión',
};

/**
 * One small line that says what the microphone and the connection are doing,
 * so "it disconnected the microphone" can be told apart on sight: the track,
 * the socket, when the interviewer last transcribed the candidate, and what
 * the session had to redo.
 */
export function micStatusLine(s: MicStatusFacts): string {
  const parts: string[] = [TRACK_LABEL[s.track]];
  if (s.track !== 'none' && s.context !== 'running') parts.push(`captura ${s.context}`);
  parts.push(SOCKET_LABEL[s.socket] ?? s.socket);
  parts.push(s.heardAgoMs === null ? 'sin transcripción todavía' : `te transcribió hace ${Math.max(0, Math.round(s.heardAgoMs / 1000))} s`);
  if (s.socketDrops) parts.push(`cortes de conexión: ${s.socketDrops}${s.lastCloseCode ? ` (${s.lastCloseCode})` : ''}`);
  if (s.deafRestarts) parts.push(`sesión reemplazada por no oír: ${s.deafRestarts}`);
  if (s.micRestarts) parts.push(`mic reabierto: ${s.micRestarts}`);
  return parts.join(' · ');
}
