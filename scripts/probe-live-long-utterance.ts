#!/usr/bin/env tsx
/**
 * When does gemini-3.8-live send the input transcription of a long utterance?
 * A candidate who thinks aloud talks for 20 to 40 s with pauses shorter than
 * the end-of-speech window (TURN_TAKING['thinking-aloud'], 2500 ms). If the
 * transcription only comes when the server closes the turn, "voice on the mic
 * and nothing transcribed for 15 s" is a healthy session, not a deaf one.
 *
 * Streams one long spoken answer as microphone audio (16 kHz PCM, 100 ms
 * chunks, real time, as the browser does) and records when each
 * inputTranscription fragment and the interviewer's first audio arrive,
 * in seconds since the first spoken sample.
 *
 *   npx tsx scripts/probe-live-long-utterance.ts [continuous,paused] [reps] [--label run1]
 *   npx tsx scripts/probe-live-long-utterance.ts session [minutes] [--label run1]
 *
 * Arms:
 * - `continuous`: the sentences back to back (about 40 s).
 * - `paused`: the same sentences with 1.5 s between them (about 48 s).
 * - `session`: one session of `minutes` (default 11) the way a mock goes: a
 *   long answer thought aloud, the interviewer's reply, a short question, its
 *   reply, fifteen seconds of loud typing, quiet, and again. Every chunk also
 *   goes through MicActivity with what the page knows (the interviewer is
 *   talking, a key was just pressed), so the output says how many times the
 *   page would have replaced the session (`unheard`) against how much of what
 *   was said the model transcribed.
 *
 * Needs macOS `say` and ffmpeg. Paid: one Live session per arm and rep.
 * Output: docs/research/voice-probe/long-utterance-<label>.json.
 */

import { config as loadEnv } from 'dotenv';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { TURN_TAKING, DEFAULT_VOICE_LIVE_MODEL } from '../src/lib/voice/live-models';
import { MicActivity } from '../src/lib/voice/mic-activity';

loadEnv({ path: '.env.local' });

const RATE = 16000;
const CHUNK = RATE / 10;
const dir = mkdtempSync(join(tmpdir(), 'long-utterance-'));

