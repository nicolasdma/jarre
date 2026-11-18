import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';

const code = `export function orangesRotting(grid: number[][]): number {
  const rows = grid.length, cols = grid[0].length;
  const g = grid.map((row) => row.slice()); // do not mutate the input
  let level: number[][] = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] === 2) level.push([r, c]); // every source at once
      else if (g[r][c] === 1) fresh++;
    }
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (level.length && fresh > 0) {
    const next: number[][] = [];
    for (const [r, c] of level) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || g[nr][nc] !== 1) continue;
        g[nr][nc] = 2;
        fresh--;
        next.push([nr, nc]);
      }
    }
    level = next; // one BFS level = one minute
    minutes++;
  }
  return fresh === 0 ? minutes : -1;
}`;

const def: TraceDef<[number[][]], number> = {
  id: 'rotting-oranges',
  title: 'Rotting Oranges',
  pattern: 'Multi-source BFS',
  code,
  examples: [
    { label: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]] },
    { label: 'grid = [[2,1,1],[0,1,1],[1,0,1]]', args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]] },
    { label: 'dos podridas a la vez: [[2,1,1],[1,1,1],[1,1,2]]', args: [[[2, 1, 1], [1, 1, 1], [1, 1, 2]]] },
  ],
  run(t, grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const g = grid.map((row) => row.slice());
    let level: number[][] = [];
    let fresh = 0;
    let minutes = 0;
    const NAME = ['·', 'fresca', 'podrida'];
    const view = (o: { flash?: number[][]; front?: number[][] }): Viz[] => {
      const marks: { r: number; c: number; tone: Tone }[] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (g[r][c] === 2) marks.push({ r, c, tone: 'drop' });
      for (const [r, c] of o.front ?? []) marks.push({ r, c, tone: 'focus' });
      for (const [r, c] of o.flash ?? []) marks.push({ r, c, tone: 'add' });
      return [
        { kind: 'grid', label: 'g · 0 vacío, 1 fresca, 2 podrida', cells: g.map((row) => row.map((v) => (v === 0 ? null : v))), marks },
        { kind: 'vars', vars: [{ name: 'minutes', value: minutes }, { name: 'fresh', value: fresh }] },
      ];
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (g[r][c] === 2) level.push([r, c]);
      else if (g[r][c] === 1) fresh++;
    }
    t.step('const dirs', `Contamos: ${fresh} fresca${fresh === 1 ? '' : 's'}, y ${level.length} ${NAME[2]}${level.length === 1 ? '' : 's'} arrancan todas juntas en el primer nivel del BFS (por eso es multi-origen).`, view({ front: level }));
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (level.length && fresh > 0) {
      t.step('while (level.length && fresh > 0)', `Minuto ${minutes + 1}: cada podrida del frente pudre a sus vecinas frescas.`, view({ front: level }));
      const next: number[][] = [];
      for (const [r, c] of level) {
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= rows || nc >= cols || g[nr][nc] !== 1) continue;
          g[nr][nc] = 2;
          fresh--;
          next.push([nr, nc]);
          t.step('g[nr][nc] = 2', `(${r}, ${c}) pudre a (${nr}, ${nc}). Quedan ${fresh} fresca${fresh === 1 ? '' : 's'}.`, view({ front: level, flash: [[nr, nc]] }));
        }
      }
      level = next;
      minutes++;
      t.step('minutes++', `Terminó el minuto ${minutes}. Las recién podridas son el frente del próximo.`, view({ front: level }));
    }
    const res = fresh === 0 ? minutes : -1;
    t.step('return fresh === 0 ? minutes : -1', res === -1
      ? `El frente se apagó y quedan ${fresh} fresca${fresh === 1 ? '' : 's'} que nadie alcanza: −1.`
      : `No quedan frescas: ${minutes} minuto${minutes === 1 ? '' : 's'}. Cada celda se visita una vez: O(filas × columnas).`, view({}));
    return res;
  },
  extraInputs: () => [[[[0, 2]]], [[[1]]], [[[2, 2], [1, 1]]]],
};

export default def;
