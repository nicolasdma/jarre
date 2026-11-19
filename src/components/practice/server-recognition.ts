'use client';

/**
 * A recognizer whose recognition happens on the server, for the browsers
 * whose own does not work (every iOS browser, Firefox; see recognition.ts for
 * the choice). It has the browser recognizer's interface, so the modes do not
 * fork: start() opens the mic and records the take with MediaRecorder, stop()
 * ends it and sends it to /api/practice/transcribe, and the text comes back
 * as one final result followed by `end`, the way Web Speech delivers a
 * finished recognition. `abort()` drops the take and closes the mic.
 *
 * What the learner sees meanwhile comes from `onphase` (recording, then
 * transcribing). The mic is opened per take and closed as soon as the take
 * stops, so it is never held while the drill plays its audio. Precedent:
 * ~/Desktop/avatar-landing, src/lib/speechInputFallback.ts.
 */

import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import type { CapturePhase, Recognition, RecognitionEvent } from './recognition';

export const TRANSCRIBE_URL = '/api/practice/transcribe';
/** The longest take; the route's size cap (MAX_AUDIO_BYTES in src/lib/practice/transcribe.ts) leaves room for it. */
export const MAX_RECORDING_MS = 90_000;
/** Smaller than this (a tap and release) holds no word: nothing is sent. */
const MIN_CLIP_BYTES = 1_000;
const MIN_CLIP_MS = 350;

export function isIosDevice(ua: string, maxTouchPoints: number): boolean {
  // iPadOS reports a Mac; its touch points give it away.
  return /\b(iPhone|iPad|iPod)\b/.test(ua) || (/\bMacintosh\b/.test(ua) && maxTouchPoints > 1);
}

