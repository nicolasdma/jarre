/**
 * POST /api/practice/transcribe
 * Body: multipart/form-data { audio: Blob, lang?: 'en-US' }
 * Response: { text } | { error, reason } (413, 415, 429, 502)
 *
 * The drills' recognizer where the browser has none (iOS, Firefox): one
 * recorded take in, its text out. Rules and limits: src/lib/practice/transcribe.ts.
 * The key stays here; a BYOK Gemini key from the header is used instead.
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { withAuth } from '@/lib/api/middleware';
import { checkTokenBudget, takeRateLimit } from '@/lib/api/rate-limit';
import { logTokenUsage } from '@/lib/db/token-usage';
import { createLogger } from '@/lib/logger';
import {
  TRANSCRIBE_MAX_OUTPUT_TOKENS,
  TRANSCRIBE_MODEL,
  TRANSCRIBE_PER_MINUTE,
  TRANSCRIBE_TIMEOUT_MS,
  handleTranscribe,
  transcribeInstruction,
} from '@/lib/practice/transcribe';

const log = createLogger('Transcribe');

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  return handleTranscribe(request, {
    rateLimit: () => takeRateLimit(`transcribe:${user.id}`, TRANSCRIBE_PER_MINUTE, 60_000),
    budget: () => checkTokenBudget(supabase, user.id, !!byokKeys.gemini),
    logTokens: (tokens) => void logTokenUsage({ userId: user.id, category: 'transcribe', tokens }),
    transcribe: async ({ data, mimeType, language }) => {
      const apiKey = byokKeys.gemini || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        log.error('GEMINI_API_KEY not configured');
        throw new Error('Transcription not configured');
      }
      const ai = new GoogleGenAI({ apiKey });
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), TRANSCRIBE_TIMEOUT_MS);
      const startedAt = Date.now();
      try {
        const response = await ai.models.generateContent({
          model: TRANSCRIBE_MODEL,
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data } }] }],
          config: {
            systemInstruction: transcribeInstruction(language),
            temperature: 0,
            maxOutputTokens: TRANSCRIBE_MAX_OUTPUT_TOKENS,
            // Transcription needs no reasoning; thinking only adds latency.
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            abortSignal: abort.signal,
          },
        });
        const tokens = response.usageMetadata?.totalTokenCount ?? 0;
        log.info(`Transcribed ${Math.round((data.length * 3) / 4 / 1024)} kB (${mimeType}) in ${Date.now() - startedAt} ms`);
        return { text: response.text ?? '', tokens };
      } catch (error) {
        log.error('Transcription failed:', error instanceof Error ? error.message.slice(0, 300) : error);
        throw error;
      } finally {
        clearTimeout(timer);
      }
    },
  });
});
