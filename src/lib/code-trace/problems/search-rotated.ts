import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function search(nums: number[], target: number): number {
  let lo = 0;
  let hi = nums.length - 1;

  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;

    if (nums[lo] <= nums[mid]) {
      // the left half [lo..mid] is sorted (<=: when lo === mid it is one element)
      if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // the right half [mid..hi] is sorted
      if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }

  return -1;
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'search-rotated',
  title: 'Search in Rotated Sorted Array',
  pattern: 'Binary search',
  code,
  examples: [
    { label: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0', args: [[4, 5, 6, 7, 0, 1, 2], 0] },
    { label: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 3', args: [[4, 5, 6, 7, 0, 1, 2], 3] },
    { label: 'nums = [6, 7, 0, 1, 2, 4, 5], target = 7', args: [[6, 7, 0, 1, 2, 4, 5], 7] },
    { label: 'nums = [1], target = 0', args: [[1], 0] },
  ],
  run(t, nums, target) {
    let lo = 0;
    let hi = nums.length - 1;
    const view = (o: { mid?: number; half?: 'left' | 'right'; found?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: [{ name: 'lo', index: lo }, { name: 'hi', index: hi }, ...(o.mid !== undefined ? [{ name: 'mid', index: o.mid }] : [])].filter((p) => p.index >= 0),
        window: lo <= hi ? { from: lo, to: hi, label: o.half ? `mitad ordenada: [${o.half === 'left' ? `${lo}..${o.mid}` : `${o.mid}..${hi}`}]` : undefined } : undefined,
        marks: [
          ...nums.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < lo || m.index > hi),
          ...(o.mid !== undefined ? [{ index: o.mid, tone: o.found ? ('found' as const) : ('focus' as const) }] : []),
        ],
      },
      { kind: 'vars', vars: [{ name: 'target', value: target }] },
    ];

    t.step('let hi = nums.length - 1', `Buscamos ${fmt(target)} en todo el array: lo = ${lo}, hi = ${hi}. Está ordenado pero rotado: un pedazo quedó al principio.`, view({}));
    while (lo <= hi) {
      t.step('while (lo <= hi)', `Quedan ${hi - lo + 1} candidatos, de ${lo} a ${hi}.`, view({}));
      const mid = lo + Math.floor((hi - lo) / 2);
      t.step('const mid', `mid = ${mid}, nums[mid] = ${fmt(nums[mid])}.`, view({ mid }));
      if (nums[mid] === target) {
        t.step('if (nums[mid] === target) return mid', `¡Es ${fmt(target)}! Devolvemos ${mid}. Cada vuelta tiró la mitad: O(log n).`, view({ mid, found: true }));
        return mid;
      }
      if (nums[lo] <= nums[mid]) {
        t.step('if (nums[lo] <= nums[mid])', `nums[lo] = ${fmt(nums[lo])} ≤ nums[mid] = ${fmt(nums[mid])}: la mitad izquierda [${lo}..${mid}] está ordenada. Una de las dos mitades siempre lo está.`, view({ mid, half: 'left' }));
        if (nums[lo] <= target && target < nums[mid]) {
          hi = mid - 1;
          t.step('if (nums[lo] <= target && target < nums[mid]) hi = mid - 1', `${fmt(target)} está entre ${fmt(nums[lo])} y ${fmt(nums[mid])}: tiene que estar a la izquierda. hi = ${hi}.`, view({}));
        } else {
          const from = nums[lo];
          lo = mid + 1;
          t.step('else lo = mid + 1', `${fmt(target)} no cae entre ${fmt(from)} y ${fmt(nums[mid])}, la mitad ordenada: tiramos la izquierda. lo = ${lo}.`, view({}));
        }
      } else {
        t.step('if (nums[lo] <= nums[mid])', `nums[lo] = ${fmt(nums[lo])} > nums[mid] = ${fmt(nums[mid])}: el corte está a la izquierda, así que la mitad derecha [${mid}..${hi}] está ordenada.`, view({ mid, half: 'right' }));
        if (nums[mid] < target && target <= nums[hi]) {
          lo = mid + 1;
          t.step('if (nums[mid] < target && target <= nums[hi]) lo = mid + 1', `${fmt(target)} está entre ${fmt(nums[mid])} y ${fmt(nums[hi])}: tiene que estar a la derecha. lo = ${lo}.`, view({}));
        } else {
          hi = mid - 1;
          t.step('else hi = mid - 1', `${fmt(target)} no cae en la mitad derecha ordenada: tiramos la derecha. hi = ${hi}.`, view({}));
        }
      }
    }
    t.step('return -1', `lo = ${lo} pasó a hi = ${hi}: no quedan candidatos. ${fmt(target)} no está: −1.`, view({}));
    return -1;
  },
  extraInputs: () => [[[], 5], [[3, 1], 1], [[5, 1, 3], 5], [[1, 3], 3], [[4, 5, 6, 7, 8, 1, 2, 3], 8]],
};

export default def;
