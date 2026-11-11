#!/usr/bin/env tsx
/**
 * Probe the voice tutor against the real Gemini Live API, with a simulated
 * learner, and score whether the tutor builds on what the learner actually said.
 *
 *   npx tsx scripts/probe-voice-tutor.ts --label before \
 *     [--model gemini-2.5-flash-native-audio-preview-12-2025] [--prompt legacy|current] \
 *     [--mode learning|interview] [--persona <id>] [--depth 1-3] \
 *     [--resource interview-brivel-call] [--runs 2] [--turns 8] [--interview-json <lesson.json>]
 *   npx tsx scripts/probe-voice-tutor.ts --resummarize <saved.json> [--mode interview]
 *
 * Paid: every run opens one Live session (audio out) and calls DeepSeek for the
 * learner and the judge. Keep runs and turns small.
 *
 * How a run goes
 * - The lesson comes from the database, as the app reads it (resource_sections,
 *   lesson_drills, resources.interview).
 * - The system instruction is built by the same function the app uses:
 *   `legacy` is the prompt that shipped until 2026-11-11 (one section only),
 *   `current` is what the app builds today (src/lib/llm/voice-tutor-session.ts).
 * - The learner is DeepSeek playing a student who answers the tutor's last
 *   question, and each turn plants one thing the tutor has to react to (a
 *   specific error, a specific good point, an answer to the next question, an
 *   "I don't know", a question back...). Learner turns go in as text
 *   (sendClientContent): the owner confirmed the audio path hears him fine, the
 *   defect is what the tutor does with the content.
 * - The judge (DeepSeek, temperature 0) reads lesson + exchange + plant and
 *   scores the tutor's next turn. Deterministic checks (questions per turn,
 *   spoken internal reasoning, latency, mute turns) are computed here.
 *
 * Output: docs/research/voice-probe/<label>.json (every turn, every score) and a
 * summary on stdout.
 */

import { config as loadEnv } from 'dotenv';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { FunctionResponseScheduling, GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai';
import { buildVoiceSystemInstruction } from '../src/lib/llm/voice-prompts';
import { TUTOR_TOOLS } from '../src/lib/voice/tool-declarations';
import { TURN_TAKING } from '../src/lib/voice/live-models';

loadEnv({ path: '.env.local' });

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const LABEL = arg('label') ?? 'probe';
const MODEL = arg('model') ?? 'gemini-3.8-live';
const PROMPT = (arg('prompt') ?? 'current') as 'legacy' | 'current';
const MODE = (arg('mode') ?? 'learning') as 'learning' | 'interview';
const PERSONA = arg('persona');
const DEPTH = Number(arg('depth') ?? '2');
const RESOURCE = arg('resource') ?? 'interview-brivel-call';
/** Lesson JSON to take the `interview` block from, when the DB does not have it yet. */
const INTERVIEW_JSON = arg('interview-json');
const RUNS = Number(arg('runs') ?? '2');
const TURNS = Number(arg('turns') ?? '8');
const TURN_TIMEOUT_MS = 40_000;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
if (!GEMINI_KEY || !DEEPSEEK_KEY) throw new Error('GEMINI_API_KEY and DEEPSEEK_API_KEY are required in .env.local');

// ---------------------------------------------------------------------------
// Lesson
// ---------------------------------------------------------------------------

interface LessonData {
  title: string;
  description: string;
  sections: { id: string; title: string; content: string }[];
  drills: { slug: string; title: string; text_en: string; text_es: string | null }[];
  interview: unknown;
}

async function loadLesson(resourceId: string): Promise<LessonData> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const { data: resource, error } = await sb.from('resources').select('*').eq('id', resourceId).single();
  if (error || !resource) throw new Error(`resource ${resourceId}: ${error?.message}`);
  const { data: sections } = await sb
    .from('resource_sections')
    .select('id, section_title, content_markdown, sort_order')
    .eq('resource_id', resourceId)
    .order('sort_order');
  const { data: drills } = await sb
    .from('lesson_drills')
    .select('slug, title, text_en, text_es, priority')
    .eq('resource_id', resourceId)
    .order('priority');
  return {
    title: resource.title,
    description: resource.description ?? '',
    sections: (sections ?? []).map((s) => ({ id: s.id, title: s.section_title, content: s.content_markdown })),
    drills: drills ?? [],
    interview: INTERVIEW_JSON
      ? JSON.parse(readFileSync(INTERVIEW_JSON, 'utf8')).interview ?? null
      : (resource as Record<string, unknown>).interview ?? null,
  };
}

