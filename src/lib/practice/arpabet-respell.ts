/**
 * ARPAbet (CMU Pronouncing Dictionary) → the drill's Spanish-ear respelling
 * and US IPA. Feeds the words the lesson's key terms and COMMON
 * (pronunciation.ts) do not cover; the dictionary itself stays on the server
 * (src/app/api/practice/respell/route.ts).
 *
 * The convention is pronunciation.ts's: syllables split with "-", the
 * stressed one in caps with an accent on its vowel ("PÉI-uol"); "u" before a
 * vowel is an English w, "j" an English h, "dy" the j of "jet", "sh" and
 * "ch" as in English. Each letter choice below follows a COMMON entry where
 * one decides it; where none does, it is what a rioplatense reader says
 * right, and the comment says so.
 *
 * Pure module: no DOM, no React, no dictionary.
 */

export interface Phone {
  /** ARPAbet symbol without stress: "AE", "K". */
  p: string;
  /** 0, 1, 2 for vowels; null for consonants. */
  stress: 0 | 1 | 2 | null;
}

/** EX is ours, not ARPAbet: an ER followed by a vowel, split into its vowel and an R that opens the next syllable. */
const VOWELS = new Set(['EX', 'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);

export function parseArpabet(arpabet: string): Phone[] {
  return arpabet
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const m = /^([A-Z]+)([012])?$/.exec(t.toUpperCase());
      if (!m) throw new Error(`Not an ARPAbet phone: ${t}`);
      const p = m[1];
      return { p, stress: VOWELS.has(p) ? (Number(m[2] ?? 0) as 0 | 1 | 2) : null };
    });
}

const isVowel = (ph: Phone | undefined) => Boolean(ph && ph.stress !== null);

// ---------------------------------------------------------------------------
// Syllables: maximal onset, with the onsets English allows
// ---------------------------------------------------------------------------

/**
 * Legal word-internal onsets. Any single consonant but NG; stop or fricative
 * + liquid/glide; s-clusters. Left out on purpose: "L Y" (value is val-ue, not
 * va-lue) and "T Y"/"D Y" (CMU writes due as D UW anyway).
 */
const ONSETS = new Set([
  ...['B', 'CH', 'D', 'DH', 'F', 'G', 'HH', 'JH', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'SH', 'T', 'TH', 'V', 'W', 'Y', 'Z', 'ZH'],
  'P R', 'P L', 'P Y', 'B R', 'B L', 'B Y', 'T R', 'T W', 'D R', 'D W', 'K R', 'K L', 'K W', 'K Y',
  'G R', 'G L', 'G W', 'F R', 'F L', 'F Y', 'TH R', 'TH W', 'SH R', 'V Y', 'M Y', 'N Y', 'HH Y',
  'S P', 'S T', 'S K', 'S M', 'S N', 'S L', 'S W', 'S F',
  'S P R', 'S P L', 'S P Y', 'S T R', 'S K R', 'S K W', 'S K Y', 'S K L',
]);

/**
 * Phones grouped by syllable: each syllable has exactly one vowel.
 * `boundaries`: phone indexes where a syllable must start (the seams of a
 * compound: check|out is CHÉK-aut, not CHÉ-kaut).
 */
export function syllabify(phones: readonly Phone[], boundaries: ReadonlySet<number> = new Set()): Phone[][] {
  const nuclei = phones.flatMap((ph, i) => (isVowel(ph) ? [i] : []));
  if (nuclei.length === 0) return phones.length ? [phones.slice()] : [];
  const starts = [0];
  for (let n = 1; n < nuclei.length; n++) {
    const from = nuclei[n - 1] + 1;
    const to = nuclei[n]; // exclusive: the cluster between two vowels
    let split = to; // empty onset if nothing fits
    const seam = [...boundaries].find((b) => b >= from && b <= to);
    for (let k = seam ?? from; k <= to; k++) {
      const onset = phones.slice(k, to).map((p) => p.p).join(' ');
      if (onset === '' || ONSETS.has(onset)) {
        split = k;
        break;
      }
    }
    starts.push(split);
  }
  return starts.map((s, i) => phones.slice(s, starts[i + 1] ?? phones.length));
}

// ---------------------------------------------------------------------------
// The word's spelling, to read the reduced vowels
// ---------------------------------------------------------------------------

/**
 * The vowel letter runs of the spelling, one per spoken syllable when the
 * counts agree ("de·ve·lo·per"). A final silent e is dropped ("image" → i, a),
 * unless it is the syllabic -le ("available").
 */
export function spellingVowels(word: string): string[] {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  const groups: string[] = [];
  const re = /[aeiouy]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(w))) {
    // A y that starts the word before a vowel is a consonant ("you", "yes").
    let g = m[0];
    if (m.index === 0 && g.length > 1 && g[0] === 'y') g = g.slice(1);
    groups.push(g);
  }
  if (groups.length > 1 && /[^aeiouy]e$/.test(w) && !/[^aeiouy]le$/.test(w)) groups.pop();
  return groups;
}

