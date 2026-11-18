import type { TraceDef } from '../trace';
import type { Viz } from '../types';

const code = `export function uniquePaths(m: number, n: number): number {
  // dp[r][c] = paths into (r, c); first row and first column have exactly one path
  const dp: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(1));
  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      dp[r][c] = dp[r - 1][c] + dp[r][c - 1]; // from above + from the left
    }
  }
  return dp[m - 1][n - 1];
}`;

const def: TraceDef<[number, number], number> = {
  id: 'unique-paths',
  title: 'Unique Paths',
  pattern: '2D DP',
  code,
  examples: [
    { label: 'm = 3, n = 4', args: [3, 4] },
    { label: 'm = 3, n = 7', args: [3, 7] },
    { label: 'm = 3, n = 2', args: [3, 2] },
  ],
  run(t, m, n) {
    const dp: number[][] = Array.from({ length: m }, () => new Array<number>(n).fill(1));
    const done = (r: number, c: number) => r === 0 || c === 0;
    const filled = new Set<string>();
    const view = (o: { r?: number; c?: number; final?: boolean }): Viz[] => [
      {
        kind: 'grid',
        label: 'dp[r][c] = caminos para llegar a (r, c)',
        cells: dp.map((row, r) => row.map((v, c) => (done(r, c) || filled.has(`${r},${c}`) ? v : null))),
        rowLabels: dp.map((_, r) => r),
        colLabels: dp[0].map((_, c) => c),
        marks: o.final
          ? [{ r: m - 1, c: n - 1, tone: 'found' }]
          : o.r !== undefined && o.c !== undefined
            ? [{ r: o.r, c: o.c, tone: 'add' }, { r: o.r - 1, c: o.c, tone: 'focus' }, { r: o.r, c: o.c - 1, tone: 'focus' }]
            : [],
      },
    ];
    t.step('const dp', 'Solo se puede ir a la derecha o abajo. A cualquier casilla de la primera fila o columna se llega de una sola forma: todo en 1.', view({}));
    for (let r = 1; r < m; r++) {
      for (let c = 1; c < n; c++) {
        dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
        filled.add(`${r},${c}`);
        t.step('dp[r][c] = dp[r - 1][c] + dp[r][c - 1]', `A (${r}, ${c}) se llega desde arriba (${dp[r - 1][c]} caminos) o desde la izquierda (${dp[r][c - 1]}): ${dp[r][c]}.`, view({ r, c }));
      }
    }
    t.step('return dp[m - 1][n - 1]', `La esquina de abajo a la derecha: ${dp[m - 1][n - 1]} caminos. O(m × n).`, view({ final: true }));
    return dp[m - 1][n - 1];
  },
  extraInputs: () => [[1, 1], [1, 5], [4, 4]],
};

export default def;
