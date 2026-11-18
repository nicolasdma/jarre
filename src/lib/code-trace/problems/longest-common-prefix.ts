import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `export function longestCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return '';
  const first = strs[0];
  for (let i = 0; i < first.length; i++) {
    for (let k = 1; k < strs.length; k++) {
      if (i >= strs[k].length || strs[k][i] !== first[i]) return first.slice(0, i);
    }
  }
  return first;
}`;

const def: TraceDef<[string[]], string> = {
  id: 'longest-common-prefix',
  title: 'Longest Common Prefix',
  pattern: 'String scan',
  code,
  examples: [
    { label: 'strs = ["flower", "flow", "flight"]', args: [['flower', 'flow', 'flight']] },
    { label: 'strs = ["dog", "racecar", "car"]', args: [['dog', 'racecar', 'car']] },
  ],
  run(t, strs) {
    if (strs.length === 0) {
      t.step("if (strs.length === 0) return ''", 'No hay palabras: prefijo vacío.', []);
      return '';
    }
    const first = strs[0];
    const width = Math.max(...strs.map((s) => s.length));
    const view = (o: { i: number; k?: number; bad?: boolean }): Viz[] => [
      {
        kind: 'grid',
        label: 'una palabra por fila, una columna por posición',
        cells: strs.map((s) => Array.from({ length: width }, (_, c) => s[c] ?? null)),
        rowLabels: strs.map((_, k) => k),
        colLabels: Array.from({ length: width }, (_, c) => c),
        marks: [
          ...strs.flatMap((s, r) => Array.from({ length: Math.min(o.i, s.length) }, (_, c) => ({ r, c, tone: 'found' as const }))),
          ...(o.k !== undefined ? [{ r: 0, c: o.i, tone: 'focus' as const }, { r: o.k, c: o.i, tone: o.bad ? ('drop' as const) : ('focus' as const) }] : []),
        ],
      },
      { kind: 'text', label: 'prefijo común hasta ahora', value: q(first.slice(0, o.i)) },
    ];
    t.step('const first = strs[0]', `Usamos ${q(first)} como molde y lo comparamos columna por columna contra las demás.`, view({ i: 0 }));
    for (let i = 0; i < first.length; i++) {
      for (let k = 1; k < strs.length; k++) {
        if (i >= strs[k].length || strs[k][i] !== first[i]) {
          t.step('if (i >= strs[k].length || strs[k][i] !== first[i]) return first.slice(0, i)', i >= strs[k].length
            ? `${q(strs[k])} se termina en la posición ${i}: el prefijo no puede ser más largo. Devolvemos ${q(first.slice(0, i))}.`
            : `Posición ${i}: ${q(strs[k])} tiene ${q(strs[k][i])} y el molde ${q(first[i])}. Distintas: devolvemos ${q(first.slice(0, i))}.`, view({ i, k, bad: true }));
          return first.slice(0, i);
        }
      }
      t.step('for (let k = 1; k < strs.length; k++)', `Posición ${i}: todas tienen ${q(first[i])}. El prefijo crece.`, view({ i: i + 1 }));
    }
    t.step('return first;', `El molde entero es prefijo de todas: ${q(first)}. O(total de letras).`, view({ i: first.length }));
    return first;
  },
  extraInputs: () => [[[]], [['a']], [['ab', 'a']], [['', 'b']]],
};

export default def;
