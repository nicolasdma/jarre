/**
 * Interview mock: who the interviewer is and how deep they go.
 *
 * Personas are data. Every lesson gets the defaults below; a lesson can add
 * its own (or override one by id) in the `interview` block of its JSON, which
 * scripts/seed-lesson.ts stores in `resources.interview`. Nothing about a
 * persona is hardcoded in a component: the voice prompt
 * (src/lib/llm/voice-tutor-session.ts) and the picker on the practice page both
 * read `resolveInterviewSetup`.
 */

import { z } from 'zod';

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
});

export const InterviewConfigSchema = z.object({
  /** The situation the mock rehearses (English): the company, the role, the call. */
  context: z.string().min(1).optional(),
  /** Persona selected by default. */
  default_persona: z.string().optional(),
  personas: z.array(InterviewPersonaSchema).default([]),
});

export type InterviewPersona = z.infer<typeof InterviewPersonaSchema>;
export type InterviewConfig = z.infer<typeof InterviewConfigSchema>;
export type InterviewDepth = 1 | 2 | 3;

export interface InterviewSetup {
  context: string | null;
  persona: InterviewPersona;
  depth: InterviewDepth;
  personas: InterviewPersona[];
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
  },
];

export const INTERVIEW_DEPTHS: Record<InterviewDepth, { label: string; blurb: string; questions: number; rule: string }> = {
  1: {
    label: 'Nivel 1',
    blurb: 'Preguntas directas, poca repregunta.',
    questions: 5,
    rule: 'Ask standard questions. Accept a reasonable answer and move on; at most one short follow-up in the whole interview.',
  },
  2: {
    label: 'Nivel 2',
    blurb: 'Repregunta cuando la respuesta queda vaga.',
    questions: 7,
    rule: 'When an answer is vague or misses a key point, ask one follow-up on that exact point before moving on.',
  },
  3: {
    label: 'Nivel 3',
    blurb: 'Va a fondo: bordes, fallas y por qué.',
    questions: 9,
    rule: 'Dig: after each answer, ask up to two follow-ups that push on edge cases, failure modes or the "why" behind the answer, before moving to a new topic.',
  },
};

function isDepth(value: unknown): value is InterviewDepth {
  return value === 1 || value === 2 || value === 3;
}

/** The lesson's interview block, validated. Anything invalid falls back to defaults. */
export function parseInterviewConfig(raw: unknown): InterviewConfig {
  const parsed = InterviewConfigSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : { personas: [] };
}

/** Lesson personas first (overriding a default with the same id), then the defaults. */
export function interviewPersonas(config: InterviewConfig): InterviewPersona[] {
  const own = config.personas;
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
  return {
    context: config.context ?? null,
    persona,
    depth: isDepth(choice.depth) ? choice.depth : 2,
    personas,
  };
}
