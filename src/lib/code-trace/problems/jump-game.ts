import type { TraceDef } from '../trace';
import type { Viz } from '../types';

const code = `export function canJump(nums: number[]): boolean {
  let reach = 0; // farthest index reachable so far
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false; // stuck before i
    reach = Math.max(reach, i + nums[i]);
    if (reach >= nums.length - 1) return true;
  }
  return true;
}`;

const def: TraceDef<[number[]], boolean> = {
  id: 'jump-game',
  title: 'Jump Game',
  pattern: 'Greedy',
  code,
  examples: [
    { label: 'nums = [2, 3, 1, 1, 4]', args: [[2, 3, 1, 1, 4]] },
    { label: 'nums = [3, 2, 1, 0, 4]', args: [[3, 2, 1, 0, 4]] },
  ],
  run(t, nums) {
    let reach = 0;
    const view = (o: { i?: number; stuck?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'nums · el salto máximo desde cada casilla',
        items: nums,
        pointers: [...(o.i !== undefined ? [{ name: 'i', index: o.i }] : []), { name: 'reach', index: Math.min(reach, nums.length) }],
        window: { from: 0, to: Math.min(reach, nums.length - 1), label: `alcanzable: 0..${reach}` },
        marks: o.stuck && o.i !== undefined ? [{ index: o.i, tone: 'drop' }] : [],
      },
      { kind: 'vars', vars: [{ name: 'reach', value: reach, changed: true }] },
    ];
    t.step('let reach = 0', 'reach = la casilla más lejana a la que podemos llegar hasta ahora. No probamos caminos: solo estiramos ese borde.', view({}));
    for (let i = 0; i < nums.length; i++) {
      if (i > reach) {
        t.step('if (i > reach) return false', `La casilla ${i} está más allá de reach = ${reach}: nadie llega acá. false.`, view({ i, stuck: true }));
        return false;
      }
      const before = reach;
      reach = Math.max(reach, i + nums[i]);
      t.step('reach = Math.max(reach, i + nums[i])', reach > before
        ? `Desde ${i} saltamos hasta ${i} + ${nums[i]} = ${i + nums[i]}: reach crece a ${reach}.`
        : `Desde ${i} llegamos a ${i + nums[i]}, no más lejos que ${before}.`, view({ i }));
      if (reach >= nums.length - 1) {
        t.step('if (reach >= nums.length - 1) return true', `reach = ${reach} ya cubre la última casilla (${nums.length - 1}): true. Una pasada, O(n).`, view({ i }));
        return true;
      }
    }
    t.step('  return true;', 'Recorrimos todo sin trabarnos: true.', view({}));
    return true;
  },
  extraInputs: () => [[[]], [[0]], [[0, 1]], [[1, 0, 1]], [[2, 0, 0]]],
};

export default def;
