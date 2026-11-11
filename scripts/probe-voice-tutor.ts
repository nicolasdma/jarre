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
 *   npx tsx scripts/probe-voice-tutor.ts --mode interview --score-transcript <transcript.txt> --label <label>
 *
 * Interview runs use `--plan hard` by default: the plants reproduce the owner's
 * real mock of 2026-11-11 (mangled name, subtle misconceptions, vague answer,
 * milestones not known, must-say left out) and rubric v2 scores precision and
 * recall of misconceptions, follow-ups, curveballs, praise and the closing.
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
/** Interview plants: `hard` reproduces the owner's real mock (2026-11-11), `v1` is the first plan. */
const PLAN = (arg('plan') ?? 'hard') as 'v1' | 'hard';
/** A real transcript to score with the interview rubric, no Live session. */
const SCORE_TRANSCRIPT = arg('score-transcript');
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
  | 'english_errors'
  | 'subtle_misconception'
  | 'mangled_term'
  | 'must_know_partial'
  | 'vague'
  | 'complete_correct'
  | 'missing_must_say';

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

/**
 * The owner's real mock (2026-11-11, Nathalie level 2) failed on these: a
 * mangled project name and missing proof in the intro, two subtle technical
 * misconceptions praised as "spot on", the six milestones not known, vague
 * answers, and next steps without the funded milestone.
 */
const INTERVIEW_PLAN_HARD: PlantKind[] = [
  'mangled_term',
  'subtle_misconception',
  'vague',
  'subtle_misconception',
  'must_know_partial',
  'complete_correct',
  'english_errors',
  'missing_must_say',
];