function lessonText(lesson: LessonData): string {
  const sections = lesson.sections.map((s) => `### ${s.title}\n${s.content}`).join('\n\n');
  const drills = lesson.drills.map((d) => `- ${d.title}: ${d.text_en}`).join('\n');
  return `${lesson.title}\n\n${sections}${drills ? `\n\nPrepared English answers:\n${drills}` : ''}`;
}

// ---------------------------------------------------------------------------
// System instruction under test
// ---------------------------------------------------------------------------

async function buildSession(lesson: LessonData): Promise<{ instruction: string; opener: string; language: 'es' | 'en' }> {
  if (PROMPT === 'legacy') {
    if (MODE !== 'learning') throw new Error('legacy prompt only exists for learning mode');
    const section = lesson.sections[0];
    return {
      instruction: buildVoiceSystemInstruction({ sectionContent: section.content, sectionTitle: section.title, language: 'es' }),
      opener: 'Ya leí esta sección.',
      language: 'es',
    };
  }
  const mod = await import('../src/lib/llm/voice-tutor-session');
  if (MODE === 'learning') {
    return mod.buildLearningSession({
      language: 'es',
      lesson: {
        title: lesson.title,
        sections: lesson.sections.map((s) => ({ title: s.title, content: s.content })),
        drills: lesson.drills,
      },
      focusSectionIndex: 0,
    });
  }
  const { resolveInterviewSetup } = await import('../src/lib/interview/personas');
  const setup = resolveInterviewSetup(lesson.interview, { personaId: PERSONA, depth: DEPTH });
  return mod.buildInterviewSession({
    lesson: {
      title: lesson.title,
      sections: lesson.sections.map((s) => ({ title: s.title, content: s.content })),
      drills: lesson.drills,
    },
    setup,
  });
}

// ---------------------------------------------------------------------------
// DeepSeek
// ---------------------------------------------------------------------------

async function deepseek(system: string, user: string, temperature: number): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          temperature,
          max_tokens: 900,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}

// ---------------------------------------------------------------------------
// Plants: what each learner turn carries for the tutor to react to
// ---------------------------------------------------------------------------

type PlantKind =
  | 'specific_error'
  | 'specific_good_point'
  | 'partial'
  | 'preempts_next'
  | 'dont_know'
  | 'asks_back'
  | 'english_errors';

const LEARNING_PLAN: PlantKind[] = [
  'specific_good_point',
  'specific_error',
  'partial',
  'preempts_next',
  'dont_know',
  'specific_error',
  'asks_back',
  'specific_good_point',
];

const INTERVIEW_PLAN: PlantKind[] = [
  'english_errors',
  'specific_error',
  'english_errors',
  'specific_good_point',
  'partial',
  'english_errors',
  'asks_back',
  'specific_error',
];

const PLANT_RULES: Record<PlantKind, string> = {
  specific_good_point:
    'Answer correctly AND add one specific, non-obvious detail that IS in the lesson but the tutor did not mention (a concrete mechanism, number or edge case). planted_point = that exact detail.',
  specific_error:
    'Answer the question but state one concrete, plausible technical claim that CONTRADICTS the lesson (e.g. a wrong duration, trusting the browser, a wrong order of steps). Say it confidently. planted_point = the wrong claim and what the lesson says instead.',
  partial:
    'Give only half of the answer: one correct element, and leave out the other key element the lesson requires. planted_point = the missing element.',
  preempts_next:
    'Answer the question and, in the same answer, also explain the next most obvious related concept from the lesson (so a good tutor should NOT ask about it next). planted_point = the extra concept you already explained.',
  dont_know:
    'Say you do not know or do not remember, briefly, maybe with a half-guess of a few words. planted_point = that the learner is stuck and needs a hint, not a lecture nor the same question again.',
  asks_back:
    'Instead of answering, ask the tutor one genuine clarifying question about the lesson topic (e.g. why something works that way, or what a term means). planted_point = your question, which the tutor must answer.',
  english_errors:
    'Answer correctly in content, but in English with 2 typical Spanish-speaker mistakes (e.g. "since three years", "I have did", "the people is", "explain me", false friends like "actually" for "currently"). planted_point = the exact wrong phrases and their corrections.',
};

