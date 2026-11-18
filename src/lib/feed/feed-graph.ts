/**
 * The lesson as a feed graph: concepts in order, each with the ids of the
 * assets it already has (drills, quizzes, recall cards, Big-O items, code
 * problems), plus the content those ids resolve to. Pure: it takes the rows
 * the page already loads (same shapes as src/app/learn/[resourceId]/page.tsx
 * and src/lib/lessons/drills.ts) and never touches a database.
 *
 * It invents no content. Everything is a projection of what the lesson tables
 * hold: concepts, resource_sections, inline_quizzes, concept_cards (recall),
 * lesson_drills, and the stored `interview` block (its `questions[].ask` and
 * its `coding` complexity/problems). The interview block is read defensively
 * from unknown, the way src/lib/practice/recall.ts and recall-eval.ts read it,
 * so a malformed or absent block just yields fewer post kinds.
 */

import type { PracticeDrill } from '@/components/practice/types';
import type { PhraseSegment } from '@/lib/practice/phrase-segments';
import { drillAsksFromInterview } from '@/lib/practice/recall';
import type { FeedVideo } from './feed-videos';

// ---------------------------------------------------------------------------
// Resolved content (what a post component reads)
// ---------------------------------------------------------------------------

export interface FeedDrill {
  slug: string;
  title: string;
  textEn: string;
  textEs: string | null;
  audioUrl: string | null;
  segments: PhraseSegment[] | null;
  conceptId: string | null;
}

export interface FeedQuiz {
  id: string;
  conceptId: string | null;
  format: 'mc' | 'tf';
  question: string;
  /** mc: the options, in order. tf: null. */
  options: { label: string; text: string }[] | null;
  /** mc: the correct option label ('B'). tf: 'true' | 'false'. */
  correctAnswer: string;
  explanation: string;
}

/** A recall concept_card: front {prompt}, back {definition}. */
export interface FeedCard {
  id: string;
  conceptId: string;
  prompt: string;
  answer: string;
}

/** One Big-O fragment from interview.coding.complexity_drill.items. */
export interface FeedComplexity {
  id: string;
  conceptId: string;
  title: string;
  code: string;
  timeAnswer: string;
  timeOptions: string[];
  timeWhy: string;
  spaceAnswer: string;
  spaceWhy: string;
  /** The sentence to say on the call. */
  say: string;
}

/** A coding problem from interview.coding.problems. */
export interface FeedCode {
  id: string;
  conceptId: string | null;
  title: string;
  pattern: string;
  statement: string;
  code: string;
  /** The optimal time complexity, as written in the problem (complexity.time or solution.time). */
  time: string | null;
  /** The optimal space complexity, as written. */
  space: string | null;
  /** The brute force's time, when the approach text names one ("Brute force: …, O(n²) time"). */
  brute: string | null;
}

// ---------------------------------------------------------------------------
// The graph
// ---------------------------------------------------------------------------

export interface FeedConceptAssets {
  id: string;
  name: string;
  definition: string;
  sortOrder: number;
  sectionMarkdown: string | null;
  /** Drills tied to this concept (nugget audio, say-it). */
  drillSlugs: string[];
  /** Drill slugs that have an interview `ask` (a judgeable say-it beat). */
  sayItSlugs: string[];
  quizIds: string[];
  cardIds: string[];
  complexityIds: string[];
  codeIds: string[];
  /** Real YouTube videos about this concept (graph.videos ids). Optional: a lesson may have none. */
  videoIds?: string[];
}

export interface FeedGraph {
  resourceId: string;
  concepts: FeedConceptAssets[];
  drills: Record<string, FeedDrill>;
  quizzes: Record<string, FeedQuiz>;
  cards: Record<string, FeedCard>;
  complexity: Record<string, FeedComplexity>;
  code: Record<string, FeedCode>;
  /** Drill slug → the interview's English question for it. */
  asks: Record<string, string>;
  /** Entry id → a YouTube video of the lesson's index (src/data/feed-videos). */
  videos?: Record<string, FeedVideo>;
}

// ---------------------------------------------------------------------------
// Input rows (what the server component hands in)
// ---------------------------------------------------------------------------

export interface GraphConceptRow {
  id: string;
  name: string;
  definition: string;
  sortOrder: number;
  sectionMarkdown: string | null;
}

export interface GraphQuizRow {
  id: string;
  conceptId: string | null;
  format: 'mc' | 'tf';
  question: string;
  options: { label: string; text: string }[] | null;
  correctAnswer: string;
  explanation: string;
}

export interface GraphCardRow {
  id: string;
  conceptId: string;
  prompt: string;
  answer: string;
}

export interface BuildFeedGraphInput {
  resourceId: string;
  concepts: GraphConceptRow[];
  quizzes: GraphQuizRow[];
  cards: GraphCardRow[];
  drills: PracticeDrill[];
  /** The stored `resources.interview` block, as is (unknown). */
  interview: unknown;
  /** The lesson's YouTube index entries (already fresh-filtered by the caller, or not: the generator checks again). */
  videos?: readonly FeedVideo[];
}

