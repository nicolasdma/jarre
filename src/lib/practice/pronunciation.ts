/**
 * Pronunciation help for the drill practice: how a target word sounds to a
 * Spanish ear, and which words of an attempt are worth drilling.
 *
 * Respellings come from the lesson's key terms first, then from the short
 * dictionary below of common technical English words, then from CMUdict
 * (served by /api/practice/respell, converted by arpabet-respell.ts). A word
 * in none gets no respelling (the view offers the audio only): nothing is
 * guessed.
 *
 * Respelling convention: syllables split with "-", the stressed one in caps
 * with its accent ("PÉI-uol"); "u" before a vowel is an English w, "j" an
 * English h, "dy" the j of "jet", "sh" and "ch" as in English. IPA is US
 * English, without slashes.
 *
 * Pure module: no DOM, no React.
 */

import type { KeyTerm } from './key-terms';
import { heardInstead, type WordAlignment } from './scoring';

export interface Pronunciation {
  say: string;
  ipa: string | null;
  source: 'term' | 'common' | 'dictionary';
}

/** Common technical English words a Spanish speaker tends to misplace, [respelling, IPA]. */
export const COMMON: Record<string, [string, string]> = {
  access: ['ÁK-ses', 'ˈæksɛs'],
  account: ['a-KÁUNT', 'əˈkaʊnt'],
  adult: ['a-DÁLT', 'əˈdʌlt'],
  agency: ['ÉI-dyen-si', 'ˈeɪdʒənsi'],
  api: ['ei-pi-ÁI', 'ˌeɪpiːˈaɪ'],
  architecture: ['ÁR-ki-tek-cher', 'ˈɑːrkɪtɛktʃər'],
  automatically: ['o-to-MÁ-ti-kli', 'ˌɔːtəˈmætɪkli'],
  available: ['a-VÉI-la-bol', 'əˈveɪləbəl'],
  backend: ['BÁK-end', 'ˈbækɛnd'],
  'back-end': ['BÁK-end', 'ˈbækɛnd'],
  balance: ['BÁ-lans', 'ˈbæləns'],
  browser: ['BRÁU-ser', 'ˈbraʊzər'],
  bucket: ['BÁ-ket', 'ˈbʌkɪt'],
  buckets: ['BÁ-kets', 'ˈbʌkɪts'],
  cache: ['KASH', 'kæʃ'],
  chapter: ['CHÁP-ter', 'ˈtʃæptər'],
  checkout: ['CHÉK-aut', 'ˈtʃɛkaʊt'],
  contract: ['KÓN-trakt', 'ˈkɑːntrækt'],
  creator: ['kri-ÉI-ter', 'kriˈeɪtər'],
  creators: ['kri-ÉI-ters', 'kriˈeɪtərz'],
  credentials: ['kre-DÉN-shals', 'krəˈdɛnʃəlz'],
  database: ['DÉI-ta-beis', 'ˈdeɪtəbeɪs'],
  december: ['di-SÉM-ber', 'dɪˈsɛmbər'],
  deploy: ['di-PLÓI', 'dɪˈplɔɪ'],
  developer: ['di-VÉ-lo-per', 'dɪˈvɛləpər'],
  foundation: ['faun-DÉI-shon', 'faʊnˈdeɪʃən'],
  frontend: ['FRÁNT-end', 'ˈfrʌntɛnd'],
  'front-end': ['FRÁNT-end', 'ˈfrʌntɛnd'],
  function: ['FÁNK-shon', 'ˈfʌŋkʃən'],
  funded: ['FÁN-did', 'ˈfʌndɪd'],
  github: ['GUÍT-jab', 'ˈɡɪthʌb'],
  iframe: ['ÁI-freim', 'ˈaɪfreɪm'],
  image: ['Í-mich', 'ˈɪmɪdʒ'],
  leaderboard: ['LÍ-der-bord', 'ˈliːdərbɔːrd'],
  ledger: ['LÉ-dyer', 'ˈlɛdʒər'],
  manager: ['MÁ-ne-dyer', 'ˈmænɪdʒər'],
  merchant: ['MÉR-chant', 'ˈmɜːrtʃənt'],
  message: ['MÉ-sich', 'ˈmɛsɪdʒ'],
  midnight: ['MÍD-nait', 'ˈmɪdnaɪt'],
  milestone: ['MÁILS-toun', 'ˈmaɪlstoʊn'],
  milestones: ['MÁILS-touns', 'ˈmaɪlstoʊnz'],
  moderation: ['mo-de-RÉI-shon', 'ˌmɑːdəˈreɪʃən'],
  panels: ['PÁ-nels', 'ˈpænəlz'],
  payment: ['PÉI-ment', 'ˈpeɪmənt'],
  payments: ['PÉI-ments', 'ˈpeɪmənts'],
  payout: ['PÉI-aut', 'ˈpeɪaʊt'],
  payouts: ['PÉI-auts', 'ˈpeɪaʊts'],
  paywall: ['PÉI-uol', 'ˈpeɪwɔːl'],
  polish: ['PÓ-lish', 'ˈpɑːlɪʃ'],
  portal: ['PÓR-tal', 'ˈpɔːrtəl'],
  postback: ['PÓUST-bak', 'ˈpoʊstbæk'],
  private: ['PRÁI-vet', 'ˈpraɪvət'],
  protected: ['pro-TÉK-ted', 'prəˈtɛktɪd'],
  protection: ['pro-TÉK-shon', 'prəˈtɛkʃən'],
  purchase: ['PÉR-ches', 'ˈpɜːrtʃəs'],
  purchases: ['PÉR-che-sis', 'ˈpɜːrtʃəsɪz'],
  queue: ['KIÚ', 'kjuː'],
  quote: ['KUÓUT', 'kwoʊt'],
  react: ['ri-ÁKT', 'riˈækt'],
  reader: ['RÍ-der', 'ˈriːdər'],
  readers: ['RÍ-ders', 'ˈriːdərz'],
  repo: ['RÍ-pou', 'ˈriːpoʊ'],
  repository: ['ri-PÓ-si-to-ri', 'rɪˈpɑːzɪtɔːri'],
  revenue: ['RÉ-ve-nu', 'ˈrɛvənuː'],
  sandbox: ['SÁND-boks', 'ˈsændbɑːks'],
  schedule: ['SKÉ-dyul', 'ˈskɛdʒuːl'],
  schema: ['SKÍ-ma', 'ˈskiːmə'],
  scope: ['SKÓUP', 'skoʊp'],
  screenshot: ['SKRÍN-shot', 'ˈskriːnʃɑːt'],
  security: ['se-KIÚ-ri-ti', 'səˈkjʊrəti'],
  server: ['SÉR-ver', 'ˈsɜːrvər'],
  'sign-off': ['SÁIN-of', 'ˈsaɪnɔːf'],
  signature: ['SÍG-na-cher', 'ˈsɪɡnətʃər'],
  staging: ['STÉI-dying', 'ˈsteɪdʒɪŋ'],
  storage: ['STÓ-rich', 'ˈstɔːrɪdʒ'],
  supabase: ['SÚ-pa-beis', 'ˈsuːpəbeɪs'],
  timezone: ['TÁIM-soun', 'ˈtaɪmzoʊn'],
  token: ['TÓU-ken', 'ˈtoʊkən'],
  transaction: ['tran-SÁK-shon', 'trænˈzækʃən'],
  typescript: ['TÁIP-skript', 'ˈtaɪpskrɪpt'],
  unique: ['iu-NÍK', 'juˈniːk'],
  upload: ['ÁP-loud', 'ˈʌploʊd'],
  upwork: ['ÁP-uerk', 'ˈʌpwɜːrk'],
  url: ['iu-ar-ÉL', 'ˌjuːɑːrˈɛl'],
  usually: ['IÚ-yua-li', 'ˈjuːʒuəli'],
  vercel: ['ver-SÉL', 'vərˈsɛl'],
  verification: ['ve-ri-fi-KÉI-shon', 'ˌvɛrɪfɪˈkeɪʃən'],
  verified: ['VÉ-ri-faid', 'ˈvɛrɪfaɪd'],
  vertical: ['VÉR-ti-kol', 'ˈvɜːrtɪkəl'],
  watermark: ['UÓ-ter-mark', 'ˈwɔːtərmɑːrk'],
  webhook: ['UÉB-juk', 'ˈwɛbhʊk'],
  webhooks: ['UÉB-juks', 'ˈwɛbhʊks'],
  wednesday: ['UÉNS-dei', 'ˈwɛnzdeɪ'],
  weekly: ['UÍ-kli', 'ˈwiːkli'],
  whether: ['UÉ-der', 'ˈwɛðər'],
};

