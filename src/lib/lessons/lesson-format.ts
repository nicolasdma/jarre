/**
 * Lesson JSON contract and its mapping onto the content tables.
 *
 * A lesson is a hand-written resource (concepts, sections, inline quizzes,
 * open questions, review cards and spoken drills) loaded by
 * `scripts/seed-lesson.ts`. Format documented in `docs/lesson-format.md`.
 *
 * Everything here is pure so it can be tested without a database.
 */

import { createHash } from 'node:crypto';
import { z } from 'zod';
import { InterviewConfigSchema } from '../interview/personas';
import { drillPhrases, segmentsFit } from '../practice/phrase-segments';

const PHASES = ['0', '1', '1.5', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] as const;
const TRACKS = ['ai', 'travel', 'aventura'] as const;
const CARD_TYPES = ['recall', 'fill_blank', 'true_false', 'connect', 'scenario_micro'] as const;
const QUESTION_TYPES = [
  'definition', 'fact', 'property', 'guarantee', 'complexity', 'comparison',
  'scenario', 'limitation', 'error_spot',
] as const;

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits and dashes');

const QuizSchema = z.object({
  format: z.enum(['mc', 'tf']),
  after_heading: z.string().nullable().optional(),
  question: z.string().min(1),
  /** mc: the option texts, in order. tf: omitted. */
  options: z.array(z.string().min(1)).min(2).max(6).optional(),
  /** mc: 0-based index into `options`. tf: true or false. */
  correct: z.union([z.number().int().min(0), z.boolean()]),
  explanation: z.string().min(1),
  justification_hint: z.string().optional(),
}).superRefine((q, ctx) => {
  if (q.format === 'mc') {
    if (!q.options) ctx.addIssue({ code: 'custom', message: 'mc quiz needs options' });
    else if (typeof q.correct !== 'number' || q.correct >= q.options.length) {
      ctx.addIssue({ code: 'custom', message: 'mc quiz `correct` must be an index into options' });
    }
  } else if (typeof q.correct !== 'boolean') {
    ctx.addIssue({ code: 'custom', message: 'tf quiz `correct` must be true or false' });
  }
});

const OpenQuestionSchema = z.object({
  question: z.string().min(1),
  expected_answer: z.string().min(1),
  difficulty: z.number().int().min(1).max(3).default(2),
  type: z.enum(QUESTION_TYPES).default('definition'),
});

const CardSchema = z.object({
  type: z.enum(CARD_TYPES),
  /** recall: a string (the prompt). Other types: the stored front_content object. */
  front: z.union([z.string().min(1), z.record(z.string(), z.unknown())]),
  /** recall: a string (the answer). Other types: the stored back_content object. */
  back: z.union([z.string().min(1), z.record(z.string(), z.unknown())]),
  difficulty: z.number().int().min(1).max(3).default(1),
}).superRefine((c, ctx) => {
  if (c.type !== 'recall' && (typeof c.front === 'string' || typeof c.back === 'string')) {
    ctx.addIssue({ code: 'custom', message: `${c.type} cards need front/back objects (see docs/lesson-format.md)` });
  }
});

const ConceptSchema = z.object({
  id: slug,
  name: z.string().min(1),
  definition: z.string().min(1),
  section: z.object({ title: z.string().min(1), markdown: z.string().min(1) }),
  quizzes: z.array(QuizSchema).default([]),
  open: z.array(OpenQuestionSchema).default([]),
  cards: z.array(CardSchema).default([]),
});

const DrillSchema = z.object({
  // Also the audio file name, so case is kept (e.g. 09-bloqueo-F12).
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'letters, digits, dashes and underscores'),
  title: z.string().min(1),
  priority: z.number().int(),
  text_en: z.string().min(1),
  text_es: z.string().nullable().optional(),
  audio: z.string().nullable().optional(),
  /**
   * The lesson concept this drill practices: the learn view shows it under
   * that section. Absent for drills not tied to one concept (the plan by
   * heart, useful phrases), which the learn view groups as "De memoria".
   */
  concept: z.string().optional(),
  /**
   * Where each phrase (" / ") sits in the audio, in seconds: one per phrase,
   * in order. Usually not written by hand: scripts/align-drill-segments.ts
   * writes them next to the audio and seed-lesson.ts reads them from there.
   */
  segments: z.array(z.object({ start: z.number().min(0), end: z.number().positive() })).optional(),
});

export const LessonSchema = z.object({
  id: slug,
  track: z.enum(TRACKS),
  phase: z.enum(PHASES).default('1'),
  title: z.string().min(1),
  description: z.string().min(1),
  language: z.string().default('es'),
  activate: z.object({
    summary: z.string(),
    sections: z.array(z.object({ number: z.number().int(), title: z.string(), description: z.string() })),
    keyConcepts: z.array(z.string()),
    insight: z.string(),
  }).optional(),
  /** Interview mock: the situation and the lesson's own interviewer personas. `null` clears it. */
  interview: InterviewConfigSchema.nullable().optional(),
  concepts: z.array(ConceptSchema).min(1),
  drills: z.array(DrillSchema).default([]),
}).superRefine((l, ctx) => {
  const dup = (ids: string[]) => ids.find((id, i) => ids.indexOf(id) !== i);
  const c = dup(l.concepts.map((x) => x.id));
  if (c) ctx.addIssue({ code: 'custom', message: `duplicate concept id ${c}` });
  const d = dup(l.drills.map((x) => x.id));
  if (d) ctx.addIssue({ code: 'custom', message: `duplicate drill id ${d}` });
  const conceptIds = new Set(l.concepts.map((c) => c.id));
  const drillIds = new Set(l.drills.map((x) => x.id));
  const coding = l.interview?.coding;
  for (const p of coding?.problems ?? []) {
    if (p.complexity?.drill && !drillIds.has(p.complexity.drill)) {
      ctx.addIssue({ code: 'custom', message: `coding problem ${p.id}: complexity drill ${p.complexity.drill} is not a drill of the lesson` });
    }
  }
  if (coding?.complexity_drill && !conceptIds.has(coding.complexity_drill.concept)) {
    ctx.addIssue({ code: 'custom', message: `complexity drill: unknown concept ${coding.complexity_drill.concept}` });
  }
  for (const drill of l.drills) {
    if (drill.concept && !conceptIds.has(drill.concept)) {
      ctx.addIssue({ code: 'custom', message: `drill ${drill.id}: unknown concept ${drill.concept}` });
    }
    if (drill.segments && !segmentsFit(drill.text_en, drill.segments)) {
      ctx.addIssue({
        code: 'custom',
        message: `drill ${drill.id}: segments need one {start, end} per phrase (${drillPhrases(drill.text_en).length}), in order, not overlapping`,
      });
    }
  }
});

