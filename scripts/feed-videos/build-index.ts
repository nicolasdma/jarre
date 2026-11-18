/**
 * Builds the static YouTube video index of each lesson's feed
 * (src/data/feed-videos/<lesson>.json). Offline: production reads the JSON
 * and never calls the API.
 *
 *   npx tsx scripts/feed-videos/build-index.ts                 # all lessons
 *   npx tsx scripts/feed-videos/build-index.ts --search-budget 40
 *   npx tsx scripts/feed-videos/build-index.ts --fresh         # ignore the cache
 *
 * REFRESH RULE (YouTube API Services policy III.E.4): API data is kept at most
 * 30 days. Every entry carries `fetchedAt`; the feed ignores entries older than
 * 30 days (src/lib/feed/feed-videos.ts, isFreshVideo). Re-run this at least
 * every 3-4 weeks: videos.list is always re-fetched (cheap), searches and
 * channel walks come from a local cache for up to 20 days.
 *
 * Sources (owner, 2026-11-18: any channel is welcome when clearly on topic;
 * the channel list below is a quality BOOST and a cheap source of candidates,
 * not a gate):
 * - Topic searches (search.list, its own bucket of 100 calls/day): shorts in
 *   English per topic, Spanish per idea topic, then medium-length English.
 *   Uncached calls stop at --search-budget (default 70), so a day's runs never
 *   exhaust the bucket; the next run continues where the cache ends.
 * - Uploads of the boosted channels (playlistItems.list, 1 unit per 50).
 * - Details of every candidate (videos.list, 1 unit per 50), then the pure
 *   classifier (src/lib/feed/video-classifier.ts) decides.
 *
 * Needs YOUTUBE_API_KEY in .env.local (never printed). Cache:
 * ~/.cache/jarre-feed-videos (or FEED_VIDEOS_CACHE).
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { classifyVideo, parseIsoDuration, topicsNamedIn, normalizeText, toLessonEntry, type ChannelTier, type RawVideo, type VideoCandidate, type RejectReason } from '../../src/lib/feed/video-classifier';
import { LESSON_VIDEO_TOPICS, TOPIC_BY_ID } from '../../src/lib/feed/video-topics';
import type { FeedVideo, FeedVideoIndex } from '../../src/lib/feed/feed-videos';

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'src/data/feed-videos');
const CACHE_DIR = process.env.FEED_VIDEOS_CACHE ?? path.join(os.homedir(), '.cache/jarre-feed-videos');
const API = 'https://www.googleapis.com/youtube/v3';
const CACHE_DAYS = 20;
const MAX_PAGES_PER_CHANNEL = 40;
/** Per concept, at most this many entries (best quality first, shorts and longs balanced). */
const PER_CONCEPT_MAX = 16;

/** Boosted channels: verified by handle at run time; a handle that does not resolve is reported and skipped. */
const CHANNELS: { handle: string; tier: ChannelTier }[] = [
  { handle: '@NeetCode', tier: 'core' },
  { handle: '@NeetCodeIO', tier: 'core' },
  { handle: '@GregHogg', tier: 'core' },
  { handle: '@takeUforward', tier: 'core' },
  { handle: '@BackToBackSWE', tier: 'core' },
  { handle: '@KevinNaughtonJr', tier: 'core' },
  { handle: '@NickWhite', tier: 'core' },
  { handle: '@Errichto2', tier: 'core' },
  { handle: '@ashishps_1', tier: 'core' },
  { handle: '@abdul_bari', tier: 'boost' },
  { handle: '@WilliamFiset-videos', tier: 'boost' },
  { handle: '@MichaelSambol', tier: 'boost' },
  { handle: '@Fireship', tier: 'boost' },
  { handle: '@Reducible', tier: 'boost' },
  { handle: '@SpanningTree', tier: 'boost' },
  { handle: '@CSDojo', tier: 'boost' },
  { handle: '@mCoding', tier: 'boost' },
  { handle: '@BroCodez', tier: 'boost' },
];

// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const FRESH = process.argv.includes('--fresh');
const SEARCH_BUDGET = Number(arg('--search-budget') ?? 70);
/** Write every decision (accepted entry or reject reason, with the title) to this TSV, to audit the filter. */
const DEBUG = arg('--debug');

function loadKey(): string {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  const env = path.join(ROOT, '.env.local');
  if (existsSync(env)) {
    for (const line of readFileSync(env, 'utf8').split('\n')) {
      const m = /^\s*YOUTUBE_API_KEY\s*=\s*"?([^"\n]+)"?\s*$/.exec(line);
      if (m) return m[1].trim();
    }
  }
  throw new Error('YOUTUBE_API_KEY missing (.env.local)');
}
const KEY = loadKey();

const quota = { search: 0, units: 0, cachedSearch: 0, cachedUnits: 0 };

