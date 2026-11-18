import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt, minus } from '../format';

const code = `export function subarraySum(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]); // the empty prefix
  let sum = 0;
  let count = 0;
  for (const x of nums) {
    sum += x;
    count += seen.get(sum - k) ?? 0; // earlier prefixes that leave exactly k
    seen.set(sum, (seen.get(sum) ?? 0) + 1);
  }
  return count;
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'subarray-sum-equals-k',
  title: 'Subarray Sum Equals K',
  pattern: 'Prefix sum + hash map',
  code,
  examples: [
    { label: 'nums = [1, 2, 3], k = 3', args: [[1, 2, 3], 3] },
    { label: 'nums = [1, 1, 1], k = 2', args: [[1, 1, 1], 2] },
    { label: 'nums = [3, 4, -7, 3, 1], k = 7', args: [[3, 4, -7, 3, 1], 7] },
  ],
  run(t, nums, k) {
    const seen = new Map<number, number>([[0, 1]]);
    let sum = 0;
    let count = 0;
    const view = (o: { i?: number; flash?: number; probe?: number; changed?: string }): Viz[] => [
      { kind: 'array', label: 'nums', items: nums, pointers: o.i !== undefined ? [{ name: 'x', index: o.i }] : [], window: o.i !== undefined ? { from: 0, to: o.i, label: `prefijo nums[0..${o.i}], suma ${fmt(sum)}` } : undefined },
      { kind: 'vars', vars: [{ name: 'k', value: k }, { name: 'sum', value: sum, changed: o.changed === 'sum' }, { name: 'count', value: count, changed: o.changed === 'count' }] },
      {
        kind: 'map',
        label: 'seen · suma de prefijo → cuántas veces',
        keyLabel: 'prefijo',
        valueLabel: 'veces',
        entries: [...seen].map(([key, value]) => ({ key, value })),
        flash: o.flash,
        probe: o.probe !== undefined ? { key: o.probe, found: seen.has(o.probe) } : undefined,
        hit: o.probe !== undefined && seen.has(o.probe) ? o.probe : undefined,
      },
    ];
    t.step('const seen', 'La idea: un subarray que termina acá suma k si a mi suma acumulada le resto un prefijo anterior y da k. Guardamos cuántas veces vimos cada suma de prefijo. Empieza con 0 → 1: el prefijo vacío.', view({}));
    for (let i = 0; i < nums.length; i++) {
      sum += nums[i];
      t.step('sum += x', `Sumamos ${fmt(nums[i])}: la suma acumulada es ${fmt(sum)}.`, view({ i, changed: 'sum' }));
      const need = sum - k;
      const found = seen.get(need) ?? 0;
      count += found;
      t.step('count += seen.get(sum - k)', found
        ? `Buscamos un prefijo de ${minus(sum, k)} = ${fmt(need)}: lo vimos ${found} ${found === 1 ? 'vez' : 'veces'}. Cada uno es un subarray que suma ${fmt(k)} y termina acá. count = ${count}.`
        : `Buscamos un prefijo de ${minus(sum, k)} = ${fmt(need)}: no hay. Ningún subarray que termine acá suma ${fmt(k)}.`, view({ i, probe: need, changed: found ? 'count' : undefined }));
      seen.set(sum, (seen.get(sum) ?? 0) + 1);
      t.step('seen.set(sum', `Anotamos el prefijo ${fmt(sum)} para los que vienen.`, view({ i, flash: sum }));
    }
    t.step('return count', `count = ${count}. Una pasada, O(n). Funciona con negativos, donde una ventana deslizante no.`, view({}));
    return count;
  },
  extraInputs: () => [[[1], 0], [[-1, -1, 1], 0], [[0, 0, 0], 0]],
};

export default def;
