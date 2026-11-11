import { describe, expect, it } from 'vitest';
import { keyTermsFromInterview, toKeyTerm, type KeyTerm } from '../key-terms';
import { commonPronunciation, pronunciationFor, wordsToPractice } from '../pronunciation';
import { alignWords, heardInstead, normalizeWords } from '../scoring';

const TERMS: KeyTerm[] = [
  toKeyTerm({ term: 'Supabase', heard_as: ['super base', 'supa base', 'super bass'], say: 'SÚ-pa-beis', ipa: 'ˈsuːpəbeɪs' }),
  toKeyTerm({ term: 'Vercel', heard_as: ['versel', 'versa'], say: 'ver-SÉL' }),
  toKeyTerm({ term: 'Centrobill', heard_as: ['centerville', 'centro bill'], say: 'SÉN-tro-bil' }),
  toKeyTerm({ term: '120-second', heard_as: ['one twenty second', '122nd'], speak: 'a hundred and twenty second' }),
  toKeyTerm({ term: '45/55', heard_as: ['4555', 'forty five fifty five'], speak: 'forty-five fifty-five' }),
  toKeyTerm({ term: 'row-level security', heard_as: [] }),
  toKeyTerm('postMessage'),
];

const TEXT =
  'Week one is the foundation: the full schema in Supabase, row-level security on every table, the 45/55 split, ' +
  'and the 120-second signed links on Vercel staging. Week four is payments: the Centrobill iframe and the paywall.';

describe('key terms in the lesson data', () => {
  it('reads bare strings and objects, and skips anything invalid', () => {
    const terms = keyTermsFromInterview({ key_terms: ['Brivel', { term: 'Paxum', heard_as: ['pack sum'], say: 'PÁK-sum' }, 3, { nope: 1 }] });
    expect(terms.map((t) => t.term)).toEqual(['Brivel', 'Paxum']);
    expect(terms[1]).toMatchObject({ heardAs: ['pack sum'], say: 'PÁK-sum', speak: 'Paxum' });
    expect(keyTermsFromInterview(null)).toEqual([]);
  });
});

