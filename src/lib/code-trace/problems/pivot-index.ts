import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function pivotIndex(nums: number[]): number {
  let total = 0;
  for (const x of nums) total += x;
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    if (left === total - left - nums[i]) return i; // right = total - left - nums[i]
    left += nums[i];
  }
  return -1;
}`;

const def: TraceDef<[number[]], number> = {
  id: 'pivot-index',
  title: 'Find Pivot Index',
  pattern: 'Prefix sums',
  code,
  examples: [
    { label: 'nums = [1, 7, 3, 6, 5, 6]', args: [[1, 7, 3, 6, 5, 6]] },
    { label: 'nums = [1, 2, 3]', args: [[1, 2, 3]] },
  ],
  run(t, nums) {
    let total = 0;
    for (const x of nums) total += x;
    let left = 0;
    const view = (o: { i?: number; found?: boolean; changed?: string }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: o.i !== undefined ? [{ name: 'i', index: o.i }] : [],
        window: o.i !== undefined && o.i > 0 ? { from: 0, to: o.i - 1, label: `izquierda: ${fmt(left)}` } : undefined,
        marks: o.i !== undefined && o.found ? [{ index: o.i, tone: 'found' }] : [],
      },
      { kind: 'vars', vars: [{ name: 'total', value: total, changed: o.changed === 'total' }, { name: 'left', value: left, changed: o.changed === 'left' }] },
    ];
    t.step('for (const x of nums) total += x', `Primero la suma total: ${fmt(total)}. Con eso, la derecha de cualquier i es total − izquierda − nums[i].`, view({ changed: 'total' }));
    for (let i = 0; i < nums.length; i++) {
      const right = total - left - nums[i];
      if (left === right) {
        t.step('if (left === total - left - nums[i]) return i', `i = ${i}: izquierda ${fmt(left)}, derecha ${fmt(total)} − ${fmt(left)} − ${fmt(nums[i])} = ${fmt(right)}. ¡Iguales! Devolvemos ${i}.`, view({ i, found: true }));
        return i;
      }
      t.step('if (left === total - left - nums[i]) return i', `i = ${i}: izquierda ${fmt(left)}, derecha ${fmt(right)}. Distintas.`, view({ i }));
      left += nums[i];
      t.step('left += nums[i]', `nums[${i}] pasa a la izquierda: left = ${fmt(left)}.`, view({ i, changed: 'left' }));
    }
    t.step('return -1', 'Ningún índice equilibra: −1. Dos pasadas, O(n), O(1) de espacio.', view({}));
    return -1;
  },
  extraInputs: () => [[[2, 1, -1]], [[]], [[0]], [[-1, -1, 0, 1, 1, 0]]],
};

export default def;
