/**
 * Pregunta → respuesta: a third party judges the spoken answer.
 *
 * The learner answers aloud, the browser's recognizer writes it down
 * (recognition.ts, the same one Repetir uses) and one cheap model call
 * compares that text with the drill's own text. The judge is lenient on
 * purpose: it reads for meaning, not wording. It lists the two to four ideas
 * that matter, says which were there, and suggests one thing.
 *
 * The grade is the model's, kept honest by a few rules here (`settleRating`),
 * and it only preselects the rating: the learner can still change it before
 * confirming, and the stored record is the same RecallRecord as before.
 *
 * Everything here is pure; the model is passed in, so tests never call one.
 */

import { z } from 'zod';
import type { RecallRating } from './recall';

/** Fewer words than this is not an answer to judge (noise, a false start). */
export const MIN_ANSWER_WORDS = 3;
/** The transcript sent to the model is capped: 40 s of speech is ~120 words. */
export const MAX_TRANSCRIPT_CHARS = 4000;
const MAX_IDEAS = 4;

export interface RecallEvalInput {
  /** What was asked: the interview's English question, or the drill's title. */
  question: string;
  /** The drill's text (the reference answer), phrases separated by " / ". */
  reference: string;
  /** What a complete answer says, when the lesson's interview lists it for this drill. */
  keyPoints?: readonly string[];
  /** What the recognizer heard. */
  transcript: string;
  /** The countdown ended while they were still talking. */
  cutOff?: boolean;
}

const ModelEvalSchema = z.object({
  answered: z.boolean().default(true),
  ideas: z
    .array(z.object({ idea: z.string().min(1), said: z.boolean() }))
    .default([]),
  rating: z.enum(['got', 'partial', 'missed']),
  tip: z.string().default(''),
});

export interface RecallEvaluation {
  rating: RecallRating;
  /** Ideas of the reference that were in the answer, in Spanish. */
  said: string[];
  /** Ideas that were not, in Spanish. */
  missing: string[];
  /** One short suggestion, in Spanish; may be empty. */
  tip: string;
  /** Whether what was said answers the question. */
  answered: boolean;
}

export type RecallEvalOutcome =
  | { kind: 'evaluated'; evaluation: RecallEvaluation; tokensUsed: number }
  /** Nothing to judge: no model call was made. */
  | { kind: 'empty' };

export type RecallEvalModel = (messages: { system: string; user: string }) => Promise<{ content: string; tokensUsed: number }>;

export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Whether there is an answer to send to the judge. */
export function isJudgeable(transcript: string): boolean {
  return wordCount(transcript) >= MIN_ANSWER_WORDS;
}