/** "Supabase," → "Supabase"; "(18+)" → "18+": the word as it is read, without the sentence's punctuation. */
export function cleanWord(word: string): string {
  return word.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[.,;:!?)"”’']+$/u, '');
}

export function dictionaryKey(word: string): string {
  return cleanWord(word).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’]/g, "'").replace(/'s$/, '');
}

/** The dictionary's respelling of a single word, or null. */
export function commonPronunciation(word: string): Pronunciation | null {
  const hit = COMMON[dictionaryKey(word)];
  return hit ? { say: hit[0], ipa: hit[1], source: 'common' } : null;
}

/** A key term's respelling if the lesson has one, else the dictionary's (single-word terms), else null. */
export function pronunciationFor(word: string, term: KeyTerm | null): Pronunciation | null {
  if (term?.say) return { say: term.say, ipa: term.ipa, source: 'term' };
  if (term && /\s/.test(term.term.trim())) return null;
  return commonPronunciation(term ? term.term : word);
}

/** What CMUdict gave, keyed by dictionaryKey. */
export type DictionaryRespellings = ReadonlyMap<string, { say: string; ipa: string }>;

/**
 * Key term → COMMON → CMUdict → null. A multi-word key term without its own
 * respelling gets none (its words are not respelled one by one).
 */