// ---------------------------------------------------------------------------
// Letters
// ---------------------------------------------------------------------------

/** How a reduced vowel is written when the spelling tells (last letter of its run: "-tion" → o, "-cial" → a). */
const SCHWA_BY_LETTER: Record<string, string> = { a: 'a', e: 'e', i: 'i', o: 'o', u: 'a', y: 'i' };

interface VowelContext {
  next: Phone | undefined;
  /** The spelled vowel run of this syllable, when the spelling lines up with the syllables. */
  spelled: string | null;
  /** The syllable ends the word (and only consonants follow it). */
  last: boolean;
  /** The word ends in consonant + "le", "les" or "led". */
  syllabicLe: boolean;
  /** The word ends in vowel + consonant + silent e ("private", "purchase"). */
  silentE: boolean;
  first: boolean;
  prev: Phone | undefined;
}

function vowelLetters(ph: Phone, c: VowelContext): string {
  switch (ph.p) {
    case 'AE':
      return 'a'; // access ÁK-ses, balance BÁ-lans
    case 'AA':
      // contract KÓN, polish PÓ, sandbox -boks; but architecture ÁR, leaderboard -bord is AO.
      if (c.next?.p === 'R') return 'a';
      if (c.spelled && c.spelled.includes('a') && !c.spelled.includes('o')) return 'a'; // father, watch
      return 'o';
    case 'AH':
      if (ph.stress !== 0) return 'a'; // adult a-DÁLT, bucket BÁ-ket, function FÁNK
      // Reduced: available a-VÉI-la-bol, vertical -kol: the syllabic -le is "ol".
      if (c.last && c.next?.p === 'L' && c.syllabicLe) return 'o';
      // foundation -shon, function -shon, moderation -shon: every -tion in COMMON.
      if (c.prev?.p === 'SH' && c.next?.p === 'N' && c.last) return 'o';
      // image -mich, message -sich, storage -rich: CMU has a schwa where COMMON (and most US speakers) say ɪ.
      if (c.next?.p === 'JH' && c.last) return 'i';
      // private PRÁI-vet, purchase PÉR-ches: a final -ate/-ase is "e".
      if (c.last && c.silentE) return 'e';
      // Otherwise the letter it is spelled with: developer -lo-, payment -ment, credentials -shals.
      if (c.spelled) return SCHWA_BY_LETTER[c.spelled[c.spelled.length - 1]] ?? 'a';
      // No spelling to read: "a", the Spanish vowel closest to a schwa.
      return 'a';
    case 'AO':
      return 'o'; // storage STÓ, sign-off -of, automatically o-
    case 'AW':
      return 'au'; // browser BRÁU, account -KÁUNT
    case 'AY':
      return 'ai'; // midnight -nait, private PRÁI
    case 'EH':
    case 'EX':
      return 'e'; // moderation mo-de-RÉI: an r before a vowel starts the next syllable
    case 'ER':
      return 'er'; // server SÉR-ver, merchant MÉR, purchase PÉR
    case 'EY':
      return 'ei'; // payment PÉI, database DÉI
    case 'IH':
      // bucket BÁ-ket, protected -ted keep a spelled e; message -sich, image -mich, developer di- are i.
      if (ph.stress === 0 && c.spelled === 'e' && !c.first) return 'e';
      // developer di-, december di-, deploy di-: a first syllable stays i.
      return 'i';
    case 'IY':
      return 'i'; // reader RÍ, weekly -kli
    case 'OW':
      return 'ou'; // token TÓU, scope SKÓUP
    case 'OY':
      return 'oi'; // deploy di-PLÓI
    case 'UH':
      return 'u'; // webhook -juk
    case 'UW':
      return 'u'; // supabase SÚ, schedule -dyul
    default:
      return '';
  }
}

function consonantLetters(ph: Phone, next: Phone | undefined, nextLetters: string): string {
  switch (ph.p) {
    case 'DH':
      return 'd'; // whether UÉ-der: the Spanish d between vowels is already that sound
    case 'TH':
      // No Spanish letter says it, and a rioplatense reader says z and c as s, the error to avoid: the English
      // "th" itself reminds the tongue between the teeth.
      return 'th';
    case 'HH':
      return 'j'; // github GUÍT-jab
    case 'JH':
      // ledger LÉ-dyer, staging STÉI-dying; at the end of the word ch, as Spanish cannot end in dy: image Í-mich.
      return next ? 'dy' : 'ch';
    case 'ZH':
      return 'y'; // usually IÚ-yua-li: the rioplatense y is that sound
    case 'Z':
      return 's'; // browser -ser, timezone -soun, wednesday UÉNS
    case 'W':
      // quote KUÓUT, paywall -uol. After g before e/i the u has to sound: güi.
      return 'u';
    case 'Y':
      return 'i'; // queue KIÚ, unique iu-: never "y", which a rioplatense reader says as "sh"
    case 'NG':
      return next && (next.p === 'K' || next.p === 'G') ? 'n' : 'ng'; // function FÁNK, staging -dying
    case 'G':
      return /^[eiéí]/i.test(nextLetters) ? 'gu' : 'g'; // github GUÍT
    case 'K':
      return 'k';
    case 'CH':
      return 'ch';
    case 'SH':
      return 'sh';
    default:
      return ph.p.toLowerCase(); // B D F L M N P R S T V
  }
}

