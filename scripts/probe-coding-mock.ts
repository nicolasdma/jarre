#!/usr/bin/env tsx
/**
 * Probe the coding mock's interviewer against the real Gemini Live API with a
 * scripted candidate (text turns, as scripts/probe-voice-tutor.ts does), and
 * check what the page relies on:
 *
 *   npx tsx scripts/probe-coding-mock.ts <lesson.json> [--problem two-sum] [--label run1]
 *
 * 1. A context note sent with turnComplete=false ([EDITOR], [RUN]) does not
 *    make the interviewer speak.
 * 2. The interviewer sees that code: asked about it, it refers to it.
 * 3. A [HINT 1] note is given as that hint, not the whole solution.
 * 4. A [TIME] "time is up" note closes the call with "interview complete".
 * 5. No praise or verdicts during the call.
 *
 * Paid: one Live session (audio out), seven turns. Output:
 * docs/research/voice-probe/coding-mock-<label>.json and a summary on stdout.
 */

import { config as loadEnv } from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai';
import { LessonSchema } from '../src/lib/lessons/lesson-format';
import { buildCodingMockSession } from '../src/lib/coding/mock-session';
import { editorNote, hintNote, runNote } from '../src/lib/coding/mock-runtime';
import { TURN_TAKING, DEFAULT_VOICE_LIVE_MODEL } from '../src/lib/voice/live-models';

loadEnv({ path: '.env.local' });

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const KEY = process.env.GEMINI_API_KEY;
if (!KEY) throw new Error('GEMINI_API_KEY missing in .env.local');

interface Turn {
  sent: string;
  respond: boolean;
  text: string;
  audioBytes: number;
  firstAudioMs: number | null;
  ms: number;
}

class Live {
  private session: Session | null = null;
  private waiter: ((m: LiveServerMessage | null) => void) | null = null;
  private queue: LiveServerMessage[] = [];

  async open(instruction: string) {
    const ai = new GoogleGenAI({ apiKey: KEY! });
    this.session = await ai.live.connect({
      model: DEFAULT_VOICE_LIVE_MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: { parts: [{ text: instruction }] },
        outputAudioTranscription: {},
        realtimeInputConfig: TURN_TAKING.patient,
      },
      callbacks: {
        onmessage: (m) => (this.waiter ? this.waiter(m) : this.queue.push(m)),
        onclose: () => this.waiter?.(null),
        onerror: () => {},
      },
    });
  }

  private next(ms: number): Promise<LiveServerMessage | null> {
    const q = this.queue.shift();
    if (q) return Promise.resolve(q);
    return new Promise((res) => {
      const t = setTimeout(() => {
        this.waiter = null;
        res(null);
      }, ms);
      this.waiter = (m) => {
        clearTimeout(t);
        this.waiter = null;
        res(m);
      };
    });
  }

  /** Send text; with respond=false, listen `quietMs` for anything the model says anyway. */
  async send(text: string, respond: boolean, quietMs = 8000): Promise<Turn> {
    const t0 = Date.now();
    this.session!.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: respond });
    const turn: Turn = { sent: text, respond, text: '', audioBytes: 0, firstAudioMs: null, ms: 0 };
    const deadline = t0 + (respond ? 45_000 : quietMs);
    for (;;) {
      const m = await this.next(Math.max(1, deadline - Date.now()));
      if (!m) break;
      for (const part of m.serverContent?.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) {
          turn.firstAudioMs ??= Date.now() - t0;
          turn.audioBytes += Math.floor((part.inlineData.data.length * 3) / 4);
        }
      }
      if (m.serverContent?.outputTranscription?.text) turn.text += m.serverContent.outputTranscription.text;
      if (m.serverContent?.turnComplete && respond) break;
    }
    turn.ms = Date.now() - t0;
    turn.text = turn.text.replace(/\s+/g, ' ').trim();
    return turn;
  }

  close() {
    this.session?.close();
  }
}

const PRAISE = /\b(great|nice|perfect|exactly|correct|good job|well done|excellent|spot on|good point)\b/i;

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npx tsx scripts/probe-coding-mock.ts <lesson.json> [--problem id] [--label name]');
  const lesson = LessonSchema.parse(JSON.parse(readFileSync(resolve(file), 'utf8')));
  const config = lesson.interview?.coding;
  if (!config) throw new Error('The lesson has no coding round');
  const problem = config.problems.find((p) => p.id === arg('problem', 'two-sum')) ?? config.problems[0];
  const label = arg('label', `${problem.id}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`);
  const { instruction, opener } = buildCodingMockSession({ config, problem, minutes: 30 });

  // A plausible first attempt with the classic falsy-index bug.
  const buggy = problem.id === 'two-sum'
    ? `export function twoSum(nums: number[], target: number): [number, number] {\n  const seen = new Map<number, number>();\n  for (let i = 0; i < nums.length; i++) {\n    const j = seen.get(target - nums[i]);\n    if (j) return [j, i];\n    seen.set(nums[i], i);\n  }\n  throw new Error('no answer');\n}\n`
    : problem.solution.code;

  const live = new Live();
  await live.open(instruction);
  const turns: Turn[] = [];
  const say = async (text: string, respond = true, quietMs?: number) => {
    const t = await live.send(text, respond, quietMs);
    turns.push(t);
    console.log(`\n> ${respond ? 'CANDIDATE' : 'NOTE'}: ${text.split('\n')[0].slice(0, 110)}`);
    console.log(`  ${respond ? 'INTERVIEWER' : 'unprompted'} (${t.audioBytes} B audio, ${t.ms} ms): ${t.text || '(silence)'}`);
    return t;
  };

  await say(opener);
  await say("Okay. So I get an array of numbers and a target, and I return the indices of the two that add up to it. Can there be duplicates or negatives? And is it sorted?");
  await say("The brute force checks every pair, that's O of n squared. I'd rather keep a hash map from value to index, one pass, O of n time and O of n space. Does that sound good?");
  const silentEditor = await say(editorNote(buggy, 9 * 60_000, 'typing'), false);
  const silentRun = await say(runNote({ kind: 'examples', passed: 3, total: 3, failed: [], logs: [] }, 11 * 60_000), false);
  const looked = await say("Okay, I think I'm done. Can you take a look at what I have on the screen?");
  await say(`${hintNote(problem.hints, 0).note}`, false, 3000);
  const hinted = await say("Hmm, I'm a bit stuck on what case I'm missing. Can I get a hint?");
  const closed = await say('[TIME 30:00 · Time is up. Close the interview now: if they are mid-sentence, let them finish the thought first. One or two sentences in character (thank them, next steps by email), no feedback. Then say exactly "interview complete".]');
  live.close();

  // The first turn reads the statement ("exactly one answer"): praise is checked after it.
  const spoken = turns.filter((t) => t.respond).slice(1).map((t) => t.text).join(' ');
  const checks = {
    notesStaySilent: silentEditor.audioBytes === 0 && silentRun.audioBytes === 0,
    seesTheCode: /line|index|zero|0|if|map|undefined|falsy/i.test(looked.text),
    hintIsSmall: hinted.text.length > 0 && !/!== undefined|has\(/.test(hinted.text),
    closesWithPhrase: /interview complete/i.test(closed.text),
    noPraise: !PRAISE.test(spoken),
  };
  console.log('\nChecks:', checks);
  const out = join('docs', 'research', 'voice-probe');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `coding-mock-${label}.json`), JSON.stringify({ model: DEFAULT_VOICE_LIVE_MODEL, problem: problem.id, checks, turns }, null, 2));
  console.log(`Saved ${join(out, `coding-mock-${label}.json`)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
