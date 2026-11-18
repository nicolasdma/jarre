import { describe, expect, it } from 'vitest';
import type { FeedConceptAssets, FeedGraph } from '../feed-graph';
import { buildFeedGraph } from '../feed-graph';
import { generateFeed } from '../feed-generator';
import { isFreshVideo, freshVideos, youtubeEmbedUrl, type FeedVideo } from '../feed-videos';

function concept(id: string, i: number, extra: Partial<FeedConceptAssets> = {}): FeedConceptAssets {
  return {
    id,
    name: `Concept ${id}`,
    definition: `Definition of ${id}`,
    sortOrder: i,
    sectionMarkdown: null,
    drillSlugs: [],
    sayItSlugs: [],
    quizIds: [`${id}-q`],
    cardIds: [`${id}-k`],
    complexityIds: [],
    codeIds: [],
    ...extra,
  };
}

const DAY = '2026-11-18';

function video(id: string, conceptIds: string[], over: Partial<FeedVideo> = {}): FeedVideo {
  return {
    id,
    videoId: id.split('@')[0],
    channel: `ch-${id.length % 4}`,
    channelId: `UC${id.charCodeAt(1) % 5}`,
    title: `Video ${id}`,
    durationSec: 60,
    kind: 'short',
    conceptIds,
    lang: 'en',
    flavor: 'core',
    quality: 0.7,
    fetchedAt: DAY,
    ...over,
  };
}

function makeGraph(videos: FeedVideo[]): FeedGraph {
  const concepts = Array.from({ length: 8 }, (_, i) => concept(`c${i}`, i));
  const graph: FeedGraph = { resourceId: 'lesson-v', concepts, drills: {}, quizzes: {}, cards: {}, complexity: {}, code: {}, asks: {}, videos: {} };
  for (const c of concepts) {
    graph.quizzes[`${c.id}-q`] = { id: `${c.id}-q`, conceptId: c.id, format: 'mc', question: 'Q?', options: [{ label: 'A', text: 'a' }, { label: 'B', text: 'b' }], correctAnswer: 'A', explanation: 'x' };
    graph.cards[`${c.id}-k`] = { id: `${c.id}-k`, conceptId: c.id, prompt: 'P', answer: 'A' };
  }
  for (const v of videos) {
    graph.videos![v.id] = v;
    for (const id of v.conceptIds) {
      const c = concepts.find((x) => x.id === id);
      if (c) (c.videoIds ??= []).push(v.id);
    }
  }
  return graph;
}

// Plenty of videos per concept, both kinds, some outside the mold.
const VIDEOS: FeedVideo[] = [];
for (let c = 0; c < 8; c++) {
  for (let k = 0; k < 12; k++) {
    const long = k % 3 === 0;
    VIDEOS.push(
      video(`v${c}x${k}`, [`c${c}`], {
        kind: long ? 'long' : 'short',
        durationSec: long ? 720 : 50,
        start: long ? 60 : undefined,
        end: long ? 400 : undefined,
        flavor: k % 4 === 1 ? 'oddball' : 'core',
        lang: k === 5 ? 'es' : 'en',
        channelId: `UC-${(c * 7 + k) % 9}`,
        quality: 0.4 + ((c + k) % 5) / 10,
      }),
    );
  }
}
const graph = makeGraph(VIDEOS);
const SEED = { resourceId: 'lesson-v', day: DAY };

function videoPositions(posts: { kind: string }[]): number[] {
  return posts.map((p, i) => (p.kind === 'video' ? i : -1)).filter((i) => i >= 0);
}

