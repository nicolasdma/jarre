/**
 * Live-coding round: the lesson's coding problems, their exercises and the
 * mock interviewer.
 *
 * It lives in the lesson JSON under `interview.coding` (stored with the rest
 * of the interview block in `resources.interview`), because it is the
 * lesson's technical interview: the same problem feeds the code exercises
 * under its reading section and the timed mock with the AI interviewer.
 * Format documented in docs/lesson-format.md ("Coding round").
 *
 * Tests are TypeScript written against the candidate's file, as in a real
 * repo: `import { twoSum } from './solution'`, then `test(...)` with a small
 * Jest-like `expect` (src/lib/coding/harness.ts). They run in a Web Worker in
 * the browser and in-process in `scripts/verify-coding.ts`, which proves every
 * reference solution passes and every starter fails before a lesson is seeded.
 */

import { z } from 'zod';
import { LIVE_VOICES } from '../voice/live-models';

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits and dashes');

export const CodingExerciseSchema = z.object({
  id: slug,
  /**
   * `guided`: the plan and the shape are there, a piece is missing (TODOs).
   * `blank`: the signature only, as in the interview.
   */
  level: z.enum(['guided', 'blank']),
  title: z.string().min(1),
  /** What to do, in the learner's language (markdown allowed). */
  instructions: z.string().min(1),
  /** The file the editor opens with. */
  starter: z.string().min(1),
});

/** One Big-O question: the right answer among the options, and why in one line. */
export const BigOAnswerSchema = z
  .object({
    /** As written on screen, e.g. "O(n log n)". */
    answer: z.string().min(1),
    /** What the learner picks from (the answer among them). */
    options: z.array(z.string().min(1)).min(2).max(6),
    /** Why, in one line (learner's language). */
    why: z.string().min(1),
  })
  .superRefine((a, ctx) => {
    if (!a.options.includes(a.answer)) ctx.addIssue({ code: 'custom', message: `answer ${a.answer} is not one of the options` });
  });

/**
 * "What's the time and space complexity?": the step after a code exercise
 * passes, and each item of the lesson's Big-O drill. The learner picks or
 * says time and space (and the brute force's time, when it is different),
 * then sees the answers with their reasons and the sentence to say aloud.
 */
export const ComplexityCheckSchema = z.object({
  time: BigOAnswerSchema,
  space: BigOAnswerSchema,
  /** The brute force, when it costs something else: its time (asked), its space and what the optimization removes. */
  brute: z.object({ time: BigOAnswerSchema, space: z.string().min(1), why: z.string().min(1) }).optional(),
  /** The answer as said on the call (English, " / " breath marks allowed). */
  say: z.string().min(1),
  /** The lesson drill with that sentence and its recording. */
  drill: z.string().optional(),
});

/** One fragment of the Big-O drill: code to read and say the complexity of. */
export const ComplexityDrillItemSchema = ComplexityCheckSchema.extend({
  id: slug,
  title: z.string().min(1),
  /** The fragment (TypeScript). */
  code: z.string().min(1),
});

export const ComplexityDrillSchema = z.object({
  /** Lesson concept whose reading section shows the drill. */
  concept: z.string().min(1),
  title: z.string().min(1),
  /** What to do (learner's language, markdown allowed). */
  instructions: z.string().min(1),
  items: z.array(ComplexityDrillItemSchema).min(1),
});

export const CodingProblemSchema = z.object({
  id: slug,
  title: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  /** The pattern it practices, e.g. "Hash map", "Sliding window". */
  pattern: z.string().min(1),
  /**
   * `core`: the lesson asks to write it from a blank page; `safety_net`: read
   * it and say its complexity. The mock labels each card. Absent: the lesson
   * does not tier its problems.
   */
  tier: z.enum(['core', 'safety_net']).optional(),
  /**
   * The lesson never shows it (no reading section, no exercises): it exists
   * for the mock, where the problem of a real round is new. The mock lists
   * these first, starts on one not tried yet, and hides its title and pattern
   * until then. A flag of its own, not a tier: a build from before it reads
   * the lesson unchanged (it drops the key) instead of rejecting the tier.
   */
  unseen: z.boolean().optional(),
  /** Lesson concept whose reading section shows the exercises. */
  concept: z.string().optional(),
  /** Minutes the interviewer budgets for it in the mock. */
  minutes: z.number().int().min(5).max(60).default(30),
  /** The prompt as the interviewer says it on the call (English). */
  statement: z.string().min(1),
  /** Examples shown with the statement: display strings. */
  examples: z
    .array(z.object({ input: z.string().min(1), output: z.string().min(1), note: z.string().optional() }))
    .default([]),
  /** Constraints shown once the candidate asks, or always for the exercises (English). */
  constraints: z.array(z.string().min(1)).default([]),
  /**
   * What the interviewer answers when asked (English): the hidden facts. A
   * question the list does not cover gets the standard answer for the problem.
   */
  clarifications: z.array(z.object({ topic: z.string().min(1), answer: z.string().min(1) })).default([]),
  /** Names the tests import from './solution'. */
  exports: z.array(z.string().regex(/^[A-Za-z_$][\w$]*$/)).min(1),
  /** The mock's starting file: the signature only. */
  starter: z.string().min(1),
  /**
   * The starting file in the pad's other languages, when the generated one
   * does not fit (src/lib/coding/languages.ts derives JavaScript by stripping
   * types and Python from the signature). Optional; the tests stay TypeScript.
   */
  starters: z.object({ javascript: z.string().min(1).optional(), python: z.string().min(1).optional() }).optional(),
  /** Visible tests (the examples), run by "Probar ejemplos". */
  example_tests: z.string().min(1),
  /** Hidden tests: edges and scale, run at the end of the mock and in the exercises. */
  tests: z.string().min(1),
  /** Graded hints, weakest first (English): a question, then a direction, then the step. */
  hints: z.array(z.string().min(1)).min(1).max(5),
  /** Follow-ups a senior interviewer pushes once there is a working answer (English). */
  follow_ups: z.array(z.string().min(1)).min(1),
  /** What the engineer watches for at senior level (English): the rubric signals. */
  senior_signals: z.array(z.string().min(1)).default([]),
  /** Wrong turns candidates take (English). */
  pitfalls: z.array(z.string().min(1)).default([]),
  solution: z.object({
    /** The brute force and the optimal idea, as the interviewer knows them (English). */
    approach: z.string().min(1),
    time: z.string().min(1),
    space: z.string().min(1),
    code: z.string().min(1),
  }),
  exercises: z.array(CodingExerciseSchema).default([]),
  /** The complexity step after an exercise passes; also what the interviewer expects to hear. */
  complexity: ComplexityCheckSchema.optional(),
});

