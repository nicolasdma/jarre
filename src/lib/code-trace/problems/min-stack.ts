import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export class MinStack {
  private values: number[] = [];
  private mins: number[] = []; // mins[i] = min of values[0..i]

  push(val: number): void {
    const min = this.mins.length ? Math.min(val, this.mins[this.mins.length - 1]) : val;
    this.values.push(val);
    this.mins.push(min);
  }
  pop(): void {
    this.values.pop();
    this.mins.pop();
  }
  top(): number {
    return this.values[this.values.length - 1];
  }
  getMin(): number {
    return this.mins[this.mins.length - 1];
  }
}`;

type Op = ['push', number] | ['pop'] | ['top'] | ['getMin'];
const label = (op: Op) => (op[0] === 'push' ? `push(${fmt(op[1])})` : `${op[0]}()`);

const def: TraceDef<[Op[]], number[]> = {
  id: 'min-stack',
  title: 'Min Stack',
  pattern: 'Stack',
  code,
  examples: [
    { label: 'push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()', args: [[['push', -2], ['push', 0], ['push', -3], ['getMin'], ['pop'], ['top'], ['getMin']]] },
    { label: 'push(5), push(3), push(7), getMin(), pop(), pop(), getMin()', args: [[['push', 5], ['push', 3], ['push', 7], ['getMin'], ['pop'], ['pop'], ['getMin']]] },
  ],
  run(t, ops) {
    const values: number[] = [];
    const mins: number[] = [];
    const results: number[] = [];
    const view = (o: { k: number; pushed?: boolean; popped?: [number, number] }): Viz[] => [
      {
        kind: 'array',
        label: 'llamadas',
        items: ops.map(label),
        indices: false,
        marks: ops.map((_, i) => ({ index: i, tone: i < o.k ? ('visited' as const) : i === o.k ? ('focus' as const) : ('muted' as const) })),
      },
      { kind: 'stack', label: 'values', items: [...values], pushed: o.pushed, popped: o.popped?.[0] },
      { kind: 'stack', label: 'mins · mins[i] = mínimo de values[0..i]', items: [...mins], pushed: o.pushed, popped: o.popped?.[1] },
      { kind: 'text', label: 'resultados', value: fmt(results) },
    ];
    ops.forEach((op, k) => {
      if (op[0] === 'push') {
        const val = op[1];
        const min = mins.length ? Math.min(val, mins[mins.length - 1]) : val;
        t.step('const min = this.mins.length', mins.length
          ? `${label(op)}: el mínimo con este valor adentro es min(${fmt(val)}, ${fmt(mins[mins.length - 1])}) = ${fmt(min)}.`
          : `${label(op)}: la pila está vacía, así que el mínimo es ${fmt(val)}.`, view({ k }));
        values.push(val);
        mins.push(min);
        t.step('this.mins.push(min)', `Apilamos ${fmt(val)} en values y ${fmt(min)} en mins, a la misma altura. Cada altura recuerda su mínimo.`, view({ k, pushed: true }));
      } else if (op[0] === 'pop') {
        const v = values.pop()!;
        const m = mins.pop()!;
        t.step('this.mins.pop()', `pop(): sacamos ${fmt(v)} y su mínimo ${fmt(m)} juntos. El mínimo de abajo vuelve a ser el que estaba: no hay que recalcular nada.`, view({ k, popped: [v, m] }));
      } else if (op[0] === 'top') {
        results.push(values[values.length - 1]);
        t.step('return this.values[this.values.length - 1]', `top(): el de arriba de values, ${fmt(values[values.length - 1])}.`, view({ k }));
      } else {
        results.push(mins[mins.length - 1]);
        t.step('return this.mins[this.mins.length - 1]', `getMin(): el de arriba de mins, ${fmt(mins[mins.length - 1])}. O(1), sin recorrer nada.`, view({ k }));
      }
    });
    return results;
  },
  callReal: (mod, ops) => {
    const S = mod.MinStack as new () => { push(v: number): void; pop(): void; top(): number; getMin(): number };
    const s = new S();
    const out: number[] = [];
    for (const op of ops) {
      if (op[0] === 'push') s.push(op[1]);
      else if (op[0] === 'pop') s.pop();
      else if (op[0] === 'top') out.push(s.top());
      else out.push(s.getMin());
    }
    return out;
  },
};

export default def;
