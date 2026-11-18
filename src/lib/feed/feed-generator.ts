/**
 * The feed generator: a pure, deterministic, endless stream of post
 * descriptors over a lesson graph.
 *
 * The model (owner, 2026-11-18) is the REST / doomscroll mode, not a drill.
 * It composes a varied stream by sampling a MATRIX of axes per post
 * (participation / energy / visual / density / novelty), weighted toward calm
 * passive posts, with active recall beats a sprinkled, always-optional
 * MINORITY, never a floor, never two close together, never blocking the
 * scroll. This supersedes the strict "retrieval on every re-surface, one
 * active beat every 2-3 posts" cadence of docs/feed-mode/03: the feed
 * complements the active modes (Escuchar, Repetir, Pregunta → respuesta), it
 * does not replace them. What makes it teach is the drag of endless scrolling
 * plus spaced repetition of real (non-garbage) content, mostly absorbed
 * passively.
 *
 * It keeps doc 03's good machinery: a seeded PRNG (same day + resource →
 * same feed, so it is reproducible and resumable, never a slot machine),
 * spaced re-surfacing with growing-then-cycling gaps, interleaving of concept
 * types, cheap per-batch stepping (no network, no per-tick work), and
 * variation of order / palette / kind on every return.
 *
 * Infinite by construction: once the new material is introduced, every later
 * post is a spaced re-surface, and the due score only grows, so it never
 * stalls and never forces an end.
 *
 * Pure and deterministic: no Date.now, no Math.random. Tested in
 * __tests__/feed-generator.test.ts.
 */

import type { FeedGraph, FeedConceptAssets } from './feed-graph';
import {
  PALETTE_COUNT,
  type Energy,
  type FeedPost,
  type FeedPostKind,
  type MilestoneKind,
  type Participation,
  type PostProfile,
  type TeachingDensity,
  type VisualVibe,
} from './feed-post';

// ---------------------------------------------------------------------------
// Deterministic PRNG (xmur3 seed + mulberry32)
// ---------------------------------------------------------------------------

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed: string): () => number {
  const seeder = xmur3(seed);
  return mulberry32(seeder());
}

