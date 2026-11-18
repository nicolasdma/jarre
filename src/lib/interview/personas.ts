/**
 * Interview mock: who the interviewer is and how deep they go.
 *
 * Personas are data. Every lesson gets the defaults below; a lesson can add
 * its own (or override one by id) in the `interview` block of its JSON, which
 * scripts/seed-lesson.ts stores in `resources.interview`. Nothing about a
 * persona is hardcoded in a component: the voice prompt
 * (src/lib/llm/voice-tutor-session.ts) and the picker on the practice page both
 * read `resolveInterviewSetup`.
 *
 * Questions are data too (`questions` in the block, plus the default
 * curveballs below). Each one carries the key points a good answer has and the
 * misconceptions to catch, so feedback is checked against a list instead of
 * the model's impression. The owner's first real mock (2026-11-11) praised two
 * wrong mechanisms as "spot on" because the prompt had only the lesson text;
 * audit in docs/research/2026-11-11-interview-mock-audit.md.
 */

import { z } from 'zod';
import { KeyTermEntrySchema, keyTermName } from '../practice/key-terms';
import { CodingConfigSchema } from '../coding/format';

export const InterviewPersonaSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  /** Name the interviewer uses on the call. */
  name: z.string().min(1),
  /** Short label for the picker, in the learner's language. */
  label: z.string().min(1),
  /** One line under the label in the picker. */
  blurb: z.string().min(1),
  /** Who they are, as the model should play them (English). */
  role: z.string().min(1),
  /** How they talk (English). */
  tone: z.string().min(1),
  /** What they ask about first and most (English). */
  focus: z.string().min(1),
  /** What makes them push back or dig (English). */
  pushback: z.string().min(1),
  /** How technical they are: shapes vocabulary and question choice. */
  technical: z.enum(['low', 'medium', 'high']),
  /**
   * `tough`: cuts in on vague answers ("Sorry, be specific: how many
   * seconds?"), throws more curveballs and praises only complete answers.
   */
  toughness: z.enum(['standard', 'tough']).default('standard'),
});

/**
 * A question the interviewer can ask, with what a good answer contains.
 * - core: a main topic of the lesson.
 * - must_know: something the candidate has to know by heart (a list, a date);
 *   scored item by item against `key_points`, ideally the canonical drill.
 * - curveball: an unexpected but realistic question (price, risk, process,
 *   a what-if), thrown a few times per interview, more at higher depth.
 */
export const InterviewQuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  kind: z.enum(['core', 'must_know', 'curveball']),
  /** How the interviewer might ask it (English); they rephrase it in their voice. */
  ask: z.string().min(1),
  /** The lesson concept it tests, or `deal` / `process` for call logistics. */
  tests: z.string().min(1),
  /** What a complete answer says (English, short). Feedback names the missing ones. */
  key_points: z.array(z.string().min(1)).min(1),
  /** Wrong claims a half-prepared candidate makes, each with the right version (English). */
  misconceptions: z.array(z.string().min(1)).default([]),
  /** Drill slug with the prepared answer, for the report's "practice next". */
  drill: z.string().optional(),
});

export const InterviewConfigSchema = z.object({
  /**
   * What the mock rehearses. `interview` (default): a job or client call.
   * `presentation`: the learner gives a short talk first, then the audience
   * asks a few questions about it (owner, 2026-11-17: a 5-minute talk with 2
   * slides to defend at work). A presentation uses only the lesson's own
   * personas and curveballs: the defaults are freelance-call people and
   * questions (price, Upwork, NDA) that make no sense after a talk.
   */
  mode: z.enum(['interview', 'presentation']).default('interview'),
  /** The situation the mock rehearses (English): the company, the role, the call. */
  context: z.string().min(1).optional(),
  /** Persona selected by default. */
  default_persona: z.string().optional(),
  personas: z.array(InterviewPersonaSchema).default([]),
  /**
   * Names and terms the candidate must say so a native listener recognizes them.
   * A bare string, or an object with the recognizer's sound-alikes and a
   * respelling for the drill practice (src/lib/practice/key-terms.ts).
   */
  key_terms: z.array(KeyTermEntrySchema).default([]),
  /** The lesson's question bank; a curveball with a default's id overrides it. */
  questions: z.array(InterviewQuestionSchema).default([]),
  /**
   * The interviewer's English question for a drill, by drill slug: what
   * Pregunta → respuesta shows (src/lib/practice/recall.ts). Wins over the ask
   * of a question linked to the drill; a drill with neither falls back to its
   * title. It is never asked by the voice interviewer.
   */
  drill_asks: z.record(z.string(), z.string().min(1)).optional(),
  /**
   * The live-coding round: problems with tests, their code exercises and the
   * timed mock with the AI interviewer (src/lib/coding/format.ts).
   */
  coding: CodingConfigSchema.optional(),
});