function speech(text: string, name: string): Int16Array {
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

function concat(parts: Int16Array[]): Int16Array {
  const out = new Int16Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

const SENTENCES = [
  'Okay, so let me think about this out loud before I write anything.',
  'The brute force would be to check every pair of days, which is quadratic, and with a hundred thousand days that is too slow.',
  'What I actually need, for each day, is the next day that is warmer, so this looks like a next greater element problem.',
  'I can keep a stack of indices whose answer I do not know yet, and the temperatures at those indices go down from bottom to top.',
  'When a warmer day comes, I pop every index that is colder, and the distance between the two indices is the answer for the one I popped.',
  'Each index goes in once and comes out once, so it is linear time and linear space, and whatever stays in the stack gets a zero.',
];

type Arm = 'continuous' | 'paused';

async function trial(arm: Arm, answer: Int16Array) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let phase: 'opener' | 'answer' = 'opener';
  let speechStart = 0;
  const fragments: { t: number; text: string }[] = [];
  let firstAudio: number | null = null;
  let said = '';
  let closed = '';
  let openerDone: () => void = () => {};
  const openerTurn = new Promise<void>((r) => (openerDone = r));
  const session = await ai.live.connect({
    model: DEFAULT_VOICE_LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: {
        parts: [{ text: 'You are Sam, a coding interviewer on a call. The candidate thinks aloud: let them finish. Short spoken sentences. RESPOND IN ENGLISH.' }],
      },
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
        const t = Math.round((Date.now() - speechStart) / 100) / 10;
        const heard = m.serverContent?.inputTranscription?.text;
        if (heard) fragments.push({ t, text: heard });
        if (m.serverContent?.outputTranscription?.text) said += m.serverContent.outputTranscription.text;
        if (firstAudio === null && m.serverContent?.modelTurn?.parts?.some((p) => p.inlineData?.data)) firstAudio = t;
      },
      onclose: (e: { code?: number; reason?: string }) => {
        closed = `code=${e.code ?? '?'} ${e.reason ?? ''}`.trim();
        openerDone();
      },
      onerror: () => {},
    },
  });
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Hi, I'm ready. Greet me in one short sentence and ask me to think aloud about the daily temperatures problem." }] }], turnComplete: true });
  await Promise.race([openerTurn, new Promise((r) => setTimeout(r, 30000))]);

  // What the page's watchdog would have said, on the same samples at the same clock.
  const mic = new MicActivity();
  let unheardAt: number | null = null;
  let heardCount = 0;
  const stream = async (pcm: Int16Array) => {
    for (let i = 0; i < pcm.length; i += CHUNK) {
      const s = pcm.subarray(i, i + CHUNK);
      session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${RATE}`, data: Buffer.from(s.buffer, s.byteOffset, s.byteLength).toString('base64') } });
      const now = Date.now();
      while (heardCount < fragments.length) {
        mic.heard();
        heardCount += 1;
      }
      mic.feed(s, RATE, now);
      if (unheardAt === null && speechStart && mic.health(now) === 'unheard') unheardAt = Math.round((now - speechStart) / 100) / 10;
      await new Promise((r) => setTimeout(r, 100));
    }
  };
  await stream(silence(2));
  phase = 'answer';
  speechStart = Date.now();
  await stream(answer);
  const speechEnd = Math.round((Date.now() - speechStart) / 100) / 10;
  await stream(silence(10));
  session.close();
  return {
    arm,
    speechSeconds: speechEnd,
    firstFragmentAt: fragments[0]?.t ?? null,
    lastFragmentAt: fragments.at(-1)?.t ?? null,
    fragments: fragments.length,
    fragmentTimes: fragments.map((f) => f.t),
    firstAudioAt: firstAudio,
    watchdogUnheardAt: unheardAt,
    heard: fragments.map((f) => f.text).join('').replace(/\s+/g, ' ').trim().slice(0, 400),
    answered: said.trim().slice(0, 160),
    closed,
  };
}

/** Loud keyboard: 120 ms bursts of noise five times a second. */
function typingNoise(seconds: number): Int16Array {
  const out = silence(seconds);
  for (let start = 0; start < out.length; start += RATE / 5) {
    for (let i = start; i < Math.min(out.length, start + RATE * 0.12); i++) out[i] = Math.round((Math.random() - 0.5) * 16000);
  }
  return out;
}

async function longSession(minutes: number, answer: Int16Array, question: Int16Array) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const t0 = Date.now();
  const at = () => Math.round((Date.now() - t0) / 100) / 10;
  const mic = new MicActivity({ endOfSpeechMs: TURN_TAKING['thinking-aloud'].automaticActivityDetection?.silenceDurationMs });
  let playUntil = 0;
  let turnsComplete = 0;
  let fragments = 0;
  let heardNow = '';
  let closed = '';
  let health = 'ok';
  const healthChanges: { t: number; health: string }[] = [];
  const session = await ai.live.connect({
    model: DEFAULT_VOICE_LIVE_MODEL,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: {
        parts: [{ text: 'You are Sam, a coding interviewer on a call about the daily temperatures problem. The candidate thinks aloud and types: let them finish, answer briefly when they ask or finish a thought. One or two short spoken sentences. RESPOND IN ENGLISH.' }],
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: TURN_TAKING['thinking-aloud'],
    },
    callbacks: {
      onmessage: (m: LiveServerMessage) => {
        if (m.serverContent?.inputTranscription) {
          mic.heard();
          const text = m.serverContent.inputTranscription.text;
          if (text) {
            fragments += 1;
            heardNow += text;
          }
        }
        for (const part of m.serverContent?.modelTurn?.parts ?? []) {
          if (!part.inlineData?.data) continue;
          const seconds = Buffer.from(part.inlineData.data, 'base64').length / 2 / 24000;
          playUntil = Math.max(Date.now(), playUntil) + seconds * 1000;
        }
        if (m.serverContent?.interrupted) playUntil = 0;
        if (m.serverContent?.turnComplete) turnsComplete += 1;
      },
      onclose: (e: { code?: number; reason?: string }) => {
        closed = `t=${at()} code=${e.code ?? '?'} ${e.reason ?? ''}`.trim();
      },
      onerror: () => {},
    },
  });
  const stream = async (pcm: Int16Array, typing = false) => {
    for (let i = 0; i < pcm.length && !closed; i += CHUNK) {
      const s = pcm.subarray(i, i + CHUNK);
      session.sendRealtimeInput({ audio: { mimeType: `audio/pcm;rate=${RATE}`, data: Buffer.from(s.buffer, s.byteOffset, s.byteLength).toString('base64') } });
      const now = Date.now();
      mic.feed(s, RATE, now, { echo: now < playUntil, lastKeyAt: typing ? now - 20 : null });
      const next = mic.health(now);
      if (next !== health) {
        health = next;
        healthChanges.push({ t: at(), health });
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  };
  /** Room noise until the interviewer has answered and stopped, or `maxSeconds`. */
  const listen = async (maxSeconds: number) => {
    const turns = turnsComplete;
    const until = Date.now() + maxSeconds * 1000;
    while (Date.now() < until && !closed) {
      await stream(silence(0.5));
      if (turnsComplete > turns && Date.now() > playUntil + 1000) return;
    }
  };
  const utterances: { t: number; kind: string; seconds: number; heardChars: number; answered: boolean }[] = [];
  const say = async (kind: string, pcm: Int16Array) => {
    const started = at();
    const turns = turnsComplete;
    heardNow = '';
    await stream(pcm);
    await listen(20);
    utterances.push({ t: started, kind, seconds: Math.round(pcm.length / RATE), heardChars: heardNow.trim().length, answered: turnsComplete > turns });
  };

  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Hi, I'm ready. Greet me in one short sentence and ask me to think aloud." }] }], turnComplete: true });
  await listen(30);
  while (Date.now() - t0 < minutes * 60_000 && !closed) {
    await say('thinking-aloud', answer);
    await say('question', question);
    await stream(typingNoise(15), true);
    await stream(silence(14));
  }
  session.close();
  return {
    arm: 'session',
    minutes: Math.round((Date.now() - t0) / 6000) / 10,
    quietMs: mic.quietMs,
    utterances,
    unheardVerdicts: mic.facts().micUnheard,
    healthChanges,
    fragments,
    closed,
  };
}

(async () => {
  const positional = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--'));
  const labelAt = process.argv.indexOf('--label');
  const label = labelAt > 0 ? process.argv[labelAt + 1] : new Date().toISOString().slice(0, 10);
  const spoken = SENTENCES.map((s, i) => speech(s, `s${i}`));
  const out = resolve('docs/research/voice-probe');
  mkdirSync(out, { recursive: true });
  if (positional[0] === 'session') {
    const answer = concat(spoken.flatMap((s, i) => (i ? [silence(1.5), s] : [s])));
    const question = speech('Sam, quick question. Can the input array be empty, or is there always at least one day?', 'question');
    const result = await longSession(Number(positional[1] ?? 11), answer, question);
    console.log(JSON.stringify(result, null, 1));
    writeFileSync(join(out, `long-session-${label}.json`), JSON.stringify({ model: DEFAULT_VOICE_LIVE_MODEL, turnTaking: 'thinking-aloud', result }, null, 2));
    return;
  }
  const arms = (positional[0] ?? 'continuous,paused').split(',') as Arm[];
  const reps = Number(positional[1] ?? 1);
  const audio: Record<Arm, Int16Array> = {
    continuous: concat(spoken),
    paused: concat(spoken.flatMap((s, i) => (i ? [silence(1.5), s] : [s]))),
  };
  const results = [];
  for (let r = 0; r < reps; r++) {
    for (const arm of arms) {
      const result = await trial(arm, audio[arm]);
      console.log(JSON.stringify(result));
      results.push(result);
    }
  }
  writeFileSync(join(out, `long-utterance-${label}.json`), JSON.stringify({ model: DEFAULT_VOICE_LIVE_MODEL, turnTaking: 'thinking-aloud', results }, null, 2));
})();
