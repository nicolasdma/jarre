/**
 * The written report after a coding mock: the only feedback of the session,
 * as in the interview mock (src/lib/interview/report.ts, same pipeline: one
 * DeepSeek call with JSON output, validated here).
 *
 * It scores the five dimensions live-coding rubrics share (communication,
 * problem solving, code that runs, testing, and senior judgment: trade-offs,
 * scale, production) plus complexity on its own (the time and space Big-O of
 * the final code, said precisely and with its reason, and the brute force's
 * cost), each 1 to 4 with moments quoted from the transcript, against the problem's senior signals and pitfalls. The facts the
 * page measured (hidden tests passed, runs, minutes to first code, hints
 * given) go in as facts, so "code that runs" is judged on the tests and not
 * on an impression. Drills to practice next can only be the lesson's drills
 * or problems: anything else the model returns is dropped.
 */

import { z } from 'zod';
import type { CodingProblem } from './format';

export const RUBRIC_DIMENSIONS = ['communication', 'problem_solving', 'code', 'testing', 'complexity', 'senior_judgment'] as const;
export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number];

export const RUBRIC_LABELS: Record<RubricDimension, string> = {
  communication: 'Comunicación',
  problem_solving: 'Resolución',
  code: 'Código que corre',
  testing: 'Testing',
  complexity: 'Complejidad (Big-O)',
  senior_judgment: 'Criterio senior',
};