export type InterviewPersona = z.infer<typeof InterviewPersonaSchema>;
export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type InterviewConfig = z.infer<typeof InterviewConfigSchema>;
export type InterviewDepth = 1 | 2 | 3;

export interface InterviewSetup {
  mode: InterviewConfig['mode'];
  context: string | null;
  persona: InterviewPersona;
  depth: InterviewDepth;
  personas: InterviewPersona[];
  /** Core and must-know questions of the lesson. */
  questions: InterviewQuestion[];
  /** Every curveball available (lesson first, then the defaults). */
  curveballs: InterviewQuestion[];
  keyTerms: string[];
  /** How many curveballs this interview throws (depth and toughness). */
  curveballCount: number;
}

/** Interviewers any lesson can use. Lesson personas come first in the picker. */
export const DEFAULT_INTERVIEW_PERSONAS: InterviewPersona[] = [
  {
    id: 'recruiter',
    name: 'Alex',
    label: 'Recruiter curioso',
    blurb: 'No técnico: quiere entenderte, ve claridad y experiencia.',
    role: 'a friendly, non-technical recruiter screening candidates before the technical round',
    tone: 'warm, curious, conversational; asks you to explain things in plain words',
    focus: 'your background, relevant experience, why you fit, availability, how you work and communicate; technical topics only at the level of "explain it to me simply"',
    pushback: 'jargon without explanation, vague claims of experience with no concrete example, answers longer than a minute',
    technical: 'low',
    toughness: 'standard',
  },
  {
    id: 'tech-lead',
    name: 'Jordan',
    label: 'Líder técnico',
    blurb: 'Pregunta cómo lo harías y por qué, con algún repregunte.',
    role: 'the tech lead who would review your code, checking you can actually build what the job needs',
    tone: 'direct, collegial, efficient',
    focus: 'how you would implement the key parts of the lesson, the order of the work, the tradeoffs you chose',
    pushback: 'hand-waving over the mechanism, wrong technical details, skipping how you would test it',
    technical: 'high',
    toughness: 'standard',
  },
  {
    id: 'expert',
    name: 'Morgan',
    label: 'Experto exigente',
    blurb: 'Va a los bordes: fallas, casos raros, por qué no otra opción.',
    role: 'a senior engineer and domain expert who digs into failure modes and edge cases',
    tone: 'calm, precise, skeptical; never hostile, never satisfied by the happy path',
    focus: 'edge cases, failure modes, security holes, race conditions, time zones, money rounding, what breaks in production and how you would notice',
    pushback: 'any claim without the mechanism behind it, ignoring a failure mode, overstating what the frontend can guarantee',
    technical: 'high',
    toughness: 'standard',
  },
  {
    id: 'worried-client',
    name: 'Taylor',
    label: 'Cliente preocupado',
    blurb: 'Le preocupan el riesgo, las fechas y la plata.',
    role: 'a client who was burned by a previous developer and is worried about risk, deadlines and money',
    tone: 'polite but anxious; asks "what if" a lot and wants reassurance backed by specifics',
    focus: 'what could go wrong, whether you can hit the timeline, what happens if a milestone slips, how money and payments are protected, how you report progress',
    pushback: 'promises without a plan, optimistic dates, answers that dodge the risk instead of naming it and how you handle it',
    technical: 'low',
    toughness: 'standard',
  },
  {
    id: 'skeptical-client',
    name: 'Riley',
    label: 'Cliente escéptico',
    blurb: 'Te corta si sos vago, desconfía y tira preguntas incómodas.',
    role: 'a skeptical client who has interviewed many freelancers this week and assumes you are overselling until you prove otherwise',
    tone: 'short, dry, impatient with filler; interrupts vague answers; polite but never warm until you earn it',
    focus: 'proof that you have done this before, exact mechanisms and numbers, risk, price and scope, what happens when things go wrong',
    pushback: 'filler ("basically", "so yeah"), answers without a number or a mechanism, guarantees nobody can give, dodging a risk, not knowing the plan by heart',
    technical: 'medium',
    toughness: 'tough',
  },
  {
    id: 'relaxed-founder',
    name: 'Sam',
    label: 'Founder relajado',
    blurb: 'Charla distendida, pero escucha si entendiste el proyecto.',
    role: 'a relaxed startup founder who wants to know if working with you will be easy',
    tone: 'friendly, informal, a bit of small talk; listens closely while sounding casual',
    focus: 'whether you understand the product, how you would explain the plan, how you work day to day, next steps',
    pushback: 'not understanding the product, overcomplicating things, not asking anything back',
    technical: 'medium',
    toughness: 'standard',
  },
];