const ACUTE: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

export interface Respelling {
  say: string;
  ipa: string;
}

/**
 * The respelling and IPA of one pronunciation. `word` is its spelling, used
 * only to read the reduced vowels; without it they fall back to "a"/"i".
 */
export function respellArpabet(arpabet: string | readonly Phone[], word = '', seams: readonly number[] = []): Respelling {
  const parsed = typeof arpabet === 'string' ? parseArpabet(arpabet) : arpabet;
  // ER before a vowel: its vowel here, its r in the next syllable (mo-de-RÉI-shon, ˌmɑːdəˈreɪʃən).
  const phones: Phone[] = [];
  const boundaries = new Set<number>();
  parsed.forEach((ph, i) => {
    if (seams.includes(i)) boundaries.add(phones.length);
    if (ph.p === 'ER' && isVowel(parsed[i + 1]) && !seams.includes(i + 1)) phones.push({ p: 'EX', stress: ph.stress }, { p: 'R', stress: null });
    else phones.push(ph);
  });
  const syllables = syllabify(phones, boundaries);
  const spelled = spellingVowels(word);
  const aligned = spelled.length === syllables.length;
  const letters = word.replace(/[^a-z]/gi, '').toLowerCase();
  const syllabicLe = /[^aeiouy]le[sd]?$/.test(letters);
  const silentE = /[^aeiouy]a[^aeiouyl]e$/.test(letters);
  // A stressed syllable: the primary one; a word without one (rare in CMU) stresses nothing.
  const primary = syllables.findIndex((s) => s.some((p) => p.stress === 1));

  const parts = syllables.map((syl, si) => {
    // Right to left, so a consonant can look at the letters after it (g before e/i).
    const letters: string[] = new Array(syl.length).fill('');
    let after = '';
    let nucleusAt = -1;
    for (let k = syl.length - 1; k >= 0; k--) {
      const ph = syl[k];
      const next = syl[k + 1] ?? syllables[si + 1]?.[0];
      if (isVowel(ph)) {
        nucleusAt = k;
        const prev = syl[k - 1] ?? syllables[si - 1]?.[syllables[si - 1].length - 1];
        letters[k] = vowelLetters(ph, {
          next,
          prev,
          spelled: aligned ? spelled[si] : null,
          last: si === syllables.length - 1,
          first: si === 0,
          syllabicLe,
          silentE,
        });
      } else if (ph.p === 'W' && syl[k - 1]?.p === 'G' && /^[eiéí]/i.test(after)) {
        letters[k] = 'ü';
      } else {
        letters[k] = consonantLetters(ph, next, after);
      }
      after = letters[k] + after;
    }
    if (si === primary && nucleusAt >= 0) {
      const v = letters[nucleusAt];
      letters[nucleusAt] = (ACUTE[v[0]] ?? v[0]) + v.slice(1);
      return letters.join('').toUpperCase();
    }
    return letters.join('');
  });

  return { say: parts.join('-'), ipa: ipaOf(syllables, primary) };
}

// ---------------------------------------------------------------------------
// IPA, in COMMON's style (US, length marks on the tense vowels)
// ---------------------------------------------------------------------------

const IPA_CONSONANT: Record<string, string> = {
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ',
  P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
};

function ipaVowel(ph: Phone, next: Phone | undefined): string {
  switch (ph.p) {
    case 'AA':
      return 'ɑː';
    case 'AE':
      return 'æ';
    case 'AH':
      return ph.stress === 0 ? 'ə' : 'ʌ';
    case 'AO':
      return 'ɔː';
    case 'AW':
      return 'aʊ';
    case 'AY':
      return 'aɪ';
    case 'EH':
      return 'ɛ';
    case 'ER':
      return ph.stress === 0 ? 'ər' : 'ɜːr';
    case 'EX':
      return ph.stress === 0 ? 'ə' : 'ɜː';
    case 'EY':
      return 'eɪ';
    case 'IH':
      return 'ɪ';
    case 'IY':
      return ph.stress === 0 ? 'i' : 'iː';
    case 'OW':
      return 'oʊ';
    case 'OY':
      return 'ɔɪ';
    case 'UH':
      return 'ʊ';
    case 'UW':
      return ph.stress === 0 ? 'u' : 'uː';
    default:
      return next ? '' : '';
  }
}

