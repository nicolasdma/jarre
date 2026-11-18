/**
 * Phrases of a drill and where each one sits in its recording.
 *
 * A lesson marks the learner's breaths with a slash between spaces
 * ("Hi, I'm Nicolás, / a full-stack engineer …"). Frase por frase plays one
 * phrase, stops, and listens to just that phrase, so it needs the start and
 * end of every phrase in the recording. Those are worked out offline
 * (scripts/align-drill-segments.ts) from local Whisper word timings, snapped
 * to the silences in the audio itself, and stored with the drill (`segments`
 * in docs/lesson-format.md, `lesson_drills.segments`).
 *
 * Pure: no DOM, no Node. Tested in __tests__/phrase-segments.test.ts.
 */

import type { AudioPauses, Pause } from './sentence-timing';

/** The breath mark: a slash with whitespace before it and whitespace or the end after it. */
const PHRASE_MARK = /\s+\/(?=\s|$)/;

/** True when the text marks its phrases with " / ". */
export function hasPhraseMarks(text: string): boolean {
  return PHRASE_MARK.test(` ${text}`);
}

/**
 * The text as the learner reads it: the " / " marks are where the audio modes
 * cut and breathe, never something to show ("means / that" reads "means that").
 */
export function withoutPhraseMarks(text: string): string {
  return ` ${text}`.replace(new RegExp(PHRASE_MARK.source, 'g'), '').trim();
}

/** The drill's phrases, split at every " / " (a text without marks is one phrase). */
export function drillPhrases(text: string): string[] {
  return ` ${text}`
    .split(PHRASE_MARK)
    .map((p) => p.replace(/^\s*\/\s+/, '').trim())
    .filter(Boolean);
}

/** One phrase in the recording, in seconds. */
export interface PhraseSegment {
  start: number;
  end: number;
}

/**
 * Segments that fit a text: one per phrase, in order, not overlapping.
 * Anything else (a stale recording, a re-written text) is not used.
 */