export const INTERVIEW_DEPTHS: Record<
  InterviewDepth,
  { label: string; blurb: string; questions: number; curveballs: number; rule: string }
> = {
  1: {
    label: 'Nivel 1',
    blurb: 'Preguntas directas, una sorpresa, poca repregunta.',
    questions: 6,
    curveballs: 1,
    rule: 'Ask standard questions. Accept a reasonable answer and move on; at most one short follow-up in the whole interview.',
  },
  2: {
    label: 'Nivel 2',
    blurb: 'Repregunta sobre lo que dijiste y tira dos sorpresas.',
    questions: 10,
    curveballs: 2,
    rule: 'Alternate: after the answer to a new topic, your next question is a follow-up on THAT answer, built on the candidate\'s OWN words: quote what they said and push on it ("You said X. What happens if Y?"). Change topic only after that follow-up is answered. A vague answer always gets a follow-up that asks for the exact missing thing.',
  },
  3: {
    label: 'Nivel 3',
    blurb: 'Te corta si sos vago, va a los bordes y tira cuatro sorpresas.',
    questions: 12,
    curveballs: 4,
    rule: 'Dig: after each answer, ask up to two follow-ups built on the candidate\'s own words that push on edge cases, failure modes or the "why", before moving to a new topic. If an answer is vague (no mechanism, no number, filler), cut in right away: "Sorry, be specific: ..." with the exact thing missing (how many seconds, who verifies it, which week).',
  },
};

/**
 * Curveballs any lesson can use: realistic things a client asks on a first
 * call that a technical study plan does not cover. A lesson adds its own (or
 * overrides one by id) in `questions`.
 */
export const DEFAULT_CURVEBALLS: InterviewQuestion[] = [
  {
    id: 'cb-rate',
    kind: 'curveball',
    ask: 'Your price is lower than some proposals I got. Why should that not worry me? (or: why is it higher?)',
    tests: 'deal',
    key_points: [
      'the price is the one agreed for the posted scope, said calmly without apologizing or renegotiating on the call',
      'the value is concrete: what they get each week and proof of having done it before',
      'anything outside the posted scope is quoted as a separate milestone',
    ],
    misconceptions: ['dropping or raising the price on the spot to win the deal: hold the posted price and scope'],
  },
  {
    id: 'cb-see-code',
    kind: 'curveball',
    ask: 'Can I see some code you wrote? Can you share your screen and show me something right now?',
    tests: 'process',
    key_points: [
      'yes: points to a public repository or a portfolio piece',
      'client work belongs to the client and stays private, but offers to walk through how it worked',
      'never shares a client\'s private code',
    ],
    misconceptions: ['sharing a previous client\'s private repository to prove experience: that breaks that client\'s trust'],
  },
  {
    id: 'cb-ai',
    kind: 'curveball',
    ask: 'Do you use AI to write code? The posting says no low-code tools.',
    tests: 'process',
    key_points: [
      'honest: uses AI assistants for repetitive parts',
      'designs the architecture, reviews and tests every change',
      'custom code in their repository, no low-code or no-code tools',
    ],
    misconceptions: ['denying any AI use, or saying the AI writes the project: both sound untrustworthy'],
  },
  {
    id: 'cb-off-platform',
    kind: 'curveball',
    ask: 'Could we move this off Upwork to save the fees? I can pay you directly.',
    tests: 'deal',
    key_points: [
      'politely keeps everything on Upwork',
      'Upwork protects both sides (payment protection, milestones, records)',
      'moving off the platform before a contract breaks its terms',
    ],
    misconceptions: ['accepting to go off the platform: it loses payment protection and breaks the platform\'s terms'],
  },
  {
    id: 'cb-sick',
    kind: 'curveball',
    ask: 'What happens if you get sick, or something happens and you miss a delivery day?',
    tests: 'process',
    key_points: [
      'tells the client the same day, not on the delivery day',
      'gives a new date and what is already done, so nothing is hidden',
      'the weekly deliveries keep the code in the client\'s repository, so the work is never lost',
    ],
    misconceptions: ['promising it will never happen instead of saying how it is handled'],
  },
  {
    id: 'cb-agency',
    kind: 'curveball',
    ask: 'Why should I pick you over an agency with a whole team?',
    tests: 'deal',
    key_points: [
      'one person who writes all the code and talks to the client directly',
      'proof: a similar project already shipped',
      'weekly deliveries so the client always sees progress',
    ],
    misconceptions: [],
  },
  {
    id: 'cb-nda-ip',
    kind: 'curveball',
    ask: 'Will you sign an NDA? And who owns the code at the end?',
    tests: 'deal',
    key_points: [
      'yes to the NDA',
      'the client owns the code and all intellectual property once paid; the repository is theirs from day one',
    ],
    misconceptions: ['keeping the code in the developer\'s own accounts until the end'],
  },
  {
    id: 'cb-daily-calls',
    kind: 'curveball',
    ask: 'Would you be available for a daily call with me?',
    tests: 'process',
    key_points: [
      'yes, flexible, with the time zone difference stated',
      'proposes a light rhythm (a short written update, calls when useful) so the work keeps moving',
    ],
    misconceptions: [],
  },
];