/** The drill text as prose: the " / " phrase marks are for the audio modes. */
function plainReference(reference: string): string {
  return reference.replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildRecallEvalMessages(input: RecallEvalInput): { system: string; user: string } {
  const system = `You are a friendly outside listener checking a spoken practice answer. A Spanish-speaking developer is rehearsing answers for job interviews in English: they see a question, answer aloud from memory, and you compare what they said with their prepared answer (the REFERENCE).

You judge the meaning, never the wording. You are NOT strict:
- Other words, another order, simpler English or a shorter answer are all fine. Never mention them as a problem.
- The ANSWER is speech recognition output: ignore grammar, missing punctuation and misheard words. A name or number that is close to the reference counts as said.
- If the question asks for one thing (one rule, one example) and the reference has several, one of them told with its concrete detail is a complete answer.
- If the reference is long, judge only its 2 to ${MAX_IDEAS} main ideas, not every sentence.
- An answer that was cut off by the timer is judged on what was said.

What you look at: did they touch the key ideas of the reference, is it the same story with its concrete proof (the numbers, the case), did they answer the question, would it convince an interviewer.

Return JSON only:
{
 "answered": true or false (did what they said answer the question),
 "ideas": [{"idea": "a main idea of the reference, one short line in Spanish", "said": true or false}],
 "rating": "got" | "partial" | "missed",
 "tip": "one short suggestion in rioplatense Spanish (vos), present tense, at most 25 words, no em dash; the most useful thing to add or fix next time. Empty string if nothing is worth adding."
}
Rules:
- "ideas": 2 to ${MAX_IDEAS} items, the ones that matter most for THIS question. Write each in Spanish; keep names, numbers and technical terms as in the reference.
- "got": they answered the question and the essential is there with something concrete. Missing a secondary idea is still "got".
- "partial": the right story but the essential is half there, or it has no concrete proof at all.
- "missed": they did not answer, said something else, or almost nothing of the reference is there.
- When in doubt between two grades, give the higher one.`;

  const points = (input.keyPoints ?? []).map((p) => p.trim()).filter(Boolean);
  const user = `QUESTION: ${input.question.trim()}

REFERENCE:
${plainReference(input.reference)}
${points.length ? `\nWHAT A COMPLETE ANSWER SAYS:\n${points.map((p) => `- ${p}`).join('\n')}\n` : ''}
ANSWER (speech recognition${input.cutOff ? ', cut off by the timer' : ''}):
${input.transcript.trim().slice(0, MAX_TRANSCRIPT_CHARS)}`;

  return { system, user };
}

/**
 * The grade that stands. The model's own, except where it contradicts what it
 * listed, and always resolved toward the learner:
 * - nothing of the reference said, or the question not answered with at most
 *   one idea: never "got";
 * - nothing said and not answered: "missed";
 * - answered with at least half the ideas: never "missed";
 * - answered with every idea: "got".
 */
export function settleRating(model: RecallRating, answered: boolean, saidCount: number, total: number): RecallRating {
  if (total === 0) return answered ? model : model === 'got' ? 'partial' : model;
  if (saidCount === 0) return answered && model !== 'missed' ? 'partial' : 'missed';
  if (answered && saidCount === total) return 'got';
  if (!answered) return model === 'got' ? 'partial' : model;
  if (model === 'missed' && saidCount * 2 >= total) return 'partial';
  return model;
}

/** Validate the model's JSON and settle the grade. Throws on anything malformed. */
export function parseRecallEvaluation(content: string): RecallEvaluation {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = ModelEvalSchema.parse(JSON.parse(fenced ? fenced[1] : content));
  const ideas = raw.ideas.map((i) => ({ idea: i.idea.trim(), said: i.said })).filter((i) => i.idea).slice(0, MAX_IDEAS);
  const said = ideas.filter((i) => i.said).map((i) => i.idea);
  const missing = ideas.filter((i) => !i.said).map((i) => i.idea);
  return {
    rating: settleRating(raw.rating, raw.answered, said.length, ideas.length),
    said,
    missing,
    tip: raw.tip.trim(),
    answered: raw.answered,
  };
}

/**
 * Judge one answer: at most one model call. An answer with nothing to judge
 * makes none. A model failure or a malformed reply throws; the caller falls
 * back to self-rating.
 */
export async function evaluateRecallAnswer(input: RecallEvalInput, model: RecallEvalModel): Promise<RecallEvalOutcome> {
  if (!isJudgeable(input.transcript)) return { kind: 'empty' };
  const { content, tokensUsed } = await model(buildRecallEvalMessages(input));
  return { kind: 'evaluated', evaluation: parseRecallEvaluation(content), tokensUsed };
}

/**
 * The interview's question and key points for a drill, from the lesson's
 * stored `interview` block (the first question linked to the drill wins,
 * as in drillAsksFromInterview). Anything malformed is skipped.
 */
export function drillQuestionFromInterview(raw: unknown, drill: string): { ask: string; keyPoints: string[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const list = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(list)) return null;
  for (const q of list) {
    if (!q || typeof q !== 'object') continue;
    const { drill: slug, ask, key_points } = q as { drill?: unknown; ask?: unknown; key_points?: unknown };
    if (slug !== drill || typeof ask !== 'string' || !ask.trim()) continue;
    const keyPoints = Array.isArray(key_points) ? key_points.filter((p): p is string => typeof p === 'string' && !!p.trim()) : [];
    return { ask: ask.trim(), keyPoints };
  }
  return null;
}

// ---------------------------------------------------------------------------
// The client side
// ---------------------------------------------------------------------------

/**
 * What the mode shows for a try:
 * - evaluated: the judge's grade and detail, the grade preselected;
 * - unheard: the recognizer caught nothing to judge, the learner rates;
 * - unavailable: no network, an error, a limit: the learner rates, as before.
 */
export type RecallJudgement =
  | { kind: 'evaluated'; evaluation: RecallEvaluation }
  | { kind: 'unheard' }
  | { kind: 'unavailable' };

const EvaluationSchema = z.object({
  rating: z.enum(['got', 'partial', 'missed']),
  said: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  tip: z.string().default(''),
  answered: z.boolean().default(true),
});

export const RECALL_EVAL_TIMEOUT_MS = 20_000;

/**
 * Ask the server to judge a try (POST /api/practice/recall-eval). Never
 * throws: every failure is `unavailable`, so the mode keeps working.
 */
export async function requestRecallJudgement(
  body: { resourceId: string; drill: string; transcript: string; cutOff?: boolean },
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<RecallJudgement> {
  if (!isJudgeable(body.transcript)) return { kind: 'unheard' };
  try {
    const timeout = AbortSignal.timeout(RECALL_EVAL_TIMEOUT_MS);
    const response = await fetcher('/api/practice/recall-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, transcript: body.transcript.slice(0, MAX_TRANSCRIPT_CHARS) }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!response.ok) return { kind: 'unavailable' };
    const data = (await response.json()) as { evaluation?: unknown; empty?: unknown };
    if (data.empty) return { kind: 'unheard' };
    return { kind: 'evaluated', evaluation: EvaluationSchema.parse(data.evaluation) };
  } catch {
    return { kind: 'unavailable' };
  }
}
