#!/usr/bin/env tsx
/**
 * Probe the voice tutor's ephemeral Live token against the real Gemini API.
 *
 *   npx tsx scripts/probe-voice-token.ts [--model gemini-3.8-live]
 *
 * Mints a token with the same config /api/voice/token uses
 * (src/lib/voice/live-token.ts), then, with the token alone (no API key in the
 * client), checks three things:
 * 1. The client's system instruction is obeyed (the March 2026 report was a
 *    token that ignored it). The instruction asks for a fixed code word.
 * 2. Tools and realtimeInputConfig sent by the client are accepted.
 * 3. What a socket asking for another model gets. Measured 2026-11-18: it
 *    answers, although gemini-2.5-flash-native-audio-preview-12-2025 was shut
 *    down on 2026-11-17, so the token's locked model serves it (the request's
 *    model is overridden, not honored).
 *
 * Paid, but tiny: one short Live answer in audio. Prints no key or token.
 */

import { config as loadEnv } from 'dotenv';
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai';
import { buildVoiceTokenConfig } from '../src/lib/voice/live-token';
import { TURN_TAKING } from '../src/lib/voice/live-models';
import { TUTOR_TOOLS } from '../src/lib/voice/tool-declarations';

loadEnv({ path: '.env.local' });

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const MODEL = arg('model', 'gemini-3.8-live');
const OTHER_MODEL = MODEL === 'gemini-3.8-live' ? 'gemini-2.5-flash-native-audio-preview-12-2025' : 'gemini-3.8-live';
const CODE_WORD = 'PERIWINKLE';

async function mint(): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing in .env.local');
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
  const token = await ai.authTokens.create({ config: buildVoiceTokenConfig(MODEL) });
  if (!token.name?.startsWith('auth_tokens/')) throw new Error('Unexpected token shape');
  return token.name;
}

function connect(token: string, model: string): Promise<{ text: string; closed: string | null }> {
  return new Promise((resolve) => {
    const client = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });
    let text = '';
    let session: Session | null = null;
    let done = false;
    const finish = (closed: string | null) => {
      if (done) return;
      done = true;
      try { session?.close(); } catch { /* already closed */ }
      resolve({ text, closed });
    };
    const timer = setTimeout(() => finish('timeout'), 30_000);
    client.live
      .connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: {
            parts: [{ text: `Whatever the user says, answer with exactly this sentence and nothing else: "The code word is ${CODE_WORD}."` }],
          },
          tools: TUTOR_TOOLS,
          realtimeInputConfig: TURN_TAKING.default,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (m: LiveServerMessage) => {
            const t = m.serverContent?.outputTranscription?.text;
            if (t) text += t;
            if (m.serverContent?.turnComplete) {
              clearTimeout(timer);
              finish(null);
            }
          },
          onclose: (e: { code?: number; reason?: string }) => {
            clearTimeout(timer);
            finish(`close ${e.code ?? '?'} ${e.reason ?? ''}`.trim());
          },
          onerror: () => {},
        },
      })
      .then((s) => {
        session = s;
        s.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'Hi, who are you?' }] }], turnComplete: true });
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        finish(`connect failed: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`);
      });
  });
}

async function main() {
  const token = await mint();
  console.log(`minted token for ${MODEL} (value not printed)`);

  const ok = await connect(token, MODEL);
  const obeyed = ok.text.toUpperCase().includes(CODE_WORD);
  console.log(`same model: closed=${ok.closed ?? 'turnComplete'} transcript="${ok.text.trim().slice(0, 120)}"`);
  console.log(`  system instruction obeyed: ${obeyed}`);

  const token2 = await mint();
  const other = await connect(token2, OTHER_MODEL);
  console.log(`other model asked (${OTHER_MODEL}): closed=${other.closed ?? 'turnComplete'} transcript="${other.text.trim().slice(0, 120)}"`);

  process.exit(obeyed ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
