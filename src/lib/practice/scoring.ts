/**
 * Pure scoring for the drill practice modes (copy, dictation, listen-and-repeat,
 * shadowing). No DOM, no React: tested in __tests__/scoring.test.ts.
 */

import type { KeyTerm } from './key-terms';

export interface CompareOptions {
  /** Treat "Hi" and "hi" as equal. */
  caseInsensitive: boolean;
  /** Skip punctuation in both texts (letters, digits and spaces still count). */
  ignorePunctuation: boolean;
}

/** Accents are always folded: the target's names (Córdoba, Nicolás) are not what is being practiced. */
function fold(ch: string): string {
  return ch
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-');
}

const PUNCT = /[^\p{L}\p{N}\s]/u;

function comparable(ch: string, opts: CompareOptions): string {
  const f = fold(ch);
  return opts.caseInsensitive ? f.toLowerCase() : f;
}

/**
 * The characters of `text` that count, with their position in the original.
 * Runs of whitespace count as one space; leading/trailing space never counts.
 */
export function significantChars(text: string, opts: CompareOptions): { ch: string; index: number }[] {
  const out: { ch: string; index: number }[] = [];
  const chars = Array.from(text);
  let pendingSpace = -1;
  for (let i = 0; i < chars.length; i++) {
    const raw = chars[i];
    if (/\s/.test(raw)) {
      if (out.length > 0 && pendingSpace < 0) pendingSpace = i;
      continue;
    }
    if (opts.ignorePunctuation && PUNCT.test(fold(raw))) continue;
    if (pendingSpace >= 0) {
      out.push({ ch: ' ', index: pendingSpace });
      pendingSpace = -1;
    }
    out.push({ ch: comparable(raw, opts), index: i });
  }
  return out;
}

export type CharState = 'correct' | 'wrong' | 'pending' | 'neutral';

export interface CopyFeedback {
  /** One entry per character of the original target (Array.from order). */
  states: CharState[];
  correct: number;
  typedLength: number;
  targetLength: number;
  /** Characters typed beyond the end of the target. */
  extra: number;
  complete: boolean;
}

/**
 * Live char-level feedback: the n-th significant typed char is compared with
 * the n-th significant target char. Skipped target chars (punctuation when
 * ignored, collapsed spaces) are `neutral`.
 */
export function copyFeedback(target: string, typed: string, opts: CompareOptions): CopyFeedback {
  const t = significantChars(target, opts);
  const y = significantChars(typed, opts);
  const states: CharState[] = Array.from(target).map(() => 'neutral');
  let correct = 0;
  t.forEach((tc, n) => {
    if (n >= y.length) states[tc.index] = 'pending';
    else if (y[n].ch === tc.ch) {
      states[tc.index] = 'correct';
      correct++;
    } else states[tc.index] = 'wrong';
  });
  // Trailing whitespace the learner just typed is not "extra".
  const extra = Math.max(0, y.length - t.length);
  return { states, correct, typedLength: y.length, targetLength: t.length, extra, complete: y.length >= t.length };
}

/** Accuracy in [0, 100]: correct chars over the longer of target and typed. */
export function accuracyPercent(f: Pick<CopyFeedback, 'correct' | 'typedLength' | 'targetLength'>): number {
  const denom = Math.max(f.targetLength, f.typedLength);
  // Floor, so only a perfect copy reads 100%.
  return denom === 0 ? 0 : Math.floor((f.correct / denom) * 100);
}

/** Words per minute, standard 5-characters-per-word. */
export function wordsPerMinute(typedChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return Math.round(typedChars / 5 / (elapsedMs / 60_000));
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const NUMBER_WORDS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16',
  seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20', thirty: '30', forty: '40', fifty: '50',
  sixty: '60', seventy: '70', eighty: '80', ninety: '90', hundred: '100', thousand: '1000',
};

/** Contractions are expanded so "I'm" and "I am" (what a recognizer may write) match. */
const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is',
  "it's": 'it is', "that's": 'that is', "there's": 'there is', "what's": 'what is', "let's": 'let us',
  "who's": 'who is', "where's": 'where is', "here's": 'here is', "how's": 'how is',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "it'll": 'it will', "that'll": 'that will',
  "i'd": 'i would', "you'd": 'you would', "we'd": 'we would', "they'd": 'they would',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', "cannot": 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "haven't": 'have not', "hasn't": 'has not', "shouldn't": 'should not', "wouldn't": 'would not', "couldn't": 'could not',
};

/**
 * Lowercase, accent-free, punctuation-free words; contractions expanded; small
 * number words become digits. A possessive "'s" is dropped (barely audible,
 * and recognizers drop it too); "18+" and "55%" read as "18 plus", "55 percent".
 */
export function normalizeWords(text: string): string[] {
  return fold(text)
    .toLowerCase()
    .replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/(\d)\s*\+/g, '$1 plus ')
    .replace(/(\d)\s*%/g, '$1 percent ')
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/[-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] ?? w.replace(/'s$/, '')).split(' '))
    .map((w) => NUMBER_WORDS[w] ?? w);
}

