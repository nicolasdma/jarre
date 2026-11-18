import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function insert(intervals: number[][], newInterval: number[]): number[][] {
  const out: number[][] = [];
  let [start, end] = newInterval;
  let i = 0;
  const n = intervals.length;
  while (i < n && intervals[i][1] < start) out.push(intervals[i++]); // entirely before
  while (i < n && intervals[i][0] <= end) { // overlaps: widen the new interval
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    i++;
  }
  out.push([start, end]);
  while (i < n) out.push(intervals[i++]); // entirely after
  return out;
}`;

const def: TraceDef<[number[][], number[]], number[][]> = {
  id: 'insert-interval',
  title: 'Insert Interval',
  pattern: 'Intervals',
  code,
  examples: [
    { label: 'intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]', args: [[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]] },
    { label: 'intervals = [[1,3],[6,9]], newInterval = [2,5]', args: [[[1, 3], [6, 9]], [2, 5]] },
  ],
  run(t, intervals, newInterval) {
    const out: number[][] = [];
    let [start, end] = newInterval;
    let i = 0;
    const n = intervals.length;
    const view = (o: { absorbing?: boolean }): Viz[] => [
      {
        kind: 'intervals',
        rows: [
          { label: 'intervals (ordenados, sin pisarse)', items: intervals.map(([s, e], k) => ({ start: s, end: e, tone: k < i ? ('muted' as const) : k === i && o.absorbing ? ('focus' as const) : undefined })) },
          { label: `el nuevo, creciendo: [${start}, ${end}]`, items: [{ start, end, tone: 'add' as const }] },
          { label: 'out', items: out.map(([s, e]) => ({ start: s, end: e })) },
        ],
      },
      { kind: 'text', label: 'out', value: fmt(out) },
    ];
    t.step('let i = 0', `Tres tramos en orden: los que terminan antes de ${start}, los que se pisan con [${start}, ${end}], y los que empiezan después.`, view({}));
    while (i < n && intervals[i][1] < start) {
      out.push(intervals[i++]);
      t.step('while (i < n && intervals[i][1] < start) out.push', `${fmt(intervals[i - 1])} termina antes de ${start}: va directo a out.`, view({}));
    }
    while (i < n && intervals[i][0] <= end) {
      t.step('while (i < n && intervals[i][0] <= end)', `${fmt(intervals[i])} empieza en ${intervals[i][0]} ≤ ${end}: se pisa con el nuevo.`, view({ absorbing: true }));
      start = Math.min(start, intervals[i][0]);
      end = Math.max(end, intervals[i][1]);
      i++;
      t.step('end = Math.max(end, intervals[i][1])', `El nuevo lo absorbe y se estira: [${start}, ${end}].`, view({}));
    }
    out.push([start, end]);
    t.step('out.push([start, end])', `Agregamos el nuevo ya fusionado: [${start}, ${end}].`, view({}));
    while (i < n) {
      out.push(intervals[i++]);
      t.step('while (i < n) out.push', `${fmt(intervals[i - 1])} empieza después: va tal cual.`, view({}));
    }
    t.step('return out', `Resultado: ${fmt(out)}. Una pasada, O(n): no hace falta ordenar, ya venían ordenados.`, view({}));
    return out;
  },
  extraInputs: () => [[[], [5, 7]], [[[1, 5]], [6, 8]], [[[1, 5]], [0, 0]], [[[3, 5], [12, 15]], [6, 6]]],
};

export default def;
