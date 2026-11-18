import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';

const code = `const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

export function numIslands(grid: string[][]): number {
  const rows = grid.length;
  const cols = rows === 0 ? 0 : grid[0].length;
  // Our own visited grid: the input is shared, so we never write to it.
  const seen: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
  let islands = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '1' || seen[r][c]) continue;
      islands++;
      // BFS with an explicit queue: no recursion, so a huge island can't overflow the stack.
      seen[r][c] = true;
      const queue: [number, number][] = [[r, c]];
      for (let head = 0; head < queue.length; head++) {
        const [cr, cc] = queue[head];
        for (const [dr, dc] of DIRECTIONS) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (grid[nr][nc] !== '1' || seen[nr][nc]) continue;
          seen[nr][nc] = true; // mark on enqueue, so no cell enters the queue twice
          queue.push([nr, nc]);
        }
      }
    }
  }
  return islands;
}`;

const def: TraceDef<[string[][]], number> = {
  id: 'number-of-islands',
  title: 'Number of Islands',
  pattern: 'BFS / DFS on a grid',
  code,
  examples: [
    {
      label: '2 islas chicas y una diagonal',
      args: [[['1', '1', '0', '0', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '1', '0', '0'], ['0', '0', '0', '1', '1']]],
    },
    {
      label: 'una isla grande',
      args: [[['1', '1', '1', '1', '0'], ['1', '1', '0', '1', '0'], ['1', '1', '0', '0', '0'], ['0', '0', '0', '0', '0']]],
    },
    { label: '1 0 1 / 0 1 0', args: [[['1', '0', '1'], ['0', '1', '0']]] },
  ],
  run(t, grid) {
    const DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const rows = grid.length;
    const cols = rows === 0 ? 0 : grid[0].length;
    const seen: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
    let islands = 0;
    let queue: [number, number][] = [];
    let head = 0;
    const view = (o: { at?: [number, number]; look?: [number, number]; lookTone?: Tone; flash?: [number, number]; showQueue?: boolean }): Viz[] => {
      const marks: { r: number; c: number; tone: Tone }[] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (seen[r][c]) marks.push({ r, c, tone: 'visited' });
      const put = (p: [number, number] | undefined, tone: Tone) => {
        if (!p) return;
        const i = marks.findIndex((m) => m.r === p[0] && m.c === p[1]);
        if (i >= 0) marks.splice(i, 1);
        marks.push({ r: p[0], c: p[1], tone });
      };
      put(o.at, 'focus');
      put(o.flash, 'add');
      if (o.look) put(o.look, o.lookTone ?? 'focus');
      return [
        {
          kind: 'grid',
          label: 'grid · sombreada = ya visitada (seen)',
          cells: grid.map((row) => [...row]),
          marks,
          rowLabels: grid.map((_, r) => r),
          colLabels: (grid[0] ?? []).map((_, c) => c),
        },
        { kind: 'vars', vars: [{ name: 'islands', value: islands }] },
        ...(o.showQueue ? [{ kind: 'queue' as const, label: 'queue', items: queue.map(([r, c]) => `(${r},${c})`), head }] : []),
      ];
    };

    t.step('const seen', 'Una grilla propia de visitados, toda en false: no tocamos la entrada.', view({}));
    t.step('let islands = 0', 'Todavía no contamos ninguna isla.', view({}));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cond = "if (grid[r][c] !== '1' || seen[r][c]) continue";
        if (grid[r][c] !== '1' || seen[r][c]) {
          t.step(cond, `(${r}, ${c}) ${grid[r][c] !== '1' ? 'es agua' : 'es tierra, pero ya es parte de una isla contada'}: seguimos.`, view({ at: [r, c] }));
          continue;
        }
        t.step(cond, `(${r}, ${c}) es tierra y nadie la visitó.`, view({ at: [r, c] }));
        islands++;
        t.step('islands++', `Es una isla nueva: islands = ${islands}. Ahora la recorremos entera para no contarla dos veces.`, view({ at: [r, c] }));
        seen[r][c] = true;
        queue = [[r, c]];
        head = 0;
        t.step('const queue', `La marcamos vista y la ponemos en una cola: el BFS se expande desde acá.`, view({ flash: [r, c], showQueue: true }));
        for (; head < queue.length; head++) {
          const [cr, cc] = queue[head];
          t.step('const [cr, cc] = queue[head]', `Sacamos (${cr}, ${cc}) de la cola y miramos sus 4 vecinos (arriba, abajo, izquierda, derecha; las diagonales no cuentan).`, view({ at: [cr, cc], showQueue: true }));
          for (const [dr, dc] of DIRECTIONS) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
            if (grid[nr][nc] !== '1' || seen[nr][nc]) continue;
            seen[nr][nc] = true;
            queue.push([nr, nc]);
            t.step('queue.push([nr, nc])', `(${nr}, ${nc}) es tierra sin visitar: la marcamos y entra a la cola. Marcar al encolar evita que entre dos veces.`, view({ at: [cr, cc], flash: [nr, nc], showQueue: true }));
          }
        }
        t.step('for (let head = 0', `La cola se vació: la isla ${islands} está entera marcada.`, view({ showQueue: true }));
      }
    }
    t.step('return islands', `Recorrimos todas las celdas una vez: O(filas × columnas). Hay ${islands} isla${islands === 1 ? '' : 's'}.`, view({}));
    return islands;
  },
  extraInputs: () => [[[]], [[['0']]], [[['1']]], [[['1', '1'], ['1', '1']]]],
};

export default def;
