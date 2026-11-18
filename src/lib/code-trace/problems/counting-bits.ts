import type { TraceDef } from '../trace';
import type { Viz } from '../types';

const code = `export function countBits(n: number): number[] {
  const bits = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) bits[i] = bits[i >> 1] + (i & 1);
  return bits;
}`;

const def: TraceDef<[number], number[]> = {
  id: 'counting-bits',
  title: 'Counting Bits',
  pattern: 'Bit manipulation + DP',
  code,
  examples: [
    { label: 'n = 6', args: [6] },
    { label: 'n = 2', args: [2] },
  ],
  run(t, n) {
    const bits = new Array<number>(n + 1).fill(0);
    const done = new Set<number>([0]);
    const view = (o: { i?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'bits · cuántos 1 tiene cada número',
        items: bits.map((b, k) => (done.has(k) ? b : '·')),
        pointers: o.i !== undefined ? [{ name: 'i', index: o.i }, { name: 'i>>1', index: o.i >> 1 }] : [],
        marks: o.i !== undefined ? [{ index: o.i, tone: 'add' }, { index: o.i >> 1, tone: 'focus' }] : [],
      },
    ];
    t.step('const bits', 'bits[0] = 0. La idea: i >> 1 es i sin su último bit, y ese número ya lo calculamos.', view({}));
    for (let i = 1; i <= n; i++) {
      bits[i] = bits[i >> 1] + (i & 1);
      done.add(i);
      t.step('for (let i = 1; i <= n; i++) bits[i]', `${i} = ${i.toString(2)} en binario. Sin el último bit es ${i >> 1} (${(i >> 1).toString(2) || '0'}), que tiene ${bits[i >> 1]}; el último bit es ${i & 1}. Total: ${bits[i]}.`, view({ i }));
    }
    t.step('return bits', 'Cada casilla reusa una anterior: O(n), sin contar bits uno por uno.', view({}));
    return bits;
  },
  extraInputs: () => [[0], [16]],
};

export default def;
