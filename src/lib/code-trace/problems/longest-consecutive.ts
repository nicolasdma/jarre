import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue; // not the start of a run
    let len = 1;
    while (set.has(x + len)) len++;
    if (len > best) best = len;
  }
  return best;
}`;

const def: TraceDef<[number[]], number> = {
  id: 'longest-consecutive',
  title: 'Longest Consecutive Sequence',
  pattern: 'Hash set',
  code,
  examples: [
    { label: 'nums = [100, 4, 200, 1, 3, 2]', args: [[100, 4, 200, 1, 3, 2]] },
    { label: 'nums = [9, 1, 4, 7, 3, 2, 8, 5]', args: [[9, 1, 4, 7, 3, 2, 8, 5]] },
  ],
  run(t, nums) {
    const set = new Set(nums);
    let best = 0;
    const view = (o: { x?: number; run?: number[]; hit?: number; probe?: number }): Viz[] => [
      { kind: 'set', label: 'set', items: [...set], hit: o.hit, probe: o.probe !== undefined ? { key: o.probe, found: set.has(o.probe) } : undefined },
      ...(o.run ? [{ kind: 'text' as const, label: 'tramo', value: o.run.join(' → '), tone: 'focus' as const }] : []),
      { kind: 'vars', vars: [{ name: 'best', value: best }] },
    ];
    t.step('const set = new Set(nums)', 'Metemos todo en un Set: preguntar si un número está cuesta O(1).', view({}));
    for (const x of set) {
      if (set.has(x - 1)) {
        t.step('if (set.has(x - 1)) continue', `${fmt(x)}: existe ${fmt(x - 1)}, así que ${fmt(x)} no empieza un tramo. Lo salteamos: lo va a contar quien sí empieza.`, view({ x, probe: x - 1 }));
        continue;
      }
      t.step('if (set.has(x - 1)) continue', `${fmt(x)}: no existe ${fmt(x - 1)}, así que acá empieza un tramo.`, view({ x, probe: x - 1 }));
      let len = 1;
      const run = [x];
      while (set.has(x + len)) {
        run.push(x + len);
        len++;
      }
      t.step('while (set.has(x + len)) len++', `Contamos hacia arriba mientras exista el siguiente: ${run.join(', ')}. Largo ${len}.`, view({ x, run, probe: x + len }));
      if (len > best) {
        best = len;
        t.step('if (len > best) best = len', `Es el tramo más largo hasta ahora: best = ${best}.`, view({ x, run }));
      }
    }
    t.step('return best', `best = ${best}. Cada número se cuenta en un solo tramo: O(n) aunque haya un while adentro.`, view({}));
    return best;
  },
  extraInputs: () => [[[]], [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], [[1, 2, 0, 1]]],
};

export default def;