describe('videos in the feed: an unpredictable mix, not a cadence', () => {
  const posts = generateFeed(graph, {}, SEED, 2000);
  const at = videoPositions(posts);
  const gaps = at.slice(1).map((p, i) => p - at[i]);

  it('videos are a minority, neither absent nor dominant', () => {
    const share = at.length / posts.length;
    expect(share).toBeGreaterThan(0.06);
    expect(share).toBeLessThan(0.25);
  });

  it('the gaps between videos have no period: widely spread, bursty, many distinct values', () => {
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const sd = Math.sqrt(gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length);
    expect(sd / mean).toBeGreaterThan(0.7); // a fixed cadence would be ~0
    expect(new Set(gaps).size).toBeGreaterThanOrEqual(15);
    const sorted = [...gaps].sort((a, b) => a - b);
    expect(sorted[sorted.length - 1]).toBeGreaterThan(sorted[Math.floor(sorted.length / 2)] * 3);
    // No single gap value dominates (a "every 7 posts" rhythm would).
    const counts = new Map<number, number>();
    for (const g of gaps) counts.set(g, (counts.get(g) ?? 0) + 1);
    expect(Math.max(...counts.values()) / gaps.length).toBeLessThan(0.3);
  });

  it('two videos back to back happen, but rarely', () => {
    const backToBack = gaps.filter((g) => g === 1).length;
    expect(backToBack).toBeGreaterThan(0);
    expect(backToBack / gaps.length).toBeLessThan(0.2);
  });

  it('a video is never followed by a fixed kind of post (no "video then recall card" pattern)', () => {
    const after = new Set(at.filter((i) => i + 1 < posts.length).map((i) => posts[i + 1].kind));
    expect(after.size).toBeGreaterThanOrEqual(3);
  });

  it('every video is on the concept of its post, and from the graph', () => {
    for (const p of posts.filter((x) => x.kind === 'video')) {
      const v = graph.videos![p.videoId!];
      expect(v).toBeDefined();
      expect(v.conceptIds).toContain(p.conceptId);
      expect(p.profile.participation).toBe('passive');
    }
  });

  it('mixes shorts and longs, the usual and the out-of-the-mold, without repeating a video soon', () => {
    const vs = posts.filter((p) => p.kind === 'video').map((p) => graph.videos![p.videoId!]);
    expect(vs.some((v) => v.kind === 'short')).toBe(true);
    expect(vs.some((v) => v.kind === 'long')).toBe(true);
    expect(vs.some((v) => v.flavor === 'oddball')).toBe(true);
    expect(vs.some((v) => v.flavor === 'core')).toBe(true);
    // The same video never comes back within 250 posts.
    const lastAt = new Map<string, number>();
    posts.forEach((p, i) => {
      if (p.kind !== 'video') return;
      const prev = lastAt.get(p.videoId!);
      if (prev !== undefined) expect(i - prev).toBeGreaterThanOrEqual(250);
      lastAt.set(p.videoId!, i);
    });
  });

  it('is deterministic per seed, and another day reshuffles where videos fall', () => {
    expect(generateFeed(graph, {}, SEED, 300)).toEqual(generateFeed(graph, {}, SEED, 300));
    const other = videoPositions(generateFeed(graph, {}, { ...SEED, day: '2026-11-19' }, 300));
    expect(other).not.toEqual(videoPositions(posts.slice(0, 300)));
  });

  it('a lesson without videos keeps exactly the stream it had', () => {
    const plain = makeGraph([]);
    const noField: FeedGraph = { ...plain, videos: undefined };
    expect(generateFeed(plain, {}, SEED, 120)).toEqual(generateFeed(noField, {}, SEED, 120));
    expect(generateFeed(plain, {}, SEED, 120).some((p) => p.kind === 'video')).toBe(false);
  });
});

describe('stale entries (YouTube API data older than 30 days) are ignored', () => {
  it('isFreshVideo: 30 days in, 31 out', () => {
    expect(isFreshVideo('2026-10-19', DAY)).toBe(true); // 30 days
    expect(isFreshVideo('2026-10-18', DAY)).toBe(false); // 31 days
    expect(isFreshVideo('2026-11-19', DAY)).toBe(true); // a day of clock skew
    expect(isFreshVideo('not a date', DAY)).toBe(false);
  });

  it('the generator never shows a stale entry', () => {
    const stale = VIDEOS.map((v, i) => (i % 2 ? { ...v, fetchedAt: '2026-09-01' } : v));
    const g = makeGraph(stale);
    const shown = generateFeed(g, {}, SEED, 1500)
      .filter((p) => p.kind === 'video')
      .map((p) => g.videos![p.videoId!]);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((v) => v.fetchedAt === DAY)).toBe(true);

    const allStale = makeGraph(VIDEOS.map((v) => ({ ...v, fetchedAt: '2026-09-01' })));
    expect(generateFeed(allStale, {}, SEED, 600).some((p) => p.kind === 'video')).toBe(false);
  });

  it('freshVideos filters an index by day', () => {
    expect(freshVideos([video('a', ['c0']), video('b', ['c0'], { fetchedAt: '2026-01-01' })], DAY).map((v) => v.id)).toEqual(['a']);
  });
});

describe('graph and embed', () => {
  it('buildFeedGraph attaches only videos of the lesson concepts', () => {
    const g = buildFeedGraph({
      resourceId: 'l',
      concepts: [{ id: 'k1', name: 'K1', definition: 'd', sortOrder: 0, sectionMarkdown: null }],
      quizzes: [],
      cards: [],
      drills: [],
      interview: null,
      videos: [video('ok', ['k1']), video('other', ['nope'])],
    });
    expect(Object.keys(g.videos ?? {})).toEqual(['ok']);
    expect(g.concepts[0].videoIds).toEqual(['ok']);
  });

  it('embeds through youtube-nocookie, inline, with the segment', () => {
    const url = youtubeEmbedUrl({ videoId: 'abc', start: 90, end: 520 }, { autoplay: true, muted: true });
    expect(url.startsWith('https://www.youtube-nocookie.com/embed/abc?')).toBe(true);
    const q = new URL(url).searchParams;
    expect([q.get('playsinline'), q.get('autoplay'), q.get('mute'), q.get('start'), q.get('end')]).toEqual(['1', '1', '1', '90', '520']);
  });
});
