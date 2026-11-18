import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function searchInsert(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length; // half-open [lo, hi): left of lo is < target, from hi on is >= target
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid; // mid may be the answer, keep it
  }
  return lo;
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'search-insert-position',
  title: 'Search Insert Position',
  pattern: 'Binary search (lower bound)',
  code,
  examples: [
    { label: 'nums = [1, 3, 5, 6], target = 2', args: [[1, 3, 5, 6], 2] },
    { label: 'nums = [1, 3, 5, 6], target = 5', args: [[1, 3, 5, 6], 5] },
    { label: 'nums = [1, 3, 5, 6], target = 7', args: [[1, 3, 5, 6], 7] },
  ],
  run(t, nums, target) {
    let lo = 0;
    let hi = nums.length;
    const view = (o: { mid?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'nums · rango semiabierto [lo, hi)',
        items: nums,
        pointers: [{ name: 'lo', index: lo }, { name: 'hi', index: hi }, ...(o.mid !== undefined ? [{ name: 'mid', index: o.mid }] : [])],
        window: lo < hi ? { from: lo, to: hi - 1 } : undefined,
        marks: [
          ...nums.map((_, k) => ({ index: k, tone: k < lo ? ('visited' as const) : ('muted' as const) })).filter((m) => m.index < lo || m.index >= hi),
          ...(o.mid !== undefined ? [{ index: o.mid, tone: 'focus' as const }] : []),
        ],
      },
      { kind: 'vars', vars: [{ name: 'target', value: target }] },
    ];
    t.step('let hi = nums.length', `[lo, hi) = [0, ${hi}). Invariante: todo lo de la izquierda de lo es < ${fmt(target)}; desde hi en adelante, ≥ ${fmt(target)}. hi puede ser n: insertar al final.`, view({}));
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      t.step('const mid', `mid = ${mid}, nums[mid] = ${fmt(nums[mid])}.`, view({ mid }));
      if (nums[mid] < target) {
        lo = mid + 1;
        t.step('if (nums[mid] < target) lo = mid + 1', `${fmt(nums[mid])} < ${fmt(target)}: mid y todo lo de su izquierda quedan antes. lo = ${lo}.`, view({}));
      } else {
        hi = mid;
        t.step('else hi = mid', `${fmt(nums[mid])} ≥ ${fmt(target)}: mid puede ser la respuesta, así que lo conservamos. hi = ${hi}.`, view({}));
      }
    }
    t.step('return lo', `lo = hi = ${lo}: la primera posición con un valor ≥ ${fmt(target)}. Ahí está o ahí iría. O(log n).`, view({}));
    return lo;
  },
  extraInputs: () => [[[], 3], [[1, 3, 5, 6], 0], [[2, 2, 2], 2]],
};

export default def;
