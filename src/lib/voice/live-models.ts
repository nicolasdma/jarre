/**
 * Gemini Live models the voice tutor can run on, and what each accepts.
 *
 * Default: gemini-3.8-live. gemini-2.5-flash-native-audio-preview-12-2025 (the
 * tutor's model until 2026-11-11) shuts down on 2026-11-17
 * (ai.google.dev/gemini-api/docs/deprecations); it stays selectable for the
 * A/B until then. Before/after numbers: docs/research/2026-11-11-voice-tutor-aaa.md
 * (scripts/probe-voice-tutor.ts).
 *
 * Pick another model with NEXT_PUBLIC_VOICE_LIVE_MODEL (build time) or, per
 * browser, `localStorage['jarre.voice.model']`. Anything outside this table
 * falls back to the default.
 *
 * Capabilities (ai.google.dev/gemini-api/docs/live-api/capabilities, read
 * 2026-11-11, and the probe of the owner's landing in
 * ~/Desktop/avatar-landing/src/lib/geminiLiveModels.ts):
 * - 3.8 Live: no thinking control (omit thinkingConfig), proactive audio always
 *   on, affective dialog removed, function calls non-blocking by default, so
 *   responses take `scheduling`.
 * - 2.5 native audio: dynamic thinking by default, blocking calls.
 */

import type { EndSensitivity, RealtimeInputConfig } from '@google/genai';

// The SDK enum's string value, so importing this module (the lesson does) does
// not pull @google/genai into the page bundle: the SDK loads with the session.
const END_SENSITIVITY_LOW = 'END_SENSITIVITY_LOW' as unknown as EndSensitivity;

export type VoiceLiveModelId = 'gemini-3.8-live' | 'gemini-2.5-flash-native-audio-preview-12-2025';

export interface VoiceLiveModelProfile {
  id: VoiceLiveModelId;
  /**
   * Whether function responses carry `scheduling` (SILENT, WHEN_IDLE). Only
   * for models whose calls are non-blocking by default: on 2.5 the tutor's
   * tools are declared without `behavior`, so they block and need none.
   */
  toolScheduling: boolean;
}

export const VOICE_LIVE_MODELS: Record<VoiceLiveModelId, VoiceLiveModelProfile> = {
  'gemini-3.8-live': { id: 'gemini-3.8-live', toolScheduling: true },
  'gemini-2.5-flash-native-audio-preview-12-2025': {
    id: 'gemini-2.5-flash-native-audio-preview-12-2025',
    toolScheduling: false,
  },
};

export const DEFAULT_VOICE_LIVE_MODEL: VoiceLiveModelId = 'gemini-3.8-live';

const MODEL_STORAGE_KEY = 'jarre.voice.model';

export function isVoiceLiveModel(value: unknown): value is VoiceLiveModelId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(VOICE_LIVE_MODELS, value);
}

/** The model a new voice session connects to. */
export function resolveVoiceLiveModel(): VoiceLiveModelId {
  let local: string | null = null;
  try {
    local = typeof window !== 'undefined' ? window.localStorage.getItem(MODEL_STORAGE_KEY) : null;
  } catch {
    local = null;
  }
  if (isVoiceLiveModel(local)) return local;
  const env = process.env.NEXT_PUBLIC_VOICE_LIVE_MODEL;
  return isVoiceLiveModel(env) ? env : DEFAULT_VOICE_LIVE_MODEL;
}

export function voiceLiveModelProfile(model: string): VoiceLiveModelProfile | null {
  return isVoiceLiveModel(model) ? VOICE_LIVE_MODELS[model] : null;
}

// ---------------------------------------------------------------------------
// Voices
// ---------------------------------------------------------------------------

/**
 * The prebuilt voices a session can ask for; the token locks the one it was
 * minted with (src/lib/voice/live-token.ts). Kore (female) is the tutor;
 * Charon is Jarre's male voice, the one the drills are recorded in
 * (DRILL_TTS_VOICE in src/lib/llm/gemini-tts.ts).
 */
export const LIVE_VOICES = ['Kore', 'Charon'] as const;
export type LiveVoice = (typeof LIVE_VOICES)[number];
export const DEFAULT_LIVE_VOICE: LiveVoice = 'Kore';

export function isLiveVoice(value: unknown): value is LiveVoice {
  return typeof value === 'string' && (LIVE_VOICES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Turn taking
// ---------------------------------------------------------------------------

export type TurnTaking = 'default' | 'patient' | 'thinking-aloud';

/**
 * End-of-speech settings sent to the Live API (realtimeInputConfig). The API
 * default (END_SENSITIVITY_HIGH, ~800 ms of silence, per
 * ai.google.dev/gemini-api/docs/live-api/capabilities) cut the owner
 * mid-thought in session 8f84e3d0 ("Porque" → the tutor talked), and cut in
 * 2 of 2 times on a 1.2 s pause in scripts/probe-voice-turn-taking.ts; LOW
 * with 1300 ms waited 2 of 2 (docs/research/voice-probe/turn-taking-*.json).
 * `patient` is for answers in a second language.
 */
export const TURN_TAKING: Record<TurnTaking, RealtimeInputConfig> = {
  default: {
    automaticActivityDetection: { endOfSpeechSensitivity: END_SENSITIVITY_LOW, silenceDurationMs: 1300 },
  },
  patient: {
    automaticActivityDetection: { endOfSpeechSensitivity: END_SENSITIVITY_LOW, silenceDurationMs: 1700 },
  },
  /**
   * The coding mock: the candidate thinks aloud while typing, with pauses
   * that are not the end of a turn. A longer window keeps the interviewer
   * from answering every pause; a question still gets an answer ~2.5 s after
   * it ends. Not measured with a probe yet: tune from the owner's sessions.
   */
  'thinking-aloud': {
    automaticActivityDetection: { endOfSpeechSensitivity: END_SENSITIVITY_LOW, silenceDurationMs: 2500 },
  },
};
