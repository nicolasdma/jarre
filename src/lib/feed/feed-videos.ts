/**
 * Real YouTube videos in the feed: the shape of the static per-lesson index
 * (src/data/feed-videos/<lesson>.json, written offline by
 * scripts/feed-videos/build-index.ts) and the freshness rule.
 *
 * YouTube API Services policy III.E.4: data from the API (titles, durations,
 * channel names) is kept at most 30 days, then refreshed or dropped. So every
 * entry carries the day it was fetched, and an entry older than
 * MAX_VIDEO_AGE_DAYS on the feed's day is ignored (the generator and the graph
 * both apply isFreshVideo). Refresh with:
 *
 *   npx tsx scripts/feed-videos/build-index.ts
 *
 * Production never calls the API: it reads the committed index.
 */

export type FeedVideoKind = 'short' | 'long';

export interface FeedVideo {
  /** Unique entry id: the videoId, or `videoId@start` for a chapter of a long video. */
  id: string;
  videoId: string;
  channel: string;
  channelId: string;
  title: string;
  /** Length of the whole video, seconds. */
  durationSec: number;
  /** short: vertical 9:16 box. long: 16:9, optionally only a segment. */
  kind: FeedVideoKind;
  /** Lesson concepts this video is about (the classifier's mapping). */
  conceptIds: string[];
  /** Segment of a long video to show (seconds), from its chapters. */
  start?: number;
  end?: number;
  /** The chapter the segment is, when there is one. */
  chapter?: string;
  lang: 'en' | 'es';
  /** core: a known LeetCode channel in English. oddball: anything outside that mold. */
  flavor: 'core' | 'oddball';
  /** 0..1, from views, like ratio and the channel boost. */
  quality: number;
  /** YYYY-MM-DD the API data was fetched. */
  fetchedAt: string;
}

export interface FeedVideoIndex {
  lessonId: string;
  builtAt: string;
  videos: FeedVideo[];
}

export const MAX_VIDEO_AGE_DAYS = 30;

function dayNumber(day: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(day);
  if (!m) return null;
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

/** Whether an entry fetched on `fetchedAt` may still be shown on `day` (both YYYY-MM-DD). */
export function isFreshVideo(fetchedAt: string, day: string): boolean {
  const a = dayNumber(fetchedAt);
  const b = dayNumber(day);
  if (a === null || b === null) return false;
  const age = b - a;
  return age >= 0 ? age <= MAX_VIDEO_AGE_DAYS : age >= -1; // tolerate a day of clock skew
}

/** The fresh entries of an index on `day`. */
export function freshVideos(videos: readonly FeedVideo[], day: string): FeedVideo[] {
  return videos.filter((v) => isFreshVideo(v.fetchedAt, day));
}

/** Watch URL on YouTube (attribution link). */
export function youtubeWatchUrl(v: Pick<FeedVideo, 'videoId' | 'kind' | 'start'>): string {
  if (v.kind === 'short') return `https://www.youtube.com/shorts/${v.videoId}`;
  return `https://www.youtube.com/watch?v=${v.videoId}${v.start ? `&t=${v.start}s` : ''}`;
}

/** The privacy-enhanced embed URL. */
export function youtubeEmbedUrl(
  v: Pick<FeedVideo, 'videoId' | 'start' | 'end'>,
  opts: { autoplay: boolean; muted: boolean; origin?: string },
): string {
  const p = new URLSearchParams({ playsinline: '1', rel: '0', autoplay: opts.autoplay ? '1' : '0' });
  if (opts.muted) p.set('mute', '1');
  if (v.start) p.set('start', String(v.start));
  if (v.end) p.set('end', String(v.end));
  if (opts.origin) p.set('origin', opts.origin);
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.videoId)}?${p.toString()}`;
}

export function youtubeThumbUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}

/** 1:05, 12:30, 1:02:03. */
export function formatSeconds(total: number): string {
  const s = Math.max(0, Math.round(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}
