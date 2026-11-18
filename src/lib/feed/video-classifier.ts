/**
 * The LLM-free on-topic filter for YouTube videos (owner, 2026-11-18: any
 * channel is welcome when the video is clearly about the topic; the trusted
 * channels are a quality boost, not a gate). Pure: the build script
 * (scripts/feed-videos/build-index.ts) hands in what videos.list returned and
 * gets back index entries, or nothing.
 *
 * A video gets in when ALL of these hold:
 * 1. Playable and clean: public, embeddable, not made for kids, not live,
 *    20 s or longer, English or Spanish.
 * 2. Not junk: no reaction / prank / vlog / salary / giveaway / gaming /
 *    crypto-scam words in its title or tags, no scam contact patterns in the
 *    description.
 * 3. In the domain: some anchor (leetcode, algorithm, data structure, coding
 *    interview, a language name, Big-O…) in title, tags or description.
 * 4. On a topic of the closed taxonomy (video-topics.ts): named in its TITLE
 *    (or LeetCode number), or in a CHAPTER (then only that chapter is shown);
 *    a short may instead be named by its tags plus description. A video that
 *    names a problem is about that problem: idea topics then do not count.
 *    More than two problems in one title is a compilation: only its chapters.
 * 5. Popular enough for its kind (views, like ratio), with a lower bar for
 *    the boosted channels.
 */

import { TOPIC_BY_ID, VIDEO_TOPICS, LESSON_VIDEO_TOPICS, type VideoTopic } from './video-topics';
import type { FeedVideo, FeedVideoKind } from './feed-videos';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** What videos.list (snippet, contentDetails, status, statistics, player) says about a video. */
export interface RawVideo {
  id: string;
  title: string;
  description: string;
  tags: string[];
  channelId: string;
  channelTitle: string;
  /** contentDetails.duration, seconds. */
  durationSec: number;
  views: number;
  /** null when the channel hides likes. */
  likes: number | null;
  embeddable: boolean;
  madeForKids: boolean;
  /** snippet.liveBroadcastContent: 'none' | 'live' | 'upcoming'. */
  live: string;
  privacy: string;
  /** snippet.defaultAudioLanguage ?? snippet.defaultLanguage. */
  lang: string | null;
  /** player.embedWidth/embedHeight (aspect), when known. */
  width: number | null;
  height: number | null;
}

/** A channel's boost tier: core LeetCode channels, or known good channels outside that mold. */
export type ChannelTier = 'core' | 'boost';

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** ISO 8601 duration (PT1H2M3S) to seconds. */
export function parseIsoDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
}

function stamp(s: string): number {
  return s.split(':').reduce((acc, part) => acc * 60 + Number(part), 0);
}

export interface Chapter {
  start: number;
  title: string;
}

/**
 * Chapters from a description, the way YouTube makes them: lines with a
 * timestamp, the first at 0:00, at least three, ascending.
 */
export function parseChapters(description: string): Chapter[] {
  const out: Chapter[] = [];
  const TS = '((?:\\d{1,2}:)?\\d{1,2}:\\d{2})';
  const lead = new RegExp(`^\\s*[\\[(]?${TS}[\\])]?\\s*[-–—:|.)]?\\s*(.+?)\\s*$`);
  const trail = new RegExp(`^\\s*(.+?)\\s*[-–—:|]?\\s*[\\[(]?${TS}[\\])]?\\s*$`);
  for (const line of description.split(/\r?\n/)) {
    let m = lead.exec(line);
    if (m) {
      out.push({ start: stamp(m[1]), title: m[2] });
      continue;
    }
    m = trail.exec(line);
    if (m && /\d:\d{2}\s*[\])]?\s*$/.test(line)) out.push({ start: stamp(m[2]), title: m[1] });
  }
  if (out.length < 3 || out[0].start !== 0) return [];
  for (let i = 1; i < out.length; i++) if (out[i].start <= out[i - 1].start) return [];
  return out;
}

function lcHit(text: string, n: number): boolean {
  return new RegExp(`(?:leet\\s*code|(?<![a-z])lc)\\s*(?:#|no\\.?|problem|question)?\\s*${n}(?![\\da-z])`).test(text);
}

