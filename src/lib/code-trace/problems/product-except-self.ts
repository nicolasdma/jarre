import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const answer = new Array<number>(n);

  // pass 1: answer[i] = product of everything to the left of i
  let left = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = left;
    left *= nums[i];
  }

  // pass 2: multiply in the product of everything to the right of i
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }

  return answer;
}`;

const def: TraceDef<[number[]], number[]> = {
  id: 'product-except-self',
  title: 'Product of Array Except Self',
  pattern: 'Prefix and suffix products',
  code,
  examples: [
    { label: 'nums = [1, 2, 3, 4]', args: [[1, 2, 3, 4]] },
    { label: 'nums = [-1, 1, 0, -3, 3]', args: [[-1, 1, 0, -3, 3]] },
  ],
  run(t, nums) {
    const n = nums.length;
    const answer: (number | undefined)[] = new Array(n).fill(undefined);
    let left = 1;
    let right = 1;
    const view = (o: { i?: number; pass?: 1 | 2; flash?: number; changed?: string }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: o.i !== undefined ? [{ name: 'i', index: o.i }] : [],
        marks:
          o.i === undefined
            ? []
            : nums.map((_, k) => ({ index: k, tone: 'visited' as const })).filter((m) => (o.pass === 1 ? m.index < o.i! : m.index > o.i!)),
      },
      { kind: 'vars', vars: [{ name: 'left', value: left, changed: o.changed === 'left' }, { name: 'right', value: right, changed: o.changed === 'right' }] },
      {
        kind: 'array',
        label: 'answer',
        items: answer.map((x) => (x === undefined ? '·' : x)),
        marks: o.flash !== undefined ? [{ index: o.flash, tone: 'add' as const }] : [],
      },
    ];

    t.step('const answer', 'La idea: answer[i] = (producto de todo lo que está a la izquierda) × (producto de todo lo que está a la derecha). Sin dividir.', view({}));
    t.step('let left = 1', 'Primera pasada, de izquierda a derecha. left = producto de lo que ya pasó; arranca en 1 (el neutro).', view({ changed: 'left' }));
    for (let i = 0; i < n; i++) {
      answer[i] = left;
      t.step('answer[i] = left', `answer[${i}] = left = ${fmt(left)}: el producto de todo lo que está antes de ${i}.`, view({ i, pass: 1, flash: i }));
      left *= nums[i];
      t.step('left *= nums[i]', `Ahora sí sumamos nums[${i}] = ${fmt(nums[i])} a left: left = ${fmt(left)}.`, view({ i, pass: 1, changed: 'left' }));
    }
    t.step('let right = 1', 'Segunda pasada, de derecha a izquierda. right = producto de lo que está después de i.', view({ changed: 'right' }));
    for (let i = n - 1; i >= 0; i--) {
      const before = answer[i]!;
      answer[i] = before * right;
      t.step('answer[i] *= right', `answer[${i}] = ${fmt(before)} × ${fmt(right)} = ${fmt(answer[i])}: izquierda por derecha.`, view({ i, pass: 2, flash: i }));
      right *= nums[i];
      t.step('right *= nums[i]', `Sumamos nums[${i}] = ${fmt(nums[i])} a right: right = ${fmt(right)}.`, view({ i, pass: 2, changed: 'right' }));
    }
    t.step('return answer', `Listo: ${fmt(answer)}. Dos pasadas, O(n), y fuera de answer solo dos números.`, view({}));
    return answer as number[];
  },
  extraInputs: () => [[[2, 3]], [[0, 0]], [[5, -2, 4, 1]]],
};

export default def;