async function learnerTurn(
  lessonContext: string,
  history: { role: 'tutor' | 'learner'; text: string }[],
  plant: PlantKind,
  language: 'es' | 'en',
): Promise<{ answer: string; planted_point: string }> {
  const system = `You simulate a learner in a voice tutoring session. The learner is Nicolás, an Argentine developer who studied the lesson below. ${
    language === 'es'
      ? 'Speak rioplatense Spanish, spoken register, 1 to 4 sentences, like a transcript of speech (no lists).'
      : 'Speak English as a non-native B2 speaker in a job interview, spoken register, 2 to 5 sentences, like a transcript of speech.'
  }
Reply to the tutor's LAST turn. This turn has a mandatory plant:
${PLANT_RULES[plant]}
Return JSON: {"answer": "...", "planted_point": "..."}.

LESSON:
${lessonContext}`;
  const transcript = history.map((h) => `${h.role === 'tutor' ? 'TUTOR' : 'LEARNER'}: ${h.text}`).join('\n');
  const out = await deepseek(system, transcript || '(no turns yet)', 0.7);
  return { answer: String(out.answer ?? ''), planted_point: String(out.planted_point ?? '') };
}

// ---------------------------------------------------------------------------
// Judge
// ---------------------------------------------------------------------------

const JUDGE_SYSTEM_LEARNING = `You grade one turn of an AI voice tutor that quizzes a learner on a lesson. Be strict and literal. Return JSON:
{
 "addresses_plant": 0|1,      // the tutor's reply reacts to the PLANTED POINT specifically (corrects that exact error / builds on that exact detail / targets that exact missing element / does not re-ask what was already explained / gives a hint for the stuck learner / answers the learner's question). Generic acknowledgement does not count.
 "parrots": 0|1,              // the reply restates or paraphrases the learner's answer back to them (more than a ~6-word acknowledgement) instead of adding something new
 "generic_ack": 0|1,          // the reply opens with a generic acknowledgement ("Exacto", "Claro", "Totalmente", "Right", "Great", "Perfecto") not tied to a specific part of the answer
 "reasks_answered": 0|1,      // the reply asks about something the learner already explained in this conversation
 "question_count": n,         // number of distinct questions the tutor asks the learner in this reply
 "factual_error": 0|1,        // the tutor states something that contradicts the lesson
 "accepts_error": 0|1,        // the learner said something wrong and the tutor accepted or praised it
 "note": "one sentence"
}`;

const JUDGE_SYSTEM_INTERVIEW = `You grade one turn of an AI mock-interview coach. The coach plays an interviewer: after each candidate answer it gives brief feedback (what was good, what was technically wrong vs the lesson, 1-3 English corrections) and asks the next interview question. Be strict and literal. Return JSON:
{
 "addresses_plant": 0|1,      // the feedback reacts to the PLANTED POINT specifically (corrects that exact English phrase / that exact technical error / credits that exact detail / names the missing element / answers the candidate's question)
 "parrots": 0|1,              // restates the candidate's answer back instead of adding something new
 "generic_ack": 0|1,          // opens with generic praise not tied to a specific part of the answer
 "reasks_answered": 0|1,      // asks about something the candidate already covered
 "question_count": n,         // distinct interview questions asked in this reply
 "factual_error": 0|1,        // the coach states something that contradicts the lesson
 "accepts_error": 0|1,        // the candidate said something technically wrong and the coach let it pass
 "english_corrections": n,    // number of explicit English corrections given (0 if none)
 "correction_wrong": 0|1,     // one of the English corrections is itself wrong or unnecessary
 "stays_in_character": 0|1,   // the interview question is asked as the interviewer persona, in English
 "note": "one sentence"
}`;

