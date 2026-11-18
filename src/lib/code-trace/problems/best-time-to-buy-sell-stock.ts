import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt, minus } from '../format';

const code = `export function maxProfit(prices: number[]): number {
  let minPrice = Infinity;
  let best = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p; // best day to have bought so far
    else if (p - minPrice > best) best = p - minPrice;
  }
  return best;
}`;

const def: TraceDef<[number[]], number> = {
  id: 'best-time-to-buy-sell-stock',
  title: 'Best Time to Buy and Sell Stock',
  pattern: 'Running minimum',
  code,
  examples: [
    { label: 'prices = [7, 1, 5, 3, 6, 4]', args: [[7, 1, 5, 3, 6, 4]] },
    { label: 'prices = [7, 6, 4, 3, 1]', args: [[7, 6, 4, 3, 1]] },
  ],
  run(t, prices) {
    let minPrice = Infinity;
    let minAt = -1;
    let best = 0;
    const view = (o: { i?: number; changed?: string }): Viz[] => [
      {
        kind: 'array',
        label: 'prices',
        items: prices,
        pointers: [...(minAt >= 0 ? [{ name: 'min', index: minAt }] : []), ...(o.i !== undefined ? [{ name: 'hoy', index: o.i }] : [])],
      },
      { kind: 'vars', vars: [{ name: 'minPrice', value: minPrice, changed: o.changed === 'min' }, { name: 'best', value: best, changed: o.changed === 'best' }] },
    ];
    t.step('let best = 0', 'Recorremos los días una vez. minPrice = el precio más barato visto hasta hoy (el mejor día para haber comprado). best = la mejor ganancia.', view({}));
    for (let i = 0; i < prices.length; i++) {
      const p = prices[i];
      if (p < minPrice) {
        const before = minPrice;
        minPrice = p;
        minAt = i;
        t.step('if (p < minPrice) minPrice = p', `Día ${i}: ${fmt(p)} < ${fmt(before)}. Es el más barato hasta ahora: si compramos, que sea acá.`, view({ i, changed: 'min' }));
      } else if (p - minPrice > best) {
        best = p - minPrice;
        t.step('else if (p - minPrice > best) best = p - minPrice', `Día ${i}: vender hoy deja ${minus(p, minPrice)} = ${fmt(best)}. Es la mejor ganancia: best = ${fmt(best)}.`, view({ i, changed: 'best' }));
      } else {
        t.step('else if (p - minPrice > best) best = p - minPrice', `Día ${i}: vender hoy deja ${minus(p, minPrice)} = ${fmt(p - minPrice)}, no supera ${fmt(best)}.`, view({ i }));
      }
    }
    t.step('return best', `best = ${fmt(best)}. Nunca miramos pares: con el mínimo corrido alcanza, O(n).`, view({}));
    return best;
  },
  extraInputs: () => [[[]], [[1]], [[2, 4, 1]], [[3, 3, 5, 0, 0, 3, 1, 4]]],
};

export default def;
