import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function subsets(nums: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const dfs = (i: number): void => {
    if (i === nums.length) { out.push([...path]); return; } // copy: path keeps changing
    dfs(i + 1); // skip nums[i]
    path.push(nums[i]); // take nums[i]
    dfs(i + 1);
    path.pop(); // undo the choice
  };
  dfs(0);
  return out;
}`;

const def: TraceDef<[number[]], number[][]> = {
  id: 'subsets',
  title: 'Subsets',
  pattern: 'Backtracking',
  code,
  examples: [
    { label: 'nums = [1, 2, 3]', args: [[1, 2, 3]] },
    { label: 'nums = [0]', args: [[0]] },
  ],
  run(t, nums) {
    const out: number[][] = [];
    const path: number[] = [];
    const view = (o: { i: number; flash?: boolean }): Viz[] => [
      { kind: 'array', label: 'nums', items: nums, pointers: o.i < nums.length ? [{ name: 'i', index: o.i }] : [], marks: nums.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < o.i) },
      { kind: 'stack', label: 'path · lo que elegimos en este camino', items: [...path] },
      { kind: 'text', label: `out (${out.length})`, value: out.map((s) => fmt(s)).join(' '), tone: o.flash ? 'add' : undefined },
    ];
    const dfs = (i: number): void => {
      if (i === nums.length) {
        out.push([...path]);
        t.step('if (i === nums.length)', `Ya decidimos los ${nums.length}: el camino ${fmt(path)} es un subconjunto. Guardamos una copia (path va a seguir cambiando).`, view({ i, flash: true }));
        return;
      }
      t.step('dfs(i + 1)#1', `¿${fmt(nums[i])} entra? Primero la rama "no": seguimos sin él.`, view({ i }));
      dfs(i + 1);
      path.push(nums[i]);
      t.step('path.push(nums[i])', `Ahora la rama "sí": ${fmt(nums[i])} entra a path.`, view({ i }));
      t.step('dfs(i + 1)#2', `Seguimos con ${fmt(nums[i])} adentro.`, view({ i }));
      dfs(i + 1);
      path.pop();
      t.step('path.pop()', `Deshacemos la elección: sacamos ${fmt(nums[i])} para volver al punto de decisión.`, view({ i }));
    };
    t.step('dfs(0);', `Cada número tiene dos opciones, entra o no: 2^${nums.length} = ${2 ** nums.length} subconjuntos. Recorremos ese árbol de decisiones con un solo path que crece y se deshace.`, view({ i: 0 }));
    dfs(0);
    t.step('return out', `Los ${out.length} subconjuntos: ${out.map((s) => fmt(s)).join(' ')}. O(n · 2^n).`, view({ i: nums.length }));
    return out;
  },
  normalize: (r) => (r as number[][]).map((s) => [...s].sort((a, b) => a - b)).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  extraInputs: () => [[[]], [[4, 5]]],
};

export default def;
