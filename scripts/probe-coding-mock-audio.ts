#!/usr/bin/env tsx
/**
 * Does the coding mock's interviewer still hear the candidate after the page
 * sends it an [EDITOR] note? Streams a spoken question as microphone audio
 * (sendRealtimeInput, 16 kHz PCM, 100 ms chunks, real time, as the browser
 * does) after a note sent each way the page could send it, and records what
 * the Live API transcribed and whether the interviewer answered.
 *
 *   npx tsx scripts/probe-coding-mock-audio.ts <lesson.json> [--arms none,open-turn,realtime-text] [--label run1]
 *
 * Arms:
 * - `none`: no note. The baseline: the question is heard and answered.
 * - `open-turn`: the note as sendClientContent with turnComplete=false (what
 *   the page sent until 2026-11-20).
 * - `realtime-text`: the note as sendRealtimeInput text.
 * - `closed-with-speech`: no note before the question; nothing is sent while
 *   the candidate talks (the baseline for a note held until the next model turn).
 *
 * Needs macOS `say` and ffmpeg. Paid: one Live session per arm.
 * Output: docs/research/voice-probe/coding-mock-audio-<label>.json.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { LessonSchema } from '../src/lib/lessons/lesson-format';
import { buildCodingMockSession } from '../src/lib/coding/mock-session';
import { editorNote } from '../src/lib/coding/mock-runtime';
import { TURN_TAKING, DEFAULT_VOICE_LIVE_MODEL } from '../src/lib/voice/live-models';

loadEnv({ path: '.env.local' });

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const RATE = 16000;

function speech(text: string, dir: string, name: string): Int16Array {
  const aiff = join(dir, `${name}.aiff`);
  const raw = join(dir, `${name}.raw`);
  execFileSync('say', ['-v', 'Samantha', '-o', aiff, text]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', String(RATE), '-f', 's16le', raw]);
  const buf = readFileSync(raw);
  return new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Low noise floor: digital silence is not what a microphone sends. */
function silence(seconds: number): Int16Array {
  const out = new Int16Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++) out[i] = Math.round((Math.random() - 0.5) * 60);
  return out;
}

const CODE = `function solve(nums: number[], target: number) {
  const pineapple = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
  }
}`;

type Arm = 'none' | 'open-turn' | 'realtime-text' | 'open-turn-mid' | 'realtime-text-mid';

