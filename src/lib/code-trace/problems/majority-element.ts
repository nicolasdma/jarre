import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function majorityElement(nums: number[]): number {
  let candidate = nums[0];
  let count = 0;
  for (const x of nums) {
    if (count === 0) candidate = x; // previous votes all cancelled
    count += x === candidate ? 1 : -1;
  }
  return candidate;
}`;

const def: TraceDef<[number[]], number> = {
  id: 'majority-element',
  title: 'Majority Element',
  pattern: 'Boyer-Moore voting',
  code,
  examples: [
    { label: 'nums = [2, 2, 1, 1, 1, 2, 2]', args: [[2, 2, 1, 1, 1, 2, 2]] },
    { label: 'nums = [3, 2, 3]', args: [[3, 2, 3]] },
  ],
  run(t, nums) {
    let candidate = nums[0];
    let count = 0;
    const view = (o: { i?: number; changed?: string[] }): Viz[] => [
      { kind: 'array', label: 'nums', items: nums, pointers: o.i !== undefined ? [{ name: 'x', index: o.i }] : [] },
      { kind: 'vars', vars: [{ name: 'candidate', value: candidate, changed: o.changed?.includes('candidate') }, { name: 'count', value: count, changed: o.changed?.includes('count') }] },
    ];
    t.step('let count = 0', 'Votación: un candidato y su saldo de votos. Cada voto a favor suma, cada voto en contra resta. El que aparece más de n/2 veces sobrevive a todas las restas.', view({}));
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      if (count === 0) {
        candidate = x;
        t.step('if (count === 0) candidate = x', `El saldo está en 0: los votos anteriores se anularon entre sí. ${fmt(x)} pasa a ser el candidato.`, view({ i, changed: ['candidate'] }));
      }
      const vote = x === candidate ? 1 : -1;
      count += vote;
      t.step('count += x === candidate', vote === 1
        ? `${fmt(x)} es el candidato: un voto a favor. count = ${count}.`
        : `${fmt(x)} no es el candidato: un voto en contra. count = ${count}.`, view({ i, changed: ['count'] }));
    }
    t.step('return candidate', `Queda ${fmt(candidate)}. Una pasada, O(1) de espacio: sin Map.`, view({}));
    return candidate;
  },
  extraInputs: () => [[[1]], [[6, 5, 5]], [[4, 4, 1, 2, 4]]],
};

export default def;
