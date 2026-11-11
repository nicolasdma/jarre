/**
 * Pure scoring for the drill practice modes (copy, dictation, listen-and-repeat,
 * shadowing). No DOM, no React: tested in __tests__/scoring.test.ts.
 */

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
  return denom === 0 ? 0 : Math.round((f.correct / denom) * 100);
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

/** Lowercase, accent-free, punctuation-free words; small number words become digits. */
export function normalizeWords(text: string): string[] {
  return fold(text)
    .toLowerCase()
    .replace(/(\d),(\d{3})/g, '$1$2')
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/[-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
    .map((w) => NUMBER_WORDS[w] ?? w);
}

export type WordState = 'said' | 'missed' | 'extra';

export interface WordMark {
  word: string;
  state: WordState;
}

export interface WordAlignment {
  /** Target words in order (said or missed) with extra spoken words interleaved where they fell. */
  marks: WordMark[];
  said: number;
  total: number;
  /** said / total, in [0, 100]. */
  score: number;
}

/**
 * Longest-common-subsequence alignment of the target's words against what
 * the learner said (or typed). Display words keep the target's spelling.
 */
export function alignWords(target: string, spoken: string): WordAlignment {
  const display = target.split(/\s+/).filter(Boolean);
  // Map each normalized target token back to its display word.
  const tokens: { norm: string; display: string }[] = [];
  for (const word of display) {
    const parts = normalizeWords(word);
    parts.forEach((norm, i) => tokens.push({ norm, display: i === 0 ? word : '' }));
  }
  const heard = normalizeWords(spoken);
  const n = tokens.length;
  const m = heard.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = tokens[i].norm === heard[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const marks: WordMark[] = [];
  let i = 0;
  let j = 0;
  let said = 0;
  const push = (word: string, state: WordState) => {
    if (word) marks.push({ word, state });
  };
  while (i < n || j < m) {
    if (i < n && j < m && tokens[i].norm === heard[j]) {
      push(tokens[i].display, 'said');
      said++;
      i++;
      j++;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      push(heard[j], 'extra');
      j++;
    } else {
      push(tokens[i].display, 'missed');
      i++;
    }
  }
  return { marks, said, total: n, score: n === 0 ? 0 : Math.round((said / n) * 100) };
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
