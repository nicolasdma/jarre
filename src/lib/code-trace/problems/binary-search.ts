import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function search(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1; // closed range [lo, hi]
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'binary-search',
  title: 'Binary Search',
  pattern: 'Binary search',
  code,
  examples: [
    { label: 'nums = [-1, 0, 3, 5, 9, 12], target = 9', args: [[-1, 0, 3, 5, 9, 12], 9] },
    { label: 'nums = [-1, 0, 3, 5, 9, 12], target = 2', args: [[-1, 0, 3, 5, 9, 12], 2] },
  ],
  run(t, nums, target) {
    let lo = 0;
    let hi = nums.length - 1;
    const view = (o: { mid?: number; found?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: [{ name: 'lo', index: lo }, { name: 'hi', index: hi }, ...(o.mid !== undefined ? [{ name: 'mid', index: o.mid }] : [])].filter((p) => p.index >= 0),
        window: lo <= hi ? { from: lo, to: hi } : undefined,
        marks: [
          ...nums.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < lo || m.index > hi),
          ...(o.mid !== undefined ? [{ index: o.mid, tone: o.found ? ('found' as const) : ('focus' as const) }] : []),
        ],
      },
      { kind: 'vars', vars: [{ name: 'target', value: target }] },
    ];
    t.step('let hi = nums.length - 1', `Rango cerrado [${lo}, ${hi}]: todo el array es candidato.`, view({}));
    while (lo <= hi) {
      const mid = lo + ((hi - lo) >> 1);
      t.step('const mid', `mid = ${lo} + (${hi} − ${lo}) / 2 = ${mid}. nums[mid] = ${fmt(nums[mid])}.`, view({ mid }));
      if (nums[mid] === target) {
        t.step('if (nums[mid] === target) return mid', `¡Es ${fmt(target)}! Devolvemos ${mid}.`, view({ mid, found: true }));
        return mid;
      }
      if (nums[mid] < target) {
        lo = mid + 1;
        t.step('if (nums[mid] < target) lo = mid + 1', `${fmt(nums[mid])} < ${fmt(target)}: está a la derecha. Tiramos la mitad izquierda, mid incluido: lo = ${lo}.`, view({}));
      } else {
        hi = mid - 1;
        t.step('else hi = mid - 1', `${fmt(nums[mid])} > ${fmt(target)}: está a la izquierda. Tiramos la mitad derecha: hi = ${hi}.`, view({}));
      }
    }
    t.step('return -1', `lo = ${lo} > hi = ${hi}: el rango quedó vacío. No está: −1. Cada vuelta divide por 2: O(log n).`, view({}));
    return -1;
  },
  extraInputs: () => [[[], 1], [[5], 5], [[1, 3], 0], [[1, 3, 5, 7], 7]],
};

export default def;
