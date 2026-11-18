import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function merge(nums1: number[], m: number, nums2: number[], n: number): void {
  let i = m - 1;
  let j = n - 1;
  let write = m + n - 1;
  while (j >= 0) {
    // take from nums1 only while it has values and its value is the larger one
    if (i >= 0 && nums1[i] > nums2[j]) nums1[write--] = nums1[i--];
    else nums1[write--] = nums2[j--];
  }
}`;

const def: TraceDef<[number[], number, number[], number], number[]> = {
  id: 'merge-sorted-array',
  title: 'Merge Sorted Array',
  pattern: 'Two pointers from the back',
  code,
  examples: [
    { label: 'nums1 = [1, 2, 3, 0, 0, 0], m = 3, nums2 = [2, 5, 6], n = 3', args: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3] },
    { label: 'nums1 = [0], m = 0, nums2 = [1], n = 1', args: [[0], 0, [1], 1] },
  ],
  run(t, nums1, m, nums2, n) {
    let i = m - 1;
    let j = n - 1;
    let write = m + n - 1;
    const view = (o: { flash?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'nums1 (los últimos n lugares son espacio libre)',
        items: [...nums1],
        pointers: [{ name: 'i', index: i }, { name: 'write', index: write }].filter((p) => p.index >= 0),
        marks: [
          ...nums1.map((_, k) => ({ index: k, tone: 'visited' as const })).filter((mk) => mk.index > write && mk.index !== o.flash),
          ...(o.flash !== undefined ? [{ index: o.flash, tone: 'add' as const }] : []),
        ],
      },
      {
        kind: 'array',
        label: 'nums2',
        items: nums2,
        pointers: j >= 0 ? [{ name: 'j', index: j }] : [],
        marks: nums2.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((mk) => mk.index > j),
      },
    ];
    t.step('let write = m + n - 1', 'Llenamos nums1 desde atrás: el lugar libre está al final, así nunca pisamos un valor que todavía no movimos.', view({}));
    while (j >= 0) {
      if (i >= 0 && nums1[i] > nums2[j]) {
        const at = write;
        t.step('if (i >= 0 && nums1[i] > nums2[j])', `${fmt(nums1[i])} (de nums1) > ${fmt(nums2[j])} (de nums2): el más grande va al fondo, a la posición ${at}.`, view({}));
        nums1[write--] = nums1[i--];
        t.step('if (i >= 0 && nums1[i] > nums2[j])', `Movido. i y write retroceden.`, view({ flash: at }));
      } else {
        const at = write;
        nums1[write--] = nums2[j--];
        t.step('else nums1[write--] = nums2[j--]', i >= 0
          ? `${fmt(nums2[j + 1])} (de nums2) ≥ ${fmt(nums1[i])}: va a la posición ${at}.`
          : `nums1 ya no tiene valores propios: ${fmt(nums2[j + 1])} va a la posición ${at}.`, view({ flash: at }));
      }
    }
    t.step('while (j >= 0)', 'nums2 se vació. Lo que queda en nums1 a la izquierda ya estaba en su lugar. O(m + n), sin memoria extra.', view({}));
    return nums1;
  },
  callReal: (mod, nums1, m, nums2, n) => {
    (mod.merge as (a: number[], m: number, b: number[], n: number) => void)(nums1, m, nums2, n);
    return nums1;
  },
  extraInputs: () => [[[1], 1, [], 0], [[4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3], [[2, 0], 1, [1], 1]],
};

export default def;
