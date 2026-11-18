import { describe, expect, it } from 'vitest';
import {
  alignTokens,
  drillPhrases,
  hasPhraseMarks,
  normToken,
  placePhrases,
  segmentsFit,
  tokens,
  withoutPhraseMarks,
  type TimedWord,
} from '../phrase-segments';
import type { AudioPauses } from '../sentence-timing';
import real from './fixtures/s01-intro-corta.json';

/** Words spoken one after another, `gap` seconds of silence after the listed indices. */
function speak(text: string, pausesAfter: Record<number, number> = {}, wordSec = 0.3): { words: TimedWord[]; audio: AudioPauses } {
  const words: TimedWord[] = [];
  const pauses: { start: number; end: number }[] = [];
  let t = 0.2;
  text.split(/\s+/).filter((w) => w !== '/').forEach((word, i) => {
    words.push({ word, start: t, end: t + wordSec });
    t += wordSec;
    const gap = pausesAfter[i];
    if (gap) {
      pauses.push({ start: t, end: t + gap });
      t += gap;
    } else t += 0.02;
  });
  return { words, audio: { duration: t + 0.3, speechStart: 0.2, speechEnd: t, pauses } };
}

describe('drill phrases', () => {
  it('splits at every " / " and keeps the punctuation', () => {
    expect(drillPhrases("Hi, I'm Nicolás, / a full-stack engineer. / I like it.")).toEqual([
      "Hi, I'm Nicolás,",
      'a full-stack engineer.',
      'I like it.',
    ]);
  });

  it('is one phrase without marks, and a slash inside a word is not a mark', () => {
    expect(hasPhraseMarks('CI/CD every day. Twice.')).toBe(false);
    expect(drillPhrases('CI/CD every day. Twice.')).toEqual(['CI/CD every day. Twice.']);
    expect(hasPhraseMarks('one / two')).toBe(true);
  });

  it('shows the text without its marks, and keeps a slash inside a word', () => {
    expect(withoutPhraseMarks('Data integrity means / that clinical-trial data / is reliable. /')).toBe(
      'Data integrity means that clinical-trial data is reliable.',
    );
    expect(withoutPhraseMarks('CI/CD every day.')).toBe('CI/CD every day.');
  });

  it('accepts segments only when there is one per phrase, in order', () => {
    const text = 'one / two / three';
    expect(segmentsFit(text, [{ start: 0, end: 1 }, { start: 1, end: 2 }, { start: 2.1, end: 3 }])).toBe(true);
    expect(segmentsFit(text, [{ start: 0, end: 1 }, { start: 1, end: 2 }])).toBe(false);
    expect(segmentsFit(text, [{ start: 0, end: 1 }, { start: 0.5, end: 2 }, { start: 2.1, end: 3 }])).toBe(false);
    expect(segmentsFit(text, null)).toBe(false);
  });
});

describe('aligning the text to the recognized words', () => {
  it('normalizes the way both sides write words', () => {
    expect(normToken('$6,000')).toBe('6000');
    expect(normToken('Nicolás,')).toBe('nicolas');
    expect(tokens('a full-stack engineer / here')).toEqual(['a', 'fullstack', 'engineer', 'here']);
  });

  it('matches names Whisper misspells and skips what it writes differently', () => {
    const text = tokens('the sole front-end developer of Doubland with ten thousand users');
    const heard = tokens('the sole front-end developer of Doblan with 10,000 users');
    const m = alignTokens(text, heard);
    expect(m[5]).toBe(5); // Doubland ↔ Doblan
    expect(m[m.length - 1]).toBe(heard.length - 1); // users
    expect(m[7]).toBeNull(); // "ten" has no word of its own
  });
});

