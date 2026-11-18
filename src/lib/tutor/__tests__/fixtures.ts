/**
 * A lesson shaped like 3y-health-tecnica-v2 (15 sections, the same titles and
 * section sizes: min 5,510, median 7,975, max 9,938 characters), with filler
 * text, so budgets are tested without committing the lesson itself.
 */
import type { LessonSectionInput } from '../lesson-map';

const TITLES: [string, number][] = [
  ['Cómo es la ronda y cómo se gana a nivel senior', 5510],
  ['Big-O desde cero (antes del primer problema)', 9650],
  ['Two Sum (calentamiento, fácil) · núcleo', 5754],
  ['Valid Parentheses (fácil) · núcleo', 6863],
  ['Longest Substring Without Repeating Characters (medio) · núcleo', 8097],
  ['Number of Islands (medio) · núcleo', 8485],
  ['Merge Intervals (medio) · núcleo', 7976],
  ['Extra: leer y depurar (medio) · núcleo', 8104],
  ['Group Anagrams (medio) · red de seguridad', 7246],
  ['Top K Frequent Elements (medio) · red de seguridad', 7988],
  ['Product of Array Except Self (medio) · red de seguridad', 7580],
  ['3Sum (medio) · red de seguridad', 7975],
  ['Search in Rotated Sorted Array (medio) · red de seguridad', 7744],
  ['Coin Change (medio) · red de seguridad', 7644],
  ['LRU Cache (medio) · red de seguridad', 9938],
];

const HEADINGS = ['Por qué está acá', 'El enunciado, como lo dice el entrevistador', 'Aclarar (minuto 0 a 2)', 'La fuerza bruta, en una frase', 'La optimización y el trade-off', 'El código', 'Probar sin que te lo pidan', 'Complejidad, en una frase', 'Las repreguntas de senior', 'Senior vs mid en este problema'];

function body(chars: number, seed: number): string {
  const parts: string[] = [];
  let i = 0;
  while (parts.join('\n\n').length < chars) {
    parts.push(`**${HEADINGS[(i + seed) % HEADINGS.length]}**`);
    parts.push(`Párrafo ${i} de la sección ${seed}: el mapa guarda cada número con su índice y busca el complemento en tiempo constante, así una pasada alcanza. `.repeat(4));
    i++;
  }
  return parts.join('\n\n').slice(0, chars);
}

export function syntheticLesson(): { title: string; sections: Required<LessonSectionInput>[] } {
  return {
    title: '3y Health · ronda técnica',
    sections: TITLES.map(([title, chars], i) => ({
      id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      conceptId: `concept-${i + 1}`,
      title,
      content: body(chars, i),
    })),
  };
}