/** LeetCode numbers a text names ("leetcode 3043", "lc 76"). */
function lcNumbers(text: string): Set<number> {
  const out = new Set<number>();
  for (const m of text.matchAll(/(?:leet\s*code|(?<![a-z])lc)\s*(?:#|no\.?|problem|question)?\s*(\d+)(?![\da-z])/g)) out.add(Number(m[1]));
  return out;
}

/** The topics a piece of (normalized) text names. */
export function topicsNamedIn(text: string, opts: { allowLcNumber?: boolean } = {}): VideoTopic[] {
  const hits: VideoTopic[] = [];
  const numbers = lcNumbers(text);
  for (const t of VIDEO_TOPICS) {
    const named = t.names.some((rx) => rx.test(text)) || (opts.allowLcNumber !== false && t.lc !== undefined && lcHit(text, t.lc));
    if (!named) continue;
    if (t.not?.some((rx) => rx.test(text))) continue;
    // "Find the Length of the Longest Common Prefix - Leetcode 3043": a sibling problem, not ours.
    if (t.kind === 'problem' && t.lc !== undefined && numbers.size && !numbers.has(t.lc)) continue;
    hits.push(t);
  }
  // A problem named means the video is about that problem.
  return hits.some((t) => t.kind === 'problem') ? hits.filter((t) => t.kind === 'problem') : hits;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/** Title words that mean it is not a study video. */
const JUNK = [
  /\breact(ion|ing to|s to)\b/,
  /\bprank/,
  /\bvlog/,
  /day in (the|my) life/,
  /\bsalary|\bsalaries|\bpaycheck|\bcompensation|\btc\b/,
  /giveaway|sorteo/,
  /\bmeme/,
  /\basmr\b/,
  /\blofi\b|\blo-fi\b|\bmusic\b|\bplaylist\b/,
  /\bpodcast\b/,
  /live ?stream|\bstreaming live\b|\ben vivo\b|\bdirecto\b/,
  /\bcrypto|bitcoin|\bnft\b|forex|\btrading\b|airdrop|\bcasino|\bbetting\b|make money|earn \$|passive income/,
  /minecraft|fortnite|roblox|\bgta\b|valorant|gameplay|speedrun/,
  /\bcheat(ing)?\b|\bhack(ed)? (the|my) interview/,
  /\blayoffs?\b|\bfired\b|\bquit my job\b|\bresume\b|\bcv tips\b/,
];

/** Tags are noisy (channels paste dozens): only unmistakable junk counts there. */
const TAG_JUNK = [/\bprank/, /\breaction\b/, /minecraft|fortnite|roblox|\bgta\b|valorant/, /\bcrypto|bitcoin|\bnft\b|forex|\bcasino|airdrop/, /\basmr\b/];

/**
 * An idea video whose title is really about some OTHER problem ("Job
 * Sequencing Problem | Greedy", "First Bad Version - Leetcode 278 - Binary
 * Search") is that problem's video, not the idea's.
 */
const OTHER_PROBLEM = /(?<![a-z])(using|with) (a |an )?(hash|heap|stack|queue|priority queue|binary search|two pointers?|sliding window|bfs|dfs|dp|dynamic programming|backtracking|recursion)|leet\s*code\s*#?\s*\d|(?<![a-z])lc\s*\d|codeforces|hackerrank|geeksforgeeks|(?<![a-z])gfg(?![a-z])|(?<![a-z])potd(?![a-z])|\bcontest\b|\bproblem\b(?!s)/;

/**
 * An idea title names the idea up front ("Binary Search in 100 Seconds"); when
 * the idea only shows after a separator ("BS-14. Find the Smallest Divisor |
 * Binary Search", "Job Sequencing | Greedy") the video is about that other
 * problem. The head is the first segment, or the first one with three words
 * when the first is a label ("Explained | Priority Queue Functions").
 */
function ideaLeadsTitle(title: string, named: VideoTopic[]): boolean {
  if (!named.length) return true;
  const segs = title.split(/\s[|\-–—:•]\s|\s?\|\s?/).map((x) => x.trim()).filter(Boolean);
  if (segs.length < 2) return true;
  const head = segs.find((x) => x.split(' ').length >= 3) ?? segs[0];
  return named.some((t) => t.names.some((rx) => rx.test(segs[0]) || rx.test(head)));
}

const SCAM = [/(telegram|whatsapp)\s*[:@+]/, /\bairdrop\b/, /binary options/, /investment plan/, /dm me/];

const DOMAIN = [
  /leet\s*code/, /\balgorithms?\b/, /data structures?/, /\bdsa\b/, /coding interview/, /technical interview/, /\binterview\b/,
  /\bprogramming\b/, /\bpython\b/, /\bjava\b/, /javascript/, /typescript/, /c\+\+/, /\bgolang\b/, /\brust\b/,
  /big[\s-]?o\b/, /complexity/, /neetcode/, /\bcoding\b/, /computer science/,
  /algoritmos?/, /estructuras? de datos/, /programacion/, /entrevista/,
];

const NON_LATIN = /[\u0400-\u04ff\u0590-\u06ff\u0900-\u0dff\u0e00-\u0eff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
const OTHER_LANG = /\bin hindi\b|\bhindi\b|\bhinglish\b|\bem portugues\b|\bportugues\b|\ben francais\b|\bauf deutsch\b|\bin urdu\b|\btamil\b|\btelugu\b|\bbangla\b|\bbengali\b/;
const SPANISH = /\b(que|como|para|con|una|los|las|del|explicado|explicacion|algoritmo|ejercicio|resolviendo|entrevista|programacion|en espanol|aprende)\b/;

/** en, es, or null when it is another language. */
export function videoLanguage(raw: Pick<RawVideo, 'lang' | 'title' | 'tags'>): 'en' | 'es' | null {
  const code = raw.lang?.toLowerCase() ?? null;
  const title = normalizeText(raw.title);
  if (NON_LATIN.test(raw.title) || OTHER_LANG.test(title) || raw.tags.some((t) => OTHER_LANG.test(normalizeText(t)))) return null;
  if (code && code !== 'und' && code !== 'zxx') {
    if (code.startsWith('en')) return 'en';
    if (code.startsWith('es')) return 'es';
    return null;
  }
  return SPANISH.test(title) ? 'es' : 'en';
}

export type RejectReason =
  | 'not-playable'
  | 'too-short'
  | 'language'
  | 'junk'
  | 'off-domain'
  | 'off-topic'
  | 'unpopular'
  | 'too-long';

export interface ClassifyOptions {
  tier?: ChannelTier;
  /** YYYY-MM-DD, stamped on every entry. */
  fetchedAt: string;
}

/** A classified video before the lesson mapping: topic ids instead of concept ids. */
export interface VideoCandidate extends Omit<FeedVideo, 'conceptIds'> {
  topicIds: string[];
}

export type ClassifyResult = { ok: true; entries: VideoCandidate[] } | { ok: false; reason: RejectReason };

const SHORT_MAX_SEC = 180;
const MIN_SEC = 20;
/** A whole long video longer than this is not a feed post; only its chapters are. */
const LONG_WHOLE_MAX_SEC = 25 * 60;
/** A segment never plays longer than this. */
const SEGMENT_MAX_SEC = 12 * 60;
const SEGMENT_MIN_SEC = 40;

const EXPLAIN = /drawing|explanation|explained|intuition|approach|idea|visuali[sz]|walkthrough|solution|optimal|how it works|dry run|explicacion|intuicion/;
const NOT_EXPLAIN = /\bcoding\b|\bcode\b|read(ing)? (the )?problem|\bintro|outro|sponsor|conclusion|\bending\b|subscribe/;

function quality(raw: RawVideo, tier: ChannelTier | undefined): number {
  const v = Math.min(1, Math.max(0, Math.log10(Math.max(1, raw.views)) / 7));
  const ratio = raw.likes !== null && raw.views > 0 ? Math.min(1, raw.likes / raw.views / 0.04) : 0.5;
  const boost = tier === 'core' ? 0.25 : tier === 'boost' ? 0.15 : 0;
  return Math.round(Math.min(1, 0.55 * v + 0.2 * ratio + boost) * 100) / 100;
}

function popularEnough(raw: RawVideo, kind: FeedVideoKind, tier: ChannelTier | undefined, lang: 'en' | 'es'): boolean {
  // Spanish study content has a smaller audience: a lower bar, same like ratio.
  const min = tier ? 300 : lang === 'es' ? (kind === 'short' ? 800 : 1500) : kind === 'short' ? 1500 : 3000;
  if (raw.views < min) return false;
  if (raw.likes !== null && raw.views >= 1000 && raw.likes / raw.views < 0.002) return false;
  return true;
}

/** The segment of a single-topic long video worth showing: its explanation chapter. */
export function explanationSegment(chapters: Chapter[], durationSec: number): { start: number; end: number; chapter: string } | null {
  for (let i = 0; i < chapters.length; i++) {
    const t = normalizeText(chapters[i].title);
    if (!EXPLAIN.test(t) || NOT_EXPLAIN.test(t)) continue;
    return segmentAt(chapters, i, durationSec);
  }
  return null;
}

function segmentAt(chapters: Chapter[], i: number, durationSec: number): { start: number; end: number; chapter: string } {
  const start = chapters[i].start;
  let j = i + 1;
  // A chapter too short to say anything runs into the next one.
  while (j < chapters.length && chapters[j].start - start < SEGMENT_MIN_SEC) j++;
  const natural = j < chapters.length ? chapters[j].start : durationSec;
  return { start, end: Math.min(natural, start + SEGMENT_MAX_SEC), chapter: chapters[i].title };
}

export function classifyVideo(raw: RawVideo, opts: ClassifyOptions): ClassifyResult {
  if (!raw.embeddable || raw.madeForKids || raw.live !== 'none' || raw.privacy !== 'public') return { ok: false, reason: 'not-playable' };
  if (raw.durationSec < MIN_SEC) return { ok: false, reason: 'too-short' };
  const lang = videoLanguage(raw);
  if (!lang) return { ok: false, reason: 'language' };

  const title = normalizeText(raw.title);
  const tags = normalizeText(raw.tags.join(' | '));
  const desc = normalizeText(raw.description.slice(0, 1500));
  if (JUNK.some((rx) => rx.test(title)) || TAG_JUNK.some((rx) => rx.test(tags))) return { ok: false, reason: 'junk' };
  if (SCAM.some((rx) => rx.test(desc))) return { ok: false, reason: 'junk' };
  if (!DOMAIN.some((rx) => rx.test(title) || rx.test(tags) || rx.test(desc))) return { ok: false, reason: 'off-domain' };

  const vertical = raw.width && raw.height ? raw.height > raw.width : raw.durationSec <= SHORT_MAX_SEC && /#shorts?\b/.test(`${title} ${tags} ${desc}`);
  const kind: FeedVideoKind = vertical ? 'short' : 'long';
  if (!popularEnough(raw, kind, opts.tier, lang)) return { ok: false, reason: 'unpopular' };

  const base = {
    videoId: raw.id,
    channel: raw.channelTitle,
    channelId: raw.channelId,
    title: raw.title,
    durationSec: raw.durationSec,
    kind,
    lang,
    flavor: (opts.tier === 'core' && lang === 'en' ? 'core' : 'oddball') as 'core' | 'oddball',
    quality: quality(raw, opts.tier),
    fetchedAt: opts.fetchedAt,
  };

  const named = topicsNamedIn(title);
  /** The title is about a problem outside the taxonomy: its idea mentions do not count, anywhere. */
  const otherProblem = !named.some((t) => t.kind === 'problem') && (OTHER_PROBLEM.test(title) || !ideaLeadsTitle(title, named));
  const titleTopics = otherProblem ? [] : named;
  const problems = titleTopics.filter((t) => t.kind === 'problem');
  const compilation = problems.length > 2;

  if (kind === 'short') {
    let topics = titleTopics;
    if (!topics.length) {
      // A short's title is often a hook ("this trick…"): accept the topic when tags AND description both name it.
      const inTags = new Set(topicsNamedIn(tags, { allowLcNumber: false }).map((t) => t.id));
      topics = topicsNamedIn(desc).filter((t) => inTags.has(t.id));
    }
    if (!topics.length || topics.length > 2) return { ok: false, reason: 'off-topic' };
    return { ok: true, entries: [{ ...base, id: raw.id, topicIds: topics.map((t) => t.id) }] };
  }

  // Long video.
  const chapters = parseChapters(raw.description);
  if (titleTopics.length && !compilation && titleTopics.length <= 2) {
    const seg = chapters.length ? explanationSegment(chapters, raw.durationSec) : null;
    if (seg) return { ok: true, entries: [{ ...base, id: raw.id, topicIds: titleTopics.map((t) => t.id), start: seg.start, end: seg.end, chapter: seg.chapter }] };
    if (raw.durationSec <= LONG_WHOLE_MAX_SEC) return { ok: true, entries: [{ ...base, id: raw.id, topicIds: titleTopics.map((t) => t.id) }] };
  }

  // Chapters that each name one topic: a segment per chapter (a lecture, a compilation).
  const entries: VideoCandidate[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const inChapter = topicsNamedIn(normalizeText(chapters[i].title));
    if (inChapter.length !== 1 || (otherProblem && inChapter[0].kind === 'idea')) continue;
    const seg = segmentAt(chapters, i, raw.durationSec);
    if (seg.end - seg.start < SEGMENT_MIN_SEC) continue;
    entries.push({ ...base, flavor: 'oddball', id: `${raw.id}@${seg.start}`, topicIds: [inChapter[0].id], start: seg.start, end: seg.end, chapter: seg.chapter });
  }
  if (entries.length) return { ok: true, entries };
  if (titleTopics.length && raw.durationSec > LONG_WHOLE_MAX_SEC) return { ok: false, reason: 'too-long' };
  return { ok: false, reason: 'off-topic' };
}

/** A candidate as a lesson's index entry (its topics mapped to that lesson's concepts), or null. */
export function toLessonEntry(c: VideoCandidate, lessonId: string): FeedVideo | null {
  const map = LESSON_VIDEO_TOPICS[lessonId];
  if (!map) return null;
  const conceptIds = [...new Set(c.topicIds.flatMap((t) => map[t] ?? []))];
  if (!conceptIds.length) return null;
  const { topicIds: _topics, ...rest } = c;
  void _topics;
  return { ...rest, conceptIds };
}

/** Every topic id the taxonomy knows (for validation in tests). */
export function knownTopicIds(): string[] {
  return Object.keys(TOPIC_BY_ID);
}