/** Curveballs thrown per interview: by depth, one more for a tough persona. */
export function curveballCountFor(depth: InterviewDepth, persona: InterviewPersona): number {
  return INTERVIEW_DEPTHS[depth].curveballs + (persona.toughness === 'tough' ? 1 : 0);
}

/**
 * Pick `count` curveballs at random (lesson ones weigh double), so two
 * interviews never surprise the same way. `random` is injectable for tests.
 */
export function pickCurveballs(
  curveballs: InterviewQuestion[],
  count: number,
  lessonIds: ReadonlySet<string>,
  random: () => number = Math.random,
): InterviewQuestion[] {
  const pool = curveballs.map((q) => ({ q, key: random() / (lessonIds.has(q.id) ? 2 : 1) }));
  return pool
    .sort((a, b) => a.key - b.key)
    .slice(0, Math.max(0, count))
    .map((x) => x.q);
}

function isDepth(value: unknown): value is InterviewDepth {
  return value === 1 || value === 2 || value === 3;
}

/** The lesson's interview block, validated. Anything invalid falls back to defaults. */
export function parseInterviewConfig(raw: unknown): InterviewConfig {
  const parsed = InterviewConfigSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : { mode: 'interview', personas: [], key_terms: [], questions: [] };
}

/**
 * Lesson personas first (overriding a default with the same id), then the
 * defaults. A presentation with its own personas uses only those.
 */
export function interviewPersonas(config: InterviewConfig): InterviewPersona[] {
  const own = config.personas;
  if (config.mode === 'presentation' && own.length > 0) return own;
  const ownIds = new Set(own.map((p) => p.id));
  return [...own, ...DEFAULT_INTERVIEW_PERSONAS.filter((p) => !ownIds.has(p.id))];
}

export function resolveInterviewSetup(
  raw: unknown,
  choice: { personaId?: string | null; depth?: number | null } = {},
): InterviewSetup {
  const config = parseInterviewConfig(raw);
  const personas = interviewPersonas(config);
  const persona =
    personas.find((p) => p.id === choice.personaId) ??
    personas.find((p) => p.id === config.default_persona) ??
    personas[0];
  const depth: InterviewDepth = isDepth(choice.depth) ? choice.depth : 2;
  const ownCurveballs = config.questions.filter((q) => q.kind === 'curveball');
  const ownIds = new Set(ownCurveballs.map((q) => q.id));
  const presentation = config.mode === 'presentation';
  const curveballs = presentation ? ownCurveballs : [...ownCurveballs, ...DEFAULT_CURVEBALLS.filter((q) => !ownIds.has(q.id))];
  return {
    mode: config.mode,
    context: config.context ?? null,
    persona,
    depth,
    personas,
    questions: config.questions.filter((q) => q.kind !== 'curveball'),
    curveballs,
    keyTerms: config.key_terms.map(keyTermName),
    curveballCount: Math.min(curveballCountFor(depth, persona), presentation ? curveballs.length : Infinity),
  };
}