export function resolvePronunciation(word: string, term: KeyTerm | null, fromDictionary: DictionaryRespellings): Pronunciation | null {
  if (term?.say) return { say: term.say, ipa: term.ipa, source: 'term' };
  if (term && /\s/.test(term.term.trim())) return null;
  const subject = term ? term.term : word;
  const common = commonPronunciation(subject);
  if (common) return common;
  const hit = fromDictionary.get(dictionaryKey(subject));
  return hit ? { say: hit.say, ipa: hit.ipa, source: 'dictionary' } : null;
}

/** Whether a word needs CMUdict at all: not a function word, not covered by a key term or COMMON. */
export function needsDictionary(word: string, term: KeyTerm | null): boolean {
  if (term?.say || (term && /\s/.test(term.term.trim()))) return false;
  const subject = term ? term.term : word;
  const key = dictionaryKey(subject);
  return Boolean(key) && /\p{L}/u.test(key) && !FUNCTION_WORDS.has(key) && !commonPronunciation(subject);
}

// ---------------------------------------------------------------------------
// Words to practice after an attempt
// ---------------------------------------------------------------------------

/** Function words: a miss on them is almost always the recognizer, and drilling "the" helps nobody. */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'as',
  'is', 'are', 'was', 'be', 'it', 'its', "it's", 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our',
  'their', 'this', 'that', 'these', 'those', 'do', 'does', 'if', 'then', 'than', 'not', 'no', 'yes', 'um', 'uh',
]);

export interface PracticeWord {
  /** What to show and say: the key term, or the target word without punctuation. */
  text: string;
  /** Index into the lesson's key terms, when it is one. */
  term: number | null;
  /** Index of its first word in the target. */
  wordIndex: number;
  /** `missed`: not recognized; `alias`: a name the recognizer wrote as a sound-alike (check it by ear). */
  kind: 'missed' | 'alias';
  /** What the recognizer wrote instead ("payroll"), when it wrote something. */
  heard: string | null;
}

/**
 * The words of an attempt worth drilling: each missed word (or key term) once,
 * in order, function words left out; then the key terms the recognizer only
 * got as a sound-alike.
 */
export function wordsToPractice(alignment: WordAlignment, terms: readonly KeyTerm[], limit = 12): PracticeWord[] {
  const missed: PracticeWord[] = [];
  const alias: PracticeWord[] = [];
  const seen = new Set<string>();
  // What was said instead belongs to the gap, not to each word in it: shown once, on its first miss.
  const gapsTold = new Set<number>();
  alignment.words.forEach((w, i) => {
    const term = w.term !== null ? terms[w.term] ?? null : null;
    // A term is one item, from its first word.
    if (term && i > 0 && alignment.words[i - 1].term === w.term) return;
    const text = term ? term.term : cleanWord(w.word);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    if (w.state === 'missed') {
      if (!term && FUNCTION_WORDS.has(key)) return;
      seen.add(key);
      const heard = gapsTold.has(w.gap) ? null : heardInstead(alignment, i);
      gapsTold.add(w.gap);
      missed.push({ text, term: w.term, wordIndex: i, kind: 'missed', heard });
    } else if (w.state === 'said' && w.viaAlias) {
      seen.add(key);
      alias.push({ text, term: w.term, wordIndex: i, kind: 'alias', heard: w.heardAs });
    }
  });
  return [...missed, ...alias].slice(0, limit);
}
