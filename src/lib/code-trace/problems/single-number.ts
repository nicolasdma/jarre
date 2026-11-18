import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function singleNumber(nums: number[]): number {
  let acc = 0;
  for (const x of nums) acc ^= x; // pairs cancel: x ^ x = 0
  return acc;
}`;

const bits = (x: number) => (x >>> 0).toString(2).padStart(4, '0').slice(-8);

const def: TraceDef<[number[]], number> = {
  id: 'single-number',
  title: 'Single Number',
  pattern: 'Bit manipulation',
  code,
  examples: [
    { label: 'nums = [4, 1, 2, 1, 2]', args: [[4, 1, 2, 1, 2]] },
    { label: 'nums = [2, 2, 1]', args: [[2, 2, 1]] },
  ],
  run(t, nums) {
    let acc = 0;
    const view = (o: { i?: number }): Viz[] => [
      { kind: 'array', label: 'nums', items: nums, pointers: o.i !== undefined ? [{ name: 'x', index: o.i }] : [] },
      { kind: 'vars', vars: [{ name: 'acc', value: acc, changed: o.i !== undefined }, { name: 'en bits', value: bits(acc) }] },
    ];
    t.step('let acc = 0', 'XOR (^) apaga los bits que se repiten: x ^ x = 0, y x ^ 0 = x. Si cada número aparece dos veces menos uno, los pares se anulan y queda el solitario.', view({}));
    for (let i = 0; i < nums.length; i++) {
      const before = acc;
      acc ^= nums[i];
      t.step('for (const x of nums) acc ^= x', `${bits(before)} ^ ${bits(nums[i])} = ${bits(acc)}  (${fmt(before)} ^ ${fmt(nums[i])} = ${fmt(acc)}).`, view({ i }));
    }
    t.step('return acc', `Los pares se anularon: queda ${fmt(acc)}. O(n), O(1) de espacio.`, view({}));
    return acc;
  },
  extraInputs: () => [[[1]], [[-1, 5, -1]]],
};

export default def;
