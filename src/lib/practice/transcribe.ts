/**
 * Speech to text on the server, for the drills that listen (Repetir, Frase por
 * frase, Pregunta → respuesta) where the browser has no recognizer that works.
 *
 * iOS has none in any browser: Chrome and the others answer `not-allowed` or
 * `service-not-allowed`, and Safari's depends on Siri and Dictation (on the
 * owner's iPhone it never returned a word). There the drill records the take
 * with MediaRecorder (src/components/practice/server-recognition.ts) and this
 * turns it into text with Gemini. Precedent: ~/Desktop/avatar-landing,
 * api/overview-companion/transcribe.ts, which solved the same iPhone.
 *
 * Pure: no request, no SDK. The route (src/app/api/practice/transcribe) wires
 * the user, the limits and the model call in.
 */

import { NextResponse } from 'next/server';
import type { BudgetCheck } from '@/lib/api/rate-limit';

/** Flash Lite: ~1.5 s for a 6 s m4a or webm clip, ~250 tokens (probe on Jarre's key, 2026-11-18). */
export const TRANSCRIBE_MODEL = 'gemini-3.5-flash-lite';

/** The client stops a take at 90 s (MAX_RECORDING_MS in src/components/practice/server-recognition.ts): 90 s at the 32 kb/s the client asks for is ~360 kB; room for a browser that ignores the bitrate. */
export const MAX_AUDIO_BYTES = 3_000_000;
/** The whole multipart body: the clip plus its form fields. */
export const MAX_BODY_BYTES = MAX_AUDIO_BYTES + 64_000;
/** Per user, on top of the shared LLM limits (checkTokenBudget). A phrase drill retries every few seconds. */
export const TRANSCRIBE_PER_MINUTE = 30;
/** Ninety seconds of fast speech are ~250 words. */
export const TRANSCRIBE_MAX_OUTPUT_TOKENS = 600;
export const TRANSCRIBE_TIMEOUT_MS = 20_000;

const ALLOWED_AUDIO = /^audio\/(webm|ogg|mp4|mpeg|wav|aac|x-m4a)(;.*)?$/;

export function isAllowedAudioType(type: string): boolean {
  return ALLOWED_AUDIO.test(type.trim().toLowerCase());
}

/** The media type Gemini gets: without codec parameters. */
export function baseAudioType(type: string): string {
  return type.split(';')[0].trim().toLowerCase();
}

export function transcribeLanguage(raw: unknown): string {
  return typeof raw === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(raw) ? raw : 'en-US';
}

/**
 * The drill scores what was said against its text, so the transcript must not
 * be cleaned up: the learner's wrong or half-said words stay wrong. The drill
 * text is never sent, so the model cannot lean toward it.
 */
export function transcribeInstruction(language: string): string {
  const name = language.toLowerCase().startsWith('es') ? 'Spanish' : 'English';
  return [
    `Transcribe the ${name} speech in this recording exactly as it was said.`,
    'The speaker is a non-native learner practicing pronunciation: write the words you actually hear, including wrong, mispronounced, repeated or unfinished words, as the closest words they sound like. Never correct, complete or guess what they meant.',
    'Output only the words, with normal punctuation. No quotes, no labels, no commentary.',
    'If there is no intelligible speech, output nothing.',
  ].join('\n');
}

export interface TranscribeClip {
  /** Base64. */
  data: string;
  mimeType: string;
  language: string;
}

export interface TranscribeDeps {
  /** The per-user request limit (takeRateLimit). */
  rateLimit: () => { allowed: boolean; retryAfterMs: number };
  /** The shared spend caps (checkTokenBudget). */
  budget: () => Promise<BudgetCheck>;
  transcribe: (clip: TranscribeClip) => Promise<{ text: string; tokens: number }>;
  logTokens: (tokens: number) => void;
}

/** Why a request is refused, as the client reads it (`reason`). */
export type TranscribeRefusal = 'too_large' | 'bad_audio' | 'unsupported_audio' | 'rate_limit' | 'daily_cap' | 'monthly_cap' | 'check_failed' | 'upstream';

function refuse(status: number, reason: TranscribeRefusal, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ error, reason }, { status, headers });
}

/**
 * POST multipart/form-data { audio: Blob, lang?: string } → { text }.
 * The caller has already authenticated the user (withAuth).
 */
export async function handleTranscribe(request: Request, deps: TranscribeDeps): Promise<NextResponse> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return refuse(413, 'too_large', 'The recording is too long');

  const rate = deps.rateLimit();
  if (!rate.allowed) {
    return refuse(429, 'rate_limit', 'Too many transcriptions. Try again in a minute.', {
      'Retry-After': String(Math.max(1, Math.ceil(rate.retryAfterMs / 1000))),
    });
  }
  const budget = await deps.budget();
  if (!budget.allowed) return refuse(429, budget.reason ?? 'daily_cap', budget.message);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return refuse(400, 'bad_audio', 'Expected multipart form data with an audio file');
  }
  const audio = form.get('audio');
  if (!audio || typeof audio === 'string') return refuse(400, 'bad_audio', 'Missing audio');
  if (audio.size === 0) return refuse(400, 'bad_audio', 'Empty audio');
  if (audio.size > MAX_AUDIO_BYTES) return refuse(413, 'too_large', 'The recording is too long');
  if (!isAllowedAudioType(audio.type)) return refuse(415, 'unsupported_audio', 'Unsupported audio type');

  const clip: TranscribeClip = {
    data: Buffer.from(await audio.arrayBuffer()).toString('base64'),
    mimeType: baseAudioType(audio.type),
    language: transcribeLanguage(form.get('lang')),
  };
  try {
    const { text, tokens } = await deps.transcribe(clip);
    if (tokens > 0) deps.logTokens(tokens);
    return NextResponse.json({ text: text.trim() });
  } catch {
    return refuse(502, 'upstream', 'Transcription failed');
  }
}
