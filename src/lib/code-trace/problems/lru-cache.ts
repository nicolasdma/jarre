import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export class LRUCache {
  private readonly capacity: number;
  // A Map iterates in insertion order: the first key is the least recently used.
  private readonly cache = new Map<number, number>();

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be a positive integer');
    this.capacity = capacity;
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1; // has, not truthiness: 0 is a valid value
    const value = this.cache.get(key) as number;
    this.cache.delete(key); // delete + set moves the key to the end: most recently used
    this.cache.set(key, value);
    return value;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key); // an update never evicts
    } else if (this.cache.size === this.capacity) {
      const oldest = this.cache.keys().next().value as number;
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }
}`;

type Op = ['put', number, number] | ['get', number];
const label = (op: Op) => (op[0] === 'put' ? `put(${op[1]}, ${op[2]})` : `get(${op[1]})`);

const def: TraceDef<[number, Op[]], number[]> = {
  id: 'lru-cache',
  title: 'LRU Cache',
  pattern: 'Design: hash map that keeps order',
  code,
  examples: [
    {
      label: 'LRUCache(2); put(1, 1); put(2, 2); get(1); put(3, 3); get(2); put(4, 4); get(1); get(3); get(4)',
      args: [2, [['put', 1, 1], ['put', 2, 2], ['get', 1], ['put', 3, 3], ['get', 2], ['put', 4, 4], ['get', 1], ['get', 3], ['get', 4]]],
    },
    { label: 'LRUCache(2); put(1, 1); put(1, 10); put(2, 2); put(3, 3); get(1)', args: [2, [['put', 1, 1], ['put', 1, 10], ['put', 2, 2], ['put', 3, 3], ['get', 1]]] },
  ],
  run(t, capacity, ops) {
    const cache = new Map<number, number>();
    const results: number[] = [];
    const view = (o: { op?: number; flash?: number; hit?: number; dropped?: [number, number]; probe?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'llamadas',
        items: ops.map(label),
        indices: false,
        marks: o.op === undefined ? [] : ops.map((_, k) => ({ index: k, tone: k < o.op! ? ('visited' as const) : k === o.op ? ('focus' as const) : ('muted' as const) })),
      },
      {
        kind: 'map',
        label: `cache (capacidad ${capacity}) · arriba el más viejo, abajo el más nuevo`,
        keyLabel: 'key',
        valueLabel: 'value',
        entries: [...(o.dropped ? [{ key: o.dropped[0], value: o.dropped[1] }] : []), ...[...cache].map(([key, value]) => ({ key, value }))],
        flash: o.flash,
        hit: o.hit,
        dropped: o.dropped?.[0],
        probe: o.probe !== undefined ? { key: o.probe, found: cache.has(o.probe) } : undefined,
      },
      { kind: 'text', label: 'resultados de get', value: fmt(results) },
    ];

    t.step('this.capacity = capacity', `Capacidad ${capacity}. El truco: un Map recorre sus claves en orden de inserción, así que la primera es la menos usada.`, view({}));
    ops.forEach((op, k) => {
      if (op[0] === 'get') {
        const key = op[1];
        if (!cache.has(key)) {
          results.push(-1);
          t.step('if (!this.cache.has(key)) return -1', `${label(op)}: ${key} no está (o ya lo echamos). Devolvemos −1. Con has, no con el valor: 0 es un valor válido.`, view({ op: k, probe: key }));
          return;
        }
        const value = cache.get(key)!;
        t.step('const value = this.cache.get(key)', `${label(op)}: está, vale ${fmt(value)}.`, view({ op: k, hit: key }));
        cache.delete(key);
        cache.set(key, value);
        t.step('this.cache.set(key, value)#1', `Lo borramos y lo volvemos a poner: pasa al final, es el más reciente. Las dos cosas son O(1).`, view({ op: k, flash: key }));
        results.push(value);
        t.step('return value', `Devolvemos ${fmt(value)}.`, view({ op: k, hit: key }));
        return;
      }
      const [, key, value] = op;
      if (cache.has(key)) {
        cache.delete(key);
        t.step('this.cache.delete(key)#2', `${label(op)}: ${key} ya está. Lo sacamos para volver a ponerlo al final; actualizar nunca echa a nadie.`, view({ op: k }));
      } else if (cache.size === capacity) {
        t.step('else if (this.cache.size === this.capacity)', `${label(op)}: ${key} es nuevo y el cache está lleno (${capacity}). Alguien tiene que salir.`, view({ op: k }));
        const oldest = cache.keys().next().value as number;
        const oldValue = cache.get(oldest)!;
        cache.delete(oldest);
        t.step('this.cache.delete(oldest)', `Sale ${oldest}: es la primera clave del Map, la que hace más tiempo nadie usa.`, view({ op: k, dropped: [oldest, oldValue] }));
      }
      cache.set(key, value);
      t.step('this.cache.set(key, value)#2', `Guardamos ${key} → ${fmt(value)} al final: el más reciente.`, view({ op: k, flash: key }));
    });
    return results;
  },
  callReal: (mod, capacity, ops) => {
    const Cache = mod.LRUCache as new (c: number) => { get(k: number): number; put(k: number, v: number): void };
    const c = new Cache(capacity);
    const out: number[] = [];
    for (const op of ops) {
      if (op[0] === 'get') out.push(c.get(op[1]));
      else c.put(op[1], op[2]);
    }
    return out;
  },
  extraInputs: () => [
    [1, [['put', 2, 1], ['get', 2], ['put', 3, 2], ['get', 2], ['get', 3]]],
    [2, [['put', 1, 0], ['get', 1], ['put', 2, 2], ['get', 1], ['put', 3, 3], ['get', 2]]],
  ],
};

export default def;
