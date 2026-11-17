/**
 * Big-O answers for the complexity checks (format.ts `ComplexityCheck`): after
 * a code exercise passes, and in the lesson's "say the Big-O" drill, the
 * learner picks or says the time and space complexity and sees the right
 * answer with its reason.
 *
 * Two jobs, both pure:
 * - `canonicalBigO`: one form for a written answer, so "O(n log n)",
 *   "O(n·log n)" and "n log n" compare equal.
 * - `readSpokenBigO`: what the browser's recognizer heard ("it's O of n time
 *   because I go through it once, and O of n space for the map") mapped to the
 *   check's options, per kind: time, space and the brute force's time. It only
 *   pre-selects the chips; the learner can always correct them by hand.
 */

const SUPERSCRIPT: Record<string, string> = { '²': '^2', '³': '^3' };

/** One comparable form of a written complexity: "O(n²)" → "n^2", "O(r · c)" → "rc", "O(1)" → "1". */
export function canonicalBigO(written: string): string {
  let s = written.toLowerCase().trim();
  s = s.replace(/[²³]/g, (c) => SUPERSCRIPT[c]);
  s = s.replace(/^o\s*\(/, '').replace(/\)\s*$/, '');
  s = s.replace(/\brows\b/g, 'r').replace(/\b(columns|cols)\b/g, 'c');
  return s.replace(/[\s·×*]+/g, '');
}

export function sameBigO(a: string, b: string): boolean {
  return canonicalBigO(a) === canonicalBigO(b);
}

export type BigOKind = 'time' | 'space' | 'brute';

export interface BigOOptions {
  time: readonly string[];
  space: readonly string[];
  /** The brute force's time options, when the check asks for it. */
  brute?: readonly string[];
}

export type SpokenBigO = Partial<Record<BigOKind, string>>;

const MARK = '§';

const NUMBER_WORDS: Record<string, string> = { one: '1', two: '2', three: '3' };