export function canRecordAudio(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/** iOS Safari records AAC in MP4; Chrome and Firefox Opus in WebM or Ogg. Gemini reads all of them. */
export function pickRecordingType(isSupported: (type: string) => boolean, ios: boolean): string {
  const types = ios
    ? ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']
    : ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  return types.find((t) => {
    try {
      return isSupported(t);
    } catch {
      return false;
    }
  }) ?? '';
}

/** The error code a failed getUserMedia becomes (recognition.ts has the words). */
export function micErrorCode(error: unknown, ios: boolean): string {
  const name = (error as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return ios ? 'mic-blocked-ios' : 'not-allowed';
  }
  return 'audio-capture';
}

/** The error code a failed transcription request becomes. */
export function transcribeErrorCode(status: number | null): string {
  if (status === null) return 'transcribe-network';
  if (status === 429) return 'transcribe-limit';
  if (status === 413) return 'transcribe-too-long';
  return 'transcribe-failed';
}

function finalEvent(transcript: string): RecognitionEvent {
  return { resultIndex: 0, results: [Object.assign({ 0: { transcript } }, { isFinal: true })] };
}

type State = 'idle' | 'opening' | 'recording' | 'transcribing' | 'ended';

export class ServerRecognition implements Recognition {
  /** Read by the modes: this recognizer records the take itself. */
  static readonly server = true;

  lang = 'en-US';
  continuous = false;
  interimResults = false;
  endOnSilenceMs = 0;
  maxMs = MAX_RECORDING_MS;
  onresult: Recognition['onresult'] = null;
  onerror: Recognition['onerror'] = null;
  onend: Recognition['onend'] = null;
  onphase: ((phase: CapturePhase) => void) | null = null;
  onaudio: ((clip: Blob) => void) | null = null;

  private state: State = 'idle';
  /** Each start() is a new take; callbacks of an older one are ignored. */
  private take = 0;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private request: AbortController | null = null;
  private timers: number[] = [];
  private meter: { ctx: AudioContext; poll: number } | null = null;
  private stopWanted = false;
  private startedAt = 0;

  start(): void {
    if (this.state !== 'idle' && this.state !== 'ended') {
      throw new DOMException('recognition has already started', 'InvalidStateError');
    }
    this.state = 'opening';
    this.stopWanted = false;
    const take = ++this.take;
    // getUserMedia is called synchronously here, inside the tap that started the take.
    void this.open(take);
  }

  /** Ends the take now and sends it. */
  stop(): void {
    if (this.state === 'opening') this.stopWanted = true;
    else if (this.state === 'recording') this.recorder?.stop();
  }

  /** Drops the take: nothing is sent, the mic closes. Like the browser's, it ends with `aborted`. */
  abort(): void {
    if (this.state === 'idle' || this.state === 'ended') return;
    this.take++;
    this.release();
    this.request?.abort();
    this.request = null;
    this.state = 'ended';
    window.setTimeout(() => {
      this.onerror?.({ error: 'aborted' });
      this.onend?.();
    }, 0);
  }

  private async open(take: number): Promise<void> {
    const ios = isIosDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0);
    if (!canRecordAudio()) return this.fail(take, 'audio-capture');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (error) {
      return this.fail(take, micErrorCode(error, ios));
    }
    if (take !== this.take) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    this.stream = stream;
    if (this.stopWanted) {
      // Stopped before the mic opened: nothing was said.
      this.release();
      return this.end(take);
    }

    const type = pickRecordingType((t) => MediaRecorder.isTypeSupported(t), ios);
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), audioBitsPerSecond: 32_000 });
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        this.release();
        return this.fail(take, 'audio-capture');
      }
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      if (take !== this.take) return;
      const clip = new Blob(chunks, { type: recorder.mimeType || type || 'audio/mp4' });
      const heldMs = Date.now() - this.startedAt;
      this.release();
      this.onaudio?.(clip);
      if (clip.size < MIN_CLIP_BYTES || heldMs < MIN_CLIP_MS) return this.end(take);
      void this.transcribe(take, clip);
    };
    this.recorder = recorder;
    try {
      recorder.start();
    } catch {
      this.release();
      return this.fail(take, 'audio-capture');
    }
    this.state = 'recording';
    this.startedAt = Date.now();
    this.onphase?.('recording');
    this.timers.push(window.setTimeout(() => this.stop(), this.maxMs));
    if (this.endOnSilenceMs > 0) this.watchSilence(stream);
  }

  /**
   * Stops the take after `endOnSilenceMs` of quiet that follows speech. Only
   * where an AudioContext runs without a tap (it may not on iOS, then the
   * learner taps Listo or the mode's own timer ends the turn).
   */
  private watchSilence(stream: MediaStream): void {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      void ctx.resume().catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let floor = 0.01;
      let speechMs = 0;
      let quietMs = 0;
      const STEP = 100;
      const poll = window.setInterval(() => {
        if (ctx.state !== 'running') return;
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        // The floor follows the room down fast and up slowly.
        floor = rms < floor ? rms : floor * 0.995 + rms * 0.005;
        const loud = rms > Math.max(0.015, floor * 3);
        if (loud) {
          speechMs += STEP;
          quietMs = 0;
        } else if (speechMs >= 250) {
          quietMs += STEP;
          if (quietMs >= this.endOnSilenceMs) this.stop();
        }
      }, STEP);
      this.meter = { ctx, poll };
    } catch {
      /* no meter: the take ends by tap or by the mode's timer */
    }
  }

  private async transcribe(take: number, clip: Blob): Promise<void> {
    this.state = 'transcribing';
    this.onphase?.('transcribing');
    const controller = new AbortController();
    this.request = controller;
    const form = new FormData();
    const ext = clip.type.includes('mp4') ? 'm4a' : clip.type.includes('ogg') ? 'ogg' : 'webm';
    form.set('audio', clip, `take.${ext}`);
    form.set('lang', this.lang);
    let status: number | null = null;
    let text = '';
    try {
      const res = await fetchWithKeys(TRANSCRIBE_URL, { method: 'POST', body: form, signal: controller.signal });
      status = res.status;
      if (res.ok) text = String(((await res.json()) as { text?: unknown }).text ?? '').trim();
    } catch {
      status = null;
    }
    if (take !== this.take) return;
    this.request = null;
    if (status !== null && status >= 200 && status < 300) {
      if (text) this.onresult?.(finalEvent(text));
      return this.end(take);
    }
    return this.fail(take, transcribeErrorCode(status));
  }

  private release(): void {
    this.timers.splice(0).forEach((t) => window.clearTimeout(t));
    if (this.meter) {
      window.clearInterval(this.meter.poll);
      void this.meter.ctx.close().catch(() => {});
      this.meter = null;
    }
    const recorder = this.recorder;
    this.recorder = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private fail(take: number, error: string): void {
    if (take !== this.take) return;
    this.release();
    this.onerror?.({ error });
    this.end(take);
  }

  private end(take: number): void {
    if (take !== this.take || this.state === 'ended') return;
    this.state = 'ended';
    this.onend?.();
  }
}