async function judge(
  lessonContext: string,
  history: { role: 'tutor' | 'learner'; text: string }[],
  plant: PlantKind,
  plantedPoint: string,
  reply: string,
): Promise<Record<string, unknown>> {
  const transcript = history.map((h) => `${h.role === 'tutor' ? 'TUTOR' : 'LEARNER'}: ${h.text}`).join('\n');
  const user = `LESSON:\n${lessonContext}\n\nCONVERSATION SO FAR:\n${transcript}\n\nPLANT IN THE LAST LEARNER TURN (${plant}): ${plantedPoint}\n\nTUTOR REPLY TO GRADE:\n${reply}`;
  return deepseek(MODE === 'interview' ? JUDGE_SYSTEM_INTERVIEW : JUDGE_SYSTEM_LEARNING, user, 0);
}

// ---------------------------------------------------------------------------
// Live session
// ---------------------------------------------------------------------------

interface TurnResult {
  text: string;
  firstAudioMs: number | null;
  doneMs: number;
  audioBytes: number;
  toolCalls: string[];
  timedOut: boolean;
}

class LiveProbe {
  private session: Session | null = null;
  private waiter: ((m: LiveServerMessage) => void) | null = null;
  private queue: LiveServerMessage[] = [];
  closed: string | null = null;

  async open(instruction: string, voiceTools: boolean): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY! });
    this.session = await ai.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        systemInstruction: { parts: [{ text: instruction }] },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        ...(voiceTools ? { tools: TUTOR_TOOLS } : {}),
        ...(PROMPT === 'current' ? { realtimeInputConfig: TURN_TAKING[MODE === 'interview' ? 'patient' : 'default'] } : {}),
      },
      callbacks: {
        onmessage: (m) => {
          if (this.waiter) this.waiter(m);
          else this.queue.push(m);
        },
        onclose: (e) => {
          this.closed = `${(e as CloseEvent).code ?? ''} ${(e as CloseEvent).reason ?? ''}`.trim();
          this.waiter?.({} as LiveServerMessage);
        },
        onerror: () => {},
      },
    });
  }

  private next(timeoutMs: number): Promise<LiveServerMessage | null> {
    const queued = this.queue.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        resolve(null);
      }, timeoutMs);
      this.waiter = (m) => {
        clearTimeout(timer);
        this.waiter = null;
        resolve(m);
      };
    });
  }

  async ask(text: string): Promise<TurnResult> {
    const t0 = Date.now();
    this.session!.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true });
    const result: TurnResult = { text: '', firstAudioMs: null, doneMs: 0, audioBytes: 0, toolCalls: [], timedOut: false };
    for (;;) {
      if (this.closed) break;
      const m = await this.next(Math.max(1, TURN_TIMEOUT_MS - (Date.now() - t0)));
      if (!m) {
        result.timedOut = true;
        // Let the late generation finish here, so it does not land on the next
        // learner turn as if it were the answer to it.
        for (const end = Date.now() + 30_000; Date.now() < end && !this.closed; ) {
          const late = await this.next(Math.max(1, end - Date.now()));
          if (!late || late.serverContent?.turnComplete) break;
        }
        break;
      }
      for (const part of m.serverContent?.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) {
          if (result.firstAudioMs === null) result.firstAudioMs = Date.now() - t0;
          result.audioBytes += Math.floor((part.inlineData.data.length * 3) / 4);
        }
      }
      const out = m.serverContent?.outputTranscription?.text;
      if (out) result.text += out;
      if (m.toolCall?.functionCalls?.length) {
        const responses = m.toolCall.functionCalls.map((c) => {
          result.toolCalls.push(c.name ?? '?');
          return {
            id: c.id,
            name: c.name,
            response: { output: { success: true } },
            // What src/lib/voice/gemini-live.ts sends on 3.8.
            ...(MODEL === 'gemini-3.8-live'
              ? { scheduling: result.audioBytes > 0 ? FunctionResponseScheduling.SILENT : FunctionResponseScheduling.WHEN_IDLE }
              : {}),
          };
        });
        this.session!.sendToolResponse({ functionResponses: responses });
      }
      if (m.serverContent?.turnComplete) {
        // A tool call before any audio can be followed by a second generation.
        if (result.audioBytes === 0 && result.toolCalls.length > 0) {
          const follow = await this.next(8000);
          if (follow) {
            this.queue.unshift(follow);
            continue;
          }
        }
        break;
      }
    }
    result.doneMs = Date.now() - t0;
    result.text = result.text.replace(/\s+/g, ' ').trim();
    return result;
  }

  close() {
    try {
      this.session?.close();
    } catch {
      /* already closed */
    }
  }
}