export const VERDICTS = ['strong_yes', 'yes', 'lean_yes', 'lean_no', 'no'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABELS: Record<Verdict, string> = {
  strong_yes: 'Pasa con margen',
  yes: 'Pasa',
  lean_yes: 'Pasa justo',
  lean_no: 'No pasa, por poco',
  no: 'No pasa',
};

const score = z.coerce.number().int().min(1).max(4);

export const CodingReportSchema = z.object({
  /** Two or three sentences in rioplatense Spanish: how it went and the one thing to fix first. */
  summary: z.string().default(''),
  /** Would a senior bar pass it, as the engineer would write it in the scorecard. */
  verdict: z.enum(VERDICTS).catch('lean_no'),
  rubric: z
    .array(
      z.object({
        dimension: z.enum(RUBRIC_DIMENSIONS),
        score,
        /** One line in Spanish: why this score. */
        note: z.string().default(''),
        /** Moments quoted from the transcript (English, as said) with what they show (Spanish). */
        evidence: z.array(z.object({ quote: z.string(), note: z.string().default('') })).default([]),
      }),
    )
    .default([]),
  /** Concrete moments: what happened, and how it should have sounded. */
  moments: z
    .array(z.object({ quote: z.string().default(''), what: z.string(), better: z.string().default('') }))
    .default([]),
  /** What the engineer would write in their notes, short, English. */
  engineer_notes: z.array(z.string()).default([]),
  /** Clarifying questions asked and the important ones missed (English). */
  clarifications: z.object({ asked: z.array(z.string()).default([]), missed: z.array(z.string()).default([]) }).default({ asked: [], missed: [] }),
  /** Recurring English errors that matter, quoted. */
  language: z.array(z.object({ said: z.string(), say: z.string() })).default([]),
  /** The 2-3 things to drill next: a drill slug or a problem id of the lesson, with why (Spanish). */
  next: z
    .array(z.object({ drill: z.string().optional(), problem: z.string().optional(), what: z.string(), why: z.string().default('') }))
    .default([]),
});

export type CodingReport = z.infer<typeof CodingReportSchema>;

/** What the page measured during the session. */
export interface CodingSessionFacts {
  minutes: number;
  elapsedSeconds: number;
  /** Seconds from start to the first edit of the starter, or null. */
  firstEditSeconds: number | null;
  runs: number;
  exampleRuns: number;
  /** Hidden + example tests on the final code. */
  finalTests: { passed: number; total: number; failing: string[]; error?: string };
  hintsGiven: number;
  checkIns: number;
}

export interface ReportTranscriptLine {
  role: 'user' | 'model';
  text: string;
}

const NEXT_MAX = 3;

/** The complexity to judge against: the lesson's check when it has one, else the solution's headline. */
function complexityReference(problem: CodingProblem): string {
  const c = problem.complexity;
  if (!c) return `${problem.solution.time} time, ${problem.solution.space} space`;
  const brute = c.brute ? `; brute force ${c.brute.time.answer} time, ${c.brute.space} space` : '';
  return `${c.time.answer} time, ${c.space.answer} space${brute}. A precise spoken answer: "${c.say.replace(/\s+\/\s+/g, ' ')}"`;
}

export function buildCodingReportMessages(params: {
  problem: CodingProblem;
  interviewerName: string;
  transcript: ReportTranscriptLine[];
  finalCode: string;
  facts: CodingSessionFacts;
  drills: { slug: string; title: string }[];
  problems: { id: string; title: string }[];
}): { system: string; user: string } {
  const { problem, interviewerName, transcript, finalCode, facts, drills, problems } = params;

  const system = `You write the scorecard of a mock live-coding interview that a Spanish-speaking developer just did in English, in TypeScript, to prepare a real 30-minute LeetCode-style round at SENIOR level. You are the engineer who ran it: demanding, specific and fair. An error you leave out is an error they repeat on the real call.

Score each of six dimensions from 1 to 4 (1 strong no, 2 lean no, 3 lean yes, 4 strong yes), at senior bar:
- communication: restates the problem, clarifies and states assumptions, thinks aloud, narrates decisions not keystrokes, uses hints well, never long silences.
- problem_solving: gets to a brute force fast with its Big-O, then optimizes with a stated trade-off; reasons from examples when stuck.
- code: correct, readable, clear names and structure, runs. Judge correctness on the FINAL TESTS fact, not on impressions.
- testing: walks through an example and edge cases WITHOUT being asked, finds and fixes their own bugs.
- complexity: the time AND space Big-O of their FINAL code, both correct, each with its reason (which loop, sort or structure dominates), saying what n is when it is not obvious; the brute force's cost and why the optimization beats it; probes ("why log n?", "can you do better on space?", "average or worst case?") answered with substance. 4: both exact with reasons, unprompted or at the first ask. 3: correct but needed a probe for the reason or for space. 2: vague ("it's fast", "linear-ish"), only one of the two, or a wrong one corrected after probing. 1: never stated, or wrong and left wrong (e.g. O(1) space with a map the size of the input). Compare against the REFERENCE COMPLEXITY below.
- senior_judgment: trade-offs, scale/memory/input-validation/production follow-ups answered with substance.
The transcript is speech recognition: ignore noise in ordinary words. Hints the interviewer gave lower problem_solving according to how big they were.

Return JSON only:
{
 "summary": "2 or 3 sentences in rioplatense Spanish (vos), no em dash: how it went at senior bar and the one thing to fix first",
 "verdict": "strong_yes | yes | lean_yes | lean_no | no (would this pass a senior bar?)",
 "rubric": [{"dimension": "communication|problem_solving|code|testing|complexity|senior_judgment", "score": 1-4, "note": "one line in Spanish: why", "evidence": [{"quote": "words the candidate actually said, or a short code excerpt", "note": "what it shows, in Spanish"}]}],
 "moments": [{"quote": "what was said or done, quoted", "what": "what happened, one line in Spanish", "better": "how it should have sounded on the call, in English, one or two spoken sentences"}],
 "engineer_notes": ["what the engineer writes in their notes, short, English, like a real scorecard"],
 "clarifications": {"asked": ["the clarifying questions they asked"], "missed": ["important questions they did not ask"]},
 "language": [{"said": "exact English words they said", "say": "the correction"}],
 "next": [{"drill": "a drill slug from the list (optional)", "problem": "a problem id from the list (optional)", "what": "what to drill, Spanish", "why": "one line in Spanish"}]
}
Rules:
- "rubric": exactly six entries, one per dimension, in the order above. Never inflate: a 4 needs evidence. For complexity, quote what they said about time and space, and in the note say the right answer if theirs was wrong or incomplete.
- "moments": 3 to 6, the ones that moved the score most, good and bad, in order of the call.
- "language": the 2 to 4 English errors that matter most; quote only words they actually said; empty if none.
- "next": exactly ${NEXT_MAX} items, each with a drill slug or a problem id from the lists below (never invented), targeting the biggest gaps.`;

  const user = `PROBLEM: ${problem.title} (${problem.difficulty}, ${problem.pattern})
Statement: ${problem.statement}
Reference approach: ${problem.solution.approach} (${problem.solution.time} time, ${problem.solution.space} space)
REFERENCE COMPLEXITY: ${complexityReference(problem)}
Senior signals to look for: ${problem.senior_signals.join('; ')}
Common pitfalls: ${problem.pitfalls.join('; ')}
Hint ladder (the interviewer gave ${facts.hintsGiven}): ${problem.hints.map((h, i) => `${i + 1}. ${h}`).join(' ')}

FACTS MEASURED BY THE PAGE
- Session: ${Math.round(facts.elapsedSeconds / 60)} of ${facts.minutes} minutes
- First edit of the code: ${facts.firstEditSeconds === null ? 'never' : `at ${Math.round(facts.firstEditSeconds / 60)} min ${facts.firstEditSeconds % 60} s`}
- Runs of their code: ${facts.runs}; runs of the example tests: ${facts.exampleRuns}
- FINAL TESTS (examples + hidden edge cases, on the final code): ${facts.finalTests.passed}/${facts.finalTests.total} pass${facts.finalTests.error ? `; error: ${facts.finalTests.error}` : ''}${facts.finalTests.failing.length ? `; failing: ${facts.finalTests.failing.join('; ')}` : ''}
- Check-ins after silences: ${facts.checkIns}

FINAL CODE
${finalCode}

DRILLS (slug: title)
${drills.map((d) => `- ${d.slug}: ${d.title}`).join('\n')}

PROBLEMS (id: title)
${problems.map((p) => `- ${p.id}: ${p.title}`).join('\n')}

TRANSCRIPT
${transcript.map((l) => `${l.role === 'user' ? 'CANDIDATE' : interviewerName.toUpperCase()}: ${l.text}`).join('\n')}`;

  return { system, user };
}

/** Validate the model's JSON; keep one entry per dimension and only drills or problems the lesson has. */
export function parseCodingReport(raw: unknown, known: { drills: ReadonlySet<string>; problems: ReadonlySet<string> }): CodingReport {
  const report = CodingReportSchema.parse(raw);
  const byDim = new Map(report.rubric.map((r) => [r.dimension, r]));
  report.rubric = RUBRIC_DIMENSIONS.filter((d) => byDim.has(d)).map((d) => byDim.get(d)!);
  report.next = report.next
    .map((n) => ({
      ...n,
      drill: n.drill && known.drills.has(n.drill) ? n.drill : undefined,
      problem: n.problem && known.problems.has(n.problem) ? n.problem : undefined,
    }))
    .filter((n) => n.drill || n.problem)
    .slice(0, NEXT_MAX);
  return report;
}

/** A report needs the candidate to have said something. */
export function hasCandidateSpeech(transcript: ReportTranscriptLine[]): boolean {
  return transcript.some((l) => l.role === 'user' && l.text.trim().split(/\s+/).length >= 3);
}
