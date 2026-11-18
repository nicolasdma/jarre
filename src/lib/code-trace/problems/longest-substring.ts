import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `export function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>(); // character -> last index where it appeared
  let left = 0; // the window s[left..right] never holds a repeated character
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    const previous = lastSeen.get(char);
    if (previous !== undefined) left = Math.max(left, previous + 1); // jump past it, never move back
    lastSeen.set(char, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`;

const def: TraceDef<[string], number> = {
  id: 'longest-substring',
  title: 'Longest Substring Without Repeating Characters',
  pattern: 'Sliding window',
  code,
  examples: [
    { label: 's = "abcabcbb"', args: ['abcabcbb'] },
    { label: 's = "pwwkew"', args: ['pwwkew'] },
    { label: 's = "bbbbb"', args: ['bbbbb'] },
    { label: 's = "abba"', args: ['abba'] },
  ],
  run(t, s) {
    const lastSeen = new Map<string, number>();
    const chars = [...s];
    let left = 0;
    let best = 0;
    let bestFrom = -1;
    const view = (o: { right?: number; flash?: string; probe?: string; found?: boolean; changed?: string[] }): Viz[] => [
      {
        kind: 'array',
        label: 's',
        items: chars,
        pointers: [{ name: 'left', index: left }, ...(o.right !== undefined ? [{ name: 'right', index: o.right }] : [])],
        window: o.right !== undefined && o.right >= left ? { from: left, to: o.right, label: `ventana s[${left}..${o.right}] = ${q(s.slice(left, o.right + 1))}` } : undefined,
        marks: chars.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < left),
      },
      {
        kind: 'vars',
        vars: [
          { name: 'left', value: left, changed: o.changed?.includes('left') },
          { name: 'best', value: best, changed: o.changed?.includes('best') },
          ...(bestFrom >= 0 ? [{ name: 'mejor ventana', value: q(s.slice(bestFrom, bestFrom + best)) }] : []),
        ],
      },
      {
        kind: 'map',
        label: 'lastSeen',
        keyLabel: 'letra',
        valueLabel: 'último índice',
        entries: [...lastSeen].map(([key, value]) => ({ key, value })),
        flash: o.flash,
        probe: o.probe !== undefined ? { key: o.probe, found: !!o.found } : undefined,
        hit: o.found ? o.probe : undefined,
      },
    ];

    t.step('const lastSeen', 'Un Map letra → último índice donde la vimos. Con eso sabemos al toque si una letra ya está adentro de la ventana.', view({}));
    t.step('let left = 0', 'La ventana arranca en left = 0. Invariante: s[left..right] nunca tiene letras repetidas.', view({ changed: ['left'] }));
    t.step('let best = 0', 'best guarda el largo de la mejor ventana vista hasta ahora.', view({ changed: ['best'] }));
    for (let right = 0; right < chars.length; right++) {
      const char = chars[right];
      t.step('for (let right', `right = ${right}: la ventana crece por la derecha con ${q(char)}.`, view({ right }));
      const previous = lastSeen.get(char);
      t.step('const previous', previous === undefined
        ? `¿Vimos ${q(char)} antes? No: no hay repetida.`
        : `¿Vimos ${q(char)} antes? Sí, en el índice ${previous}.`, view({ right, probe: char, found: previous !== undefined }));
      if (previous !== undefined) {
        const next = Math.max(left, previous + 1);
        const caption = next === left
          ? `Ese ${q(char)} (índice ${previous}) quedó afuera de la ventana, que empieza en ${left}: no estorba. left no se mueve (nunca va para atrás).`
          : `Está adentro de la ventana: left salta a ${previous} + 1 = ${next}, justo después del ${q(char)} viejo. Saltamos de una, sin ir letra por letra.`;
        const moved = next !== left;
        left = next;
        t.step('if (previous !== undefined)', caption, view({ right, probe: char, found: true, changed: moved ? ['left'] : [] }));
      }
      lastSeen.set(char, right);
      t.step('lastSeen.set', `Anotamos ${q(char)} → ${right}: su posición más nueva.`, view({ right, flash: char }));
      const len = right - left + 1;
      if (len > best) {
        best = len;
        bestFrom = left;
        t.step('best = Math.max', `La ventana mide ${right} − ${left} + 1 = ${len}: es la más larga hasta ahora. best = ${best}.`, view({ right, changed: ['best'] }));
      } else {
        t.step('best = Math.max', `La ventana mide ${right} − ${left} + 1 = ${len}, no supera best = ${best}.`, view({ right }));
      }
    }
    t.step('return best', `Cada letra entró una vez por la derecha y left solo avanzó: O(n). Resultado: ${best}.`, view({}));
    return best;
  },
  extraInputs: () => [[''], [' '], ['dvdf'], ['tmmzuxt'], ['abcdef']],
};

export default def;
