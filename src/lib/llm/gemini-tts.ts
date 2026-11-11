/**
 * Gemini text-to-speech for lesson drills.
 *
 * Returns raw PCM (s16le, mono) plus its sample rate; callers encode it
 * (scripts/seed-lesson.ts turns it into m4a with ffmpeg). The key's
 * per-minute quota answers 429 after ~20 quick calls, so callers pace
 * requests and this retries 429/5xx with a growing wait.
 */

import { GoogleGenAI } from '@google/genai';

export const DRILL_TTS_MODEL = 'gemini-3.8-flash-tts';
export const DRILL_TTS_VOICE = 'Charon';
export const DRILL_TTS_STYLE =
  'Read this aloud as a calm, friendly, confident software developer on a video call. ' +
  'Use clear American English and a slightly slow, natural pace so a learner can repeat it. ' +
  'Pause briefly between sentences:';

export interface SpeechPcm {
  pcm: Buffer;
  sampleRate: number;
}

const RETRIES = 3;
const RETRY_BASE_MS = 30_000;

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number })?.status;
  const text = String((error as Error)?.message ?? error);
  return status === 429 || (status !== undefined && status >= 500) || /\b(429|RESOURCE_EXHAUSTED|50\d)\b/.test(text);
}

export async function synthesizeDrillSpeech(text: string, apiKey: string): Promise<SpeechPcm> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: DRILL_TTS_MODEL,
        contents: [{ role: 'user', parts: [{ text: `${DRILL_TTS_STYLE}\n\n${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: DRILL_TTS_VOICE } } },
        },
      });
      const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      if (!part?.inlineData?.data) throw new Error('Gemini TTS returned no audio');
      const rate = Number(part.inlineData.mimeType?.match(/rate=(\d+)/)?.[1] ?? 24000);
      return { pcm: Buffer.from(part.inlineData.data, 'base64'), sampleRate: rate };
    } catch (error) {
      lastError = error;
      if (attempt === RETRIES || !isRetryable(error)) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
