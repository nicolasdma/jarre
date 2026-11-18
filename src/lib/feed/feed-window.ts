/**
 * The feed's memory bound. The stream is infinite, but what the page holds is
 * not: descriptors far behind the reader are dropped (a spacer keeps their
 * height so the scroll does not jump) and, if the reader scrolls back up,
 * rebuilt exactly from the scheduler, which is deterministic (same seed, same
 * learner → same prefix). So a two-hour scroll holds a few dozen descriptors,
 * not thousands. Pure: tested in __tests__/feed-window.test.ts.
 *
 * Also here: which drill recordings need re-signing as a long session passes
 * the signed URLs' lifetime (POST /api/feed/sign-audio refreshes them for the
 * posts around the reader, ahead of time).
 */

import type { FeedPost } from './feed-post';

/** Descriptors kept behind the active one before a chunk is dropped. */
export const KEEP_BEHIND = 24;
/** How many descriptors are dropped / rebuilt at a time. */
export const DROP_CHUNK = 12;
/** Rebuild a chunk when the reader comes within this many posts of the window's start. */
export const REBUILD_WITHIN = 2;

export interface StreamWindow {
  /** Absolute index (in the infinite stream) of posts[0]. */
  base: number;
  posts: FeedPost[];
}

/** The absolute index past the last held post. */
export function windowEnd(win: StreamWindow): number {
  return win.base + win.posts.length;
}

export function postAt(win: StreamWindow, index: number): FeedPost | undefined {
  return win.posts[index - win.base];
}

/** How many descriptors to drop from the front now (0 or DROP_CHUNK). */
export function dropCount(win: StreamWindow, activeIndex: number): number {
  return activeIndex - win.base > KEEP_BEHIND + DROP_CHUNK && win.posts.length > DROP_CHUNK ? DROP_CHUNK : 0;
}

/** How many dropped descriptors to rebuild in front now (0 when not needed). */
export function rebuildCount(win: StreamWindow, activeIndex: number): number {
  if (win.base === 0 || activeIndex >= win.base + REBUILD_WITHIN) return 0;
  return Math.min(DROP_CHUNK, win.base);
}

/**
 * The descriptors [from, to) of the stream, regenerated from a fresh
 * scheduler. `take` is the scheduler's (deterministic) `take` from post 0.
 */
export function rebuildRange(take: (n: number) => FeedPost[], from: number, to: number): FeedPost[] {
  return take(to).slice(from, to);
}

/** Signed URLs live 4 h (fetchPracticeDrills, sign-audio): refresh well before. */
export const AUDIO_RESIGN_AFTER_MS = 3 * 60 * 60 * 1000;

/**
 * The drill slugs, among the given posts, whose recording URL is older than
 * the refresh age (signed at page load unless re-signed since).
 */
export function slugsToResign(
  posts: readonly FeedPost[],
  signedAt: ReadonlyMap<string, number>,
  loadedAt: number,
  now: number,
  hasAudio: (slug: string) => boolean,
): string[] {
  const out = new Set<string>();
  for (const p of posts) {
    const slug = p.drillSlug;
    if (!slug || out.has(slug) || !hasAudio(slug)) continue;
    if (now - (signedAt.get(slug) ?? loadedAt) >= AUDIO_RESIGN_AFTER_MS) out.add(slug);
  }
  return [...out];
}
