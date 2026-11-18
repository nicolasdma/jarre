/**
 * Feed mode descriptors: what a post IS, as ids into the already-loaded
 * lesson graph, never the content itself (the component resolves the content
 * at render from the graph it was handed). Pure and serializable.
 *
 * The feed is the REST mode of Jarre (owner, 2026-11-18): a low-pressure
 * doomscroll of your own study material between breaks. The teaching comes
 * from the drag of endless scrolling plus spaced repetition of non-garbage
 * content, absorbed mostly passively, NOT from forcing an active beat on every
 * post. Explicit recall practice lives in the other modes (Escuchar, Copiar,
 * Repetir, Pregunta → respuesta); the feed complements them.
 *
 * So every post carries a PROFILE across axes, like a real social feed, and
 * the generator (feed-generator.ts) composes a varied stream by sampling the
 * axes, weighted toward calm passive posts with active beats as a sprinkled,
 * always-optional minority. Nothing here ever blocks the scroll or demands an
 * answer: the axes decide the vibe, the component decides what the (optional)
 * tap does.
 */

/** The post kinds, each a projection of data the lesson already has. */
export type FeedPostKind =
  /** Keywords on screen + (when the drill has a recording) autoplay audio. */
  | 'nugget'
  /** An inline quiz: tap an option to reveal the right one and why. */
  | 'tap-quiz'
  /** A prompt; tap (or just scroll past) to reveal the answer. */
  | 'predict'
  /** A spoken drill: an optional mic beat, judged, then the recording. */
  | 'say-it'
  /** A code fragment: predict its Big-O, or just read the answer. */
  | 'complexity'
  /** A code snippet with one line of what it does. */
  | 'code'
  /** An honest, calm progress reminder (never a stop, never a streak). */
  | 'milestone';

/**
 * How the post invites participation. ALWAYS optional: you can keep scrolling.
 * - passive: nothing to do, just watch or listen.
 * - optional-tap: a single tap reveals or answers, if you feel like it.
 * - active-optional: a real recall beat (predict, say it) offered, never
 *   forced. The minority of the feed, never a floor, never two close together.
 */
export type Participation = 'passive' | 'optional-tap' | 'active-optional';

/** Calm ↔ stimulating, so the feed breathes instead of droning. */
export type Energy = 'calm' | 'lively' | 'stimulating';

/** Polished ↔ raw: the visual vibe (color weight, layout density). */
export type VisualVibe = 'polished' | 'plain' | 'raw';

/** Dense teaching ↔ loose review ↔ a light reminder. */
export type TeachingDensity = 'dense' | 'loose' | 'light';

/** A brand-new concept, or a spaced re-surface of one seen earlier. */
export type Novelty = 'new' | 'resurface';

/** The matrix: variety is a first-class dimension, not an afterthought. */
export interface PostProfile {
  participation: Participation;
  energy: Energy;
  visual: VisualVibe;
  density: TeachingDensity;
  novelty: Novelty;
}

export type MilestoneKind = 'covered' | 'resurfacing' | 'patterns';

export interface FeedPost {
  /** Stable React key: kind + ids + pass, unique across the infinite stream. */
  key: string;
  kind: FeedPostKind;
  /** The lesson concept this post is about; null only for cross-cutting milestones. */
  conceptId: string | null;
  profile: PostProfile;
  /** Which palette (encoding variety); rotates, and changes on re-surface. */
  paletteIndex: number;
  /** 0 = first appearance, 1+ = how many times this concept was surfaced before. */
  pass: number;
  // Ids into the graph, by kind. Exactly the ones the kind needs are set.
  /** tap-quiz: the inline quiz id. */
  quizId?: string;
  /** predict: the concept_card id. */
  cardId?: string;
  /** nugget, say-it: the drill slug (nugget may have none → text only). */
  drillSlug?: string;
  /** complexity: the complexity-drill item id. */
  complexityId?: string;
  /** code: the coding problem id. */
  codeId?: string;
  /** milestone: which reminder. */
  milestone?: MilestoneKind;
}

/** Whether a post offers a real recall beat (for the generator's minority accounting and tests). */
export function isActiveBeat(post: FeedPost): boolean {
  return post.profile.participation === 'active-optional';
}

/** How many palettes the feed rotates through. */
export const PALETTE_COUNT = 8;
