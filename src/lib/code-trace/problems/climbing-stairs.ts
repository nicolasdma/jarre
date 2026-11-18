import type { TraceDef } from '../trace';
import type { Viz } from '../types';

const code = `export function climbStairs(n: number): number {
  let prev = 1, cur = 1; // ways to reach step 0 and step 1
  for (let i = 2; i <= n; i++) {
    [prev, cur] = [cur, prev + cur]; // ways(i) = ways(i - 1) + ways(i - 2)
  }
  return cur;
}`;

const def: TraceDef<[number], number> = {
  id: 'climbing-stairs',
  title: 'Climbing Stairs',
  pattern: '1D DP',
  code,
  examples: [
    { label: 'n = 5', args: [5] },
    { label: 'n = 2', args: [2] },
    { label: 'n = 3', args: [3] },
  ],
  run(t, n) {
    let prev = 1;
    let cur = 1;
    const ways: (number | string)[] = Array.from({ length: n + 1 }, (_, i) => (i <= 1 ? 1 : '·'));
    const view = (o: { i?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'ways · formas de llegar a cada escalón (solo guardamos las dos últimas)',
        items: [...ways],
        pointers: o.i !== undefined ? [{ name: 'i', index: o.i }] : [],
        marks: o.i !== undefined ? [{ index: o.i, tone: 'add' }, { index: o.i - 1, tone: 'visited' }, { index: o.i - 2, tone: 'visited' }] : [],
      },
      { kind: 'vars', vars: [{ name: 'prev', value: prev }, { name: 'cur', value: cur }] },
    ];
    t.step('let prev = 1, cur = 1', 'Al escalón 0 se llega de 1 forma (no moverse) y al 1 de 1 forma (un paso). Son los casos base.', view({}));
    for (let i = 2; i <= n; i++) {
      [prev, cur] = [cur, prev + cur];
      ways[i] = cur;
      t.step('[prev, cur] = [cur, prev + cur]', `Al escalón ${i} se llega desde ${i - 1} (un paso) o desde ${i - 2} (dos pasos): ${prev} + ${cur - prev} = ${cur}. Es Fibonacci.`, view({ i }));
    }
    t.step('return cur', `Hay ${cur} forma${cur === 1 ? '' : 's'} de subir ${n} escalón${n === 1 ? '' : 'es'}. O(n) tiempo, O(1) espacio.`, view({}));
    return cur;
  },
  extraInputs: () => [[1], [10]],
};

export default def;
