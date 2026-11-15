import { dictionary } from 'cmu-pronouncing-dictionary';
import { describe, expect, it } from 'vitest';
import {
  cmuKey,
  parseArpabet,
  respellArpabet,
  respellFromDictionary,
  spellingVowels,
  syllabify,
} from '../arpabet-respell';
import { COMMON } from '../pronunciation';

const syl = (arpabet: string) => syllabify(parseArpabet(arpabet)).map((s) => s.map((p) => p.p).join(' '));
const say = (word: string) => respellFromDictionary(word, dictionary)?.say ?? null;
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

describe('syllabify (maximal onset, English onsets)', () => {
  it('gives the next syllable the longest legal onset', () => {
    expect(syl('CH AE1 P T ER0')).toEqual(['CH AE P', 'T ER']); // PT is not an onset: chap-ter
    expect(syl('EH1 K S T R AH0')).toEqual(['EH K', 'S T R AH']); // ex-tra: STR is
    expect(syl('B AE1 L AH0 N S')).toEqual(['B AE', 'L AH N S']);
  });
  it('never starts a syllable with NG, and keeps clusters that are not onsets apart', () => {
    expect(syl('S IH1 NG ER0')).toEqual(['S IH NG', 'ER']);
    expect(syl('L AE1 NG G W AH0 JH')).toEqual(['L AE NG', 'G W AH JH']);
    expect(syl('M AY1 L S T OW2 N')).toEqual(['M AY L', 'S T OW N']);
  });
  it('one vowel, one syllable; vowel-initial and vowel-to-vowel words', () => {
    expect(syl('K Y UW1')).toEqual(['K Y UW']);
    expect(syl('AH0 V EY1 L AH0 B AH0 L')).toEqual(['AH', 'V EY', 'L AH', 'B AH L']);
    expect(syl('R IY0 AE1 K T')).toEqual(['R IY', 'AE K T']);
  });
  it('respects a seam: a compound is split where its parts meet', () => {
    expect(syllabify(parseArpabet('CH EH1 K AW2 T'), new Set([3])).map((s) => s.map((p) => p.p).join(' '))).toEqual(['CH EH K', 'AW T']);
  });
});

describe('respellArpabet: the drill convention', () => {
  it('caps the stressed syllable and accents its vowel, not a glide', () => {
    expect(respellArpabet('K Y UW1', 'queue').say).toBe('KIÚ');
    expect(respellArpabet('K W OW1 T', 'quote').say).toBe('KUÓUT');
    expect(respellArpabet('W EH1 DH ER0', 'whether').say).toBe('UÉ-der');
  });
  it('maps the English sounds to Spanish-ear letters', () => {
    expect(respellArpabet('G IH1 T HH AH0 B', 'github').say).toBe('GUÍT-jab'); // gu before i, h → j
    expect(respellArpabet('L EH1 JH ER0', 'ledger').say).toBe('LÉ-dyer');
    expect(respellArpabet('IH1 M AH0 JH', 'image').say).toBe('Í-mich'); // final dy → ch
    expect(respellArpabet('TH IH1 NG K', 'think').say).toBe('THÍNK');
    expect(respellArpabet('F AH1 NG K SH AH0 N', 'function').say).toBe('FÁNK-shon');
    expect(respellArpabet('B R AW1 Z ER0', 'browser').say).toBe('BRÁU-ser'); // z → s
  });
  it('reads the reduced vowels from the spelling when the syllables line up', () => {
    expect(respellArpabet('D IH0 V EH1 L AH0 P ER0', 'developer').say).toBe('di-VÉ-lo-per');
    expect(respellArpabet('AH0 V EY1 L AH0 B AH0 L', 'available').say).toBe('a-VÉI-la-bol');
    expect(respellArpabet('M AA2 D ER0 EY1 SH AH0 N', 'moderation').say).toBe('mo-de-RÉI-shon');
  });
  it('writes US IPA with stress marks, none on one syllable', () => {
    expect(respellArpabet('K AE1 SH', 'cache').ipa).toBe('kæʃ');
    expect(respellArpabet('AO2 T AH0 M AE1 T IH0 K L IY0', 'automatically').ipa).toBe('ˌɔːtəˈmætɪkli');
    expect(respellArpabet('M AA2 D ER0 EY1 SH AH0 N', 'moderation').ipa).toBe('ˌmɑːdəˈreɪʃən');
  });
});

describe('respellFromDictionary', () => {
  it('normalizes the word as written in the drill', () => {
    expect(cmuKey('“Browser,”')).toBe('browser');
    expect(cmuKey("Runbo's")).toBe('runbo');
    expect(spellingVowels('image')).toEqual(['i', 'a']);
    expect(spellingVowels('available')).toEqual(['a', 'ai', 'a', 'e']);
  });
  it('splits compounds at their seam, hyphenated or not', () => {
    expect(say('checkout')).toBe('CHÉK-aut');
    expect(say('front-end')).toBe('FRÁNT-end');
    expect(say('paywall')).toBe('PÉI-uol'); // not in CMU: pay + wall
    expect(say('building')).toBe('BÍL-ding'); // a suffix is not a compound part
  });
  it('never guesses a name: a capitalized word CMU lacks gets nothing', () => {
    expect(say('Doubland')).toBeNull();
    expect(say('Runbo')).toBeNull();
    expect(say('Paywall')).toBeNull();
  });
  it('reproduces most of COMMON from CMUdict', () => {
    const entries = Object.entries(COMMON);
    let found = 0;
    let exact = 0;
    let loose = 0;
    for (const [word, [expected]] of entries) {
      const got = say(word);
      if (!got) continue;
      found++;
      if (got === expected) exact++;
      if (fold(got) === fold(expected)) loose++;
    }
    // 2026-11-15: 92 of 95 in CMU, 77 exact, 80 ignoring accents and case. The rest are CMU's own vowels or stress
    // (vercel, wednesday) or COMMON's choices (milestone MÁILS-toun).
    expect(found).toBeGreaterThanOrEqual(90);
    expect(exact).toBeGreaterThanOrEqual(75);
    expect(loose).toBeGreaterThanOrEqual(78);
  });
});
