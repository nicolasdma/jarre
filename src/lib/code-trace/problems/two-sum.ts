import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt, minus } from '../format';

const code = `export function twoSum(nums: number[], target: number): [number, number] {
  const indexByValue = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    const j = indexByValue.get(complement);
    if (j !== undefined) return [j, i];
    indexByValue.set(nums[i], i);
  }
  throw new Error('No two numbers add up to the target');
}`;

const def: TraceDef<[number[], number], [number, number]> = {
  id: 'two-sum',
  title: 'Two Sum',
  pattern: 'Hash map',
  code,
  examples: [
    { label: 'nums = [2, 7, 11, 15], target = 9', args: [[2, 7, 11, 15], 9] },
    { label: 'nums = [3, 2, 4], target = 6', args: [[3, 2, 4], 6] },
    { label: 'nums = [3, 3], target = 6', args: [[3, 3], 6] },
    { label: 'nums = [1, 8, 4, 6, 3], target = 9', args: [[1, 8, 4, 6, 3], 9] },
  ],
  run(t, nums, target) {
    const seen = new Map<number, number>();
    const view = (o: { i?: number; comp?: number; j?: number; flash?: number; probe?: boolean; found?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: [
          ...(o.i !== undefined ? [{ name: 'i', index: o.i }] : []),
          ...(o.found && o.j !== undefined ? [{ name: 'j', index: o.j }] : []),
        ],
        marks: o.found && o.j !== undefined && o.i !== undefined
          ? [{ index: o.j, tone: 'found' as const }, { index: o.i, tone: 'found' as const }]
          : [...seen.values()].filter((idx) => idx !== o.i).map((idx) => ({ index: idx, tone: 'visited' as const })),
      },
      { kind: 'vars', vars: [{ name: 'target', value: target }, ...(o.comp !== undefined ? [{ name: 'complement', value: o.comp, changed: !o.probe }] : [])] },
      {
        kind: 'map',
        label: 'indexByValue',
        keyLabel: 'valor',
        valueLabel: 'índice',
        entries: [...seen].map(([key, value]) => ({ key, value })),
        flash: o.flash,
        hit: o.found ? o.comp : undefined,
        probe: o.probe && o.comp !== undefined ? { key: o.comp, found: !!o.found } : undefined,
      },
    ];

    t.step('const indexByValue', 'Arrancamos con un Map vacío: valor → índice. Ahí vamos a anotar cada número que ya vimos y dónde estaba.', view({}));
    for (let i = 0; i < nums.length; i++) {
      t.step('for (let i', `i = ${i}: miramos nums[${i}] = ${fmt(nums[i])}.`, view({ i }));
      const comp = target - nums[i];
      t.step('const complement', `complemento = ${minus(target, nums[i])} = ${fmt(comp)}: es el número que le falta a ${fmt(nums[i])} para llegar a ${fmt(target)}.`, view({ i, comp }));
      const j = seen.get(comp);
      if (j === undefined) {
        t.step('indexByValue.get(complement)', `¿Está ${fmt(comp)} en el Map? Todavía no: nadie de los que ya pasaron le sirve a ${fmt(nums[i])}.`, view({ i, comp, probe: true }));
        t.step('if (j !== undefined)', 'j es undefined, así que no hay par todavía: seguimos.', view({ i, comp, probe: true }));
      } else {
        t.step('indexByValue.get(complement)', `¿Está ${fmt(comp)} en el Map? Sí: lo vimos en el índice ${j}.`, view({ i, comp, j, probe: true, found: true }));
        t.step('return [j, i]', `Devolvemos [${j}, ${i}]: ${fmt(nums[j])} + ${fmt(nums[i])} = ${fmt(target)}. Una sola pasada: el Map reemplazó al for de adentro.`, view({ i, comp, j, found: true }));
        return [j, i];
      }
      seen.set(nums[i], i);
      t.step('indexByValue.set', `Guardamos ${fmt(nums[i])} → ${i}, por si más adelante a alguien le falta justo un ${fmt(nums[i])}.`, view({ i, comp, flash: nums[i] }));
    }
    throw new Error('No two numbers add up to the target');
  },
  normalize: (r) => [...(r as number[])].sort((a, b) => a - b),
  extraInputs: () => [
    [[5, 1, 4], 9],
    [[-3, 4, 3, 90], 0],
    [[0, 4, 3, 0], 0],
  ],
};

export default def;
