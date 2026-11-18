import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function maxSubArray(nums: number[]): number {
  let best = nums[0];
  let cur = nums[0]; // best sum of a subarray ending at the current index
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]); // extend or restart
    best = Math.max(best, cur);
  }
  return best;
}`;

const def: TraceDef<[number[]], number> = {
  id: 'maximum-subarray',
  title: 'Maximum Subarray',
  pattern: 'Kadane (1D DP)',
  code,
  examples: [
    { label: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]] },
    { label: 'nums = [5, 4, -1, 7, 8]', args: [[5, 4, -1, 7, 8]] },
  ],
  run(t, nums) {
    let best = nums[0];
    let cur = nums[0];
    let curFrom = 0;
    let bestRange: [number, number] = [0, 0];
    const view = (o: { i?: number; changed?: string }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: o.i !== undefined ? [{ name: 'i', index: o.i }] : [],
        window: { from: curFrom, to: o.i ?? 0, label: `cur: el mejor subarray que termina en ${o.i ?? 0}` },
        marks: [bestRange[0], bestRange[1]].filter((k, n, arr) => arr.indexOf(k) === n).map((k) => ({ index: k, tone: 'found' as const })),
      },
      { kind: 'vars', vars: [{ name: 'cur', value: cur, changed: o.changed === 'cur' }, { name: 'best', value: best, changed: o.changed === 'best' }, { name: 'mejor tramo', value: `[${bestRange[0]}..${bestRange[1]}]` }] },
    ];
    t.step('let cur = nums[0]', `Arrancamos con nums[0] = ${fmt(nums[0])}: cur = best = ${fmt(nums[0])}.`, view({ i: 0 }));
    for (let i = 1; i < nums.length; i++) {
      const extend = cur + nums[i];
      if (nums[i] > extend) {
        cur = nums[i];
        curFrom = i;
        t.step('cur = Math.max(nums[i], cur + nums[i])', `Extender da ${fmt(extend)}; empezar de nuevo en ${fmt(nums[i])} da más: lo que veníamos arrastrando restaba. Reiniciamos: cur = ${fmt(cur)}.`, view({ i, changed: 'cur' }));
      } else {
        cur = extend;
        t.step('cur = Math.max(nums[i], cur + nums[i])', `Extender: ${fmt(extend - nums[i])} + ${fmt(nums[i])} = ${fmt(extend)} ≥ ${fmt(nums[i])} solo. Seguimos el mismo tramo: cur = ${fmt(cur)}.`, view({ i, changed: 'cur' }));
      }
      if (cur > best) {
        best = cur;
        bestRange = [curFrom, i];
        t.step('best = Math.max(best, cur)', `cur = ${fmt(cur)} supera a best: best = ${fmt(best)}.`, view({ i, changed: 'best' }));
      }
    }
    t.step('return best', `best = ${fmt(best)}, el tramo [${bestRange[0]}..${bestRange[1]}]. Una pasada, O(n), O(1) de espacio.`, view({ i: nums.length - 1 }));
    return best;
  },
  extraInputs: () => [[[1]], [[-3, -1, -2]], [[2, -1, 2]]],
};

export default def;
