#!/usr/bin/env tsx
/**
 * How often does a gemini-3.8-live session not hear the microphone at all?
 * Short sessions (a one-sentence opener, then a spoken question as microphone
 * audio, real time), each in one of three arms:
 *
 * - `none`: nothing else is sent;
 * - `mid`: an [EDITOR] note (sendClientContent, turnComplete=false) 3 s into the question;
 * - `before`: the same note 4 s before the question.
 *
 * A deaf session shows `heard: 0` (no input transcription) and no answer.
 *
 *   npx tsx scripts/probe-live-deaf.ts [none,mid,before] [reps]
 *
 * Needs macOS `say` and ffmpeg. Paid: one short Live session per arm and rep.
 * Results of 2026-11-20: docs/research/voice-probe/coding-mock-deaf.md.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { TURN_TAKING, DEFAULT_VOICE_LIVE_MODEL } from '../src/lib/voice/live-models';
loadEnv({ path: '.env.local' });
const RATE = 16000;
const dir = mkdtempSync(join(tmpdir(), 'deaf-'));
function speech(text: string, name: string): Int16Array {
  const aiff = join(dir, `${name}.aiff`); const raw = join(dir, `${name}.raw`);
  execFileSync('say', ['-v', 'Samantha', '-o', aiff, text]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', String(RATE), '-f', 's16le', raw]);
  const buf = readFileSync(raw); return new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}
function silence(s: number) { const o = new Int16Array(Math.round(s * RATE)); for (let i = 0; i < o.length; i++) o[i] = Math.round((Math.random() - 0.5) * 60); return o; }
const NOTE = '[EDITOR 1:00 · the candidate\'s screen right now (typing). Not spoken: never read it aloud.]\n1| function solve(nums: number[]) {\n2|   const pineapple = new Map();\n3| }';
async function trial(arm: string, q: Int16Array) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let phase = 'opener'; let heard = ''; let said = ''; let done: () => void = () => {};
  const opener = new Promise<void>((r) => (done = r));
  const session = await ai.live.connect({
    model: DEFAULT_VOICE_LIVE_MODEL,
    config: { responseModalities: [Modality.AUDIO], systemInstruction: { parts: [{ text: 'You are Sam, a coding interviewer on a call. Short spoken sentences. Notes in square brackets come from the platform: never read them aloud. Answer what the candidate asks. RESPOND IN ENGLISH.' }] }, inputAudioTranscription: {}, outputAudioTranscription: {}, realtimeInputConfig: TURN_TAKING['thinking-aloud'] },
    callbacks: { onmessage: (m: LiveServerMessage) => {
      if (phase === 'opener') { if (m.serverContent?.turnComplete) done(); return; }
      if (m.serverContent?.inputTranscription?.text) heard += m.serverContent.inputTranscription.text;
      if (m.serverContent?.outputTranscription?.text) said += m.serverContent.outputTranscription.text;
    }, onclose: () => done(), onerror: () => {} },
  });
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Hi, I'm ready. Greet me in one sentence." }] }], turnComplete: true });
  await Promise.race([opener, new Promise((r) => setTimeout(r, 30000))]);
  phase = 'q';
  const stream = async (pcm: Int16Array, at?: number) => { let ran = false; for (let i = 0; i < pcm.length; i += RATE / 10) {
    if (at !== undefined && !ran && i / RATE >= at) { ran = true; session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: NOTE }] }], turnComplete: false }); }
    const s = pcm.subarray(i, i + RATE / 10); session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${RATE}`, data: Buffer.from(s.buffer, s.byteOffset, s.byteLength).toString('base64') } }); await new Promise((r) => setTimeout(r, 100)); } };
  await stream(silence(2));
  if (arm === 'before') { session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: NOTE }] }], turnComplete: false }); await stream(silence(4)); }
  await stream(q, arm === 'mid' ? 3 : undefined);
  await stream(silence(8));
  session.close();
  return { arm, heard: heard.length, answered: said.trim().slice(0, 70) };
}
(async () => {
  const q = speech('Okay, so I am going to walk the array once, and keep a map from each value to its index. Quick question. What did I name the map on line two?', 'q');
  const arms = (process.argv[2] ?? 'none,mid,before').split(',');
  const reps = Number(process.argv[3] ?? 3);
  for (let r = 0; r < reps; r++) for (const arm of arms) console.log(JSON.stringify(await trial(arm, q)));
})();
