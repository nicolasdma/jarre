#!/usr/bin/env tsx
/**
 * How fast does the coding mock's interviewer speak, and what does the page's
 * slower playback do to that voice? One Live session per arm:
 *
 * - `before`: the prompt without its pace lines (the interviewer the owner
 *   found too fast on 2026-11-20).
 * - `after`: the prompt as it is.
 *
 * In each: the opening (greeting and problem statement), then the candidate
 * says "Sorry, could you speak slower, please?" as microphone audio, and the
 * interviewer repeats. For every reply: words per second of the audio Gemini
 * sent, how much of it is pause, and whether the turn ends when its audio
 * would at real time (`generationComplete` → `turnComplete`). The spoken
 * request is read with the page's own detector (src/lib/voice/speech-pace.ts).
 * Then the opening goes through the page's stretcher (src/lib/voice/wsola.ts)
 * at each pace: length, median pitch before and after, CPU per second of voice.
 *
 *   npx tsx scripts/probe-coding-mock-pace.ts <lesson.json> [--arms before,after] [--label run1] [--wav <dir>]
 *
 * Needs macOS `say` and ffmpeg. Paid: one Live session per arm.
 * Output: docs/research/voice-probe/coding-mock-pace-<label>.json.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { LessonSchema } from '../src/lib/lessons/lesson-format';
import { buildCodingMockSession } from '../src/lib/coding/mock-session';
import { TURN_TAKING, DEFAULT_VOICE_LIVE_MODEL } from '../src/lib/voice/live-models';
import { applyPaceRequest, DEFAULT_PACE, findPaceRequest, PACE_STEPS } from '../src/lib/voice/speech-pace';
import { StreamingWsola } from '../src/lib/voice/wsola';

loadEnv({ path: '.env.local' });

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const MIC_RATE = 16000;
const OUT_RATE = 24000;

function speech(text: string, dir: string, name: string): Int16Array {
  const aiff = join(dir, `${name}.aiff`);
  const raw = join(dir, `${name}.raw`);
  execFileSync('say', ['-v', 'Samantha', '-o', aiff, text]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', String(MIC_RATE), '-f', 's16le', raw]);
  const buf = readFileSync(raw);
  return new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Low noise floor: digital silence is not what a microphone sends. */
function silence(seconds: number): Int16Array {
  const out = new Int16Array(Math.round(seconds * MIC_RATE));
  for (let i = 0; i < out.length; i++) out[i] = Math.round((Math.random() - 0.5) * 60);
  return out;
}

function toFloat(chunks: Buffer[]): Float32Array {
  const buf = Buffer.concat(chunks);
  const int16 = new Int16Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + (buf.byteLength & ~1)));
  const out = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) out[i] = int16[i] / 32768;
  return out;
}

function writeWav(path: string, samples: Float32Array): void {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(OUT_RATE, 24);
  head.writeUInt32LE(OUT_RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([head, data]));
}

/** Share of 20 ms frames under -40 dBFS: the pauses. */
function pauseShare(x: Float32Array): number {
  const frame = OUT_RATE / 50;
  let quiet = 0;
  let frames = 0;
  for (let at = 0; at + frame <= x.length; at += frame) {
    let sum = 0;
    for (let i = 0; i < frame; i++) sum += x[at + i] * x[at + i];
    if (Math.sqrt(sum / frame) < 0.01) quiet += 1;
    frames += 1;
  }
  return frames ? quiet / frames : 0;
}

/** Median pitch (Hz) over the voiced 40 ms frames, by normalized autocorrelation between 60 and 350 Hz. */
function medianPitch(x: Float32Array): number | null {
  const n = 960;
  const lo = Math.floor(OUT_RATE / 350);
  const hi = Math.ceil(OUT_RATE / 60);
  const found: number[] = [];
  for (let at = 0; at + n + hi <= x.length; at += n * 2) {
    let energy = 0;
    for (let i = 0; i < n; i++) energy += x[at + i] * x[at + i];
    if (Math.sqrt(energy / n) < 0.03) continue;
    let best = 0;
    let bestScore = 0;
    for (let lag = lo; lag <= hi; lag++) {
      let s = 0;
      let e = 0;
      for (let i = 0; i < n; i++) {
        s += x[at + i] * x[at + i + lag];
        e += x[at + i + lag] * x[at + i + lag];
      }
      const score = s / Math.sqrt(energy * e + 1e-12);
      if (score > bestScore) {
        bestScore = score;
        best = lag;
      }
    }
    if (bestScore > 0.6) found.push(OUT_RATE / best);
  }
  if (found.length < 5) return null;
  found.sort((a, b) => a - b);
  return Number(found[Math.floor(found.length / 2)].toFixed(1));
}

