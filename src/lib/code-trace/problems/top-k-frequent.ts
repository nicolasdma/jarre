import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function topKFrequent(nums: number[], k: number): number[] {
  const countByValue = new Map<number, number>();
  for (const num of nums) countByValue.set(num, (countByValue.get(num) ?? 0) + 1);

  // buckets[c] holds the values that appear exactly c times; a count goes from 1 to n
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => []);
  for (const [value, count] of countByValue) buckets[count].push(value);

  const result: number[] = [];
  for (let count = nums.length; count >= 1; count--) {
    for (const value of buckets[count]) {
      result.push(value);
      if (result.length === k) return result;
    }
  }
  return result;
}`;

const def: TraceDef<[number[], number], number[]> = {
  id: 'top-k-frequent',
  title: 'Top K Frequent Elements',
  pattern: 'Hash map + bucket sort (or heap)',
  code,
  examples: [
    { label: 'nums = [1, 1, 1, 2, 2, 3], k = 2', args: [[1, 1, 1, 2, 2, 3], 2] },
    { label: 'nums = [1], k = 1', args: [[1], 1] },
    { label: 'nums = [4, 1, 4, 2, 4, 1, 3], k = 2', args: [[4, 1, 4, 2, 4, 1, 3], 2] },
  ],
  run(t, nums, k) {
    const counts = new Map<number, number>();
    let buckets: number[][] = [];
    const result: number[] = [];
    const view = (o: { i?: number; flash?: number; bucket?: number; showBuckets?: boolean; showResult?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'nums',
        items: nums,
        pointers: o.i !== undefined ? [{ name: 'num', index: o.i }] : [],
      },
      {
        kind: 'map',
        label: 'countByValue',
        keyLabel: 'valor',
        valueLabel: 'veces',
        entries: [...counts].map(([key, value]) => ({ key, value })),
        flash: o.flash,
      },
      ...(o.showBuckets
        ? [{
            kind: 'array' as const,
            label: 'buckets · el índice es cuántas veces aparece',
            items: buckets.map((b) => (b.length ? fmt(b) : '·')),
            marks: o.bucket !== undefined ? [{ index: o.bucket, tone: 'focus' as const }] : [],
          }]
        : []),
      ...(o.showResult ? [{ kind: 'text' as const, label: `result (k = ${k})`, value: fmt(result), tone: result.length === k ? ('found' as const) : undefined }] : []),
    ];

    for (let i = 0; i < nums.length; i++) {
      const before = counts.get(nums[i]) ?? 0;
      counts.set(nums[i], before + 1);
      t.step('for (const num of nums) countByValue.set', `Contamos ${fmt(nums[i])}: ${before} → ${before + 1}.`, view({ i, flash: nums[i] }));
    }
    buckets = Array.from({ length: nums.length + 1 }, () => []);
    t.step('const buckets', `En vez de ordenar por frecuencia (n log n), armamos ${nums.length + 1} baldes: el balde c tiene los valores que aparecen exactamente c veces. Nadie aparece más de n = ${nums.length} veces.`, view({ showBuckets: true }));
    for (const [value, count] of counts) {
      buckets[count].push(value);
      t.step('for (const [value, count] of countByValue) buckets[count].push(value)', `${fmt(value)} aparece ${count} ${count === 1 ? 'vez' : 'veces'}: va al balde ${count}.`, view({ showBuckets: true, bucket: count }));
    }
    t.step('const result', 'Ahora recorremos los baldes del más alto al más bajo: los más frecuentes salen primero.', view({ showBuckets: true, showResult: true }));
    for (let count = nums.length; count >= 1; count--) {
      if (buckets[count].length === 0) continue;
      t.step('for (let count = nums.length', `Balde ${count}: ${fmt(buckets[count])}.`, view({ showBuckets: true, bucket: count, showResult: true }));
      for (const value of buckets[count]) {
        result.push(value);
        t.step('result.push(value)', `Sumamos ${fmt(value)} al resultado.`, view({ showBuckets: true, bucket: count, showResult: true }));
        if (result.length === k) {
          t.step('if (result.length === k) return result', `Ya tenemos k = ${k}: devolvemos ${fmt(result)}. Todo fue lineal: O(n).`, view({ showBuckets: true, bucket: count, showResult: true }));
          return result;
        }
      }
    }
    t.step('  return result;', `Devolvemos ${fmt(result)}.`, view({ showBuckets: true, showResult: true }));
    return result;
  },
  normalize: (r) => [...(r as number[])].sort((a, b) => a - b),
  extraInputs: () => [[[5, 5, 6, 6, 6, 7], 1], [[-1, -1, 2], 2]],
};

export default def;