function ipaOf(syllables: Phone[][], primary: number): string {
  const many = syllables.length > 1;
  return syllables
    .map((syl, si) => {
      const body = syl.map((ph, k) => (isVowel(ph) ? ipaVowel(ph, syl[k + 1]) : IPA_CONSONANT[ph.p] ?? '')).join('');
      if (!many) return body;
      if (si === primary) return `ˈ${body}`;
      // Secondary stress is marked only before the primary (ˌɔːtəˈmætɪkli), as COMMON does.
      if (primary > si && syl.some((p) => p.stress === 2)) return `ˌ${body}`;
      return body;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Dictionary lookup (the dictionary is passed in: this module never loads it)
// ---------------------------------------------------------------------------

/** The CMU key of a word as written: lowercase, no accents, no sentence punctuation, no possessive. */
export function cmuKey(word: string): string {
  return word
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/'s$/, '');
}

/** Joins the parts of a compound: the first part keeps its stress, the others' primary turns secondary ("front-end"). */
function joinParts(parts: Phone[][]): Phone[] {
  return parts.flatMap((ph, i) => (i === 0 ? ph : ph.map((p) => (p.stress === 1 ? { ...p, stress: 2 as const } : p))));
}

/** Where the parts meet, as phone indexes. */
function seamsOf(parts: Phone[][]): number[] {
  const out: number[] = [];
  let at = 0;
  for (const p of parts.slice(0, -1)) out.push((at += p.length));
  return out;
}

/** Endings CMU also lists as words: build|ing is one word with a suffix, not a compound. */
const SUFFIXES = new Set([
  'ing', 'ings', 'ers', 'est', 'ion', 'ions', 'ism', 'ist', 'ists', 'ful', 'ous', 'ity', 'ive', 'ent', 'ents', 'ant',
  'ants', 'ance', 'ence', 'able', 'ible', 'less', 'ness', 'ment', 'ments', 'ship', 'ward', 'wards', 'wise', 'ted', 'ies',
]);

const bare = (phones: readonly Phone[]) => phones.map((p) => p.p).join(' ');

/**
 * The seam of a word CMU has whole that is also two CMU words with the same
 * sounds ("checkout" = check + out, "upload" = up + load): syllables do not
 * cross it.
 */
function compoundSeam(key: string, phones: readonly Phone[], dictionary: Readonly<Record<string, string>>): number[] {
  if (!/^[a-z]+$/.test(key)) return [];
  const whole = bare(phones);
  // The second part has three letters at least: brows|er and develop|er are not compounds.
  for (let i = key.length - 3; i >= 2; i--) {
    if (SUFFIXES.has(key.slice(i))) continue;
    const a = dictionary[key.slice(0, i)];
    const b = dictionary[key.slice(i)];
    if (!a || !b) continue;
    const pa = parseArpabet(a);
    if (`${bare(pa)} ${bare(parseArpabet(b))}` === whole && pa.some(isVowel) && parseArpabet(b).some(isVowel)) return [pa.length];
  }
  return [];
}

/**
 * A word's respelling from a CMU-shaped dictionary, or null. A hyphenated word
 * is read part by part; a lowercase word CMU lacks may be two CMU words of at
 * least three letters each ("paywall" = pay + wall). A capitalized word is
 * looked up as is only: a name is never split into guesses.
 */
export function respellFromDictionary(word: string, dictionary: Readonly<Record<string, string>>): Respelling | null {
  const key = cmuKey(word);
  if (!key) return null;
  const direct = dictionary[key];
  if (direct) {
    const phones = parseArpabet(direct);
    return respellArpabet(phones, key, compoundSeam(key, phones, dictionary));
  }
  if (key.includes('-')) {
    const pieces = key.split('-').filter(Boolean);
    const phones = pieces.map((p) => dictionary[p]);
    if (pieces.length > 1 && phones.every(Boolean)) {
      const parts = phones.map((p) => parseArpabet(p as string));
      return respellArpabet(joinParts(parts), pieces.join(''), seamsOf(parts));
    }
    return null;
  }
  const capitalized = /^\p{Lu}/u.test(word.replace(/^[^\p{L}]+/u, ''));
  if (capitalized || !/^[a-z]+$/.test(key)) return null;
  for (let i = key.length - 3; i >= 3; i--) {
    if (SUFFIXES.has(key.slice(i))) continue;
    const a = dictionary[key.slice(0, i)];
    const b = dictionary[key.slice(i)];
    if (a && b) {
      const parts = [parseArpabet(a), parseArpabet(b)];
      return respellArpabet(joinParts(parts), key, seamsOf(parts));
    }
  }
  return null;
}