describe('alignWords with key terms', () => {
  it('counts a proper noun said as a known sound-alike, flagged to check by ear', () => {
    const a = alignWords('The full schema in Supabase, on Vercel.', 'the full schema in super bass on versa', { terms: TERMS });
    expect(a.score).toBe(100);
    const supa = a.words.find((w) => w.word === 'Supabase,')!;
    expect(supa).toMatchObject({ state: 'said', viaAlias: true, heardAs: 'super bass' });
    expect(a.words.find((w) => w.word === 'Vercel.')).toMatchObject({ state: 'said', viaAlias: true, heardAs: 'versa' });
    expect(a.extras).toEqual([]);
  });

  it('marks the name said as itself as plainly said', () => {
    const a = alignWords('The Centrobill iframe.', 'the Centrobill iframe', { terms: TERMS });
    expect(a.words[1]).toMatchObject({ state: 'said', viaAlias: false, heardAs: null });
  });

  it('accepts number spellings of figures', () => {
    const t = 'the 45/55 split and the 120-second links';
    expect(alignWords(t, 'the 4555 split and the 122nd links', { terms: TERMS }).score).toBe(100);
    expect(alignWords(t, 'the 45 55 split and the one twenty second links', { terms: TERMS }).score).toBe(100);
    expect(alignWords(t, 'the forty five fifty five split and the 120 second links', { terms: TERMS }).score).toBe(100);
  });

  it('takes a name written with other spacing as the name itself, without flagging it', () => {
    const terms = [toKeyTerm('postback'), toKeyTerm('ExoClick')];
    const a = alignWords('the iframe and postback on ExoClick', 'the iframe and post back on exo click', { terms });
    expect(a.score).toBe(100);
    expect(a.words.some((w) => w.viaAlias)).toBe(false);
    expect(alignWords('the 45/55 split', 'the 4555 split', { terms: TERMS }).words[1]).toMatchObject({ state: 'said', viaAlias: false });
  });

  it('keeps a real mispronunciation of a common word as a miss: payroll is not paywall', () => {
    const a = alignWords('the paywall at chapter four', 'the payroll at chapter four', { terms: TERMS });
    const paywall = a.words.find((w) => w.word === 'paywall')!;
    expect(paywall.state).toBe('missed');
    expect(heardInstead(a, a.words.indexOf(paywall))).toBe('payroll');
    expect(a.extras.map((e) => e.word)).toEqual(['payroll']);
  });

  it('does not accept a sound-alike for a term the text does not have', () => {
    const a = alignWords('vice versa', 'vice versa', { terms: TERMS });
    expect(a.score).toBe(100);
    expect(a.words.every((w) => !w.viaAlias && w.term === null)).toBe(true);
  });

  it('does not take sound-alikes when typing (dictation spells the name)', () => {
    const a = alignWords('in Supabase', 'in super base', { terms: TERMS, acceptSoundAlikes: false });
    expect(a.words[1].state).toBe('missed');
  });

  it('matches multi-word terms as a whole and scores them by their words', () => {
    const a = alignWords('row-level security on every table', 'row level security on every table', { terms: TERMS });
    expect(a.score).toBe(100);
    expect(a.total).toBe(6);
    expect(a.words.slice(0, 2).map((w) => w.term)).toEqual([5, 5]);
    const half = alignWords('row-level security on every table', 'row level on every table', { terms: TERMS });
    expect(half.words.slice(0, 2).map((w) => w.state)).toEqual(['missed', 'missed']);
  });

  it('returns every target word once, in order, whatever was heard (the text never reflows)', () => {
    const words = TEXT.split(/\s+/);
    const empty = alignWords(TEXT, '', { terms: TERMS });
    const noisy = alignWords(TEXT, 'um so the maximum paksum vacuum pack some the payroll super bass four five five five', { terms: TERMS });
    expect(empty.words.map((w) => w.word)).toEqual(words);
    expect(noisy.words.map((w) => w.word)).toEqual(words);
    expect(noisy.words.map((w) => w.term)).toEqual(empty.words.map((w) => w.term));
    expect(noisy.extras.length).toBeGreaterThan(0);
  });

  it('leaves the words not reached yet as pending while speaking', () => {
    const a = alignWords('I have been writing code for six years.', 'I have been', { pendingTail: true });
    expect(a.words.map((w) => w.state)).toEqual(['said', 'said', 'said', 'pending', 'pending', 'pending', 'pending', 'pending']);
    const done = alignWords('I have been writing code for six years.', 'I have been');
    expect(done.words[3].state).toBe('missed');
  });
});

describe('normalizeWords', () => {
  it('reads 18+ and 55% as words, and drops a possessive', () => {
    expect(normalizeWords('the 18-plus gate')).toEqual(normalizeWords('the 18+ gate'));
    expect(normalizeWords('55%')).toEqual(['55', 'percent']);
    expect(normalizeWords("Centrobill's iframe")).toEqual(['centrobill', 'iframe']);
    expect(normalizeWords("it's here")).toEqual(['it', 'is', 'here']);
  });
});

describe('pronunciation', () => {
  it('takes the lesson respelling first, then the dictionary, and never guesses', () => {
    expect(pronunciationFor('Supabase,', TERMS[0])).toMatchObject({ say: 'SÚ-pa-beis', source: 'term' });
    expect(pronunciationFor('paywall', null)).toMatchObject({ say: 'PÉI-uol', source: 'common' });
    expect(commonPronunciation('Ledger.')).toMatchObject({ say: 'LÉ-dyer' });
    expect(pronunciationFor('Brivel', toKeyTerm('Brivel'))).toBeNull();
    expect(pronunciationFor('floccinaucinihilipilification', null)).toBeNull();
  });

  it('lists the words to drill: misses with what was heard, then names the recognizer only got as a sound-alike', () => {
    const a = alignWords('the full schema in Supabase and the paywall at chapter four', 'the full in super bass and the payroll at chapter four', { terms: TERMS });
    const items = wordsToPractice(a, TERMS);
    expect(items.map((i) => [i.text, i.kind, i.heard])).toEqual([
      ['schema', 'missed', null],
      ['paywall', 'missed', 'payroll'],
      ['Supabase', 'alias', 'super bass'],
    ]);
  });

  it('leaves function words out of the list', () => {
    const a = alignWords('the code is on your GitHub', 'code on GitHub', {});
    expect(wordsToPractice(a, []).map((i) => i.text)).toEqual([]);
  });
});
