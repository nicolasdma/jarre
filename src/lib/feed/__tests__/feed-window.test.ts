import { describe, expect, it } from 'vitest';
import type { FeedGraph } from '../feed-graph';
import { createFeedGenerator } from '../feed-generator';
import type { FeedPost } from '../feed-post';
import {
  AUDIO_RESIGN_AFTER_MS,
  DROP_CHUNK,
  KEEP_BEHIND,
  dropCount,
  postAt,
  rebuildCount,
  rebuildRange,
  slugsToResign,
  windowEnd,
  type StreamWindow,
} from '../feed-window';

function graph(): FeedGraph {
  const concepts = ['a', 'b', 'c', 'd'].map((id, i) => ({
    id,
    name: `Concept ${id}`,
    definition: `Def ${id}`,
    sortOrder: i,
    sectionMarkdown: null,
    drillSlugs: [`${id}-d`],
    sayItSlugs: [`${id}-d`],
    quizIds: [`${id}-q`],
    cardIds: [`${id}-k`],
    complexityIds: [],
    codeIds: [],
  }));
  const g: FeedGraph = { resourceId: 'r', concepts, drills: {}, quizzes: {}, cards: {}, complexity: {}, code: {}, asks: {} };
  for (const c of concepts) {
    g.drills[`${c.id}-d`] = { slug: `${c.id}-d`, title: 't', textEn: 'en', textEs: null, audioUrl: 'u', segments: null, conceptId: c.id };
    g.asks[`${c.id}-d`] = 'ask?';
    g.quizzes[`${c.id}-q`] = { id: `${c.id}-q`, conceptId: c.id, format: 'tf', question: 'q', options: null, correctAnswer: 'true', explanation: 'e' };
    g.cards[`${c.id}-k`] = { id: `${c.id}-k`, conceptId: c.id, prompt: 'p', answer: 'a' };
  }
  return g;
}

const SEED = { resourceId: 'r', day: '2026-11-18' };
const newGen = () => createFeedGenerator(graph(), {}, SEED);

/** Simulate a long scroll: extend, advance, drop, exactly as the feed does. */
function scrollTo(target: number): { win: StreamWindow; dropped: FeedPost[] } {
  const gen = newGen();
  let win: StreamWindow = { base: 0, posts: gen.take(10) };
  const dropped: FeedPost[] = [];
  for (let active = 0; active <= target; active++) {
    while (windowEnd(win) - active < 4) win = { ...win, posts: [...win.posts, ...gen.take(8)] };
    const n = dropCount(win, active);
    if (n) {
      dropped.push(...win.posts.slice(0, n));
      win = { base: win.base + n, posts: win.posts.slice(n) };
    }
  }
  return { win, dropped };
}

describe('feed window: bounded memory over an infinite stream', () => {
  it('holds a bounded number of descriptors however far you scroll', () => {
    const { win } = scrollTo(2000);
    expect(win.base).toBeGreaterThan(1900);
    expect(win.posts.length).toBeLessThanOrEqual(KEEP_BEHIND + 2 * DROP_CHUNK + 12);
    expect(postAt(win, 2000)).toBeTruthy();
  });

  it('never drops what is near the reader', () => {
    const { win } = scrollTo(500);
    expect(500 - win.base).toBeGreaterThanOrEqual(KEEP_BEHIND);
  });

  it('rebuilds dropped descriptors exactly (deterministic scheduler)', () => {
    const { win, dropped } = scrollTo(300);
    const rebuilt = rebuildRange((n) => newGen().take(n), 0, win.base);
    expect(rebuilt).toEqual(dropped);
    expect(rebuildRange((n) => newGen().take(n), win.base - DROP_CHUNK, win.base)).toEqual(dropped.slice(-DROP_CHUNK));
  });

  it('rebuilds only when the reader comes back to the window start', () => {
    const { win } = scrollTo(300);
    expect(rebuildCount(win, 300)).toBe(0);
    expect(rebuildCount(win, win.base)).toBe(DROP_CHUNK);
    expect(rebuildCount({ base: 5, posts: [] }, 4)).toBe(5);
    expect(rebuildCount({ base: 0, posts: [] }, 0)).toBe(0);
  });
});

describe('feed window: re-signing recordings in long sessions', () => {
  const post = (slug: string): FeedPost => ({
    key: slug,
    kind: 'nugget',
    conceptId: 'a',
    profile: { participation: 'passive', energy: 'calm', visual: 'plain', density: 'light', novelty: 'new' },
    paletteIndex: 0,
    pass: 0,
    drillSlug: slug,
  });

  it('asks for nothing before the URLs age', () => {
    expect(slugsToResign([post('x')], new Map(), 0, AUDIO_RESIGN_AFTER_MS - 1, () => true)).toEqual([]);
  });

  it('asks once per slug with a recording, after the refresh age, skipping fresh ones', () => {
    const now = AUDIO_RESIGN_AFTER_MS + 10;
    const signed = new Map([['y', now - 5]]);
    expect(slugsToResign([post('x'), post('x'), post('y'), post('z')], signed, 0, now, (s) => s !== 'z')).toEqual(['x']);
  });
});