interface Reply {
  said: string;
  audio: Buffer[];
  firstAudioAt: number | null;
  generationCompleteAt: number | null;
  turnCompleteAt: number | null;
}

const newReply = (): Reply => ({ said: '', audio: [], firstAudioAt: null, generationCompleteAt: null, turnCompleteAt: null });

function replyFacts(r: Reply) {
  const samples = toFloat(r.audio);
  const seconds = samples.length / OUT_RATE;
  const words = r.said.trim().split(/\s+/).filter(Boolean).length;
  const pause = pauseShare(samples);
  return {
    said: r.said.replace(/\s+/g, ' ').trim(),
    words,
    audio_s: Number(seconds.toFixed(2)),
    words_per_s: seconds ? Number((words / seconds).toFixed(2)) : null,
    words_per_min: seconds ? Math.round((words / seconds) * 60) : null,
    pause_share: Number(pause.toFixed(2)),
    /** Words per second of the time actually spent speaking. */
    articulation_words_per_s: seconds && pause < 1 ? Number((words / (seconds * (1 - pause))).toFixed(2)) : null,
    /** The audio arrived in this long: faster than it plays. */
    audio_arrived_in_s: r.firstAudioAt !== null && r.generationCompleteAt !== null ? Number(((r.generationCompleteAt - r.firstAudioAt) / 1000).toFixed(2)) : null,
    /** First audio to turnComplete: the server ends the turn when the audio it sent would have played. */
    first_audio_to_turn_complete_s: r.firstAudioAt !== null && r.turnCompleteAt !== null ? Number(((r.turnCompleteAt - r.firstAudioAt) / 1000).toFixed(2)) : null,
    generation_complete_seen: r.generationCompleteAt !== null,
  };
}

