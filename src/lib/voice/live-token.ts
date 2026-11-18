/**
 * Gemini Live ephemeral tokens for the voice tutor (server only).
 *
 * The token is locked to one model of live-models.ts, audio out, both
 * transcriptions and the tutor's voice (`liveConnectConstraints` plus
 * `lockAdditionalFields`). The system instruction, tools, VAD settings and the
 * resumption handle stay with the client: Google's "Case 2" (constraints set,
 * lockAdditionalFields unset) locks EVERY LiveConnectConfig field, which is the
 * "ephemeral token ignores system_instruction" report of March 2026
 * (discuss.ai.google.dev/t/113346). Naming extra fields (Case 3, see the
 * `tokens.create` docs in @google/genai) locks only the fields set plus those:
 * the same setup the owner's landing runs in production
 * (avatar-landing/api/overview-companion/live-token.ts).
 */

import { Modality } from '@google/genai';
import { GEMINI_VOICE_NAME } from '@/lib/constants';

/** A socket must open within this window (the client refreshes prefetched tokens before it ends). */
export const VOICE_TOKEN_NEW_SESSION_MS = 10 * 60 * 1000;
/** How long messages may flow on a socket the token opened (Google closes sockets at ~10-15 min). */
export const VOICE_TOKEN_EXPIRE_MS = 30 * 60 * 1000;
/** One connect plus one retry; every reconnect asks for a fresh token. */
export const VOICE_TOKEN_USES = 2;

export function buildVoiceTokenConfig(model: string, now: number = Date.now()) {
  return {
    uses: VOICE_TOKEN_USES,
    expireTime: new Date(now + VOICE_TOKEN_EXPIRE_MS).toISOString(),
    newSessionExpireTime: new Date(now + VOICE_TOKEN_NEW_SESSION_MS).toISOString(),
    liveConnectConstraints: {
      model,
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE_NAME } },
        },
      },
    },
    // Non-empty on purpose: see the header (Case 3, not Case 2).
    lockAdditionalFields: ['temperature', 'topP'],
  };
}
