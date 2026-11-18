import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `export function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  const count = new Array<number>(26).fill(0);
  for (let i = 0; i < s.length; i++) {
    count[s.charCodeAt(i) - 97]++;
    count[t.charCodeAt(i) - 97]--;
  }
  return count.every((c) => c === 0);
}`;

const def: TraceDef<[string, string], boolean> = {
  id: 'valid-anagram',
  title: 'Valid Anagram',
  pattern: 'Counting',
  code,
  examples: [
    { label: 's = "anagram", t = "nagaram"', args: ['anagram', 'nagaram'] },
    { label: 's = "rat", t = "car"', args: ['rat', 'car'] },
  ],
  run(tr, s, t) {
    const count = new Array<number>(26).fill(0);
    const letters = () => count.map((c, k) => ({ key: String.fromCharCode(97 + k), value: c })).filter((e) => e.value !== 0 || [...s, ...t].includes(e.key));
    const view = (o: { i?: number; flash?: string; bad?: string }): Viz[] => [
      { kind: 'array', label: 's', items: [...s], pointers: o.i !== undefined ? [{ name: 'i', index: o.i }] : [] },
      { kind: 'array', label: 't', items: [...t], pointers: o.i !== undefined ? [{ name: 'i', index: o.i }] : [] },
      { kind: 'map', label: 'count · +1 por s, −1 por t', keyLabel: 'letra', valueLabel: 'saldo', entries: letters().map((e) => ({ key: e.key, value: e.value })), flash: o.flash, dropped: o.bad },
    ];
    if (s.length !== t.length) {
      tr.step('if (s.length !== t.length) return false', `Largos distintos (${s.length} y ${t.length}): no pueden ser anagramas.`, view({}));
      return false;
    }
    tr.step('const count', 'Un contador por letra, de "a" a "z", todo en 0. Las letras de s suman y las de t restan.', view({}));
    for (let i = 0; i < s.length; i++) {
      count[s.charCodeAt(i) - 97]++;
      tr.step('count[s.charCodeAt(i) - 97]++', `${q(s[i])} de s: +1.`, view({ i, flash: s[i] }));
      count[t.charCodeAt(i) - 97]--;
      tr.step('count[t.charCodeAt(i) - 97]--', `${q(t[i])} de t: −1.`, view({ i, flash: t[i] }));
    }
    const bad = count.findIndex((c) => c !== 0);
    const ok = bad === -1;
    tr.step('return count.every', ok
      ? 'Todos los saldos quedaron en 0: las mismas letras, las mismas veces. true.'
      : `El saldo de ${q(String.fromCharCode(97 + bad))} no es 0: sobra o falta esa letra. false.`, view({ bad: ok ? undefined : String.fromCharCode(97 + bad) }));
    return ok;
  },
  extraInputs: () => [['', ''], ['a', 'ab'], ['ab', 'ba'], ['aacc', 'ccac']],
};

export default def;