// ---------------------------------------------------------------------------
// Defensive interview extraction (same spirit as recall.ts / recall-eval.ts)
// ---------------------------------------------------------------------------

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Big-O fragments from interview.coding.complexity_drill. All tied to its `concept`. */
export function complexityFromInterview(raw: unknown): FeedComplexity[] {
  const coding = (raw as { coding?: unknown })?.coding as { complexity_drill?: unknown } | undefined;
  const drill = coding?.complexity_drill as { concept?: unknown; items?: unknown } | undefined;
  const conceptId = asString(drill?.concept);
  const items = drill?.items;
  if (!conceptId || !Array.isArray(items)) return [];
  const out: FeedComplexity[] = [];
  for (const it of items) {
    if (!it || typeof it !== 'object') continue;
    const o = it as Record<string, unknown>;
    const id = asString(o.id);
    const title = asString(o.title);
    const code = asString(o.code);
    const time = o.time as Record<string, unknown> | undefined;
    const space = o.space as Record<string, unknown> | undefined;
    const timeAnswer = asString(time?.answer);
    const spaceAnswer = asString(space?.answer);
    const say = asString(o.say);
    if (!id || !title || !code || !timeAnswer || !spaceAnswer || !say) continue;
    const timeOptions = Array.isArray(time?.options)
      ? (time!.options as unknown[]).map(asString).filter((x): x is string => !!x)
      : [];
    out.push({
      id,
      conceptId,
      title,
      code,
      timeAnswer,
      timeOptions: timeOptions.length >= 2 ? timeOptions : [timeAnswer],
      timeWhy: asString(time?.why) ?? '',
      spaceAnswer,
      spaceWhy: asString(space?.why) ?? '',
      say,
    });
  }
  return out;
}

/** The first Big-O in an approach's "Brute force: …" sentence, or null when it names none. */
export function bruteForceTime(approach: string | null): string | null {
  if (!approach) return null;
  const m = approach.match(/brute[- ]force\s*:([^]*?)(?:\.\s|\.$|$)/i);
  if (!m) return null;
  return m[1].match(/O\([^)]*\)/)?.[0] ?? null;
}

/** Coding problems from interview.coding.problems: code is the reference solution, else the starter. */
export function codeFromInterview(raw: unknown): FeedCode[] {
  const coding = (raw as { coding?: unknown })?.coding as { problems?: unknown } | undefined;
  const problems = coding?.problems;
  if (!Array.isArray(problems)) return [];
  const out: FeedCode[] = [];
  for (const p of problems) {
    if (!p || typeof p !== 'object') continue;
    const o = p as Record<string, unknown>;
    const id = asString(o.id);
    const title = asString(o.title);
    const pattern = asString(o.pattern);
    const statement = asString(o.statement);
    const solution = o.solution as Record<string, unknown> | undefined;
    const code = asString(solution?.code) ?? asString(o.starter);
    if (!id || !title || !pattern || !statement || !code) continue;
    const complexity = o.complexity as { time?: { answer?: unknown }; space?: { answer?: unknown } } | undefined;
    out.push({
      id,
      conceptId: asString(o.concept),
      title,
      pattern,
      statement,
      code,
      time: asString(complexity?.time?.answer) ?? asString(solution?.time),
      space: asString(complexity?.space?.answer) ?? asString(solution?.space),
      brute: bruteForceTime(asString(solution?.approach)),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function buildFeedGraph(input: BuildFeedGraphInput): FeedGraph {
  const asks = drillAsksFromInterview(input.interview);
  const complexity = complexityFromInterview(input.interview);
  const code = codeFromInterview(input.interview);

  const drills: Record<string, FeedDrill> = {};
  for (const d of input.drills) {
    drills[d.slug] = {
      slug: d.slug,
      title: d.title,
      textEn: d.textEn,
      textEs: d.textEs,
      audioUrl: d.audioUrl,
      segments: d.segments,
      conceptId: d.conceptId,
    };
  }

  const quizzes: Record<string, FeedQuiz> = {};
  for (const q of input.quizzes) quizzes[q.id] = q;

  const cards: Record<string, FeedCard> = {};
  for (const c of input.cards) cards[c.id] = c;

  const complexityById: Record<string, FeedComplexity> = {};
  for (const c of complexity) complexityById[c.id] = c;

  const codeById: Record<string, FeedCode> = {};
  for (const c of code) codeById[c.id] = c;

  const byConcept = new Map<string, FeedConceptAssets>();
  const ordered = [...input.concepts].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const c of ordered) {
    byConcept.set(c.id, {
      id: c.id,
      name: c.name,
      definition: c.definition,
      sortOrder: c.sortOrder,
      sectionMarkdown: c.sectionMarkdown,
      drillSlugs: [],
      sayItSlugs: [],
      quizIds: [],
      cardIds: [],
      complexityIds: [],
      codeIds: [],
    });
  }

  for (const d of input.drills) {
    if (!d.conceptId) continue;
    const c = byConcept.get(d.conceptId);
    if (!c) continue;
    c.drillSlugs.push(d.slug);
    if (asks[d.slug]) c.sayItSlugs.push(d.slug);
  }
  for (const q of input.quizzes) {
    if (q.conceptId) byConcept.get(q.conceptId)?.quizIds.push(q.id);
  }
  for (const c of input.cards) {
    byConcept.get(c.conceptId)?.cardIds.push(c.id);
  }
  for (const c of complexity) {
    byConcept.get(c.conceptId)?.complexityIds.push(c.id);
  }
  for (const c of code) {
    if (c.conceptId) byConcept.get(c.conceptId)?.codeIds.push(c.id);
  }
  const videos: Record<string, FeedVideo> = {};
  for (const v of input.videos ?? []) {
    const owners = v.conceptIds.filter((id) => byConcept.has(id));
    if (!owners.length) continue;
    videos[v.id] = v;
    for (const id of owners) {
      const c = byConcept.get(id)!;
      (c.videoIds ??= []).push(v.id);
    }
  }

  // Only concepts the feed can actually show something for.
  const concepts = ordered
    .map((c) => byConcept.get(c.id)!)
    .filter((c) => c.drillSlugs.length || c.quizIds.length || c.cardIds.length || c.complexityIds.length || c.codeIds.length || c.definition);

  return { resourceId: input.resourceId, concepts, drills, quizzes, cards, complexity: complexityById, code: codeById, asks, videos };
}
