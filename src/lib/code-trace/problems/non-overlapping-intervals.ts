import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function eraseOverlapIntervals(intervals: number[][]): number {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]); // by end, without mutating the input
  let removed = 0;
  let lastEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start >= lastEnd) lastEnd = end; // keep it: it ends earliest among the compatible ones
    else removed++;
  }
  return removed;
}`;

const def: TraceDef<[number[][]], number> = {
  id: 'non-overlapping-intervals',
  title: 'Non-overlapping Intervals',
  pattern: 'Greedy (intervals)',
  code,
  examples: [
    { label: 'intervals = [[1,2],[2,3],[3,4],[1,3]]', args: [[[1, 2], [2, 3], [3, 4], [1, 3]]] },
    { label: 'intervals = [[1,2],[1,2],[1,2]]', args: [[[1, 2], [1, 2], [1, 2]]] },
    { label: 'intervals = [[1,10],[2,3],[4,5],[6,7]]', args: [[[1, 10], [2, 3], [4, 5], [6, 7]]] },
  ],
  run(t, intervals) {
    const sorted = [...intervals].sort((a, b) => a[1] - b[1]);
    let removed = 0;
    let lastEnd = -Infinity;
    const fate: ('keep' | 'drop' | undefined)[] = sorted.map(() => undefined);
    const view = (o: { k?: number }): Viz[] => [
      {
        kind: 'intervals',
        rows: [{ label: 'ordenados por FIN', items: sorted.map(([s, e], k) => ({ start: s, end: e, tone: k === o.k ? ('focus' as const) : fate[k] === 'keep' ? ('found' as const) : fate[k] === 'drop' ? ('drop' as const) : undefined })) }],
      },
      { kind: 'vars', vars: [{ name: 'lastEnd', value: lastEnd }, { name: 'removed', value: removed }] },
    ];
    t.step('const sorted', `Ordenamos por fin: ${fmt(sorted)}. La idea golosa: quedarse siempre con el que termina antes deja más lugar para los que vienen.`, view({}));
    for (let k = 0; k < sorted.length; k++) {
      const [start, end] = sorted[k];
      if (start >= lastEnd) {
        lastEnd = end;
        fate[k] = 'keep';
        t.step('if (start >= lastEnd) lastEnd = end', `${fmt(sorted[k])} empieza en ${start}, después del último que guardamos: lo guardamos. lastEnd = ${end}.`, view({ k }));
      } else {
        removed++;
        fate[k] = 'drop';
        t.step('else removed++', `${fmt(sorted[k])} empieza en ${start}, antes de ${fmt(lastEnd)}: se pisa. Lo sacamos (el que ya guardamos termina antes, conviene más). removed = ${removed}.`, view({ k }));
      }
    }
    t.step('return removed', `Hay que sacar ${removed}. O(n log n) por el sort.`, view({}));
    return removed;
  },
  extraInputs: () => [[[]], [[[1, 2], [2, 3]]], [[[-52, 31], [-73, -26], [82, 97], [-65, -11], [-62, -49]]]],
};

export default def;
