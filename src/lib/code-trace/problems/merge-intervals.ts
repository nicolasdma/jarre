import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';
import { fmt } from '../format';

const code = `export function merge(intervals: number[][]): number[][] {
  const byStart = [...intervals].sort((a, b) => a[0] - b[0]); // a copy: the caller's list keeps its order
  const merged: number[][] = [];

  for (const [start, end] of byStart) {
    const last = merged[merged.length - 1];
    if (last !== undefined && start <= last[1]) {
      last[1] = Math.max(last[1], end); // overlaps or touches: extend, never shrink
    } else {
      merged.push([start, end]); // a new array, never the caller's own
    }
  }

  return merged;
}`;

const iv = (a: number[]) => `[${a[0]}, ${a[1]}]`;

const def: TraceDef<[number[][]], number[][]> = {
  id: 'merge-intervals',
  title: 'Merge Intervals',
  pattern: 'Intervals',
  code,
  examples: [
    { label: '[[1, 3], [2, 6], [8, 10], [15, 18]]', args: [[[1, 3], [2, 6], [8, 10], [15, 18]]] },
    { label: '[[1, 4], [4, 5]]', args: [[[1, 4], [4, 5]]] },
    { label: '[[600, 660], [540, 600], [780, 840]]', args: [[[600, 660], [540, 600], [780, 840]]] },
    { label: '[[1, 10], [2, 3], [4, 5]]', args: [[[1, 10], [2, 3], [4, 5]]] },
  ],
  run(t, intervals) {
    const byStart = [...intervals].sort((a, b) => a[0] - b[0]);
    const merged: number[][] = [];
    const view = (o: { k?: number; sorted?: boolean; lastTone?: Tone; newOne?: boolean }): Viz[] => [
      {
        kind: 'intervals',
        rows: [
          {
            label: o.sorted ? 'byStart (ordenados por inicio)' : 'intervals (como vienen)',
            items: (o.sorted ? byStart : intervals).map((x, n) => ({
              start: x[0],
              end: x[1],
              tone: o.k === undefined ? undefined : n < o.k ? ('muted' as const) : n === o.k ? ('focus' as const) : undefined,
            })),
          },
          {
            label: 'merged',
            items: merged.map((x, n) => ({
              start: x[0],
              end: x[1],
              tone: n === merged.length - 1 ? (o.newOne ? ('add' as const) : o.lastTone) : undefined,
            })),
          },
        ],
      },
      { kind: 'text', label: 'merged', value: merged.length ? `[${merged.map(iv).join(', ')}]` : '[]' },
    ];

    t.intro(null, `Entrada: ${intervals.map(iv).join(', ')}. Cada bloque es [inicio, fin].`, view({}));
    t.step('const byStart', `Ordenamos una copia por inicio: ${byStart.map(iv).join(', ')}. Así, todo lo que se pisa queda pegado. Este sort es el O(n log n).`, view({ sorted: true }));
    t.step('const merged', 'merged arranca vacío. Solo vamos a mirar su último bloque.', view({ sorted: true }));
    for (let k = 0; k < byStart.length; k++) {
      const [start, end] = byStart[k];
      t.step('for (const [start, end] of byStart)', `Tomamos ${iv([start, end])}.`, view({ sorted: true, k }));
      const last = merged[merged.length - 1];
      if (last !== undefined && start <= last[1]) {
        t.step('if (last !== undefined', `¿Se pisa con el último de merged, ${iv(last)}? Empieza en ${start} ≤ ${last[1]}: sí, se pisan (o se tocan).`, view({ sorted: true, k, lastTone: 'focus' }));
        const before = last[1];
        last[1] = Math.max(last[1], end);
        t.step('last[1] = Math.max', before === last[1]
          ? `Fin = max(${before}, ${end}) = ${before}: ${iv([start, end])} queda adentro, el bloque no se achica.`
          : `Fin = max(${before}, ${end}) = ${last[1]}: el bloque se estira hasta ${last[1]}.`, view({ sorted: true, k, lastTone: 'add' }));
      } else {
        t.step('if (last !== undefined', last === undefined
          ? 'merged está vacío: no hay con qué juntarlo.'
          : `¿Se pisa con ${iv(last)}? Empieza en ${start} > ${last[1]}: no. Hay un hueco.`, view({ sorted: true, k }));
        merged.push([start, end]);
        t.step('merged.push', `Agregamos ${iv([start, end])} como bloque nuevo (una copia, no el array del que llama).`, view({ sorted: true, k, newOne: true }));
      }
    }
    t.step('return merged', `Resultado: ${merged.map(iv).join(', ')}. ${merged.length} bloque${merged.length === 1 ? '' : 's'} de ${fmt(intervals.length)}.`, view({ sorted: true, k: byStart.length }));
    return merged;
  },
  extraInputs: () => [[[]], [[[5, 7]]], [[[1, 4], [0, 4]]], [[[2, 3], [4, 5], [6, 7], [8, 9], [1, 10]]]],
};

export default def;
