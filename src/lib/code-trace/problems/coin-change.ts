import type { TraceDef } from '../trace';
import type { Mark, Viz } from '../types';
import { fmt } from '../format';

const code = `export function coinChange(coins: number[], amount: number): number {
  // fewest[a] = fewest coins that add up to exactly a (Infinity = not reachable)
  const fewest = new Array<number>(amount + 1).fill(Infinity);
  fewest[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && fewest[a - coin] + 1 < fewest[a]) {
        fewest[a] = fewest[a - coin] + 1; // the last coin is \`coin\`
      }
    }
  }
  return fewest[amount] === Infinity ? -1 : fewest[amount];
}`;

const def: TraceDef<[number[], number], number> = {
  id: 'coin-change',
  title: 'Coin Change',
  pattern: 'Dynamic programming (1D)',
  code,
  examples: [
    { label: 'coins = [1, 2, 5], amount = 11', args: [[1, 2, 5], 11] },
    { label: 'coins = [2], amount = 3', args: [[2], 3] },
    { label: 'coins = [1], amount = 0', args: [[1], 0] },
    { label: 'coins = [1, 3, 4], amount = 6', args: [[1, 3, 4], 6] },
  ],
  run(t, coins, amount) {
    const fewest = new Array<number>(amount + 1).fill(Infinity);
    const view = (o: { a?: number; from?: number; tone?: 'add' | 'focus' }): Viz[] => {
      const marks: Mark[] = [];
      if (o.from !== undefined) marks.push({ index: o.from, tone: 'visited' });
      if (o.a !== undefined) marks.push({ index: o.a, tone: o.tone ?? 'focus' });
      return [
        { kind: 'array', label: 'fewest · fewest[a] = menos monedas para sumar a', items: fewest, pointers: o.a !== undefined ? [{ name: 'a', index: o.a }] : [], marks },
        { kind: 'vars', vars: [{ name: 'coins', value: fmt(coins) }, { name: 'amount', value: amount }] },
      ];
    };

    t.step('const fewest', `Una tabla de 0 a ${amount}. fewest[a] = la menor cantidad de monedas que suman exactamente a. Arranca todo en ∞ (todavía no se puede).`, view({}));
    fewest[0] = 0;
    t.step('fewest[0] = 0', 'El caso base: 0 se arma con 0 monedas.', view({ a: 0, tone: 'add' }));
    for (let a = 1; a <= amount; a++) {
      t.step('for (let a = 1', `a = ${a}: ¿cuál es la mejor forma de armar ${a}? Probamos que la última moneda sea cada una.`, view({ a }));
      for (const coin of coins) {
        if (coin > a) continue;
        const cand = fewest[a - coin] + 1;
        if (cand < fewest[a]) {
          const before = fewest[a];
          fewest[a] = cand;
          t.step('fewest[a] = fewest[a - coin] + 1', `Última moneda ${coin}: fewest[${a - coin}] + 1 = ${fmt(cand)}, mejor que ${fmt(before)}. fewest[${a}] = ${fmt(cand)}.`, view({ a, from: a - coin, tone: 'add' }));
        } else {
          t.step('if (coin <= a && fewest[a - coin] + 1 < fewest[a])', `Última moneda ${coin}: fewest[${a - coin}] + 1 = ${fmt(cand)}, no mejora ${fmt(fewest[a])}.`, view({ a, from: a - coin }));
        }
      }
    }
    const result = fewest[amount] === Infinity ? -1 : fewest[amount];
    t.step('return fewest[amount] === Infinity', result === -1
      ? `fewest[${amount}] sigue en ∞: no hay forma de armarlo. Devolvemos −1.`
      : `fewest[${amount}] = ${result}. Cada casilla reusa las anteriores: O(amount × monedas).`, view({ a: amount, tone: result === -1 ? 'focus' : 'add' }));
    return result;
  },
  extraInputs: () => [[[2, 5, 10, 1], 27], [[186, 419, 83, 408], 50], [[3], 9]],
};

export default def;
