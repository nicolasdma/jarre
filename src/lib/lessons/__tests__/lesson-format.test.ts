import { describe, expect, it } from 'vitest';
import {
  LessonSchema,
  mapCard,
  mapQuiz,
  normalizeSectionMarkdown,
  resolveQuizHeading,
  sectionHeadings,
  stableUuid,
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
});