export type Lesson = z.infer<typeof LessonSchema>;
export type LessonConcept = Lesson['concepts'][number];
export type LessonQuiz = LessonConcept['quizzes'][number];
export type LessonCard = LessonConcept['cards'][number];

/**
 * Stable UUID from a key, so re-seeding updates rows in place instead of
 * duplicating them (and review_schedule rows keep pointing at the same card).
 */
export function stableUuid(key: string): string {
  const h = createHash('sha1').update(`jarre-lesson:${key}`).digest('hex');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * The learn view splits sections at bold-line headings (`**Heading**`, see
 * `src/lib/markdown-splitter.ts`) and anchors inline quizzes to them. Lesson
 * authors write ATX headings (`## Heading`), so they are rewritten to the
 * bold form the renderer and the pipeline content use.
 */
export function normalizeSectionMarkdown(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => {
      const m = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
      return m ? `**${m[1].replace(/\*\*/g, '')}**` : line;
    })
    .join('\n');
}

/** Bold headings of normalized markdown, in order. */
export function sectionHeadings(markdown: string): string[] {
  return markdown
    .split('\n')
    .map((line) => line.trim().match(/^\*\*(.+?)\*\*$/)?.[1])
    .filter((h): h is string => Boolean(h));
}

/**
 * Where a quiz sits in its section. `after_heading` must name one of the
 * section's headings; null puts it at the end (after the last heading).
 */
export function resolveQuizHeading(quiz: LessonQuiz, headings: string[]): string {
  if (headings.length === 0) {
    throw new Error('Section has no headings: inline quizzes need at least one "## Heading"');
  }
  if (!quiz.after_heading) return headings[headings.length - 1];
  const wanted = quiz.after_heading.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
  const hit = headings.find((h) => h === wanted) ?? headings.find((h) => h.toLowerCase() === wanted.toLowerCase());
  if (!hit) throw new Error(`after_heading "${quiz.after_heading}" is not a heading of its section`);
  return hit;
}

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** inline_quizzes row shape: options [{label,text}], correct_answer 'B' or 'true'. */
export function mapQuiz(quiz: LessonQuiz): { options: { label: string; text: string }[] | null; correct_answer: string } {
  if (quiz.format === 'tf') return { options: null, correct_answer: String(quiz.correct) };
  const options = (quiz.options ?? []).map((text, i) => ({ label: LABELS[i], text }));
  return { options, correct_answer: LABELS[quiz.correct as number] };
}

/** concept_cards front/back: recall is {prompt} / {definition}; other types pass through. */
export function mapCard(card: LessonCard): { front_content: Record<string, unknown>; back_content: Record<string, unknown> } {
  return {
    front_content: typeof card.front === 'string' ? { prompt: card.front } : card.front,
    back_content: typeof card.back === 'string' ? { definition: card.back } : card.back,
  };
}

/** Storage object path of a drill's audio inside the `lesson-audio` bucket. */
export function drillAudioPath(resourceId: string, drillId: string): string {
  return `${resourceId}/${drillId}.m4a`;
}

/** Phrase timings for one drill's audio, written next to it by scripts/align-drill-segments.ts. */
export interface DrillSegmentsFile {
  version: 1;
  drill: string;
  /** The drill text they were aligned to: a re-written text makes them stale. */
  text: string;
  /** The audio they were measured on: a re-recorded file makes them stale. */
  audio: { sha1: string; duration: number };
  asr: string;
  segments: { start: number; end: number; text: string }[];
  boundaries?: unknown[];
}

/** `<dir>/<name>.m4a` → `<dir>/<name>.segments.json`. */
export function segmentsSidecarPath(audioPath: string): string {
  return audioPath.replace(/\.[^./\\]+$/, '') + '.segments.json';
}

/**
 * The segments to store for a drill: its own `segments` when the lesson has
 * them, else the sidecar's when it was made from this text and this audio
 * file. Null (with the reason) when there are none that fit.
 */
export function drillSegments(
  drill: { text_en: string; segments?: { start: number; end: number }[] },
  sidecar: DrillSegmentsFile | null,
  audioSha1: string | null,
): { segments: { start: number; end: number }[] | null; why: string | null } {
  if (drill.segments) return { segments: drill.segments, why: null };
  if (!sidecar) return { segments: null, why: 'no segments file' };
  if (sidecar.text !== drill.text_en) return { segments: null, why: 'segments file is for another text' };
  if (!audioSha1 || sidecar.audio?.sha1 !== audioSha1) return { segments: null, why: 'segments file is for another recording' };
  const segments = sidecar.segments.map(({ start, end }) => ({ start, end }));
  if (!segmentsFit(drill.text_en, segments)) return { segments: null, why: 'segments file does not fit the phrases' };
  return { segments, why: null };
}
