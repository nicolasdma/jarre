import { describe, expect, it } from 'vitest';
import { buildLearningSession } from '@/lib/llm/voice-tutor-session';
import { estimateTokens } from '../lesson-map';
import { syntheticLesson } from './fixtures';

/** docs/tutor/02-arquitectura.md §3.2: ~7.4k typical, 10k hard cap (the lesson whole was 37k). */
const CAP_TOKENS = 10_000;

describe('the section tutor instruction', () => {
  const lesson = syntheticLesson();
  const brief = 'x'.repeat(2400); // the brief at its cap (≈ 600 tokens)

  it('carries every section in the map and only the focus section in full', () => {
    const { instruction } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 2, bilingual: true });
    for (const s of lesson.sections) expect(instruction).toContain(s.title);
    expect(instruction).toContain(lesson.sections[2].content.slice(0, 200));
    expect(instruction).not.toContain(lesson.sections[14].content.slice(0, 200));
    expect(instruction).toContain('la 15, LRU Cache');
  });

  it(`stays under ${CAP_TOKENS} tokens with the longest section in focus and the brief at its cap`, () => {
    const longest = lesson.sections.reduce((best, s, i) => (s.content.length > lesson.sections[best].content.length ? i : best), 0);
    const { instruction } = buildLearningSession({ language: 'es', lesson, focusSectionIndex: longest, bilingual: true, learnerBrief: brief });
    expect(estimateTokens(instruction)).toBeLessThan(CAP_TOKENS);
  });

  it('says it has no memory when it has none, and uses the brief when it has one', () => {
    const none = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 2 }).instruction;
    expect(none).toContain('You have no record of any earlier session');
    const withBrief = buildLearningSession({ language: 'es', lesson, focusSectionIndex: 2, learnerBrief: '- Ya contestó: por qué chequear antes de insertar.' }).instruction;
    expect(withBrief).toContain('Ya contestó: por qué chequear antes de insertar');
    expect(withBrief).not.toContain('You have no record of any earlier session');
  });
});
