import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `function isAlnum(code: number): boolean {
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

export function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    while (left < right && !isAlnum(s.charCodeAt(left))) left++;
    while (left < right && !isAlnum(s.charCodeAt(right))) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}`;

const isAlnum = (c: number) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);

const def: TraceDef<[string], boolean> = {
  id: 'valid-palindrome',
  title: 'Valid Palindrome',
  pattern: 'Two pointers',
  code,
  examples: [
    { label: 's = "Taco cat!"', args: ['Taco cat!'] },
    { label: 's = "race a car"', args: ['race a car'] },
    { label: 's = "A man, a plan, a canal: Panama"', args: ['A man, a plan, a canal: Panama'] },
  ],
  run(t, s) {
    const chars = [...s].map((c) => (c === ' ' ? '␣' : c));
    let left = 0;
    let right = s.length - 1;
    const view = (o: { tone?: 'found' | 'drop' }): Viz[] => [
      {
        kind: 'array',
        label: 's (␣ = espacio)',
        items: chars,
        indices: s.length <= 12,
        pointers: [{ name: 'L', index: left }, { name: 'R', index: right }].filter((p) => p.index >= 0),
        marks: [
          ...chars.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < left || m.index > right),
          ...(o.tone && left < right ? [{ index: left, tone: o.tone }, { index: right, tone: o.tone }] : []),
        ],
      },
    ];
    t.step('let right = s.length - 1', 'Dos punteros, uno en cada punta. Comparamos de afuera hacia adentro, ignorando lo que no es letra ni número.', view({}));
    while (left < right) {
      const l0 = left;
      while (left < right && !isAlnum(s.charCodeAt(left))) left++;
      if (left !== l0) t.step('while (left < right && !isAlnum(s.charCodeAt(left))) left++', `L saltea ${left - l0} símbolo${left - l0 === 1 ? '' : 's'} que no cuenta${left - l0 === 1 ? '' : 'n'}.`, view({}));
      const r0 = right;
      while (left < right && !isAlnum(s.charCodeAt(right))) right--;
      if (right !== r0) t.step('while (left < right && !isAlnum(s.charCodeAt(right))) right--', `R saltea ${r0 - right} símbolo${r0 - right === 1 ? '' : 's'} que no cuenta${r0 - right === 1 ? '' : 'n'}.`, view({}));
      if (s[left].toLowerCase() !== s[right].toLowerCase()) {
        t.step('if (s[left].toLowerCase() !== s[right].toLowerCase()) return false', `${q(s[left])} contra ${q(s[right])}: distintas. No es palíndromo.`, view({ tone: 'drop' }));
        return false;
      }
      t.step('if (s[left].toLowerCase() !== s[right].toLowerCase()) return false', `${q(s[left])} contra ${q(s[right])}: iguales (sin mirar mayúsculas).`, view({ tone: 'found' }));
      left++;
      right--;
      t.step('right--;#2', 'Los dos punteros avanzan hacia el medio.', view({}));
    }
    t.step('return true', 'Se cruzaron sin encontrar diferencias: es palíndromo. O(n), sin armar otro string.', view({}));
    return true;
  },
  extraInputs: () => [[''], [' '], ['.,'], ['0P'], ['ab_a']],
};

export default def;