/** Speech to tokens where a complexity reads like its canonical form, with § before each "O of". */
function spokenTokens(clause: string): string[] {
  let s = ` ${clause.toLowerCase()} `;
  s = s.replace(/[²³]/g, (c) => SUPERSCRIPT[c]);
  // Words that name a complexity on their own.
  s = s.replace(/\blinearithmic\b/g, ` ${MARK} n log n `);
  s = s.replace(/\bquadratic\b/g, ` ${MARK} n^2 `);
  s = s.replace(/\bcubic\b/g, ` ${MARK} n^3 `);
  s = s.replace(/\blinear\b/g, ` ${MARK} n `);
  s = s.replace(/\bconstant\b/g, ` ${MARK} 1 `);
  s = s.replace(/\blogarithmic\b/g, ` ${MARK} log n `);
  s = s.replace(/\bexponential\b/g, ` ${MARK} 2^n `);
  // "O of", "oh of", "big O of", "O(" (the recognizer sometimes writes it).
  s = s.replace(/\bbig[\s-]?o\b(\s+of)?/g, ` ${MARK} `);
  s = s.replace(/\b(o|oh)\s+of\b/g, ` ${MARK} `);
  s = s.replace(/\bo\s*\(/g, ` ${MARK} `);
  s = s.replace(/\b(o|oh)\s+(?=n\b|log\b|1\b|one\b|k\b)/g, ` ${MARK} `);
  // How the numbers are said.
  s = s.replace(/\b(\w+)\s+squared\b/g, (_, w) => ` ${w === 'and' || w === 'in' || w === 'en' ? 'n' : w}^2 `);
  s = s.replace(/\b(\w+)\s+cubed\b/g, (_, w) => ` ${w}^3 `);
  s = s.replace(/\btwo to the (power of )?n\b/g, ' 2^n ');
  s = s.replace(/\blog of\b/g, ' log ');
  s = s.replace(/\blogin\b/g, ' log n ');
  s = s.replace(/\b(times|multiplied by)\b/g, ' ');
  s = s.replace(/\bplus\b/g, ' + ');
  s = s.replace(/\b(one|two|three)\b/g, (w) => NUMBER_WORDS[w]);
  s = s.replace(/\brows\b/g, 'r').replace(/\b(columns|cols)\b/g, 'c');
  s = s.replace(/[(),:;"“”]/g, ' ');
  return s.split(/\s+/).filter(Boolean);
}

/** An option's key for matching speech: no parentheses or commas ("min(n,k)" → "minnk"). */
const speechKey = (option: string) => canonicalBigO(option).replace(/[(),]/g, '');
/** "exponential" (2^n) names any exponential option, e.g. O(coins^amount). */
const isExponential = (key: string) => /\^[a-z]/.test(key);

/** Every token run that matches an option, preferring the ones right after an "O of". */
function matchOption(tokens: string[], options: readonly string[]): string | null {
  const canon = new Map(options.map((o) => [speechKey(o), o]));
  const exponential = options.find((o) => isExponential(speechKey(o)));
  let best: { option: string; marked: boolean; len: number } | null = null;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === MARK) continue;
    const marked = tokens[i - 1] === MARK;
    for (let len = 1; len <= 5 && i + len <= tokens.length; len++) {
      const run = tokens.slice(i, i + len);
      if (run.includes(MARK)) break;
      const key = run.join('');
      const option = canon.get(key) ?? (key === '2^n' ? exponential : undefined);
      if (!option) continue;
      // A bare "n" or "1" is any word: only after "O of" (or "linear" / "constant", which add the mark).
      if (!marked && key.length < 2) continue;
      const better = !best || (marked && !best.marked) || (marked === best.marked && len > best.len);
      if (better) best = { option, marked, len };
    }
  }
  return best?.option ?? null;
}

/** The brute force, or the slower alternative said as a conditional ("would be O of n squared", "without sorting"). */
const BRUTE = /\b(brute|naive|naïve|plain|would|without)\b/;
const SPACE = /\b(space|memory)\b/;
const TIME = /\b(time|runtime|run time)\b/;
/** Words that start a new thought: the brute force's sentence ends there. */
const NEW_THOUGHT = /\b(now|then|instead|with the|using|but|my solution|this solution|the optimal|the optimized|to do better)\b/;

/**
 * What the learner said, mapped to the options. A clause that names space or
 * time sets that kind; an unlabeled one only fills a kind no clause named
 * (time first). "Brute force" or "naive" sends what follows, until the next
 * sentence or a new thought, to the brute force.
 */
export function readSpokenBigO(transcript: string, options: BigOOptions): SpokenBigO {
  const labeled: SpokenBigO = {};
  const unlabeled: string[] = [];
  const text = transcript.toLowerCase().replace(/\bmin(?:imum)?\s+of\s+(\w+)\s+and\s+(\w+)/g, ' min $1 $2 ');
  const sentences = text.split(/[.!?;]+/);
  for (const sentence of sentences) {
    let brute = false;
    for (const clause of sentence.split(/,|\band\b|\bwhile\b|\bwhereas\b/)) {
      if (BRUTE.test(clause)) brute = true;
      else if (NEW_THOUGHT.test(clause)) brute = false;
      const tokens = spokenTokens(clause);
      if (brute) {
        if (SPACE.test(clause) || !options.brute) continue;
        const hit = matchOption(tokens, options.brute);
        if (hit && !labeled.brute) labeled.brute = hit;
        continue;
      }
      if (SPACE.test(clause)) {
        const hit = matchOption(tokens, options.space);
        if (hit && !labeled.space) labeled.space = hit;
      } else if (TIME.test(clause)) {
        const hit = matchOption(tokens, options.time);
        if (hit && !labeled.time) labeled.time = hit;
      } else {
        const hit = matchOption(tokens, [...new Set([...options.time, ...options.space])]);
        if (hit) unlabeled.push(hit);
      }
    }
  }
  const out: SpokenBigO = { ...labeled };
  for (const hit of unlabeled) {
    if (!out.time && !labeled.time && options.time.includes(hit)) out.time = hit;
    else if (!out.space && !labeled.space && options.space.includes(hit)) out.space = hit;
  }
  return out;
}
