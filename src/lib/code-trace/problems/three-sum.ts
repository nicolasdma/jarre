import type { TraceDef } from '../trace';
import type { Mark, Viz } from '../types';
import { fmt } from '../format';

const code = `export function threeSum(nums: number[]): number[][] {
  const sorted = [...nums].sort((a, b) => a - b); // a copy, sorted as numbers
  const triplets: number[][] = [];

  for (let i = 0; i < sorted.length - 2; i++) {
    if (sorted[i] > 0) break; // the smallest is positive: nothing left can add up to zero
    if (i > 0 && sorted[i] === sorted[i - 1]) continue; // this first value already gave its triplets

    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum < 0) {
        left++;
      } else if (sum > 0) {
        right--;
      } else {
        triplets.push([sorted[i], sorted[left], sorted[right]]);
        left++;
        right--;
        while (left < right && sorted[left] === sorted[left - 1]) left++; // skip repeated second values
      }
    }
  }

  return triplets;
}`;

const def: TraceDef<[number[]], number[][]> = {
  id: 'three-sum',
  title: '3Sum',
  pattern: 'Sort + two pointers',
  code,
  examples: [
    { label: 'nums = [-1, 0, 1, 2, -1, -4]', args: [[-1, 0, 1, 2, -1, -4]] },
    { label: 'nums = [0, 1, 1]', args: [[0, 1, 1]] },
    { label: 'nums = [0, 0, 0]', args: [[0, 0, 0]] },
  ],
  run(t, nums) {
    const sorted = [...nums].sort((a, b) => a - b);
    const triplets: number[][] = [];
    let left = -1;
    let right = -1;
    const view = (o: { i?: number; found?: boolean; sum?: number }): Viz[] => {
      const marks: Mark[] = [];
      if (o.i !== undefined) {
        for (let k = 0; k < o.i; k++) marks.push({ index: k, tone: 'muted' });
        if (o.found) for (const k of [o.i, left, right]) marks.push({ index: k, tone: 'found' });
      }
      return [
        {
          kind: 'array',
          label: 'sorted',
          items: sorted,
          pointers: o.i === undefined ? [] : [{ name: 'i', index: o.i }, ...(left > o.i ? [{ name: 'left', index: left }, { name: 'right', index: right }] : [])],
          window: o.i !== undefined && left > o.i && left <= right ? { from: left, to: right } : undefined,
          marks,
        },
        ...(o.sum !== undefined ? [{ kind: 'vars' as const, vars: [{ name: 'sum', value: o.sum, changed: true }] }] : []),
        { kind: 'text', label: 'triplets', value: triplets.length ? fmt(triplets) : '[]', tone: o.found ? 'add' : undefined },
      ];
    };

    t.step('const sorted', `Ordenamos una copia: ${fmt(sorted)}. Ordenado, dos punteros pueden achicar la suma desde los dos lados, y los repetidos quedan juntos.`, view({}));
    for (let i = 0; i < sorted.length - 2; i++) {
      left = -1;
      t.step('for (let i = 0; i < sorted.length - 2', `Fijamos el primero: sorted[${i}] = ${fmt(sorted[i])}. Buscamos dos más que sumen ${fmt(-sorted[i])}.`, view({ i }));
      if (sorted[i] > 0) {
        t.step('if (sorted[i] > 0) break', `${fmt(sorted[i])} > 0: el más chico ya es positivo, nada de acá en adelante suma 0. Cortamos.`, view({ i }));
        break;
      }
      if (i > 0 && sorted[i] === sorted[i - 1]) {
        t.step('if (i > 0 && sorted[i] === sorted[i - 1]) continue', `Es igual al anterior (${fmt(sorted[i])}): ya dio todos sus tríos. Lo salteamos para no repetir.`, view({ i }));
        continue;
      }
      left = i + 1;
      right = sorted.length - 1;
      t.step('let right = sorted.length - 1', `left arranca justo después de i, right al final.`, view({ i }));
      while (left < right) {
        const sum = sorted[i] + sorted[left] + sorted[right];
        if (sum < 0) {
          t.step('const sum =', `${fmt(sorted[i])} + ${fmt(sorted[left])} + ${fmt(sorted[right])} = ${fmt(sum)}: nos falta. Movemos left a la derecha para agrandar la suma.`, view({ i, sum }));
          left++;
          t.step('left++;#1', `left = ${left}.`, view({ i, sum }));
        } else if (sum > 0) {
          t.step('const sum =', `${fmt(sorted[i])} + ${fmt(sorted[left])} + ${fmt(sorted[right])} = ${fmt(sum)}: nos pasamos. Movemos right a la izquierda para achicarla.`, view({ i, sum }));
          right--;
          t.step('right--;#1', `right = ${right}.`, view({ i, sum }));
        } else {
          t.step('const sum =', `${fmt(sorted[i])} + ${fmt(sorted[left])} + ${fmt(sorted[right])} = 0.`, view({ i, sum }));
          triplets.push([sorted[i], sorted[left], sorted[right]]);
          t.step('triplets.push', `¡Trío! Guardamos ${fmt([sorted[i], sorted[left], sorted[right]])}.`, view({ i, sum, found: true }));
          left++;
          right--;
          t.step('right--;#2', 'Movemos los dos punteros hacia adentro para buscar otro par.', view({ i }));
          let skipped = 0;
          while (left < right && sorted[left] === sorted[left - 1]) {
            left++;
            skipped++;
          }
          if (skipped) t.step('while (left < right && sorted[left] === sorted[left - 1]) left++', `Salteamos ${skipped} valor${skipped === 1 ? '' : 'es'} repetido${skipped === 1 ? '' : 's'} en left: darían el mismo trío.`, view({ i }));
        }
      }
    }
    t.step('return triplets', `Resultado: ${fmt(triplets)}. Sort O(n log n) + un barrido de dos punteros por cada i: O(n²).`, view({}));
    return triplets;
  },
  extraInputs: () => [[[]], [[-2, 0, 1, 1, 2]], [[-1, -1, -1, 2, 2]], [[1, 2, 3]], [[-4, -1, -1, 0, 1, 2]]],
};

export default def;
