import type { TraceDef } from '../trace';
import type { Mark, Viz } from '../types';
import { fmt } from '../format';

const code = `class MinHeap {
  private a: number[] = [];
  get size(): number { return this.a.length; }
  peek(): number { return this.a[0]; }
  push(x: number): void {
    const a = this.a;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) { // sift up
      const p = (i - 1) >> 1;
      if (a[p] <= a[i]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.a;
    const top = a[0];
    const last = a.pop() as number;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) { // sift down
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l] < a[m]) m = l;
        if (r < a.length && a[r] < a[m]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

export function findKthLargest(nums: number[], k: number): number {
  const heap = new MinHeap();
  for (const x of nums) {
    heap.push(x);
    if (heap.size > k) heap.pop(); // drop the smallest: the heap keeps the k largest
  }
  return heap.peek(); // the smallest of the k largest
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'kth-largest-element',
  title: 'Kth Largest Element in an Array',
  pattern: 'Heap (top k)',
  code,
  examples: [
    { label: 'nums = [3, 2, 1, 5, 6, 4], k = 2', args: [[3, 2, 1, 5, 6, 4], 2] },
    { label: 'nums = [3, 2, 3, 1, 2, 4, 5, 5, 6], k = 4', args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4] },
  ],
  run(t, nums, k) {
    const a: number[] = [];
    const view = (o: { x?: number; marks?: Mark[] }): Viz[] => [
      { kind: 'array', label: 'nums', items: nums, pointers: o.x !== undefined ? [{ name: 'x', index: o.x }] : [] },
      { kind: 'heap', label: `heap mínimo · los ${k} más grandes`, items: [...a], marks: o.marks },
    ];
    t.step('const heap = new MinHeap()', `Un heap mínimo de tamaño ${k}: adentro quedan los ${k} más grandes vistos, y la raíz es el más chico de ellos, o sea el k-ésimo más grande.`, view({}));
    for (let xi = 0; xi < nums.length; xi++) {
      const x = nums[xi];
      a.push(x);
      t.step('heap.push(x)', `Entra ${fmt(x)} al final del heap.`, view({ x: xi, marks: [{ index: a.length - 1, tone: 'add' }] }));
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (a[p] <= a[i]) break;
        [a[p], a[i]] = [a[i], a[p]];
        t.step('[a[p], a[i]] = [a[i], a[p]]', `${fmt(a[i])} (padre) > ${fmt(a[p])}: los cambiamos. Sube hasta que su padre sea menor (sift up, O(log k)).`, view({ x: xi, marks: [{ index: p, tone: 'add' }, { index: i, tone: 'focus' }] }));
        i = p;
      }
      if (a.length > k) {
        const top = a[0];
        const last = a.pop()!;
        a[0] = last;
        t.step('if (heap.size > k) heap.pop()', `Hay ${k + 1}: sacamos la raíz ${fmt(top)}, el más chico, que ya no está entre los ${k} más grandes. El último sube a la raíz.`, view({ x: xi, marks: [{ index: 0, tone: 'focus' }] }));
        let j = 0;
        for (;;) {
          const l = 2 * j + 1;
          const r = l + 1;
          let m = j;
          if (l < a.length && a[l] < a[m]) m = l;
          if (r < a.length && a[r] < a[m]) m = r;
          if (m === j) break;
          [a[m], a[j]] = [a[j], a[m]];
          t.step('[a[m], a[i]] = [a[i], a[m]]', `${fmt(a[m])} es mayor que su hijo ${fmt(a[j])}: los cambiamos (sift down).`, view({ x: xi, marks: [{ index: j, tone: 'add' }, { index: m, tone: 'focus' }] }));
          j = m;
        }
      }
    }
    t.step('return heap.peek()', `La raíz es ${fmt(a[0])}: el más chico de los ${k} más grandes, o sea el ${k}° más grande. O(n log k).`, view({ marks: [{ index: 0, tone: 'found' }] }));
    return a[0];
  },
  extraInputs: () => [[[1], 1], [[2, 1], 2], [[7, 6, 5, 4, 3, 2, 1], 3], [[-1, -1], 2]],
};

export default def;
