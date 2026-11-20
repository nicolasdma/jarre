#!/usr/bin/env tsx
/**
 * How long should the coding mock's interviewer wait before taking the turn?
 * Streams a candidate who thinks aloud while typing (three sentences with
 * pauses of 1.2, 2.0 and 2.8 s between them, none addressed to the
 * interviewer), then a direct question, as microphone audio, real time, and
 * records for each end-of-speech setting:
 *
 * - cut-ins: what the interviewer said while the candidate was still thinking
 *   aloud, and during which pause;
 * - latency: seconds from the end of the direct question to the first audio
 *   of the answer.
 *
 *   npx tsx scripts/probe-coding-mock-turns.ts <lesson.json> [--arms 2500,1500] [--reps 2] [--label run1]
 *
 * An arm is a silenceDurationMs for automatic activity detection
 * (END_SENSITIVITY_LOW), or `adaptive`: activity detection off, the client
 * sends activityStart/activityEnd with src/lib/voice/turn-detector.ts, the
 * candidate "typing" through the narration and not during the question.
 *
 * Needs macOS `say` and ffmpeg. Paid: one Live session per arm and rep.
 * Output: docs/research/voice-probe/coding-mock-turns-<label>.json.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { EndSensitivity, GoogleGenAI, Modality, type LiveServerMessage, type RealtimeInputConfig } from '@google/genai';
import { LessonSchema } from '../src/lib/lessons/lesson-format';
import { buildCodingMockSession } from '../src/lib/coding/mock-session';
import { DEFAULT_VOICE_LIVE_MODEL } from '../src/lib/voice/live-models';
import { MicActivity } from '../src/lib/voice/mic-activity';
import { TurnDetector } from '../src/lib/voice/turn-detector';

loadEnv({ path: '.env.local' });

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const RATE = 16000;
const CHUNK = RATE / 10;

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

interface Segment {
  name: string;
  pcm: Int16Array;
  /** The candidate is typing during this segment. */
  typing: boolean;
}

