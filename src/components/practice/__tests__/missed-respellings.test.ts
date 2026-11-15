import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { toKeyTerm } from '@/lib/practice/key-terms';
import { alignWords } from '@/lib/practice/scoring';
import { TargetText } from '../target-text';
import { missedRespellings } from '../use-missed-respellings';

const TERMS = [toKeyTerm({ term: 'Doubland', heard_as: ['double and'], say: 'DÁB-land' })];
const TEXT = "At Doubland I'm the only front-end developer;";
const DICT = new Map([
  ['integration', { say: 'in-te-GRÉI-shon', ipa: 'ˌɪntəˈɡreɪʃən' }],
  ['end-to-end', { say: 'ÉND-tu-end', ipa: 'ˈɛndtuːɛnd' }],
]);

const skeleton = (html: string) => html.replace(/<(\/?\w+)[^>]*>/g, '<$1>');

describe('missedRespellings', () => {
  it('respells the missed words of the attempt: key term, then COMMON, then the dictionary', () => {
    const replaced = missedRespellings(TEXT, "at I'm the only developer", TERMS, DICT);
    expect([...replaced.values()]).toEqual(['DÁB-land', 'FRÁNT-end']);
    const plain = missedRespellings('I led the Playwright integration for our end-to-end tests.', 'I led the for our tests', [], DICT);
    // Playwright: no term and not in the dictionary, so it stays as written.
    expect([...plain.values()]).toEqual(['in-te-GRÉI-shon', 'ÉND-tu-end']);
  });
  it('leaves out function words, words said, and key terms said as their sound-alike', () => {
    expect(missedRespellings(TEXT, "at double and I'm only front end developer", TERMS, DICT).size).toBe(0);
  });
});

describe('TargetText with replaced words', () => {
  const render = (heard: string | null, replaced?: Map<number, string>, pendingTail = false) => {
    const alignment = alignWords(TEXT, heard ?? '', { terms: TERMS, pendingTail });
    return renderToStaticMarkup(createElement(TargetText, { words: alignment.words, terms: TERMS, colored: heard !== null, replaced }));
  };
  const replaced = missedRespellings(TEXT, "at I'm the only developer", TERMS, DICT);

  it('writes the missed words as they sound, punctuation kept, spelling in the title; the rest stays English', () => {
    const html = render(null, replaced);
    expect(html).toContain('>DÁB-land<');
    expect(html).toContain('>FRÁNT-end<');
    expect(html).toContain('title="Doubland · así suena"');
    expect(html).toContain('aria-label="front-end"');
    expect(html.match(/data-replaced/g)).toHaveLength(2);
    expect(html).toContain('>developer;<');
    expect(html).not.toContain('>Doubland<');
  });

  it('keeps the punctuation of the sentence around the respelling', () => {
    const r = missedRespellings('I build the Playwright integration, every day.', 'I build the Playwright every day', [], DICT);
    const alignment = alignWords('I build the Playwright integration, every day.', '', {});
    const html = renderToStaticMarkup(createElement(TargetText, { words: alignment.words, terms: [], colored: false, replaced: r }));
    expect(html).toContain('>in-te-GRÉI-shon,<');
  });

  it('does not reflow while the retry is spoken: same tags before, while and after', () => {
    const before = render(null, replaced);
    expect(skeleton(render('at double and', replaced, true))).toBe(skeleton(before));
    expect(skeleton(render("at double and I'm the only front end developer", replaced))).toBe(skeleton(before));
  });

  it('without replaced words renders exactly as before', () => {
    expect(render(null, new Map())).toBe(render(null));
  });
});
