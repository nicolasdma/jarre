#!/usr/bin/env tsx
/**
 * Does the tutor wait while the learner pauses mid-answer? Streams a spoken
 * answer with a pause in the middle ("Porque el servidor… [pause] …verifica el
 * postback") to Gemini Live as microphone audio, exactly as the browser sends
 * it (sendRealtimeInput audio, 16 kHz PCM, 100 ms chunks, real time), and
 * records whether the model starts talking during the pause.
 *
 *   npx tsx scripts/probe-voice-turn-taking.ts [--model gemini-3.8-live] [--pause 1.2] [--reps 2]
 *
 * Arms: `api-default` (no realtimeInputConfig, what the app sent until
 * 2026-11-11), `low-900`, and `default` and `patient` (TURN_TAKING in
 * src/lib/voice/live-models.ts, what the app sends now).
 * Needs macOS `say` (voice "Isabela (Enhanced)", es_AR) and ffmpeg. Paid: one
 * Live session per arm and rep. Output: docs/research/voice-probe/turn-taking-<model>.json.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EndSensitivity, GoogleGenAI, Modality, type LiveServerMessage, type RealtimeInputConfig } from '@google/genai';
import { buildLearningSession } from '../src/lib/llm/voice-tutor-session';
import { TURN_TAKING } from '../src/lib/voice/live-models';

loadEnv({ path: '.env.local' });

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const MODEL = arg('model', 'gemini-3.8-live');
const PAUSE_S = Number(arg('pause', '1.2'));
const REPS = Number(arg('reps', '2'));
const RATE = 16000;

const ARMS: Record<string, RealtimeInputConfig | undefined> = {
  'api-default': undefined,
  'low-900': { automaticActivityDetection: { endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW, silenceDurationMs: 900 } },
  ...TURN_TAKING,
};

function speech(text: string, dir: string, name: string): Int16Array {
  const aiff = join(dir, `${name}.aiff`);
  const raw = join(dir, `${name}.raw`);
  execFileSync('say', ['-v', 'Isabela (Enhanced)', '-o', aiff, text]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', String(RATE), '-f', 's16le', raw]);
  const buf = readFileSync(raw);
  return new Int16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
}

/** Low noise floor: digital silence is not what a microphone sends. */
function silence(seconds: number): Int16Array {
  const out = new Int16Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++) out[i] = Math.round((Math.random() - 0.5) * 60);
  return out;
}

function concat(parts: Int16Array[]): Int16Array {
  const out = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function trial(arm: string, audio: Int16Array, pauseStartS: number, pauseEndS: number) {
  const lesson = {
    title: 'Pagos',
    sections: [{ title: 'El navegador nunca decide quién paga', content: 'El postMessage del iframe solo actualiza la pantalla. El postback de Centrobill al servidor, con la firma verificada, es lo único que acredita la compra.' }],
  };
  const { instruction } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 0 });
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const events: { t: number; kind: string; text?: string }[] = [];
  let t0 = 0;
  let firstTurnDone: () => void = () => {};
  const firstTurn = new Promise<void>((r) => (firstTurnDone = r));
  let phase: 'opener' | 'answer' = 'opener';
  let closed = '';
  const session = await ai.live.connect({
    model: MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: instruction }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      ...(ARMS[arm] ? { realtimeInputConfig: ARMS[arm] } : {}),
    },
    callbacks: {
      onmessage: (m: LiveServerMessage) => {
        if (phase === 'opener') {
          if (m.serverContent?.turnComplete) firstTurnDone();
          return;
        }
        const t = (Date.now() - t0) / 1000;
        if (m.serverContent?.modelTurn?.parts?.some((p) => p.inlineData?.data)) events.push({ t, kind: 'audio' });
        if (m.serverContent?.inputTranscription?.text) events.push({ t, kind: 'heard', text: m.serverContent.inputTranscription.text });
        if (m.serverContent?.outputTranscription?.text) events.push({ t, kind: 'said', text: m.serverContent.outputTranscription.text });
        if (m.serverContent?.interrupted) events.push({ t, kind: 'interrupted' });
        if (m.serverContent?.turnComplete) events.push({ t, kind: 'turnComplete' });
      },
      onclose: (e) => {
        closed = `${(e as CloseEvent).code} ${(e as CloseEvent).reason}`;
        firstTurnDone();
      },
      onerror: () => {},
    },
  });
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: 'Ya leí la lección. Preguntame.' }] }], turnComplete: true });
  await Promise.race([firstTurn, new Promise((r) => setTimeout(r, 20_000))]);
  phase = 'answer';
  t0 = Date.now();
  const chunk = RATE / 10;
  const tail = silence(6);
  const stream = concat([audio, tail]);
  for (let i = 0; i < stream.length && !closed; i += chunk) {
    const slice = stream.subarray(i, i + chunk);
    session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${RATE}`, data: Buffer.from(slice.buffer, slice.byteOffset, slice.byteLength).toString('base64') } });
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 1500));
  session.close();
  const firstAudio = events.find((e) => e.kind === 'audio')?.t ?? null;
  const speechEndS = audio.length / RATE;
  return {
    arm,
    closed: closed || null,
    cut_in_during_pause: firstAudio !== null && firstAudio >= pauseStartS && firstAudio < pauseEndS + 0.3,
    first_audio_s: firstAudio,
    speech_end_s: Number(speechEndS.toFixed(2)),
    response_after_speech_end_s: firstAudio !== null ? Number((firstAudio - speechEndS).toFixed(2)) : null,
    heard: events.filter((e) => e.kind === 'heard').map((e) => e.text).join(''),
    said: events.filter((e) => e.kind === 'said').map((e) => e.text).join('').slice(0, 300),
    events: events.filter((e) => e.kind !== 'audio' && e.kind !== 'said' && e.kind !== 'heard'),
  };
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'jarre-turn-'));
  const a = speech('Porque el servidor', dir, 'a');
  const b = speech('verifica el postback con la firma antes de acreditar la compra, el navegador no decide nada.', dir, 'b');
  const lead = silence(0.4);
  const pause = silence(PAUSE_S);
  const audio = concat([lead, a, pause, b]);
  const pauseStart = (lead.length + a.length) / RATE;
  const pauseEnd = pauseStart + PAUSE_S;
  const results = [];
  for (let rep = 0; rep < REPS; rep++) {
    for (const arm of Object.keys(ARMS)) {
      const r = await trial(arm, audio, pauseStart, pauseEnd);
      console.log(`${arm} rep ${rep + 1}: cut_in=${r.cut_in_during_pause} first_audio=${r.first_audio_s}s (speech ends ${r.speech_end_s}s) closed=${r.closed ?? '-'} heard="${r.heard.slice(0, 90)}"`);
      results.push({ rep: rep + 1, ...r });
    }
  }
  const out = join(process.cwd(), 'docs/research/voice-probe');
  mkdirSync(out, { recursive: true });
  const file = join(out, `turn-taking-${MODEL}-pause${PAUSE_S}.json`);
  writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), model: MODEL, pause_s: PAUSE_S, pause_window_s: [pauseStart, pauseEnd], results }, null, 2));
  console.log(`saved ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