export const CodingPersonaSchema = z.object({
  name: z.string().min(1),
  /** Who they are, as the model plays them (English). */
  role: z.string().min(1),
  /** How they talk (English). */
  tone: z.string().min(1),
  /** The voice they speak with (LIVE_VOICES). Default: the male voice. */
  voice: z.enum(LIVE_VOICES).default('Charon'),
});

/** A phase of the round, for the on-screen guide. Times are fractions of the session. */
export const CodingPhaseSchema = z.object({
  id: slug,
  title: z.string().min(1),
  /** Start and end as a fraction of the session (0..1). */
  from: z.number().min(0).max(1),
  to: z.number().min(0).max(1),
  /** What to do in this phase (learner's language). */
  what: z.string().min(1),
  /** Drill with the phrases for this phase: its text, cut at " / ", is the list. */
  drill: z.string().optional(),
});

export const CodingConfigSchema = z
  .object({
    /** The round being rehearsed (English): format, length, what they score. */
    context: z.string().min(1),
    interviewer: CodingPersonaSchema,
    /** Session length of the mock, minutes. */
    minutes: z.number().int().min(10).max(60).default(30),
    phases: z.array(CodingPhaseSchema).default([]),
    /** Drill slugs with the phrases for being stuck and asking for help. */
    stuck_drills: z.array(z.string()).default([]),
    problems: z.array(CodingProblemSchema).min(1),
    /** "Say the Big-O": code fragments under a reading section, each answered aloud. */
    complexity_drill: ComplexityDrillSchema.optional(),
  })
  .superRefine((c, ctx) => {
    const dup = (ids: string[]) => ids.find((id, i) => ids.indexOf(id) !== i);
    const p = dup(c.problems.map((x) => x.id));
    if (p) ctx.addIssue({ code: 'custom', message: `duplicate coding problem id ${p}` });
    const e = dup(c.problems.flatMap((x) => x.exercises.map((ex) => ex.id)));
    if (e) ctx.addIssue({ code: 'custom', message: `duplicate coding exercise id ${e}` });
    const items = c.complexity_drill?.items.map((x) => x.id) ?? [];
    const i = dup(items);
    if (i) ctx.addIssue({ code: 'custom', message: `duplicate complexity drill item ${i}` });
    for (const phase of c.phases) {
      if (phase.to <= phase.from) ctx.addIssue({ code: 'custom', message: `phase ${phase.id}: "to" must be after "from"` });
    }
  });

export type CodingExercise = z.infer<typeof CodingExerciseSchema>;
export type CodingProblem = z.infer<typeof CodingProblemSchema>;
export type CodingPersona = z.infer<typeof CodingPersonaSchema>;
export type CodingPhase = z.infer<typeof CodingPhaseSchema>;
export type CodingConfig = z.infer<typeof CodingConfigSchema>;
export type BigOAnswer = z.infer<typeof BigOAnswerSchema>;
export type ComplexityCheck = z.infer<typeof ComplexityCheckSchema>;
export type ComplexityDrillItem = z.infer<typeof ComplexityDrillItemSchema>;
export type ComplexityDrill = z.infer<typeof ComplexityDrillSchema>;

/** The coding round of a stored interview block, or null when it has none or it is invalid. */
export function parseCodingConfig(interview: unknown): CodingConfig | null {
  if (!interview || typeof interview !== 'object') return null;
  const raw = (interview as Record<string, unknown>).coding;
  if (!raw) return null;
  const parsed = CodingConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** The example tests and the hidden ones, as separate files: each declares its own helpers. */
export function allTestsOf(problem: Pick<CodingProblem, 'example_tests' | 'tests'>): string[] {
  return [problem.example_tests, problem.tests];
}

export function findProblem(config: CodingConfig, problemId: string): CodingProblem | null {
  return config.problems.find((p) => p.id === problemId) ?? null;
}
