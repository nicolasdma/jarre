import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function moveZeroes(nums: number[]): void {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) nums[write++] = nums[read]; // keep order
  }
  while (write < nums.length) nums[write++] = 0;
}`;

const def: TraceDef<[number[]], number[]> = {
  id: 'move-zeroes',
  title: 'Move Zeroes',
  pattern: 'Two pointers (read/write)',
  code,
  examples: [
    { label: 'nums = [0, 1, 0, 3, 12]', args: [[0, 1, 0, 3, 12]] },
    { label: 'nums = [0]', args: [[0]] },
  ],
  run(t, nums) {
    let write = 0;
    const view = (o: { read?: number; flash?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'nums (se modifica en el lugar)',
        items: [...nums],
        pointers: [{ name: 'write', index: write }, ...(o.read !== undefined ? [{ name: 'read', index: o.read }] : [])],
        marks: [
          ...nums.map((_, k) => ({ index: k, tone: 'visited' as const })).filter((m) => m.index < write && m.index !== o.flash),
          ...(o.flash !== undefined ? [{ index: o.flash, tone: 'add' as const }] : []),
        ],
      },
    ];
    t.step('let write = 0', 'write marca dónde va el próximo número que no es 0. Todo lo que queda a su izquierda ya está en su lugar.', view({}));
    for (let read = 0; read < nums.length; read++) {
      if (nums[read] !== 0) {
        const at = write;
        nums[write++] = nums[read];
        t.step('if (nums[read] !== 0) nums[write++] = nums[read]', `nums[${read}] = ${fmt(nums[at])} no es 0: lo copiamos a la posición ${at} y write avanza. El orden se mantiene.`, view({ read, flash: at }));
      } else {
        t.step('if (nums[read] !== 0) nums[write++] = nums[read]', `nums[${read}] es 0: read sigue, write se queda esperando.`, view({ read }));
      }
    }
    while (write < nums.length) {
      const at = write;
      nums[write++] = 0;
      t.step('while (write < nums.length) nums[write++] = 0', `Rellenamos con 0 la posición ${at}.`, view({ flash: at }));
    }
    return nums;
  },
  callReal: (mod, nums) => {
    (mod.moveZeroes as (a: number[]) => void)(nums);
    return nums;
  },
  extraInputs: () => [[[]], [[1, 2, 3]], [[0, 0, 1]], [[4, 0, 5, 0, 0, 6]]],
};

export default def;
