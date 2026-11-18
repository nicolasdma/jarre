import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left++]; // positives: shrinking always lowers the sum
    }
  }
  return best === Infinity ? 0 : best;
}`;

const def: TraceDef<[number, number[]], number> = {
  id: 'min-size-subarray-sum',
  title: 'Minimum Size Subarray Sum',
  pattern: 'Sliding window (variable)',
  code,
  examples: [
    { label: 'target = 7, nums = [2, 3, 1, 2, 4, 3]', args: [7, [2, 3, 1, 2, 4, 3]] },
    { label: 'target = 11, nums = [1, 1, 1, 1, 1, 1, 1, 1]', args: [11, [1, 1, 1, 1, 1, 1, 1, 1]] },
  ],
  run(t, target, nums) {
    let left = 0;
    let sum = 0;
    let best = Infinity;
    const view = (o: { right?: number; changed?: string }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: [{ name: 'left', index: left }, ...(o.right !== undefined ? [{ name: 'right', index: o.right }] : [])],
        window: o.right !== undefined && left <= o.right ? { from: left, to: o.right, label: `ventana [${left}..${o.right}], suma ${fmt(sum)}` } : undefined,
        marks: nums.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < left),
      },
      { kind: 'vars', vars: [{ name: 'target', value: target }, { name: 'sum', value: sum, changed: o.changed === 'sum' }, { name: 'best', value: best, changed: o.changed === 'best' }] },
    ];
    t.step('let best = Infinity', `Buscamos la ventana más corta con suma ≥ ${fmt(target)}. Todos los números son positivos: agrandar sube la suma, achicar la baja.`, view({}));
    for (let right = 0; right < nums.length; right++) {
      sum += nums[right];
      t.step('sum += nums[right]', `Entra nums[${right}] = ${fmt(nums[right])} por la derecha: sum = ${fmt(sum)}.`, view({ right, changed: 'sum' }));
      while (sum >= target) {
        best = Math.min(best, right - left + 1);
        t.step('best = Math.min(best, right - left + 1)', `${fmt(sum)} ≥ ${fmt(target)}: la ventana sirve y mide ${right - left + 1}. best = ${fmt(best)}. ¿Se puede más corta?`, view({ right, changed: 'best' }));
        const out = nums[left];
        sum -= nums[left++];
        t.step('sum -= nums[left++]', `Sale ${fmt(out)} por la izquierda: sum = ${fmt(sum)}.`, view({ right, changed: 'sum' }));
      }
    }
    const res = best === Infinity ? 0 : best;
    t.step('return best === Infinity ? 0 : best', res === 0
      ? `Ninguna ventana llegó a ${fmt(target)}: devolvemos 0.`
      : `La más corta mide ${res}. Cada número entra una vez y sale una vez: O(n).`, view({}));
    return res;
  },
  extraInputs: () => [[4, [1, 4, 4]], [15, [1, 2, 3, 4, 5]], [3, []]],
};

export default def;