function cachePath(url: string): string {
  return path.join(CACHE_DIR, `${createHash('sha1').update(url).digest('hex')}.json`);
}

function pruneCache(): void {
  if (!existsSync(CACHE_DIR)) return;
  const max = 30 * 86_400_000; // never keep API data past 30 days
  for (const f of readdirSync(CACHE_DIR)) {
    const p = path.join(CACHE_DIR, f);
    if (Date.now() - statSync(p).mtimeMs > max) rmSync(p);
  }
}

class BudgetExhausted extends Error {}

async function get<T>(endpoint: string, params: Record<string, string>, opts: { cache: boolean; search?: boolean }): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const id = `${endpoint}?${qs}`;
  const cp = cachePath(id);
  if (opts.cache && !FRESH && existsSync(cp) && Date.now() - statSync(cp).mtimeMs < CACHE_DAYS * 86_400_000) {
    if (opts.search) quota.cachedSearch++;
    else quota.cachedUnits++;
    return JSON.parse(readFileSync(cp, 'utf8')) as T;
  }
  if (opts.search && quota.search >= SEARCH_BUDGET) throw new BudgetExhausted();
  const res = await fetch(`${API}/${endpoint}?${qs}&key=${encodeURIComponent(KEY)}`);
  if (opts.search) quota.search++;
  else quota.units++;
  if (!res.ok) {
    const body = (await res.text()).replace(KEY, '<key>');
    throw new Error(`${endpoint} ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as T;
  if (opts.cache) {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cp, JSON.stringify(data));
  }
  return data;
}

// ---------------------------------------------------------------------------

interface Candidate {
  tier?: ChannelTier;
  via: Set<string>;
}

async function resolveChannels(): Promise<{ kept: { handle: string; id: string; title: string; uploads: string; tier: ChannelTier }[]; dropped: string[] }> {
  const kept: { handle: string; id: string; title: string; uploads: string; tier: ChannelTier }[] = [];
  const dropped: string[] = [];
  for (const c of CHANNELS) {
    const data = await get<{ items?: { id: string; snippet: { title: string }; contentDetails: { relatedPlaylists: { uploads: string } } }[] }>(
      'channels',
      { part: 'id,snippet,contentDetails', forHandle: c.handle },
      { cache: true },
    );
    const it = data.items?.[0];
    if (!it) {
      dropped.push(c.handle);
      continue;
    }
    kept.push({ handle: c.handle, id: it.id, title: it.snippet.title, uploads: it.contentDetails.relatedPlaylists.uploads, tier: c.tier });
  }
  return { kept, dropped };
}

function looksOnTopic(title: string, description: string): boolean {
  const t = normalizeText(title);
  if (topicsNamedIn(t).length) return true;
  // A short whose title is a hook: let the classifier look at its description.
  return /#shorts?\b/.test(t) && topicsNamedIn(normalizeText(description.slice(0, 1500))).length > 0;
}

async function walkUploads(uploads: string, tier: ChannelTier, label: string, cands: Map<string, Candidate>): Promise<number> {
  let pageToken: string | undefined;
  let seen = 0;
  for (let page = 0; page < MAX_PAGES_PER_CHANNEL; page++) {
    const params: Record<string, string> = { part: 'snippet', playlistId: uploads, maxResults: '50' };
    if (pageToken) params.pageToken = pageToken;
    const data = await get<{ nextPageToken?: string; items?: { snippet: { title: string; description: string; resourceId: { videoId: string } } }[] }>(
      'playlistItems',
      params,
      { cache: true },
    );
    for (const it of data.items ?? []) {
      seen++;
      if (!looksOnTopic(it.snippet.title, it.snippet.description)) continue;
      const id = it.snippet.resourceId.videoId;
      const c = cands.get(id) ?? { via: new Set<string>() };
      c.tier = tier;
      c.via.add(label);
      cands.set(id, c);
    }
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return seen;
}

interface SearchSpec {
  topicId: string;
  q: string;
  lang: 'en' | 'es';
  duration: 'short' | 'medium' | 'any';
}

function searchPlan(): SearchSpec[] {
  // Topic order: the lessons' own order (v2 first), ideas before problems within a lesson's later pass.
  const order: string[] = [];
  for (const lesson of Object.keys(LESSON_VIDEO_TOPICS)) {
    for (const t of Object.keys(LESSON_VIDEO_TOPICS[lesson])) if (!order.includes(t)) order.push(t);
  }
  const plan: SearchSpec[] = [];
  const ideas = order.filter((t) => TOPIC_BY_ID[t].kind === 'idea');
  const problems = order.filter((t) => TOPIC_BY_ID[t].kind === 'problem');
  // 1. An English shorts search per idea (channel walks rarely cover ideas).
  for (const t of ideas) plan.push({ topicId: t, q: TOPIC_BY_ID[t].query, lang: 'en', duration: 'short' });
  // 2. Spanish per idea that has Spanish content.
  for (const t of ideas) {
    const qEs = TOPIC_BY_ID[t].queryEs;
    if (qEs) plan.push({ topicId: t, q: qEs, lang: 'es', duration: 'any' });
  }
  // 3. An English shorts search per problem, lessons in order (long ones come from the channel walks).
  for (const t of problems) plan.push({ topicId: t, q: TOPIC_BY_ID[t].query, lang: 'en', duration: 'short' });
  // 4. Medium-length English explainers for the ideas.
  for (const t of ideas) plan.push({ topicId: t, q: TOPIC_BY_ID[t].query, lang: 'en', duration: 'medium' });
  return plan;
}

async function runSearches(cands: Map<string, Candidate>, tiers: Map<string, ChannelTier>): Promise<{ done: number; skipped: number }> {
  const plan = searchPlan();
  let done = 0;
  for (const s of plan) {
    const params: Record<string, string> = {
      part: 'snippet',
      type: 'video',
      q: s.q,
      maxResults: '50',
      videoEmbeddable: 'true',
      safeSearch: 'strict',
      relevanceLanguage: s.lang,
    };
    if (s.duration !== 'any') params.videoDuration = s.duration;
    try {
      const data = await get<{ items?: { id: { videoId?: string }; snippet: { channelId: string; title: string; description: string } }[] }>('search', params, { cache: true, search: true });
      done++;
      for (const it of data.items ?? []) {
        const id = it.id.videoId;
        if (!id) continue;
        const c = cands.get(id) ?? { via: new Set<string>() };
        c.tier = c.tier ?? tiers.get(it.snippet.channelId);
        c.via.add(`search:${s.lang}:${s.duration}`);
        cands.set(id, c);
      }
    } catch (e) {
      if (e instanceof BudgetExhausted) return { done, skipped: plan.length - done };
      throw e;
    }
  }
  return { done, skipped: 0 };
}

interface ApiVideo {
  id: string;
  snippet: { title: string; description: string; tags?: string[]; channelId: string; channelTitle: string; liveBroadcastContent: string; defaultAudioLanguage?: string; defaultLanguage?: string };
  contentDetails: { duration: string };
  status: { embeddable: boolean; madeForKids?: boolean; privacyStatus: string };
  statistics: { viewCount?: string; likeCount?: string };
  player?: { embedWidth?: string; embedHeight?: string };
}

async function fetchDetails(ids: string[]): Promise<ApiVideo[]> {
  const out: ApiVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const data = await get<{ items?: ApiVideo[] }>(
      'videos',
      { part: 'snippet,contentDetails,status,statistics,player', id: ids.slice(i, i + 50).join(','), maxHeight: '720' },
      { cache: false },
    );
    out.push(...(data.items ?? []));
  }
  return out;
}

function toRaw(v: ApiVideo): RawVideo {
  return {
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description ?? '',
    tags: v.snippet.tags ?? [],
    channelId: v.snippet.channelId,
    channelTitle: v.snippet.channelTitle,
    durationSec: parseIsoDuration(v.contentDetails.duration),
    views: Number(v.statistics.viewCount ?? 0),
    likes: v.statistics.likeCount !== undefined ? Number(v.statistics.likeCount) : null,
    embeddable: v.status.embeddable,
    madeForKids: Boolean(v.status.madeForKids),
    live: v.snippet.liveBroadcastContent,
    privacy: v.status.privacyStatus,
    lang: v.snippet.defaultAudioLanguage ?? v.snippet.defaultLanguage ?? null,
    width: v.player?.embedWidth ? Number(v.player.embedWidth) : null,
    height: v.player?.embedHeight ? Number(v.player.embedHeight) : null,
  };
}

/**
 * Best entries per concept, with room for variety: up to 2 in Spanish and 3
 * outside the usual mold go in first (they rarely win on views alone), then
 * the rest by quality, alternating shorts and longs so both kinds survive.
 */
function capPerConcept(entries: FeedVideo[]): FeedVideo[] {
  const byConcept = new Map<string, FeedVideo[]>();
  for (const e of entries) for (const c of e.conceptIds) byConcept.set(c, [...(byConcept.get(c) ?? []), e]);
  const keep = new Set<string>();
  for (const list of byConcept.values()) {
    const sorted = [...list].sort((a, b) => b.quality - a.quality);
    const picked = new Set<FeedVideo>();
    for (const e of sorted.filter((x) => x.lang === 'es').slice(0, 2)) picked.add(e);
    for (const e of sorted.filter((x) => x.flavor === 'oddball' && x.lang === 'en').slice(0, 3)) picked.add(e);
    const shorts = sorted.filter((e) => e.kind === 'short' && !picked.has(e));
    const longs = sorted.filter((e) => e.kind === 'long' && !picked.has(e));
    while (picked.size < PER_CONCEPT_MAX && (shorts.length || longs.length)) {
      const s = shorts.shift();
      if (s) picked.add(s);
      const l = longs.shift();
      if (l && picked.size < PER_CONCEPT_MAX) picked.add(l);
    }
    for (const p of picked) keep.add(p.id);
  }
  return entries.filter((e) => keep.has(e.id));
}

async function main(): Promise<void> {
  pruneCache();
  const today = new Date().toISOString().slice(0, 10);
  const cands = new Map<string, Candidate>();

  const { kept, dropped } = await resolveChannels();
  const tiers = new Map(kept.map((c) => [c.id, c.tier]));
  const walked: string[] = [];
  for (const c of kept) {
    const n = await walkUploads(c.uploads, c.tier, c.handle, cands);
    walked.push(`${c.title} (${c.handle}, ${c.tier}): ${n} uploads scanned`);
  }
  const searches = await runSearches(cands, tiers);

  const details = await fetchDetails([...cands.keys()]);
  const rejects: Record<RejectReason, number> = { 'not-playable': 0, 'too-short': 0, language: 0, junk: 0, 'off-domain': 0, 'off-topic': 0, unpopular: 0, 'too-long': 0 };
  const accepted: VideoCandidate[] = [];
  const audit: string[] = ['decision\ttopics\tkind\tsec\tviews\tlang\tchannel\ttitle\tvia'];
  for (const v of details) {
    const raw = toRaw(v);
    const r = classifyVideo(raw, { tier: cands.get(raw.id)?.tier ?? tiers.get(raw.channelId), fetchedAt: today });
    const via = [...(cands.get(raw.id)?.via ?? [])].join(',');
    if (r.ok) {
      accepted.push(...r.entries);
      for (const e of r.entries) audit.push(['ok', e.topicIds.join(','), e.kind + (e.start !== undefined ? `@${e.start}-${e.end}` : ''), raw.durationSec, raw.views, e.lang, raw.channelTitle, raw.title, via].join('\t'));
    } else {
      rejects[r.reason]++;
      audit.push([r.reason, '', '', raw.durationSec, raw.views, raw.lang ?? '', raw.channelTitle, raw.title, via].join('\t'));
    }
  }
  if (DEBUG) writeFileSync(DEBUG, `${audit.join('\n')}\n`);

  mkdirSync(OUT_DIR, { recursive: true });
  const report: string[] = [];
  for (const lessonId of Object.keys(LESSON_VIDEO_TOPICS)) {
    const seen = new Set<string>();
    const entries: FeedVideo[] = [];
    for (const c of accepted) {
      const e = toLessonEntry(c, lessonId);
      if (!e || seen.has(e.id)) continue;
      seen.add(e.id);
      entries.push(e);
    }
    const videos = capPerConcept(entries).sort((a, b) => a.conceptIds[0].localeCompare(b.conceptIds[0]) || b.quality - a.quality);
    const index: FeedVideoIndex = { lessonId, builtAt: new Date().toISOString(), videos };
    writeFileSync(path.join(OUT_DIR, `${lessonId}.json`), `${JSON.stringify(index, null, 1)}\n`);
    const perConcept = new Map<string, number>();
    for (const v of videos) for (const c of v.conceptIds) perConcept.set(c, (perConcept.get(c) ?? 0) + 1);
    const shorts = videos.filter((v) => v.kind === 'short').length;
    report.push(`\n${lessonId}: ${videos.length} entries (${shorts} shorts, ${videos.length - shorts} long/segments), ${videos.filter((v) => v.lang === 'es').length} es, ${videos.filter((v) => v.flavor === 'oddball').length} oddball`);
    const concepts = Object.values(LESSON_VIDEO_TOPICS[lessonId]).flat();
    for (const c of [...new Set(concepts)]) report.push(`  ${c}: ${perConcept.get(c) ?? 0}`);
  }

  console.log('Channels kept:');
  for (const w of walked) console.log(`  ${w}`);
  console.log(`Channels dropped (handle did not resolve): ${dropped.join(', ') || 'none'}`);
  console.log(`Searches: ${searches.done} done, ${searches.skipped} left for the next run (budget ${SEARCH_BUDGET})`);
  console.log(`Candidates: ${cands.size}, details fetched: ${details.length}, accepted entries: ${accepted.length}`);
  console.log(`Rejected: ${JSON.stringify(rejects)}`);
  console.log(report.join('\n'));
  console.log(`\nQuota this run: search.list ${quota.search} calls (+${quota.cachedSearch} from cache), other ${quota.units} units (+${quota.cachedUnits} from cache)`);
}

main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e).replace(KEY, '<key>'));
  process.exit(1);
});