describe('placing the phrases', () => {
  it('cuts in the silence between two phrases, with a short tail and head', () => {
    const text = 'Hi there friend, / this is the second one, / and the third.';
    const { words, audio } = speak(text, { 2: 0.6, 7: 0.5 });
    const placed = placePhrases(drillPhrases(text), words, { duration: audio.duration, pauses: audio });
    expect(placed.problems).toEqual([]);
    expect(placed.segments).toHaveLength(3);
    const [p1, p2] = audio.pauses;
    expect(placed.segments[0].end).toBeCloseTo(p1.start + 0.15, 3);
    expect(placed.segments[1].start).toBeCloseTo(p1.end - 0.08, 3);
    expect(placed.segments[1].end).toBeCloseTo(p2.start + 0.15, 3);
    expect(placed.segments[2].start).toBeCloseTo(p2.end - 0.08, 3);
    // Every word of a phrase is inside its segment, and no word of another one.
    drillPhrases(text).forEach((_, i) => {
      const seg = placed.segments[i];
      const own = words.filter((w) => w.start >= seg.start && w.end <= seg.end).map((w) => w.word);
      expect(own.join(' ')).toBe(drillPhrases(text)[i]);
    });
  });

  it('picks the long breath over a comma pause nearby', () => {
    const text = 'one two, three / four five';
    // A comma pause after "two" (0.2 s) and the breath after "three" (0.7 s).
    const { words, audio } = speak(text, { 1: 0.2, 2: 0.7 });
    const placed = placePhrases(drillPhrases(text), words, { duration: audio.duration, pauses: audio });
    expect(placed.segments[0].end).toBeGreaterThan(words[2].end);
    expect(placed.segments[1].start).toBeLessThan(words[3].start);
  });

  it('cuts halfway between Whisper words when the voice runs on without a silence', () => {
    const text = 'Agents for clinics / is the work';
    const { words, audio } = speak(text);
    const placed = placePhrases(drillPhrases(text), words, { duration: audio.duration, pauses: audio });
    expect(placed.problems).toEqual([]);
    expect(placed.boundaries[0].pause).toBeNull();
    expect(placed.segments[0].end).toBe(placed.segments[1].start);
    expect(placed.segments[0].end).toBeGreaterThanOrEqual(words[2].end);
    expect(placed.segments[0].end).toBeLessThanOrEqual(words[3].start);
  });

  it('refuses a recording that does not say the text', () => {
    const { words, audio } = speak('something else entirely was recorded here today');
    const placed = placePhrases(drillPhrases('Hi there friend, / this is the second one'), words, { duration: audio.duration, pauses: audio });
    expect(placed.segments).toEqual([]);
    expect(placed.problems.length).toBeGreaterThan(0);
  });

  it('places every phrase of a real drill in its own stretch of the recording', () => {
    const phrases = drillPhrases(real.text);
    const placed = placePhrases(phrases, real.words, { duration: real.pauses.duration, pauses: real.pauses });
    expect(placed.problems).toEqual([]);
    expect(placed.segments).toHaveLength(17);
    expect(segmentsFit(real.text, placed.segments)).toBe(true);
    expect(placed.matched / placed.total).toBeGreaterThan(0.95);
    // The cuts sit in a real silence, except where the voice ran on.
    expect(placed.boundaries.filter((b) => b.pause).length).toBeGreaterThanOrEqual(15);
    placed.boundaries.forEach((b, i) => {
      if (!b.pause) return;
      expect(placed.segments[i].end).toBeGreaterThanOrEqual(b.pause.start);
      expect(placed.segments[i + 1].start).toBeLessThanOrEqual(b.pause.end);
    });
    // Every recognized word matched to a phrase falls mostly in that phrase's segment
    // (Whisper's own word edges drift into the silences, so not wholly).
    const match = alignTokens(phrases.flatMap(tokens), real.words.map((w) => normToken(w.word)));
    const overlap = (w: TimedWord, seg: { start: number; end: number }) => Math.max(0, Math.min(w.end, seg.end) - Math.max(w.start, seg.start));
    let k = 0;
    phrases.forEach((p, i) => {
      for (const w of match.slice(k, k + tokens(p).length)) {
        if (w === null) continue;
        const word = real.words[w];
        const own = overlap(word, placed.segments[i]);
        expect(own).toBeGreaterThan(0);
        placed.segments.forEach((seg, j) => {
          if (j !== i) expect(overlap(word, seg)).toBeLessThan(own);
        });
      }
      k += tokens(p).length;
    });
  });
});