export function segmentsFit(text: string, segments: readonly PhraseSegment[] | null | undefined): segments is readonly PhraseSegment[] {
  if (!segments || segments.length !== drillPhrases(text).length) return false;
  let prevEnd = -Infinity;
  for (const s of segments) {
    if (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < 0 || s.end <= s.start) return false;
    if (s.start < prevEnd - 1e-6) return false;
    prevEnd = s.end;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

/** A word with its timing, as Whisper gives it (`--word-timestamps`). */
export interface TimedWord {
  word: string;
  start: number;
  end: number;
}

/** Comparable form of a word: no accents, no punctuation, lower case ("$6,000" → "6000", "full-stack" → "fullstack"). */
export function normToken(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** The comparable words of a piece of text. */
export function tokens(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normToken)
    .filter(Boolean);
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

/** Same word, allowing what speech recognition does to names ("Doubland" / "Doblan", "Nicolás" / "Nicolas"). */
export function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const short = Math.min(a.length, b.length);
  if (short >= 3 && (a.startsWith(b) || b.startsWith(a))) return true;
  if (short < 4) return false;
  return editDistance(a, b) <= Math.floor(Math.max(a.length, b.length) * 0.3);
}

/**
 * For each text token, the index of the recognized word it matches, or null.
 * Global alignment (edit distance over words): monotonic, so a word said
 * twice in the drill matches in order.
 */
export function alignTokens(text: readonly string[], heard: readonly string[]): (number | null)[] {
  const n = text.length;
  const m = heard.length;
  // cost[i][j]: aligning text[0..i) with heard[0..j).
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const match = cost[i - 1][j - 1] + (sameWord(text[i - 1], heard[j - 1]) ? 0 : 1);
      cost[i][j] = Math.min(match, cost[i - 1][j] + 1, cost[i][j - 1] + 1);
    }
  }
  const out: (number | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const same = sameWord(text[i - 1], heard[j - 1]);
    if (cost[i][j] === cost[i - 1][j - 1] + (same ? 0 : 1)) {
      if (same) out[i - 1] = j - 1;
      i--;
      j--;
    } else if (cost[i][j] === cost[i - 1][j] + 1) {
      i--;
    } else {
      j--;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

/** How far into the pause a phrase keeps playing, and how early the next one starts (seconds). */
export const PHRASE_TAIL = 0.15;
export const PHRASE_HEAD = 0.08;
/** How far outside the words around a boundary a silence may sit (Whisper word edges drift). */
const SEARCH_MARGIN = 0.35;
/** Below this share of the text recognized, the recording is not this text. */
export const MIN_MATCHED = 0.8;

export interface BoundaryReport {
  /** Whisper's silence between the phrases: end of the last word, start of the next. */
  wordEnd: number;
  wordStart: number;
  /** The silence in the audio the cut sits in, or null when none was found. */
  pause: Pause | null;
}

export interface PhrasePlacement {
  segments: PhraseSegment[];
  boundaries: BoundaryReport[];
  /** Text words matched to a recognized word, and all of them. */
  matched: number;
  total: number;
  /** Why these segments should not be used; empty when they are good. */
  problems: string[];
}

const ms = (s: number) => Math.round(s * 1000) / 1000;

/**
 * Place each phrase in the recording: the text is aligned to the recognized
 * words, the cut between two phrases goes in the silence between the last
 * word of one and the first of the next (the longest silence of the audio in
 * that stretch), and without a silence there, halfway between Whisper's words.
 */
export function placePhrases(
  phrases: readonly string[],
  words: readonly TimedWord[],
  audio: { duration: number; pauses?: AudioPauses | null },
): PhrasePlacement {
  const phraseTokens = phrases.map(tokens);
  const flat = phraseTokens.flat();
  const owner = phraseTokens.flatMap((t, p) => t.map(() => p));
  const heard = words.map((w) => normToken(w.word));
  // Whisper can return empty or punctuation-only "words": keep their indices, never match them.
  const match = alignTokens(flat, heard);
  const matched = match.filter((x) => x !== null).length;
  const problems: string[] = [];

  const first: (number | null)[] = phrases.map(() => null);
  const last: (number | null)[] = phrases.map(() => null);
  match.forEach((w, k) => {
    if (w === null) return;
    const p = owner[k];
    if (first[p] === null) first[p] = w;
    last[p] = w;
  });

  if (flat.length === 0 || words.length === 0) problems.push('no words to align');
  else if (matched / flat.length < MIN_MATCHED) {
    problems.push(`only ${matched} of ${flat.length} words of the text are in the recording: is the audio for this text?`);
  }
  phrases.forEach((p, i) => {
    if (first[i] === null) problems.push(`phrase ${i + 1} not found in the recording: "${p}"`);
  });

  const duration = audio.duration;
  const pauses = audio.pauses?.pauses ?? [];
  const boundaries: BoundaryReport[] = [];
  const cuts: { end: number; start: number }[] = [];

  if (problems.length === 0) {
    for (let i = 0; i < phrases.length - 1; i++) {
      const a = last[i] as number;
      const b = first[i + 1] as number;
      if (b <= a) {
        problems.push(`phrases ${i + 1} and ${i + 2} overlap in the recording`);
        break;
      }
      // Whisper's widest gap between a and b (unmatched words in between, e.g. "10,000" for "ten thousand").
      let k = a;
      for (let x = a; x < b; x++) {
        if (words[x + 1].start - words[x].end > words[k + 1].start - words[k].end) k = x;
      }
      const wordEnd = words[k].end;
      const wordStart = words[k + 1].start;
      const lo = Math.min(words[a].end, wordEnd) - SEARCH_MARGIN;
      const hi = Math.max(words[b].start, wordStart) + SEARCH_MARGIN;
      // Never past the middle of the words on either side.
      const floor = (words[a].start + words[a].end) / 2;
      const ceil = (words[b].start + words[b].end) / 2;
      let pause: Pause | null = null;
      let best = 0;
      for (const p of pauses) {
        const s = Math.max(p.start, lo, floor);
        const e = Math.min(p.end, hi, ceil);
        if (e - s > best) {
          best = e - s;
          pause = { start: Math.max(p.start, floor), end: Math.min(p.end, ceil) };
        }
      }
      boundaries.push({ wordEnd: ms(wordEnd), wordStart: ms(wordStart), pause: pause && { start: ms(pause.start), end: ms(pause.end) } });
      if (pause) {
        const len = pause.end - pause.start;
        cuts.push({ end: pause.start + Math.min(PHRASE_TAIL, len / 2), start: pause.end - Math.min(PHRASE_HEAD, len / 2) });
      } else {
        const mid = (wordEnd + Math.max(wordEnd, wordStart)) / 2;
        cuts.push({ end: mid, start: mid });
      }
    }
  }

  if (problems.length > 0) return { segments: [], boundaries, matched, total: flat.length, problems };

  const firstWord = words[first[0] as number];
  const lastWord = words[last[phrases.length - 1] as number];
  const speech = audio.pauses;
  const onset = speech ? Math.min(speech.speechStart, firstWord.start) : firstWord.start;
  const offset = speech ? Math.max(speech.speechEnd, Math.min(lastWord.end, speech.speechEnd + 0.3)) : lastWord.end;
  const begin = Math.max(0, onset - PHRASE_HEAD);
  const finish = Math.min(duration, offset + PHRASE_TAIL);
  const segments = phrases.map((_, i) => ({
    start: ms(i === 0 ? begin : cuts[i - 1].start),
    end: ms(i === phrases.length - 1 ? finish : cuts[i].end),
  }));
  segments.forEach((s, i) => {
    if (!(s.end > s.start)) problems.push(`phrase ${i + 1} has no length`);
  });
  return { segments: problems.length ? [] : segments, boundaries, matched, total: flat.length, problems };
}
