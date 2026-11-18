import { describe, expect, it } from 'vitest';
import { buildLessonMap, renderLessonMap, sectionTopics, sectionsNamedIn, shortTitle } from '../lesson-map';
import { syntheticLesson } from './fixtures';

describe('the lesson map', () => {
  it('names each section the way it is said out loud', () => {
    expect(shortTitle('Two Sum (calentamiento, fácil) · núcleo')).toBe('Two Sum');
    expect(shortTitle('Big-O desde cero (antes del primer problema)')).toBe('Big-O desde cero');
    expect(shortTitle('Extra: leer y depurar (medio) · núcleo')).toBe('Extra: leer y depurar');
    expect(shortTitle('LRU Cache (medio) · red de seguridad')).toBe('LRU Cache');
  });

  it('takes what a section covers from its bold one-line headings', () => {
    const md = '**Qué es n**\n**n es el tamaño de la entrada.** Si te pasan…\n\n**El truco: contar en tu propio código**\n1. Un for\n### Cómo se dice en voz alta\ntexto';
    expect(sectionTopics(md)).toEqual(['Qué es n', 'El truco: contar en tu propio código', 'Cómo se dice en voz alta']);
  });

  it('marks the focus section and stays small for a 15-section lesson', () => {
    const lesson = syntheticLesson();
    const text = renderLessonMap(buildLessonMap(lesson.sections), 2);
    expect(text).toContain('3. Two Sum (calentamiento, fácil) · núcleo  ← THE SECTION BEING STUDIED NOW');
    expect(text).toContain('15. LRU Cache');
    expect(text.length / 3.4).toBeLessThan(2500);
  });
});

describe('which section a line names', () => {
  const map = buildLessonMap(syntheticLesson().sections);

  it.each([
    ['¿y LRU cómo se hace?', [15]],
    ['no entiendo lo de Big-O', [2]],
    ['volvamos a la sección cinco', [5]],
    ['lo de la sección 13', [13]],
    ['¿se parece a Group Anagrams?', [9]],
  ])('%s → %j', (line, expected) => {
    expect(sectionsNamedIn(line, map)).toEqual(expected);
  });

  it.each(['o de n al cuadrado', 'la 2 cosas', 'n log n porque tenés dos for', 'sección 40'])('%s → nothing', (line) => {
    expect(sectionsNamedIn(line, map)).toEqual([]);
  });
});
