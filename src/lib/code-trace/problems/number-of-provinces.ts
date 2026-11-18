import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';

const code = `export function findCircleNum(isConnected: number[][]): number {
  const n = isConnected.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array<number>(n).fill(1);
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root];
    while (parent[x] !== root) { // path compression: point the whole path at the root
      const next = parent[x];
      parent[x] = root;
      x = next;
    }
    return root;
  };
  let provinces = n;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (isConnected[i][j] !== 1) continue;
      let a = find(i), b = find(j);
      if (a === b) continue;
      if (size[a] < size[b]) [a, b] = [b, a]; // union by size: small tree under big tree
      parent[b] = a;
      size[a] += size[b];
      provinces--;
    }
  }
  return provinces;
}`;

const def: TraceDef<[number[][]], number> = {
  id: 'number-of-provinces',
  title: 'Number of Provinces',
  pattern: 'Union-find',
  code,
  examples: [
    { label: 'isConnected = [[1,1,0],[1,1,0],[0,0,1]]', args: [[[1, 1, 0], [1, 1, 0], [0, 0, 1]]] },
    { label: '5 ciudades: 0-1, 1-2, 3-4', args: [[[1, 1, 0, 0, 0], [1, 1, 1, 0, 0], [0, 1, 1, 0, 0], [0, 0, 0, 1, 1], [0, 0, 0, 1, 1]]] },
    { label: 'isConnected = [[1,0,0],[0,1,0],[0,0,1]]', args: [[[1, 0, 0], [0, 1, 0], [0, 0, 1]]] },
  ],
  run(t, isConnected) {
    const n = isConnected.length;
    const parent = Array.from({ length: n }, (_, i) => i);
    const size = new Array<number>(n).fill(1);
    const find = (x: number): number => {
      let root = x;
      while (parent[root] !== root) root = parent[root];
      while (parent[x] !== root) {
        const next = parent[x];
        parent[x] = root;
        x = next;
      }
      return root;
    };
    let provinces = n;
    const edges: { from: string; to: string }[] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (isConnected[i][j] === 1) edges.push({ from: String(i), to: String(j) });
    const view = (o: { pair?: [number, number]; joined?: number }): Viz[] => {
      const marks: { id: string; tone: Tone }[] = [];
      if (o.pair) for (const k of o.pair) marks.push({ id: String(k), tone: 'focus' });
      return [
        {
          kind: 'graph',
          label: 'ciudades y rutas',
          nodes: Array.from({ length: n }, (_, i) => ({ id: String(i), label: String(i) })),
          edges: edges.map((e) => ({ ...e, tone: o.pair && e.from === String(o.pair[0]) && e.to === String(o.pair[1]) ? ('focus' as const) : undefined })),
          marks,
        },
        {
          kind: 'array',
          label: 'parent · cada ciudad apunta a su jefe; la raíz se apunta a sí misma',
          items: [...parent],
          marks: [
            ...parent.map((p, i) => ({ index: i, tone: 'visited' as const })).filter((m) => parent[m.index] === m.index),
            ...(o.joined !== undefined ? [{ index: o.joined, tone: 'add' as const }] : []),
          ],
        },
        { kind: 'vars', vars: [{ name: 'provinces', value: provinces }] },
      ];
    };
    t.step('let provinces = n', `Al principio cada ciudad es su propia provincia: ${n}. Cada unión entre dos provincias distintas resta una.`, view({}));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (isConnected[i][j] !== 1) continue;
        let a = find(i);
        let b = find(j);
        t.step('let a = find(i), b = find(j)', `Ruta ${i}–${j}. find sube por los parent hasta la raíz: la de ${i} es ${a}, la de ${j} es ${b}.`, view({ pair: [i, j] }));
        if (a === b) {
          t.step('if (a === b) continue', 'Misma raíz: ya están en la misma provincia. Nada que unir.', view({ pair: [i, j] }));
          continue;
        }
        if (size[a] < size[b]) [a, b] = [b, a];
        parent[b] = a;
        size[a] += size[b];
        t.step('parent[b] = a', `Raíces distintas: colgamos ${b} debajo de ${a} (el árbol chico debajo del grande, así find sigue corto).`, view({ pair: [i, j], joined: b }));
        provinces--;
        t.step('provinces--', `Dos provincias se volvieron una: provinces = ${provinces}.`, view({ pair: [i, j] }));
      }
    }
    t.step('return provinces', `Quedan ${provinces} provincia${provinces === 1 ? '' : 's'}: tantas como raíces en parent. Casi O(n²) por leer la matriz.`, view({}));
    return provinces;
  },
  extraInputs: () => [[[[1]]], [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]], [[[1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1]]]],
};

export default def;