// ---------------------------------------------------------------------------
// Deterministic checks
// ---------------------------------------------------------------------------

/** Things the model wrote for itself and then spoke: reasoning, numbered plans, stage directions. */
const LEAK = /(INTERNAL (REASONING|THOUGHT)|RAZONAMIENTO INTERNO|^\s*\d\.\s.*\n\s*\d\.\s|back in character|\bin character:)/im;

function countQuestions(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface ExchangeRecord {
  turn: number;
  plant: PlantKind | 'opener';
  learner: string;
  planted_point: string;
  tutor: string;
  first_audio_ms: number | null;
  done_ms: number;
  audio_seconds: number;
  tool_calls: string[];
  mute: boolean;
  timed_out: boolean;
  leaks_reasoning: boolean;
  question_marks: number;
  words: number;
  judge?: Record<string, unknown>;
}

async function runOnce(lesson: LessonData, run: number) {
  const { instruction, opener, language } = await buildSession(lesson);
  const context = lessonText(lesson);
  const probe = new LiveProbe();
  // As the app connects: the legacy learning tutor got the UI tools, the
  // current learning and interview sessions get none.
  await probe.open(instruction, PROMPT === 'legacy');
  const history: { role: 'tutor' | 'learner'; text: string }[] = [];
  const records: ExchangeRecord[] = [];
  const plan = MODE === 'interview' ? INTERVIEW_PLAN : LEARNING_PLAN;

  const record = (turn: number, plant: ExchangeRecord['plant'], learner: string, planted: string, r: TurnResult): ExchangeRecord => ({
    turn,
    plant,
    learner,
    planted_point: planted,
    tutor: r.text,
    first_audio_ms: r.firstAudioMs,
    done_ms: r.doneMs,
    audio_seconds: Number((r.audioBytes / 2 / 24000).toFixed(1)),
    tool_calls: r.toolCalls,
    mute: r.audioBytes === 0,
    timed_out: r.timedOut,
    leaks_reasoning: LEAK.test(r.text),
    question_marks: countQuestions(r.text),
    words: r.text ? r.text.split(/\s+/).length : 0,
  });

  const first = await probe.ask(opener);
  records.push(record(0, 'opener', opener, '', first));
  history.push({ role: 'tutor', text: first.text });
  process.stdout.write(`  run ${run} opener: ${first.text.slice(0, 120)}\n`);

  for (let i = 0; i < Math.min(TURNS, plan.length); i++) {
    if (probe.closed) break;
    const plant = plan[i];
    const learner = await learnerTurn(context, history, plant, language);
    history.push({ role: 'learner', text: learner.answer });
    const r = await probe.ask(learner.answer);
    const rec = record(i + 1, plant, learner.answer, learner.planted_point, r);
    rec.judge = await judge(context, history, plant, learner.planted_point, r.text);
    history.push({ role: 'tutor', text: r.text });
    records.push(rec);
    process.stdout.write(`  run ${run} turn ${i + 1} [${plant}] plant=${rec.judge.addresses_plant} parrot=${rec.judge.parrots} q=${rec.judge.question_count} ${r.firstAudioMs ?? 'mute'}ms\n`);
    if (r.toolCalls.includes('end_session')) break;
  }
  probe.close();
  return { run, closed: probe.closed, instruction_chars: instruction.length, records };
}

function mean(xs: number[]): number | null {
  return xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3)) : null;
}