const PLANT_RULES: Record<PlantKind, string> = {
  subtle_misconception:
    'Answer the question confidently and mostly right, but include ONE subtle technical misconception about the mechanism, the kind a developer who half-studied would say. Examples of the kind (adapt to the question): links "expire every two minutes" as if a global timer rotates them (instead of each link expiring 120 s after it is signed); "we check the signature in the postMessage listener" or "when the iframe says paid we unlock" (instead of: the browser message only refreshes the UI, the server postback is verified and writes access); "RLS hides the bucket so the URL is safe to share"; "the reset deletes the votes every Sunday at 23:59 UTC". planted_point = the misconception and the correct version.',
  mangled_term:
    'Answer correctly, but write ONE key name or term from the lesson the way a speech recognizer mangles an accented speaker (e.g. "Body of Guardians" for Valley of Guardians, "role low security" for row-level security, "center bill" for Centrobill, "PG crown" for pg_cron). If you are introducing yourself, also leave out two things the prepared introduction has (e.g. that you work alone, and the ten thousand users). planted_point = the mangled term and what it should be, plus what was left out.',
  must_know_partial:
    'Show you do not know a list the lesson expects by heart (e.g. the six weekly milestones): name one or two items vaguely, then admit you have not thought about it. If the question is not about a list, answer with only the first item of what the lesson lists and trail off. planted_point = which items of the canonical list are missing.',
  vague:
    'Give a vague, hand-waving answer: no mechanism, no number, filler like "basically", "we set a limit", "so yeah", "something like that". planted_point = the specific mechanism or number that is missing.',
  complete_correct:
    'Give a complete and correct answer that contains every key point of the lesson\'s prepared answer for this question, in good English. planted_point = "nothing to correct: the coach should not invent an error".',
  missing_must_say:
    'Answer reasonably, but leave out the one thing the lesson says must be said for this question (e.g. for next steps: that you start only once the first milestone is funded on Upwork, and that every Wednesday the code is on staging; for payments: that the browser message never unlocks anything). planted_point = the must-say item left out.',
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

/**
 * Rubric v2 (docs/research/2026-11-11-interview-mock-audit.md). It does not
 * depend on the plant: the judge finds the errors and the missing key points
 * itself, from the lesson, so the same rubric scores a real transcript.
 */
const JUDGE_SYSTEM_INTERVIEW_V2 = `You audit one turn of an AI mock-interview coach that rehearses a real client call. The coach plays the interviewer: after each candidate answer it gives feedback (starting "Feedback:") and asks the next question. The lesson below is the answer key: its sections and its "Prepared English answers". Be strict, literal and fair. Return JSON:
{
 "answer_errors": ["..."],        // technical claims in the candidate's LAST answer that are wrong or misleading against the lesson (e.g. "links expire every 2 minutes" as a global timer instead of each link expiring 120 s after it is signed; checking a signature in the browser postMessage listener; the browser message unlocking access). Empty if none. Do not list language mistakes here.
 "answer_missing": ["..."],       // up to 3 key points the lesson's prepared answer for THIS question has and the candidate left out, only those a demanding client would notice (e.g. "the browser message never unlocks anything", "start only once the first milestone is funded", "every Wednesday the code is on staging", "works alone", "10,000+ users"). For a list question (the six milestones), each missing item counts. Empty if complete.
 "flagged_errors": n,              // how many of answer_errors the coach's feedback explicitly corrects (states the right mechanism; only renaming a term does not count)
 "false_flags": n,                 // things the coach calls wrong that are actually right per the lesson
 "named_missing": n,               // how many of answer_missing the coach names
 "praise_despite_issue": 0|1,      // the coach praises the content strongly ("spot on", "exactly", "excellent", "perfect", "you clearly understand") although answer_errors or answer_missing is not empty
 "content_before_language": 0|1|null, // null if answer_errors and answer_missing are empty; else 1 if the content issue comes before the English corrections
 "mangled_term": "..."|null,       // a key lesson name or term that appears mangled in the candidate answer (speech recognition output: e.g. "Body of Guardians" for Valley of Guardians, "role low security" for row-level security). null if none.
 "flags_mangled_term": 0|1|null,   // null if mangled_term is null; else 1 if the coach tells the candidate to say that name or term right
 "english_corrections": n,
 "correction_wrong": 0|1,          // an English correction that is itself wrong or unnecessary
 "next_question_kind": "follow_up"|"curveball"|"bank"|"none", // follow_up: digs into the candidate's OWN last answer (what they said, a what-if on it, asks them to be specific); curveball: a realistic but unexpected question NOT covered by any prepared answer in the lesson; bank: a question covered by the prepared answers; none: no question (the interview ended)
 "vague_pressed": 0|1|null,        // null if the candidate's answer was specific; else 1 if the coach/interviewer pushes them to be specific (asks for the number, the mechanism)
 "stage_direction": 0|1,           // speaks a stage direction ("back in character", "next question")
 "addresses_plant": 0|1,           // the reply reacts to the PLANTED POINT (given below) specifically; for "nothing to correct" plants, 1 if it invents no error
 "note": "one sentence"
}`;

const CLOSING_JUDGE = `You audit the closing summary of an AI mock-interview coach. Given the whole interview and the lesson (the answer key), return JSON:
{
 "has_closing": 0|1,               // there is an overall summary at the end
 "names_misconceptions": 0|1,      // it names the specific technical misconceptions the candidate had (if there were any; 1 if there were none and it says nothing wrong)
 "names_must_know_misses": 0|1,    // it names what the candidate did not know that the lesson expects by heart (e.g. the milestones), or 1 if there was nothing
 "names_language_errors": 0|1,     // it names recurring English errors with the correct form
 "gives_next_practice": 0|1,       // it says concretely what to practice next (which answers or drills)
 "generic": 0|1,                   // it is mostly generic praise
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
  return deepseek(MODE === 'interview' ? JUDGE_SYSTEM_INTERVIEW_V2 : JUDGE_SYSTEM_LEARNING, user, 0);
}

async function judgeClosing(lessonContext: string, history: { role: 'tutor' | 'learner'; text: string }[]): Promise<Record<string, unknown>> {
  const transcript = history.map((h) => `${h.role === 'tutor' ? 'COACH' : 'CANDIDATE'}: ${h.text}`).join('\n');
  return deepseek(CLOSING_JUDGE, `LESSON:\n${lessonContext}\n\nINTERVIEW:\n${transcript}`, 0);
}

/** Old judge kept for the record: the first interview runs were scored with it. */
void JUDGE_SYSTEM_INTERVIEW;

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
  const plan = MODE === 'interview' ? (PLAN === 'hard' ? INTERVIEW_PLAN_HARD : INTERVIEW_PLAN) : LEARNING_PLAN;

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
  let closing: Record<string, unknown> | null = null;
  if (MODE === 'interview' && !probe.closed) {
    // Ask to wrap up unless it already ended, then judge the closing summary.
    if (!/interview complete/i.test(history[history.length - 1]?.text ?? '')) {
      const wrap = "I think that's all I have time for. Can we wrap up?";
      history.push({ role: 'learner', text: wrap });
      const r = await probe.ask(wrap);
      history.push({ role: 'tutor', text: r.text });
      records.push(record(records.length, 'opener', wrap, '', r));
    }
    closing = await judgeClosing(context, history);
  }
  probe.close();
  return { run, closed: probe.closed, instruction_chars: instruction.length, records, closing };
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

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

/** Rubric v2 metrics (interview). */
function summarizeV2(runs: { records: ExchangeRecord[]; closing?: Record<string, unknown> | null }[]) {
  const scored = runs.flatMap((r) => r.records.filter((x) => x.judge && x.judge.answer_errors !== undefined));
  const n = (x: ExchangeRecord, k: string) => Number(x.judge?.[k] ?? 0);
  const len = (x: ExchangeRecord, k: string) => (Array.isArray(x.judge?.[k]) ? (x.judge?.[k] as unknown[]).length : 0);
  const errors = sum(scored.map((x) => len(x, 'answer_errors')));
  const flagged = sum(scored.map((x) => Math.min(n(x, 'flagged_errors'), len(x, 'answer_errors'))));
  const falseFlags = sum(scored.map((x) => n(x, 'false_flags')));
  const missing = sum(scored.map((x) => len(x, 'answer_missing')));
  const named = sum(scored.map((x) => Math.min(n(x, 'named_missing'), len(x, 'answer_missing'))));
  const withIssue = scored.filter((x) => len(x, 'answer_errors') + len(x, 'answer_missing') > 0);
  const mangled = scored.filter((x) => x.judge?.mangled_term);
  const vague = scored.filter((x) => x.judge?.vague_pressed !== null && x.judge?.vague_pressed !== undefined);
  const kinds = scored.map((x) => String(x.judge?.next_question_kind ?? 'none'));
  const asked = kinds.filter((k) => k !== 'none').length;
  const closings = runs.map((r) => r.closing).filter((c): c is Record<string, unknown> => !!c);
  const c = (k: string) => mean(closings.map((x) => Number(x[k] ?? 0)));
  const ratio = (a: number, b: number) => (b ? Number((a / b).toFixed(3)) : null);
  return {
    interviews: runs.length,
    scored_turns: scored.length,
    misconceptions_in_answers: errors,
    misconception_recall: ratio(flagged, errors),
    misconception_precision: ratio(flagged, flagged + falseFlags),
    false_flags: falseFlags,
    missing_key_points: missing,
    missing_recall: ratio(named, missing),
    praise_despite_issue: ratio(sum(withIssue.map((x) => n(x, 'praise_despite_issue'))), withIssue.length),
    content_before_language: mean(withIssue.filter((x) => x.judge?.content_before_language !== null).map((x) => n(x, 'content_before_language'))),
    mangled_terms: mangled.length,
    mangled_flagged: ratio(sum(mangled.map((x) => n(x, 'flags_mangled_term'))), mangled.length),
    vague_answers: vague.length,
    vague_pressed: ratio(sum(vague.map((x) => n(x, 'vague_pressed'))), vague.length),
    follow_up_rate: ratio(kinds.filter((k) => k === 'follow_up').length, asked),
    curveballs_per_interview: ratio(kinds.filter((k) => k === 'curveball').length, runs.length),
    english_corrections_mean: mean(scored.map((x) => n(x, 'english_corrections'))),
    correction_wrong: mean(scored.map((x) => n(x, 'correction_wrong'))),
    stage_direction: mean(scored.map((x) => n(x, 'stage_direction'))),
    addresses_plant: mean(scored.filter((x) => x.plant !== 'opener' && x.plant !== ('transcript' as PlantKind)).map((x) => n(x, 'addresses_plant'))),
    closing: closings.length
      ? {
          names_misconceptions: c('names_misconceptions'),
          names_must_know_misses: c('names_must_know_misses'),
          names_language_errors: c('names_language_errors'),
          gives_next_practice: c('gives_next_practice'),
          generic: c('generic'),
        }
      : null,
  };
}

function summarize(runs: { records: ExchangeRecord[]; closing?: Record<string, unknown> | null }[]) {
  if (MODE === 'interview' && runs.some((r) => r.records.some((x) => x.judge?.answer_errors !== undefined))) {
    return { ...summarizeLegacy(runs), v2: summarizeV2(runs) };
  }
  return summarizeLegacy(runs);
}

function summarizeLegacy(runs: { records: ExchangeRecord[] }[]) {
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
  if (SCORE_TRANSCRIPT) {
    await scoreTranscript(lesson, SCORE_TRANSCRIPT);
    return;
  }
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

/**
 * Score a real interview transcript with rubric v2. The file has one turn per
 * paragraph, "Name: text" (the learner's turns start with "Vos:").
 */
async function scoreTranscript(lesson: LessonData, file: string) {
  if (MODE !== 'interview') throw new Error('--score-transcript needs --mode interview');
  const context = lessonText(lesson);
  const turns = readFileSync(file, 'utf8')
    .split(/\n(?=[A-ZÁÉÍÓÚa-z]+:)/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const i = t.indexOf(':');
      return { who: t.slice(0, i).trim(), text: t.slice(i + 1).replace(/\s+/g, ' ').trim() };
    });
  const history: { role: 'tutor' | 'learner'; text: string }[] = [];
  const records: ExchangeRecord[] = [];
  for (const t of turns) {
    const role: 'tutor' | 'learner' = t.who === 'Vos' ? 'learner' : 'tutor';
    if (role === 'tutor' && history.length && history[history.length - 1].role === 'learner') {
      const rec: ExchangeRecord = {
        turn: records.length + 1, plant: 'transcript' as PlantKind, learner: history[history.length - 1].text, planted_point: '',
        tutor: t.text, first_audio_ms: null, done_ms: 0, audio_seconds: 0, tool_calls: [], mute: false, timed_out: false,
        leaks_reasoning: LEAK.test(t.text), question_marks: countQuestions(t.text), words: t.text.split(/\s+/).length,
      };
      rec.judge = await judge(context, history, 'transcript' as PlantKind, '(real transcript: no plant; set addresses_plant to 0)', t.text);
      records.push(rec);
      process.stdout.write(`  turn ${rec.turn}: errors=${JSON.stringify(rec.judge.answer_errors)} flagged=${rec.judge.flagged_errors} next=${rec.judge.next_question_kind}\n`);
    }
    history.push({ role, text: t.text });
  }
  const closing = await judgeClosing(context, history);
  const runs = [{ run: 1, closed: null, instruction_chars: 0, records, closing }];
  const summary = summarize(runs);
  const dir = join(process.cwd(), 'docs/research/voice-probe');
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${LABEL}.json`);
  writeFileSync(out, JSON.stringify({ label: LABEL, date: new Date().toISOString(), source: file, mode: MODE, resource: RESOURCE, summary, runs }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  console.log(`saved ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
