/**
 * The committed YouTube indexes, by lesson id (src/data/feed-videos/*.json,
 * written by scripts/feed-videos/build-index.ts). Server-side only: the feed
 * page picks its lesson's fresh entries and hands them to the graph, so the
 * client gets one lesson's videos, never the whole set.
 */

import type { FeedVideo, FeedVideoIndex } from './feed-videos';
import { freshVideos } from './feed-videos';
import v2 from '@/data/feed-videos/3y-health-tecnica-v2.json';
import repaso from '@/data/feed-videos/3y-health-tecnica-repaso.json';

const INDEXES: Record<string, FeedVideoIndex> = Object.fromEntries(
  ([v2, repaso] as unknown as FeedVideoIndex[]).map((ix) => [ix.lessonId, ix]),
);

/** The lesson's index entries that may still be shown on `day` (30-day rule). */
export function lessonVideos(lessonId: string, day: string): FeedVideo[] {
  const ix = INDEXES[lessonId];
  return ix ? freshVideos(ix.videos, day) : [];
}
