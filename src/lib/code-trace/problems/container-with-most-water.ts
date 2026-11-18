import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let best = 0;
  while (left < right) {
    const area = (right - left) * Math.min(height[left], height[right]);
    if (area > best) best = area;
    if (height[left] < height[right]) left++; // the shorter wall is done
    else right--;
  }
  return best;
}`;

const def: TraceDef<[number[]], number> = {
  id: 'container-with-most-water',
  title: 'Container With Most Water',
  pattern: 'Two pointers',
  code,
  examples: [
    { label: 'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]', args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]] },
    { label: 'height = [1, 1]', args: [[1, 1]] },
  ],
  run(t, height) {
    let left = 0;
    let right = height.length - 1;
    let best = 0;
    const view = (o: { area?: number; changed?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'height · las paredes',
        items: height,
        pointers: [{ name: 'left', index: left }, { name: 'right', index: right }],
        window: left < right ? { from: left, to: right } : undefined,
        marks: [
          ...height.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < left || m.index > right),
          ...(left < right ? [{ index: height[left] < height[right] ? left : right, tone: 'focus' as const }] : []),
        ],
      },
      { kind: 'vars', vars: [...(o.area !== undefined ? [{ name: 'area', value: o.area }] : []), { name: 'best', value: best, changed: o.changed }] },
    ];
    t.step('let best = 0', 'Empezamos con las paredes más separadas: el ancho máximo. Cada paso sacrifica ancho, así que solo vale la pena si la pared baja puede mejorar.', view({}));
    while (left < right) {
      const area = (right - left) * Math.min(height[left], height[right]);
      t.step('const area', `Ancho ${right - left} × la pared más baja ${Math.min(height[left], height[right])} = ${area}.`, view({ area }));
      if (area > best) {
        best = area;
        t.step('if (area > best) best = area', `Mejor que todo lo anterior: best = ${best}.`, view({ area, changed: true }));
      }
      if (height[left] < height[right]) {
        left++;
        t.step('if (height[left] < height[right]) left++', `La izquierda (${fmt(height[left - 1])}) es la más baja: con ella ningún contenedor más angosto puede ser mejor. La descartamos: left = ${left}.`, view({}));
      } else {
        right--;
        t.step('else right--', `La derecha (${fmt(height[right + 1])}) es la más baja (o empatan): la descartamos. right = ${right}.`, view({}));
      }
    }
    t.step('return best', `Se juntaron: best = ${best}. Una pasada, O(n), en vez de probar todos los pares.`, view({}));
    return best;
  },
  extraInputs: () => [[[4, 3, 2, 1, 4]], [[1, 2, 1]], [[2]]],
};

export default def;