function percentile(xs: number[], p: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}

/**
 * A mute reply addresses nothing, whatever the judge says. A turn right after
 * a timed-out one is left out: its reply can still belong to the turn before.
 */
function scoredRecords(run: { records: ExchangeRecord[] }): ExchangeRecord[] {
  return run.records
    .filter((x, i) => x.judge && !run.records[i - 1]?.timed_out)
    .map((x) => (x.mute ? { ...x, judge: { ...x.judge, addresses_plant: 0, parrots: 0, generic_ack: 0, question_count: 0 } } : x));
}

function summarize(runs: { records: ExchangeRecord[] }[]) {
  const scored = runs.flatMap((r) => scoredRecords(r));
  const all = runs.flatMap((r) => r.records);
  const j = (k: string) => scored.map((x) => Number(x.judge?.[k] ?? 0));
  const latencies = all.map((x) => x.first_audio_ms).filter((x): x is number => x !== null);
  const byPlant: Record<string, number | null> = {};
  for (const kind of new Set(scored.map((x) => x.plant))) {
    byPlant[kind] = mean(scored.filter((x) => x.plant === kind).map((x) => Number(x.judge?.addresses_plant ?? 0)));
  }
  return {
    scored_turns: scored.length,
    addresses_plant: mean(j('addresses_plant')),
    addresses_plant_by_kind: byPlant,
    parrots: mean(j('parrots')),
    generic_ack: mean(j('generic_ack')),
    reasks_answered: mean(j('reasks_answered')),
    one_question: mean(scored.map((x) => (Number(x.judge?.question_count ?? 0) === 1 ? 1 : 0))),
    more_than_one_question: mean(scored.map((x) => (Number(x.judge?.question_count ?? 0) > 1 ? 1 : 0))),
    factual_error: mean(j('factual_error')),
    accepts_error: mean(j('accepts_error')),
    ...(MODE === 'interview'
      ? {
          english_corrections_mean: mean(j('english_corrections')),
          correction_wrong: mean(j('correction_wrong')),
          stays_in_character: mean(j('stays_in_character')),
        }
      : {}),
    leaks_reasoning: mean(all.map((x) => (LEAK.test(x.tutor) ? 1 : 0))),
    mute_turns: all.filter((x) => x.mute).length,
    timed_out_turns: all.filter((x) => x.timed_out).length,
    first_audio_ms_p50: percentile(latencies, 50),
    first_audio_ms_p90: percentile(latencies, 90),
    words_mean: mean(scored.map((x) => x.words)),
    audio_seconds_mean: mean(scored.map((x) => x.audio_seconds)),
  };
}

async function main() {
  const resummarize = arg('resummarize');
  if (resummarize) {
    // Recompute the summary of a saved run with the current rules, no network.
    const saved = JSON.parse(readFileSync(resummarize, 'utf8'));
    saved.summary = summarize(saved.runs);
    writeFileSync(resummarize, JSON.stringify(saved, null, 2));
    console.log(JSON.stringify(saved.summary, null, 2));
    return;
  }
  const lesson = await loadLesson(RESOURCE);
  console.log(`probe ${LABEL}: model=${MODEL} prompt=${PROMPT} mode=${MODE} persona=${PERSONA ?? '-'} depth=${DEPTH} runs=${RUNS} turns=${TURNS}`);
  const runs = [];
  for (let run = 1; run <= RUNS; run++) runs.push(await runOnce(lesson, run));
  const summary = summarize(runs);
  const dir = join(process.cwd(), 'docs/research/voice-probe');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${LABEL}.json`);
  writeFileSync(
    file,
    JSON.stringify(
      { label: LABEL, date: new Date().toISOString(), model: MODEL, prompt: PROMPT, mode: MODE, persona: PERSONA ?? null, depth: DEPTH, resource: RESOURCE, summary, runs },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(summary, null, 2));
  console.log(`saved ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