async function trial(arm: Arm, instruction: string, opener: string, question: Int16Array, again: Int16Array) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const events: { t: number; phase: string; kind: string; text?: string }[] = [];
  let phase = 'opener';
  let t0 = Date.now();
  let closed = '';
  let openerDone: () => void = () => {};
  const openerTurn = new Promise<void>((r) => (openerDone = r));
  const session = await ai.live.connect({
    model: DEFAULT_VOICE_LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: instruction }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: TURN_TAKING['thinking-aloud'],
    },
    callbacks: {
      onmessage: (m: LiveServerMessage) => {
        if (phase === 'opener') {
          if (m.serverContent?.turnComplete) openerDone();
          return;
        }
        const t = Number(((Date.now() - t0) / 1000).toFixed(2));
        if (m.serverContent?.inputTranscription?.text) events.push({ t, phase, kind: 'heard', text: m.serverContent.inputTranscription.text });
        if (m.serverContent?.outputTranscription?.text) events.push({ t, phase, kind: 'said', text: m.serverContent.outputTranscription.text });
        if (m.serverContent?.interrupted) events.push({ t, phase, kind: 'interrupted' });
        if (m.serverContent?.turnComplete) events.push({ t, phase, kind: 'turnComplete' });
      },
      onclose: (e) => {
        closed = `${(e as CloseEvent).code} ${(e as CloseEvent).reason}`;
        openerDone();
      },
      onerror: () => {},
    },
  });
  const stream = async (pcm: Int16Array, at?: { s: number; run: () => void }) => {
    const chunk = RATE / 10;
    let ran = false;
    for (let i = 0; i < pcm.length && !closed; i += chunk) {
      if (at && !ran && i / RATE >= at.s) {
        ran = true;
        at.run();
      }
      const slice = pcm.subarray(i, i + chunk);
      session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${RATE}`, data: Buffer.from(slice.buffer, slice.byteOffset, slice.byteLength).toString('base64') } });
      await new Promise((r) => setTimeout(r, 100));
    }
  };
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: opener }] }], turnComplete: true });
  await Promise.race([openerTurn, new Promise((r) => setTimeout(r, 45_000))]);

  // The note, then quiet typing: does the note alone make the interviewer talk?
  phase = 'after-note';
  t0 = Date.now();
  const note = editorNote(CODE, 60_000, 'typing', 'TypeScript');
  if (arm === 'open-turn') session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: note }] }], turnComplete: false });
  if (arm === 'realtime-text') {
    // Three snapshots, as a minute-by-minute typing session sends them.
    session.sendRealtimeInput({ text: note });
    await stream(silence(5));
    session.sendRealtimeInput({ text: editorNote(`${CODE}\n// todo`, 120_000, 'typing', 'TypeScript') });
    await stream(silence(5));
    session.sendRealtimeInput({ text: editorNote(`${CODE}\n// todo: return`, 180_000, 'typing', 'TypeScript') });
  }
  await stream(silence(6));

  // The candidate asks something that needs the screen.
  phase = 'question';
  t0 = Date.now();
  const mid = arm === 'open-turn-mid' || arm === 'realtime-text-mid';
  await stream(
    question,
    mid
      ? {
          s: 3,
          run: () => {
            events.push({ t: 3, phase, kind: 'note' });
            if (arm === 'open-turn-mid') session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: note }] }], turnComplete: false });
            else session.sendRealtimeInput({ text: note });
          },
        }
      : undefined,
  );
  await stream(silence(9));

  // A cue that asks the interviewer to speak now.
  phase = 'cue';
  t0 = Date.now();
  const cue = '[CHECK-IN 4:00 · They have been coding in silence for two minutes. Ask them, in one short sentence, to talk you through what they are writing.]';
  if (arm.startsWith('realtime-text')) session.sendRealtimeInput({ text: cue });
  else session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: cue }] }], turnComplete: true });
  await stream(silence(9));

  // Is the candidate still heard afterwards?
  phase = 'again';
  t0 = Date.now();
  await stream(again);
  await stream(silence(9));
  session.close();

  const of = (p: string, k: string) => events.filter((e) => e.phase === p && e.kind === k).map((e) => e.text).join('');
  return {
    arm,
    closed: closed || null,
    spoke_after_note: of('after-note', 'said'),
    heard: of('question', 'heard'),
    answered: of('question', 'said'),
    first_answer_s: events.find((e) => e.phase === 'question' && e.kind === 'said')?.t ?? null,
    question_s: Number((question.length / RATE).toFixed(2)),
    cue_said: of('cue', 'said'),
    again_heard: of('again', 'heard'),
    again_answered: of('again', 'said'),
    heard_at: events.filter((e) => e.phase === 'question' && e.kind === 'heard').map((e) => e.t),
    interrupted: events.some((e) => e.kind === 'interrupted'),
  };
}

async function main() {
  const lessonPath = process.argv[2];
  if (!lessonPath) throw new Error('usage: probe-coding-mock-audio.ts <lesson.json>');
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(resolve(lessonPath), 'utf8')));
  const config = lesson.interview?.coding;
  if (!config) throw new Error('the lesson has no coding block');
  const problem = config.problems.find((p) => p.id === arg('problem', 'two-sum')) ?? config.problems[0];
  const { instruction, opener } = buildCodingMockSession({ config, problem, minutes: 30 });
  const dir = mkdtempSync(join(tmpdir(), 'jarre-mock-audio-'));
  const question = speech(
    arg('long')
      ? 'Okay, so I am going to walk the array once, and keep a map from each value to its index. For every number I check whether the complement is already there. Quick question about my code. What did I name the map on line two?'
      : 'Quick question about my code. What did I name the map on line two?',
    dir,
    'q',
  );
  const again = speech('Can the same number be used twice?', dir, 'again');
  const arms = (arg('arms', 'none,open-turn,realtime-text') ?? '').split(',') as Arm[];
  const results = [];
  for (const arm of arms) {
    const r = await trial(arm, instruction, opener ?? "Hi, I'm ready.", question, again);
    console.log(`\n${arm}: closed=${r.closed ?? '-'}\n  spoke after note: "${r.spoke_after_note.slice(0, 160)}"\n  heard: "${r.heard}"\n  answered (${r.first_answer_s}s, question ${r.question_s}s): "${r.answered.slice(0, 200)}"\n  heard at: ${r.heard_at.join(' ')}\n  cue said: "${r.cue_said}"\n  again heard: "${r.again_heard}" answered: "${r.again_answered.slice(0, 120)}"`);
    results.push(r);
  }
  const out = join(process.cwd(), 'docs/research/voice-probe');
  mkdirSync(out, { recursive: true });
  const file = join(out, `coding-mock-audio-${arg('label', 'run')}.json`);
  writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), model: DEFAULT_VOICE_LIVE_MODEL, results }, null, 2));
  console.log(`\nsaved ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