async function trial(arm: string, instruction: string, opener: string, voiceName: string | undefined, segments: Segment[]) {
  const adaptive = arm === 'adaptive';
  const realtimeInputConfig: RealtimeInputConfig = adaptive
    ? { automaticActivityDetection: { disabled: true } }
    : { automaticActivityDetection: { endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW, silenceDurationMs: Number(arm) } };
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const events: { t: number; seg: string; kind: string; text?: string }[] = [];
  let seg = 'opener';
  let t0 = Date.now();
  let closed = '';
  let openerDone: () => void = () => {};
  const openerTurn = new Promise<void>((r) => (openerDone = r));
  const session = await ai.live.connect({
    model: DEFAULT_VOICE_LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      ...(voiceName ? { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } } : {}),
      systemInstruction: { parts: [{ text: instruction }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig,
    },
    callbacks: {
      onmessage: (m: LiveServerMessage) => {
        if (seg === 'opener') {
          if (m.serverContent?.turnComplete) openerDone();
          return;
        }
        const t = Number(((Date.now() - t0) / 1000).toFixed(2));
        if (m.serverContent?.modelTurn?.parts?.some((p) => p.inlineData?.data)) events.push({ t, seg, kind: 'audio' });
        if (m.serverContent?.inputTranscription?.text) events.push({ t, seg, kind: 'heard', text: m.serverContent.inputTranscription.text });
        if (m.serverContent?.outputTranscription?.text) events.push({ t, seg, kind: 'said', text: m.serverContent.outputTranscription.text });
        if (m.serverContent?.interrupted) events.push({ t, seg, kind: 'interrupted' });
      },
      onclose: (e) => {
        closed = `${(e as CloseEvent).code} ${(e as CloseEvent).reason}`;
        openerDone();
      },
      onerror: () => {},
    },
  });
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: opener }] }], turnComplete: true });
  await Promise.race([openerTurn, new Promise((r) => setTimeout(r, 60_000))]);

  // What the browser does in adaptive mode: the same detector, on the same chunks.
  const mic = new MicActivity();
  const detector = new TurnDetector();
  let lastKeyAt: number | null = null;
  const signals: { t: number; seg: string; signal: string }[] = [];
  const b64 = (pcm: Int16Array) => Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength).toString('base64');
  const sendAudio = (pcm: Int16Array) => session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${RATE}`, data: b64(pcm) } });

  let questionEndAt = 0;
  t0 = Date.now();
  for (const s of segments) {
    seg = s.name;
    for (let i = 0; i < s.pcm.length && !closed; i += CHUNK) {
      const slice = s.pcm.subarray(i, i + CHUNK);
      const now = Date.now();
      if (s.typing) lastKeyAt = now;
      if (!adaptive) sendAudio(slice);
      else {
        const voiced = mic.feed(slice, RATE, now);
        for (const out of detector.feed({ chunk: slice, voiced, now, lastKeyAt })) {
          if (out.type === 'audio') sendAudio(out.chunk);
          else {
            signals.push({ t: Number(((now - t0) / 1000).toFixed(2)), seg, signal: out.type });
            session.sendRealtimeInput(out.type === 'start' ? { activityStart: {} } : { activityEnd: {} });
          }
        }
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    if (s.name === 'question') questionEndAt = (Date.now() - t0) / 1000;
  }
  session.close();

  const narration = new Set(['a', 'pause-1.2', 'b', 'pause-2.0', 'c', 'pause-2.8', 'd']);
  const cutIns = events.filter((e) => e.kind === 'said' && narration.has(e.seg));
  const firstAnswerAudio = events.find((e) => e.kind === 'audio' && (e.seg === 'question' || e.seg === 'after-question') && e.t >= questionEndAt - 0.3)?.t ?? null;
  return {
    arm,
    closed: closed || null,
    cut_ins: cutIns.length ? [...new Set(cutIns.map((e) => e.seg))].map((name) => ({ during: name, said: cutIns.filter((e) => e.seg === name).map((e) => e.text).join('') })) : [],
    said_in_the_quiet_after: events.filter((e) => e.kind === 'said' && e.seg === 'quiet').map((e) => e.text).join(''),
    heard: events.filter((e) => e.kind === 'heard').map((e) => e.text).join(''),
    question_latency_s: firstAnswerAudio === null ? null : Number((firstAnswerAudio - questionEndAt).toFixed(2)),
    answer: events.filter((e) => e.kind === 'said' && (e.seg === 'question' || e.seg === 'after-question')).map((e) => e.text).join('').slice(0, 200),
    signals,
  };
}

async function main() {
  const lessonPath = process.argv[2];
  if (!lessonPath) throw new Error('usage: probe-coding-mock-turns.ts <lesson.json>');
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(resolve(lessonPath), 'utf8')));
  const config = lesson.interview?.coding;
  if (!config) throw new Error('the lesson has no coding block');
  const problem = config.problems.find((p) => p.id === arg('problem', 'two-sum')) ?? config.problems[0];
  const { instruction, opener } = buildCodingMockSession({ config, problem, minutes: 30 });
  const dir = mkdtempSync(join(tmpdir(), 'jarre-mock-turns-'));
  const segments: Segment[] = [
    { name: 'lead', pcm: silence(1), typing: true },
    { name: 'a', pcm: speech('Okay, so first I will create a map, to keep the numbers I have already seen.', dir, 'a'), typing: true },
    { name: 'pause-1.2', pcm: silence(1.2), typing: true },
    { name: 'b', pcm: speech('Then I loop over the array, and for each number I compute the complement.', dir, 'b'), typing: true },
    { name: 'pause-2.0', pcm: silence(2.0), typing: true },
    { name: 'c', pcm: speech('If the complement is in the map, I return both indexes.', dir, 'c'), typing: true },
    { name: 'pause-2.8', pcm: silence(2.8), typing: true },
    { name: 'd', pcm: speech('Otherwise I store the number with its index, and keep going.', dir, 'd'), typing: true },
    { name: 'quiet', pcm: silence(9), typing: false },
    { name: 'question', pcm: speech('Quick question. Can the same number appear twice in the array?', dir, 'q'), typing: false },
    { name: 'after-question', pcm: silence(9), typing: false },
  ];
  const arms = (arg('arms', '2500,1500') ?? '').split(',');
  const reps = Number(arg('reps', '2'));
  const results = [];
  for (let rep = 1; rep <= reps; rep++) {
    for (const arm of arms) {
      const r = await trial(arm, instruction, opener ?? "Hi, I'm ready.", config.interviewer.voice, segments);
      console.log(`\n${arm} rep ${rep}: closed=${r.closed ?? '-'}\n  cut-ins: ${r.cut_ins.length ? r.cut_ins.map((c) => `[${c.during}] "${c.said.trim()}"`).join(' ') : 'none'}\n  in the quiet after: "${r.said_in_the_quiet_after.trim().slice(0, 120)}"\n  question latency: ${r.question_latency_s}s · answer: "${r.answer.trim().slice(0, 120)}"\n  heard: "${r.heard.slice(0, 160)}"${r.signals.length ? `\n  signals: ${r.signals.map((s) => `${s.signal}@${s.t}(${s.seg})`).join(' ')}` : ''}`);
      results.push({ rep, ...r });
    }
  }
  const out = join(process.cwd(), 'docs/research/voice-probe');
  mkdirSync(out, { recursive: true });
  const file = join(out, `coding-mock-turns-${arg('label', 'run')}.json`);
  writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), model: DEFAULT_VOICE_LIVE_MODEL, voice: config.interviewer.voice, results }, null, 2));
  console.log(`\nsaved ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
