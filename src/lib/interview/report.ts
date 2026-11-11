/**
 * Interview mock: the written report shown after the call.
 *
 * The spoken closing is five sentences; this is the part to study from. It is
 * built from the transcript and the same answer key the interviewer used
 * (`questions` with key points and misconceptions, must-know lists checked
 * against their canonical drill), so a question scores against a list and not
 * against an impression. Practice suggestions can only be drills the lesson
 * has: anything else the model returns is dropped.
 */

import { z } from 'zod';
import type { InterviewSetup } from './personas';

export interface ReportTranscriptLine {
  role: 'user' | 'model';
  text: string;
}

export interface ReportDrill {
  slug: string;
  title: string;
  text_en: string;
}

const score = z.coerce.number().int().min(0).max(3);

export const InterviewReportSchema = z.object({
  /** Two or three sentences in rioplatense Spanish: how the call went and the one thing to fix first. */
  summary: z.string().default(''),
  questions: z
    .array(
      z.object({
        question: z.string(),
        /** 0: wrong or missing, 1: weak, 2: right but incomplete, 3: complete. */
        score,
        verdict: z.string().default(''),
        missing: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  misconceptions: z.array(z.object({ said: z.string(), right: z.string() })).default([]),
  must_know: z.array(z.object({ topic: z.string(), missing: z.array(z.string()).default([]) })).default([]),
  terms: z.array(z.object({ heard: z.string(), say: z.string() })).default([]),
  language: z.array(z.object({ said: z.string(), say: z.string(), times: z.coerce.number().int().min(1).default(1) })).default([]),
  practice: z.array(z.object({ drill: z.string(), why: z.string().default('') })).default([]),
});

export type InterviewReport = z.infer<typeof InterviewReportSchema>;

const PRACTICE_MAX = 3;

function answerKey(setup: InterviewSetup, drills: ReportDrill[]): string {
  const bySlug = new Map(drills.map((d) => [d.slug, d]));
  return [...setup.questions, ...setup.curveballs]
    .map((q) => {
      const canonical = q.kind === 'must_know' && q.drill ? bySlug.get(q.drill)?.text_en : undefined;
      return [
        `- [${q.kind}] "${q.ask}"${q.drill ? ` (drill ${q.drill})` : ''}`,
        `  Key points: ${q.key_points.join('; ')}`,
        q.misconceptions.length ? `  Misconceptions: ${q.misconceptions.join('; ')}` : '',
        canonical ? `  Canonical answer: ${canonical}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}

export function buildInterviewReportMessages(params: {
  setup: InterviewSetup;
  drills: ReportDrill[];
  sections: { title: string; content: string }[];
  transcript: ReportTranscriptLine[];
}): { system: string; user: string } {
  const { setup, drills, sections, transcript } = params;
  const interviewer = setup.persona.name;
  const system = `You write the report of a mock job interview that a Spanish-speaking developer just did in English, to prepare a real call. You are demanding and precise: an error you leave out is an error they repeat on the real call. Judge every answer against the answer key and the lesson. The transcript is speech recognition: ignore recognition noise in ordinary words, but when a KEY name or term came out unrecognizable (e.g. "Body of Guardians" for Valley of Guardians, "role low security" for row-level security) report it under "terms".

Return JSON only:
{
 "summary": "2 or 3 sentences in rioplatense Spanish (vos), no em dash: how it went and the one thing to fix first",
 "questions": [{"question": "the interviewer's question, short, in English", "score": 0-3, "verdict": "one line in Spanish: what was right and what was wrong", "missing": ["key points left out, short, English"]}],
 "misconceptions": [{"said": "what the candidate claimed, quoted or close", "right": "the correct mechanism, one sentence, English"}],
 "must_know": [{"topic": "e.g. the six milestones", "missing": ["each item of the canonical answer they did not say"]}],
 "terms": [{"heard": "as it came out", "say": "the right name or term"}],
 "language": [{"said": "exact words they said", "say": "the correction", "times": n}],
 "practice": [{"drill": "a drill slug from the list below", "why": "one line in Spanish"}]
}
Rules:
- Score: 3 only when every key point is there and nothing is wrong; 2 right but incomplete; 1 weak or vague; 0 wrong or not answered. Never inflate.
- "misconceptions": technical claims that contradict the key or the lesson, even said in passing. Not language mistakes.
- "language": the 3 to 5 English errors that matter most, recurring ones first; quote only words they actually said.
- "practice": exactly ${PRACTICE_MAX} drills, the ones that fix the biggest gaps, by slug from the list. Never invent a slug.`;

  const user = `INTERVIEWER: ${interviewer}, ${setup.persona.role}.
${setup.context ? `SITUATION: ${setup.context}\n` : ''}
ANSWER KEY:
${answerKey(setup, drills)}

DRILLS (slug: title):
${drills.map((d) => `- ${d.slug}: ${d.title}`).join('\n')}

LESSON:
${sections.map((s) => `### ${s.title}\n${s.content.slice(0, 2500)}`).join('\n\n')}

TRANSCRIPT:
${transcript.map((l) => `${l.role === 'user' ? 'CANDIDATE' : interviewer.toUpperCase()}: ${l.text}`).join('\n')}`;

  return { system, user };
}

/** Validate the model's JSON and keep only drills the lesson has. */
export function parseInterviewReport(raw: unknown, drillSlugs: ReadonlySet<string>): InterviewReport {
  const report = InterviewReportSchema.parse(raw);
  const seen = new Set<string>();
  report.practice = report.practice
    .filter((p) => drillSlugs.has(p.drill) && !seen.has(p.drill) && seen.add(p.drill))
    .slice(0, PRACTICE_MAX);
  return report;
}

/** The candidate must have answered at least once for a report to mean anything. */
export function hasAnswers(transcript: ReportTranscriptLine[]): boolean {
  return transcript.some((l) => l.role === 'user' && l.text.trim().split(/\s+/).length >= 3);
}
