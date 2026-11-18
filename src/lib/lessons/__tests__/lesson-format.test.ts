import { describe, expect, it } from 'vitest';
import {
  cardContentKey,
  drillSegments,
  LessonSchema,
  mapCard,
  mapQuiz,
  normalizeSectionMarkdown,
  resolveQuizHeading,
  sectionHeadings,
  segmentsSidecarPath,
  selectCardsToEnroll,
  stableUuid,
  type DrillSegmentsFile,
  type LessonQuiz,
} from '../lesson-format';
import sample from '../../../../scripts/fixtures/sample-lesson.json';

describe('lesson format', () => {
  it('parses the sample lesson', () => {
    const lesson = LessonSchema.parse(sample);
    expect(lesson.concepts.length).toBeGreaterThan(0);
    expect(lesson.phase).toBe('1');
  });

  it('rejects an mc quiz whose correct index is out of range', () => {
    const bad = structuredClone(sample) as { concepts: { quizzes: { correct: number }[] }[] };
    bad.concepts[0].quizzes[0].correct = 9;
    expect(LessonSchema.safeParse(bad).success).toBe(false);
  });

  it('rewrites ATX headings into the bold headings the learn view splits on', () => {
    const md = normalizeSectionMarkdown('Intro\n\n## Qué es\n\nTexto\n\n### Para decirlo ##');
    expect(sectionHeadings(md)).toEqual(['Qué es', 'Para decirlo']);
  });

  it('puts a quiz with no heading after the last heading', () => {
    const q: LessonQuiz = { format: 'mc', after_heading: null, question: 'q', options: ['a', 'b'], correct: 1, explanation: 'e' };
    expect(resolveQuizHeading(q, ['A', 'B'])).toBe('B');
    expect(resolveQuizHeading({ ...q, after_heading: '## a' }, ['A', 'B'])).toBe('A');
    expect(() => resolveQuizHeading({ ...q, after_heading: 'Z' }, ['A'])).toThrow();
  });

  it('maps quizzes and cards to the stored shapes', () => {
    expect(mapQuiz({ format: 'mc', question: 'q', options: ['x', 'y', 'z'], correct: 2, explanation: 'e' })).toEqual({
      options: [{ label: 'A', text: 'x' }, { label: 'B', text: 'y' }, { label: 'C', text: 'z' }],
      correct_answer: 'C',
    });
    expect(mapQuiz({ format: 'tf', question: 'q', correct: false, explanation: 'e' })).toEqual({ options: null, correct_answer: 'false' });
    expect(mapCard({ type: 'recall', front: 'F', back: 'B', difficulty: 1 })).toEqual({
      front_content: { prompt: 'F' },
      back_content: { definition: 'B' },
    });
  });

  it('derives stable, valid UUIDs', () => {
    const a = stableUuid('x/card/1');
    expect(a).toBe(stableUuid('x/card/1'));
    expect(a).not.toBe(stableUuid('x/card/2'));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  describe('phrase timings', () => {
    const text = "Hi, I'm Nicolás, / a full-stack engineer. / I like it.";
    const withDrill = (drill: Record<string, unknown>) => {
      const l = structuredClone(sample) as { drills: Record<string, unknown>[] };
      l.drills[0] = { ...l.drills[0], text_en: text, ...drill };
      return l;
    };
    const three = [{ start: 0, end: 1.2 }, { start: 1.3, end: 3 }, { start: 3.1, end: 4 }];

    it('accepts one segment per phrase, in order', () => {
      expect(LessonSchema.safeParse(withDrill({ segments: three })).success).toBe(true);
    });

    it('rejects segments that do not fit the phrases', () => {
      expect(LessonSchema.safeParse(withDrill({ segments: three.slice(0, 2) })).success).toBe(false);
      expect(LessonSchema.safeParse(withDrill({ segments: [three[0], { start: 0.5, end: 3 }, three[2]] })).success).toBe(false);
      expect(LessonSchema.safeParse(withDrill({ segments: [three[0], { start: 2, end: 1.5 }, three[2]] })).success).toBe(false);
    });

    it('names the sidecar after the audio', () => {
      expect(segmentsSidecarPath('/a/b/audios/01-intro.m4a')).toBe('/a/b/audios/01-intro.segments.json');
    });

    it('uses a sidecar only for the same text and the same recording', () => {
      const sidecar: DrillSegmentsFile = {
        version: 1, drill: 'x', text, audio: { sha1: 'abc', duration: 4.2 }, asr: 'whisper',
        segments: three.map((s, i) => ({ ...s, text: `p${i}` })),
      };
      expect(drillSegments({ text_en: text }, sidecar, 'abc')).toEqual({ segments: three, why: null });
      expect(drillSegments({ text_en: `${text} More.` }, sidecar, 'abc').segments).toBeNull();
      expect(drillSegments({ text_en: text }, sidecar, 'other').segments).toBeNull();
      expect(drillSegments({ text_en: text }, null, 'abc').segments).toBeNull();
      // The lesson's own segments win.
      expect(drillSegments({ text_en: text, segments: three }, null, null).segments).toBe(three);
    });
  });
});

describe('review enrollment', () => {
  const recall = (prompt: string, definition: string) => ({ card_type: 'recall', ...mapCard({ type: 'recall', front: prompt, back: definition, difficulty: 1 }) });

  it('keys a card by content: case, spacing and key order do not matter', () => {
    expect(cardContentKey(recall('¿Qué es  O(n)?', 'Lineal.'))).toBe(cardContentKey(recall('¿qué es o(n)? ', 'lineal.')));
    expect(cardContentKey({ card_type: 'connect', front_content: { a: 'X', b: 'Y' }, back_content: {} }))
      .toBe(cardContentKey({ card_type: 'connect', front_content: { b: 'y', a: 'x' }, back_content: {} }));
  });

  it('tells apart a different answer, prompt or card type', () => {
    const base = cardContentKey(recall('Q', 'A'));
    expect(cardContentKey(recall('Q', 'B'))).not.toBe(base);
    expect(cardContentKey(recall('Q2', 'A'))).not.toBe(base);
    expect(cardContentKey({ ...recall('Q', 'A'), card_type: 'true_false' })).not.toBe(base);
  });

  it('never enrolls a card whose content is already in the deck, nor twice from one lesson', () => {
    const v1 = { id: 'v1-card', key: cardContentKey(recall('Two Sum: idea', 'Hash map of complements')) };
    const v2Copy = { id: 'v2-card', key: v1.key }; // re-namespaced lesson, same text
    const fresh = { id: 'new-card', key: cardContentKey(recall('Kadane', 'Best sum ending here')) };
    const freshTwice = { id: 'new-card-2', key: fresh.key };
    const already = { id: 'old', key: cardContentKey(recall('Old', 'Card')) };
    const r = selectCardsToEnroll([v2Copy, fresh, freshTwice, already], new Set(['v1-card', 'old']), new Set([v1.key, already.key]));
    expect(r.enroll.map((c) => c.id)).toEqual(['new-card']);
    expect(r.duplicates.map((c) => c.id)).toEqual(['v2-card', 'new-card-2']);
    expect(r.alreadyEnrolled.map((c) => c.id)).toEqual(['old']);
  });

  it('is idempotent: a second run over the same lesson enrolls nothing', () => {
    const cards = [{ id: 'a', key: 'k1' }, { id: 'b', key: 'k2' }];
    const first = selectCardsToEnroll(cards, new Set(), new Set());
    const ids = new Set(first.enroll.map((c) => c.id));
    const keys = new Set(first.enroll.map((c) => c.key));
    expect(selectCardsToEnroll(cards, ids, keys).enroll).toEqual([]);
  });

  it('reads enroll_cards from the lesson (absent means the old behavior)', () => {
    expect(LessonSchema.parse(sample).enroll_cards).toBeUndefined();
    expect(LessonSchema.parse({ ...sample, enroll_cards: false }).enroll_cards).toBe(false);
  });
});
