import type { TraceDef } from '../trace';
import type { Viz } from '../types';

const code = `export function minEatingSpeed(piles: number[], h: number): number {
  let lo = 1;
  let hi = 0;
  for (const p of piles) hi = Math.max(hi, p); // max(piles) always works
  while (lo < hi) {
    const k = lo + Math.floor((hi - lo) / 2);
    let hours = 0;
    for (const p of piles) hours += Math.ceil(p / k);
    if (hours <= h) hi = k; // k works, try slower
    else lo = k + 1;        // too slow
  }
  return lo;
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'koko-eating-bananas',
  title: 'Koko Eating Bananas',
  pattern: 'Binary search on the answer',
  code,
  examples: [
    { label: 'piles = [3, 6, 7, 11], h = 8', args: [[3, 6, 7, 11], 8] },
    { label: 'piles = [30, 11, 23, 4, 20], h = 5', args: [[30, 11, 23, 4, 20], 5] },
  ],
  run(t, piles, h) {
    let lo = 1;
    let hi = 0;
    for (const p of piles) hi = Math.max(hi, p);
    // The candidate speeds 1..max, drawn as a row while it fits on screen.
    const speeds = Array.from({ length: Math.min(hi, 40) }, (_, i) => i + 1);
    const view = (o: { k?: number; hours?: number[]; ok?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'velocidades posibles (bananas por hora)',
        items: speeds,
        indices: false,
        pointers: [{ name: 'lo', index: lo - 1 }, { name: 'hi', index: hi - 1 }, ...(o.k !== undefined ? [{ name: 'k', index: o.k - 1 }] : [])],
        window: { from: lo - 1, to: hi - 1 },
        marks: [
          ...speeds.map((_, i) => ({ index: i, tone: 'muted' as const })).filter((m) => m.index < lo - 1 || m.index > hi - 1),
          ...(o.k !== undefined && o.ok !== undefined ? [{ index: o.k - 1, tone: o.ok ? ('found' as const) : ('drop' as const) }] : []),
        ],
      },
      { kind: 'array', label: o.hours ? `piles · horas por pila a velocidad ${o.k}` : 'piles', items: o.hours ? piles.map((p, i) => `${p}→${o.hours![i]}h`) : piles },
      { kind: 'vars', vars: [{ name: 'h', value: h }, ...(o.hours ? [{ name: 'hours', value: o.hours.reduce((a, b) => a + b, 0), changed: true }] : [])] },
    ];
    t.step('for (const p of piles) hi = Math.max(hi, p)', `No buscamos en el array: buscamos la respuesta. La velocidad va de 1 a ${hi} (la pila más grande: con eso cada pila tarda 1 hora). Y si una velocidad alcanza, cualquier más rápida también: eso permite búsqueda binaria.`, view({}));
    while (lo < hi) {
      const k = lo + Math.floor((hi - lo) / 2);
      t.step('const k = lo', `Probamos la velocidad del medio: k = ${k}.`, view({ k }));
      const hours = piles.map((p) => Math.ceil(p / k));
      const total = hours.reduce((a, b) => a + b, 0);
      t.step('for (const p of piles) hours += Math.ceil(p / k)', `A ${k} por hora: ${hours.join(' + ')} = ${total} horas (cada pila redondea para arriba).`, view({ k, hours }));
      if (total <= h) {
        hi = k;
        t.step('if (hours <= h) hi = k', `${total} ≤ ${h}: alcanza. k sirve, probamos más lento: hi = ${k} (k sigue siendo candidato).`, view({ k, hours, ok: true }));
      } else {
        lo = k + 1;
        t.step('else lo = k + 1', `${total} > ${h}: no llega. Hay que ir más rápido: lo = ${lo}.`, view({ k, hours, ok: false }));
      }
    }
    t.step('return lo', `lo = hi = ${lo}: la velocidad más lenta que alcanza. O(n · log(max)).`, view({}));
    return lo;
  },
  extraInputs: () => [[[30, 11, 23, 4, 20], 6], [[1], 1], [[25, 9], 3]],
};

export default def;