/** Weighted pick from {value → weight}; weights need not sum to 1. */
function weightedPick<T extends string>(rng: () => number, weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return entries[0][0];
  let r = rng() * total;
  for (const [value, w] of entries) {
    r -= Math.max(0, w);
    if (r < 0) return value;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// Learner state (cheap, built client-side from best-scores; optional)
// ---------------------------------------------------------------------------

export interface LearnerState {
  /**
   * Per concept, how well the learner knows it, 0 (new/weak) → 1 (strong).
   * Weaker concepts re-surface sooner. Missing → treated as 0.5.
   */
  conceptStrength?: Record<string, number>;
  /** Concepts with a review due now (FSRS): surfaced a touch sooner. */
  dueConceptIds?: readonly string[];
}

// ---------------------------------------------------------------------------
// Tuning
// ---------------------------------------------------------------------------

/** Base participation mix: passive is the plurality, active-optional a minority. */
const PARTICIPATION_WEIGHTS: Record<Participation, number> = {
  passive: 0.52,
  'optional-tap': 0.3,
  'active-optional': 0.18,
};
/** Never two active beats within this many posts (keeps them sprinkled, never a floor). */
const ACTIVE_SPACING = 3;
/** Seed the pool with a few concepts before interleaving review. */
const SEED_CONCEPTS = 2;
/** Force an introduction if none happened in this many posts (coverage). */
const NEW_FORCE_AFTER = 3;
/** Spaced re-surface gaps (posts): grow, then cap and cycle. */
const RESURFACE_GAPS = [4, 8, 13, 19, 26];
/** Weak-concept priority: how much strength 0 pulls a re-surface forward. */
const WEAKNESS_BOOST = 6;
/** A calm progress reminder about this often; never a stop. */
const MILESTONE_EVERY = 12;
const MILESTONE_MIN_INDEX = 8;

function gapFor(times: number): number {
  return RESURFACE_GAPS[Math.min(Math.max(times - 1, 0), RESURFACE_GAPS.length - 1)];
}

// ---------------------------------------------------------------------------
// The generator
// ---------------------------------------------------------------------------

interface Seen {
  lastIndex: number;
  times: number;
  order: number;
}

export interface FeedGenerator {
  /** The next descriptor. Always returns one (the stream never ends). */
  next: () => FeedPost;
  /** The next `n` descriptors. */
  take: (n: number) => FeedPost[];
}

export interface FeedSeedParts {
  resourceId: string;
  /** A day stamp (e.g. '2026-11-18'), so the feed is stable within a day and fresh across days. */
  day: string;
}

export function feedSeed(parts: FeedSeedParts): string {
  return `jarre-feed:${parts.resourceId}:${parts.day}`;
}

/** Can this concept serve this participation channel right now? */
function canServe(c: FeedConceptAssets, p: Participation): boolean {
  if (p === 'active-optional') return c.cardIds.length > 0 || c.sayItSlugs.length > 0;
  if (p === 'optional-tap') return c.quizIds.length > 0 || c.complexityIds.length > 0 || Boolean(c.definition);
  return true; // passive: a concept always has at least its definition to re-view
}

export function createFeedGenerator(graph: FeedGraph, learner: LearnerState, seedParts: FeedSeedParts): FeedGenerator {
  const rng = makeRng(feedSeed(seedParts));
  const concepts = graph.concepts;
  const strength = learner.conceptStrength ?? {};
  const due = new Set(learner.dueConceptIds ?? []);

  let index = 0;
  const notIntroduced = concepts.map((c) => c.id); // sort order
  const seen = new Map<string, Seen>();
  let introducedCount = 0;
  let sinceActive = ACTIVE_SPACING; // allow an early active once material exists
  let sinceNew = NEW_FORCE_AFTER; // allow an intro immediately
  let sinceMilestone = 0;
  const recentKinds: FeedPostKind[] = [];
  const recentParticipation: Participation[] = [];
  const recentEnergy: Energy[] = [];

  function note<T>(list: T[], value: T, keep = 3): void {
    list.push(value);
    if (list.length > keep) list.shift();
  }

  function introduced(): FeedConceptAssets[] {
    return concepts.filter((c) => seen.has(c.id));
  }

  /** The most "due" introduced concept that can serve `p`. Spaced + weak-first + varied. */
  function pickResurface(p: Participation): FeedConceptAssets | null {
    const pool = introduced().filter((c) => canServe(c, p));
    if (!pool.length) return null;
    let best: FeedConceptAssets | null = null;
    let bestScore = -Infinity;
    for (const c of pool) {
      const s = seen.get(c.id)!;
      const weak = 1 - (strength[c.id] ?? 0.5);
      const dueBoost = due.has(c.id) ? 3 : 0;
      // Overdue by how much, plus pull from weakness, plus a little noise for varied order.
      const score = index - s.lastIndex - gapFor(s.times) + weak * WEAKNESS_BOOST + dueBoost + rng() * 2;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  /** Rotate through a concept's assets of one kind so repeated visits vary. */
  function rotate<T>(ids: T[], times: number): T | undefined {
    if (!ids.length) return undefined;
    return ids[(times + Math.floor(rng() * ids.length)) % ids.length];
  }

  function paletteFor(c: FeedConceptAssets | null, times: number): number {
    const base = c ? concepts.indexOf(c) : index;
    return (base + times * 2 + Math.floor(rng() * 2)) % PALETTE_COUNT;
  }

  function energyFor(kind: FeedPostKind): Energy {
    const weights: Record<Energy, number> =
      kind === 'say-it' || kind === 'predict'
        ? { calm: 0.2, lively: 0.4, stimulating: 0.4 }
        : kind === 'milestone' || kind === 'nugget'
          ? { calm: 0.55, lively: 0.35, stimulating: 0.1 }
          : { calm: 0.35, lively: 0.45, stimulating: 0.2 };
    // Avoid three identical energies in a row.
    if (recentEnergy.length >= 2 && recentEnergy[recentEnergy.length - 1] === recentEnergy[recentEnergy.length - 2]) {
      weights[recentEnergy[recentEnergy.length - 1]] *= 0.3;
    }
    return weightedPick(rng, weights);
  }

  function visualFor(kind: FeedPostKind, paletteIndex: number): VisualVibe {
    if (kind === 'code' || kind === 'complexity') return rng() < 0.5 ? 'raw' : 'plain';
    if (kind === 'milestone') return 'plain';
    // Polished and plain alternate with the palette so the feed does not drone.
    const weights: Record<VisualVibe, number> = paletteIndex % 2 === 0
      ? { polished: 0.6, plain: 0.3, raw: 0.1 }
      : { polished: 0.35, plain: 0.45, raw: 0.2 };
    return weightedPick(rng, weights);
  }

  function emit(post: Omit<FeedPost, 'key'>): FeedPost {
    const key = `${index}-${post.kind}-${post.conceptId ?? 'x'}-${post.pass}`;
    note(recentKinds, post.kind);
    note(recentParticipation, post.profile.participation);
    note(recentEnergy, post.profile.energy);
    if (post.profile.participation === 'active-optional') sinceActive = 0;
    else sinceActive++;
    // Novelty drives the intro bookkeeping in one place, so callers never double-count.
    if (post.profile.novelty === 'new') {
      sinceNew = 0;
      introducedCount++;
    } else {
      sinceNew++;
    }
    sinceMilestone++;
    index++;
    return { ...post, key };
  }

  function milestone(): FeedPost {
    const kind: MilestoneKind = (['covered', 'resurfacing', 'patterns'] as const)[
      Math.floor((index / MILESTONE_EVERY)) % 3
    ];
    sinceMilestone = 0;
    const profile: PostProfile = { participation: 'passive', energy: 'calm', visual: 'plain', density: 'light', novelty: 'resurface' };
    return emit({ kind: 'milestone', conceptId: null, profile, paletteIndex: index % PALETTE_COUNT, pass: 0, milestone: kind });
  }

  function markSeen(c: FeedConceptAssets): { pass: number; times: number } {
    const prev = seen.get(c.id);
    const pass = prev ? prev.times : 0;
    const order = prev ? prev.order : introducedCount;
    seen.set(c.id, { lastIndex: index, times: pass + 1, order });
    return { pass, times: pass + 1 };
  }

  /** Decide this slot's participation, with the anti-floor and variety rules. */
  function pickParticipation(canActive: boolean, canTap: boolean): Participation {
    const w: Record<Participation, number> = { ...PARTICIPATION_WEIGHTS };
    if (!canActive || sinceActive < ACTIVE_SPACING) w['active-optional'] = 0;
    if (!canTap) w['optional-tap'] = 0;
    // Discourage a third identical participation in a row (variety like a real feed).
    const last = recentParticipation[recentParticipation.length - 1];
    const prev = recentParticipation[recentParticipation.length - 2];
    if (last && last === prev) w[last] *= 0.25;
    return weightedPick(rng, w);
  }

  function nuggetPost(c: FeedConceptAssets, participation: Participation, novelty: 'new' | 'resurface'): FeedPost {
    const { pass, times } = markSeen(c);
    const drillSlug = rotate(c.drillSlugs, times);
    const paletteIndex = paletteFor(c, pass);
    const density: TeachingDensity = novelty === 'new' ? 'dense' : participation === 'optional-tap' ? 'loose' : 'light';
    const profile: PostProfile = { participation, energy: energyFor('nugget'), visual: visualFor('nugget', paletteIndex), density, novelty };
    return emit({ kind: 'nugget', conceptId: c.id, profile, paletteIndex, pass, drillSlug });
  }

  function next(): FeedPost {
    // Occasional calm progress reminder (never a stop).
    if (index >= MILESTONE_MIN_INDEX && sinceMilestone >= MILESTONE_EVERY && introducedCount > 0) {
      return milestone();
    }

    // Coverage: if the pool is empty, or we have not introduced anyone in a
    // while, introduce the next new concept as a calm nugget.
    const mustIntroduce =
      notIntroduced.length > 0 && (introducedCount === 0 || introducedCount < SEED_CONCEPTS || sinceNew >= NEW_FORCE_AFTER);

    if (mustIntroduce) {
      const id = notIntroduced.shift()!;
      const c = concepts.find((x) => x.id === id)!;
      const participation: Participation = rng() < 0.75 ? 'passive' : 'optional-tap';
      return nuggetPost(c, participation, 'new');
    }

    const hasIntroduced = introducedCount > 0;
    const canActive = hasIntroduced && introduced().some((c) => canServe(c, 'active-optional'));
    const canTap = hasIntroduced && introduced().some((c) => canServe(c, 'optional-tap'));
    let participation = pickParticipation(canActive, canTap);

    // A passive slot sometimes introduces new material (interleave), else re-views.
    if (participation === 'passive') {
      if (notIntroduced.length > 0 && sinceNew >= 1 && rng() < 0.5) {
        const id = notIntroduced.shift()!;
        const c = concepts.find((x) => x.id === id)!;
        return nuggetPost(c, 'passive', 'new');
      }
      const c = pickResurface('passive');
      if (!c) {
        // Nothing introduced yet somehow: introduce if we can, else a safe nugget.
        if (notIntroduced.length > 0) {
          const id = notIntroduced.shift()!;
          return nuggetPost(concepts.find((x) => x.id === id)!, 'passive', 'new');
        }
        return nuggetPost(concepts[0], 'passive', 'resurface');
      }
      // A passive re-view: a light reminder (nugget) or a code read when it has one.
      if (c.codeIds.length && rng() < 0.4) return codePost(c, 'passive');
      return nuggetPost(c, 'passive', 'resurface');
    }

    // optional-tap and active-optional always re-surface an introduced concept.
    let c = pickResurface(participation);
    if (!c) {
      participation = 'passive';
      c = pickResurface('passive');
      if (!c) return nuggetPost(concepts[0], 'passive', 'resurface');
      return nuggetPost(c, 'passive', 'resurface');
    }

    if (participation === 'active-optional') return activePost(c);
    return tapPost(c);
  }

  function tapPost(c: FeedConceptAssets): FeedPost {
    const { pass, times } = markSeen(c);
    const paletteIndex = paletteFor(c, pass);
    // Prefer a quiz or a Big-O predict; else fall to a nugget you tap to flip.
    const useComplexity = c.complexityIds.length && (!c.quizIds.length || rng() < 0.4);
    if (useComplexity) {
      const complexityId = rotate(c.complexityIds, times)!;
      const profile: PostProfile = { participation: 'optional-tap', energy: energyFor('complexity'), visual: visualFor('complexity', paletteIndex), density: 'loose', novelty: 'resurface' };
      return emit({ kind: 'complexity', conceptId: c.id, profile, paletteIndex, pass, complexityId });
    }
    if (c.quizIds.length) {
      const quizId = rotate(c.quizIds, times)!;
      const profile: PostProfile = { participation: 'optional-tap', energy: energyFor('tap-quiz'), visual: visualFor('tap-quiz', paletteIndex), density: 'loose', novelty: 'resurface' };
      return emit({ kind: 'tap-quiz', conceptId: c.id, profile, paletteIndex, pass, quizId });
    }
    // Nugget you can tap to flip to the definition.
    const drillSlug = rotate(c.drillSlugs, times);
    const profile: PostProfile = { participation: 'optional-tap', energy: energyFor('nugget'), visual: visualFor('nugget', paletteIndex), density: 'loose', novelty: 'resurface' };
    return emit({ kind: 'nugget', conceptId: c.id, profile, paletteIndex, pass, drillSlug });
  }

  function activePost(c: FeedConceptAssets): FeedPost {
    const { pass, times } = markSeen(c);
    const paletteIndex = paletteFor(c, pass);
    // Say-it when the concept has a judgeable drill and not too often; else predict a recall card.
    const useSayIt = c.sayItSlugs.length && (!c.cardIds.length || rng() < 0.45);
    if (useSayIt) {
      const drillSlug = rotate(c.sayItSlugs, times)!;
      const profile: PostProfile = { participation: 'active-optional', energy: energyFor('say-it'), visual: visualFor('say-it', paletteIndex), density: 'loose', novelty: 'resurface' };
      return emit({ kind: 'say-it', conceptId: c.id, profile, paletteIndex, pass, drillSlug });
    }
    const cardId = rotate(c.cardIds, times)!;
    const profile: PostProfile = { participation: 'active-optional', energy: energyFor('predict'), visual: visualFor('predict', paletteIndex), density: 'loose', novelty: 'resurface' };
    return emit({ kind: 'predict', conceptId: c.id, profile, paletteIndex, pass, cardId });
  }

  function codePost(c: FeedConceptAssets, participation: Participation): FeedPost {
    const { pass, times } = markSeen(c);
    const paletteIndex = paletteFor(c, pass);
    const codeId = rotate(c.codeIds, times)!;
    const profile: PostProfile = { participation, energy: energyFor('code'), visual: visualFor('code', paletteIndex), density: 'light', novelty: 'resurface' };
    return emit({ kind: 'code', conceptId: c.id, profile, paletteIndex, pass, codeId });
  }

  function take(n: number): FeedPost[] {
    const out: FeedPost[] = [];
    for (let i = 0; i < n; i++) out.push(next());
    return out;
  }

  return { next, take };
}

/** First `count` posts of the feed. Deterministic prefix of the infinite stream. */
export function generateFeed(graph: FeedGraph, learner: LearnerState, seedParts: FeedSeedParts, count: number): FeedPost[] {
  return createFeedGenerator(graph, learner, seedParts).take(count);
}
