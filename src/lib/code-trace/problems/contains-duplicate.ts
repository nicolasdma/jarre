import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const x of nums) {
    if (seen.has(x)) return true; // second time we see it
    seen.add(x);
  }
  return false;
}`;

const def: TraceDef<[number[]], boolean> = {
  id: 'contains-duplicate',
  title: 'Contains Duplicate',
  pattern: 'Hash set',
  code,
  examples: [
    { label: 'nums = [1, 2, 3, 1]', args: [[1, 2, 3, 1]] },
    { label: 'nums = [1, 2, 3, 4]', args: [[1, 2, 3, 4]] },
  ],
  run(t, nums) {
    const seen = new Set<number>();
    const view = (o: { i?: number; flash?: number; hit?: number; probe?: number }): Viz[] => [
      { kind: 'array', label: 'nums', items: nums, pointers: o.i !== undefined ? [{ name: 'x', index: o.i }] : [], marks: o.hit !== undefined && o.i !== undefined ? [{ index: o.i, tone: 'found' }, { index: nums.indexOf(o.hit), tone: 'found' }] : [] },
      { kind: 'set', label: 'seen', items: [...seen], flash: o.flash, hit: o.hit, probe: o.probe !== undefined ? { key: o.probe, found: seen.has(o.probe) } : undefined },
    ];
    t.step('const seen', 'Un Set con lo que ya vimos. Preguntarle "¿está?" cuesta O(1).', view({}));
    for (let i = 0; i < nums.length; i++) {
      const x = nums[i];
      t.step('for (const x of nums)', `x = ${fmt(x)}.`, view({ i }));
      if (seen.has(x)) {
        t.step('if (seen.has(x)) return true', `¿Ya vimos ${fmt(x)}? Sí: es la segunda vez. Devolvemos true sin mirar el resto.`, view({ i, hit: x }));
        return true;
      }
      t.step('if (seen.has(x)) return true', `¿Ya vimos ${fmt(x)}? No.`, view({ i, probe: x }));
      seen.add(x);
      t.step('seen.add(x)', `Lo anotamos en el Set.`, view({ i, flash: x }));
    }
    t.step('return false', 'Recorrimos todo sin repetir ninguno: false. O(n) tiempo, O(n) espacio.', view({}));
    return false;
  },
  extraInputs: () => [[[]], [[7, 7]], [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]]],
};

export default def;