async function trial(arm: string, instruction: string, opener: string, voiceName: string, ask: Int16Array) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let reply = newReply();
  let heard = '';
  let closed = '';
  let done: () => void = () => {};
  const session = await ai.live.connect({
    model: DEFAULT_VOICE_LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      systemInstruction: { parts: [{ text: instruction }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: TURN_TAKING['thinking-aloud'],
    },
    callbacks: {
      onmessage: (m: LiveServerMessage) => {
        const sc = m.serverContent;
        if (!sc) return;
        for (const part of sc.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) {
            reply.firstAudioAt ??= Date.now();
            reply.audio.push(Buffer.from(part.inlineData.data, 'base64'));
          }
        }
        if (sc.inputTranscription?.text) heard += sc.inputTranscription.text;
        if (sc.outputTranscription?.text) reply.said += sc.outputTranscription.text;
        if (sc.generationComplete) reply.generationCompleteAt = Date.now();
        if (sc.turnComplete) {
          reply.turnCompleteAt = Date.now();
          done();
        }
      },
      onclose: (e) => {
        closed = `${(e as CloseEvent).code} ${(e as CloseEvent).reason}`;
        done();
      },
      onerror: () => {},
    },
  });
  const turn = (ms: number) =>
    Promise.race([new Promise<void>((r) => (done = r)), new Promise<void>((r) => setTimeout(r, ms))]);
  const stream = async (pcm: Int16Array, until?: () => boolean) => {
    const chunk = MIC_RATE / 10;
    for (let i = 0; i < pcm.length && !closed && !until?.(); i += chunk) {
      const slice = pcm.subarray(i, i + chunk);
      session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${MIC_RATE}`, data: Buffer.from(slice.buffer, slice.byteOffset, slice.byteLength).toString('base64') } });
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  const openerTurn = turn(90_000);
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: opener }] }], turnComplete: true });
  await openerTurn;
  const opening = reply;

  // "Sorry, could you speak slower, please?", as the microphone would send it.
  reply = newReply();
  const askTurn = turn(60_000);
  let answered = false;
  void askTurn.then(() => (answered = true));
  await stream(ask);
  await stream(silence(40), () => answered);
  await askTurn;
  const repeat = reply;
  session.close();

  const request = findPaceRequest(heard);
  return {
    arm,
    closed: closed || null,
    opening: replyFacts(opening),
    asked_heard: heard.replace(/\s+/g, ' ').trim(),
    /** What the page does with what it heard: the request it reads and the pace it moves to from the default. */
    page_reads: request?.kind ?? null,
    page_pace_after: request ? applyPaceRequest(DEFAULT_PACE, request.kind) : DEFAULT_PACE,
    repeat: replyFacts(repeat),
    openingAudio: toFloat(opening.audio),
  };
}

/** The page's playback path: the reply in chunks as they came, through the stretcher. */
function stretchFacts(samples: Float32Array, tempo: number, wavDir: string | undefined, name: string) {
  const started = process.hrtime.bigint();
  let out: Float32Array;
  if (tempo === 1) out = samples;
  else {
    const w = new StreamingWsola(tempo);
    const parts: Float32Array[] = [];
    for (let at = 0; at < samples.length; at += 9600) parts.push(w.push(samples.subarray(at, at + 9600)));
    parts.push(w.flush());
    out = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
  }
  const cpuMs = Number(process.hrtime.bigint() - started) / 1e6;
  if (wavDir) writeWav(join(wavDir, `${name}-${tempo.toFixed(1)}x.wav`), out);
  const seconds = samples.length / OUT_RATE;
  return {
    pace: tempo,
    plays_s: Number((out.length / OUT_RATE).toFixed(2)),
    median_pitch_hz: medianPitch(out),
    cpu_ms_per_s_of_voice: seconds ? Number((cpuMs / seconds).toFixed(2)) : null,
  };
}

async function main() {
  const lessonPath = process.argv[2];
  if (!lessonPath) throw new Error('usage: probe-coding-mock-pace.ts <lesson.json>');
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(resolve(lessonPath), 'utf8')));
  const config = lesson.interview?.coding;
  if (!config) throw new Error('the lesson has no coding block');
  const problem = config.problems.find((p) => p.id === arg('problem', 'two-sum')) ?? config.problems[0];
  const session = buildCodingMockSession({ config, problem, minutes: 30 });
  // The prompt before the pace lines: the same text without them.
  const before = session.instruction
    .split('\n')
    .filter((line) => !line.startsWith('- Pace:') && !line.startsWith('- When they ask you to slow down'))
    .join('\n');
  if (before === session.instruction) throw new Error('the prompt has no pace lines to remove: update this probe');
  const dir = mkdtempSync(join(tmpdir(), 'jarre-mock-pace-'));
  const ask = speech('Sorry, could you speak slower, please?', dir, 'ask');
  const wavDir = arg('wav');
  if (wavDir) mkdirSync(wavDir, { recursive: true });

  const arms = arg('arms', 'before,after')!.split(',');
  const results = [];
  for (const arm of arms) {
    const { openingAudio, ...facts } = await trial(arm, arm === 'before' ? before : session.instruction, session.opener, config.interviewer.voice, ask);
    const playback = PACE_STEPS.map((pace) => stretchFacts(openingAudio, pace, wavDir, `opening-${arm}`));
    results.push({ ...facts, playback });
    console.log(JSON.stringify({ ...facts, playback }, null, 2));
  }

  const label = arg('label', 'run');
  const outDir = resolve('docs/research/voice-probe');
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `coding-mock-pace-${label}.json`);
  writeFileSync(out, `${JSON.stringify({ at: new Date().toISOString(), model: DEFAULT_VOICE_LIVE_MODEL, voice: config.interviewer.voice, problem: problem.id, results }, null, 2)}\n`);
  console.log(`wrote ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