/**
 * A target word's state. `pending`: not reached yet while the learner is still
 * speaking (only with `pendingTail`).
 */
export type TargetWordState = 'said' | 'missed' | 'pending';

export interface TargetWord {
  /** The target's own spelling, punctuation included. */
  word: string;
  state: TargetWordState;
  /** Index into the given key terms when the word is part of one. */
  term: number | null;
  /**
   * Said through one of the term's sound-alikes: the recognizer does not know
   * the name, so it counts as said and is flagged for a check by ear.
   */
  viaAlias: boolean;
  /** What the recognizer wrote for it, when `viaAlias`. */
  heardAs: string | null;
  /**
   * Which gap between said words a missed word falls in: the extra words with
   * the same gap are what was said instead ("payroll" for "paywall"). -1 when said.
   */
  gap: number;
}

export interface ExtraWord {
  /** As the recognizer (or the learner) wrote it, normalized. */
  word: string;
  gap: number;
}

export interface WordAlignment {
  /** One entry per target word, in order: the text itself never changes. */
  words: TargetWord[];
  /** Words heard or typed that are not in the target, kept apart from it. */
  extras: ExtraWord[];
  said: number;
  total: number;
  /** said / total, in [0, 100]. */
  score: number;
}

export interface AlignOptions {
  /**
   * The lesson's key terms. Each one present in the target is matched as a
   * whole, and its sound-alikes count as said (`viaAlias`). Pass them only for
   * speech: a typed dictation has to spell the name.
   */
  terms?: readonly KeyTerm[];
  /** Count a term's sound-alikes as said (default true). Off for typing: the terms then only group their words. */
  acceptSoundAlikes?: boolean;
  /** While the learner is still speaking: target words after the last one said are `pending`, not missed. */
  pendingTail?: boolean;
}

interface TargetUnit {
  key: string;
  words: number[];
  /** Normalized tokens it stands for: the score stays per token, with or without terms. */
  weight: number;
  term: number | null;
}

interface HeardUnit {
  key: string;
  text: string;
  viaAlias: boolean;
}

const TERM_KEY = '\u0001term:';

function startsWith(tokens: readonly string[], at: number, seq: readonly string[]): boolean {
  if (seq.length === 0 || at + seq.length > tokens.length) return false;
  for (let k = 0; k < seq.length; k++) if (tokens[at + k] !== seq[k]) return false;
  return true;
}

/** The target as units: a key term's tokens become one unit, every other token is its own. */
function targetUnits(display: string[], terms: readonly KeyTerm[]): { units: TargetUnit[]; present: Set<number> } {
  const tokens: { norm: string; word: number }[] = [];
  display.forEach((word, w) => normalizeWords(word).forEach((norm) => tokens.push({ norm, word: w })));
  const norms = tokens.map((tk) => tk.norm);
  // Longest term first, so "row-level security" wins over a term "security".
  const order = terms
    .map((term, k) => ({ k, seq: normalizeWords(term.term) }))
    .filter((x) => x.seq.length > 0)
    .sort((a, b) => b.seq.length - a.seq.length);

  const units: TargetUnit[] = [];
  const present = new Set<number>();
  for (let i = 0; i < tokens.length; ) {
    const hit = order.find((x) => startsWith(norms, i, x.seq));
    if (hit) {
      const words = [...new Set(tokens.slice(i, i + hit.seq.length).map((tk) => tk.word))];
      units.push({ key: `${TERM_KEY}${hit.k}`, words, weight: hit.seq.length, term: hit.k });
      present.add(hit.k);
      i += hit.seq.length;
    } else {
      units.push({ key: tokens[i].norm, words: [tokens[i].word], weight: 1, term: null });
      i++;
    }
  }
  return { units, present };
}

/** A spoken name split differently ("post back", "web hooks") is the same name. */
const MAX_SPLIT = 4;

/**
 * What was heard, as units. Only the terms present in the target take part, so
 * a sound-alike never swallows words of a text that does not have the name. A
 * term written with other spacing ("post back" for postback) counts as the
 * term itself; a listed sound-alike ("super bass") counts as said via alias.
 */
function heardUnits(spoken: string, terms: readonly KeyTerm[], present: Set<number>, soundAlikes: boolean): HeardUnit[] {
  const heard = normalizeWords(spoken);
  const compact = new Map<string, number>();
  for (const k of present) compact.set(normalizeWords(terms[k].term).join(''), k);
  const forms = [...present]
    .flatMap((k) => {
      const own = normalizeWords(terms[k].term).join('');
      return [
        { k, seq: normalizeWords(terms[k].term), viaAlias: false },
        ...(soundAlikes ? terms[k].heardAs : []).map((alias) => {
          const seq = normalizeWords(alias);
          return { k, seq, viaAlias: seq.join('') !== own };
        }),
      ];
    })
    .filter((f) => f.seq.length > 0)
    // Longest first; at equal length the term itself before a sound-alike.
    .sort((x, y) => y.seq.length - x.seq.length || Number(x.viaAlias) - Number(y.viaAlias));

  const units: HeardUnit[] = [];
  for (let j = 0; j < heard.length; ) {
    let hit: { k: number; len: number; viaAlias: boolean } | null = null;
    const form = forms.find((f) => startsWith(heard, j, f.seq));
    if (form) hit = { k: form.k, len: form.seq.length, viaAlias: form.viaAlias };
    if (soundAlikes) {
      for (let len = Math.min(MAX_SPLIT, heard.length - j); len > (hit?.len ?? 0); len--) {
        const k = compact.get(heard.slice(j, j + len).join(''));
        if (k !== undefined) {
          hit = { k, len, viaAlias: false };
          break;
        }
      }
    }
    if (hit) {
      units.push({ key: `${TERM_KEY}${hit.k}`, text: heard.slice(j, j + hit.len).join(' '), viaAlias: hit.viaAlias });
      j += hit.len;
    } else {
      units.push({ key: heard[j], text: heard[j], viaAlias: false });
      j++;
    }
  }
  return units;
}

/**
 * Longest-common-subsequence alignment of the target's words against what
 * the learner said (or typed). The target words come back in their own
 * spelling and order, one entry each; extra words come back apart, so a view
 * can color the target without moving it.
 */
export function alignWords(target: string, spoken: string, options: AlignOptions = {}): WordAlignment {
  const terms = options.terms ?? [];
  const display = target.split(/\s+/).filter(Boolean);
  const { units: t, present } = targetUnits(display, terms);
  const h = heardUnits(spoken, terms, present, options.acceptSoundAlikes ?? true);
  const n = t.length;
  const m = h.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = t[i].key === h[j].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Per display word: how many units it has, how many were said.
  const unitsOf = display.map(() => 0);
  const saidOf = display.map(() => 0);
  const gapOf = display.map(() => -1);
  const heardAsOf: (string | null)[] = display.map(() => null);
  const termOf: (number | null)[] = display.map(() => null);
  for (const u of t) {
    for (const w of u.words) {
      unitsOf[w]++;
      if (u.term !== null) termOf[w] = u.term;
    }
  }

  const extras: ExtraWord[] = [];
  let gap = 0;
  let said = 0;
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && t[i].key === h[j].key) {
      for (const w of t[i].words) {
        saidOf[w]++;
        if (h[j].viaAlias) heardAsOf[w] = h[j].text;
      }
      said += t[i].weight;
      gap++;
      i++;
      j++;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      extras.push({ word: h[j].text, gap });
      j++;
    } else {
      for (const w of t[i].words) if (gapOf[w] < 0) gapOf[w] = gap;
      i++;
    }
  }

  const words: TargetWord[] = display.map((word, w) => {
    const isSaid = unitsOf[w] > 0 && saidOf[w] === unitsOf[w];
    return {
      word,
      state: isSaid ? 'said' : 'missed',
      term: termOf[w],
      viaAlias: isSaid && heardAsOf[w] !== null,
      heardAs: isSaid ? heardAsOf[w] : null,
      gap: isSaid ? -1 : Math.max(0, gapOf[w]),
    };
  });

  if (options.pendingTail) {
    let last = -1;
    words.forEach((w, k) => {
      if (w.state === 'said') last = k;
    });
    for (let k = last + 1; k < words.length; k++) words[k].state = 'pending';
  }

  const total = t.reduce((sum, u) => sum + u.weight, 0);
  return { words, extras, said, total, score: total === 0 ? 0 : Math.round((said / total) * 100) };
}

/**
 * What was said in place of a missed word: the extra words in its gap
 * ("payroll" for "paywall"). Null when nothing was said there.
 */
export function heardInstead(alignment: WordAlignment, wordIndex: number): string | null {
  const w = alignment.words[wordIndex];
  if (!w || w.state !== 'missed') return null;
  const text = alignment.extras.filter((e) => e.gap === w.gap).map((e) => e.word).join(' ');
  return text || null;
}

// ---------------------------------------------------------------------------
// Sentences (shadowing)
// ---------------------------------------------------------------------------

export interface TimedSentence {
  text: string;
  /** Fraction of the audio where the sentence starts and ends, in [0, 1]. */
  start: number;
  end: number;
}

/** Split on sentence ends; no audio alignment exists, so timing is proportional to length. */
export function splitSentences(text: string): TimedSentence[] {
  const parts = text
    .split(/(?<=[.!?])\s+(?=["'“(]?[\p{Lu}\p{N}])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const total = parts.reduce((sum, s) => sum + s.length, 0) || 1;
  let acc = 0;
  return parts.map((s) => {
    const start = acc / total;
    acc += s.length;
    return { text: s, start, end: acc / total };
  });
}
