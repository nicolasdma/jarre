import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `export function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length, n = text2.length;
  // dp[i][j] = LCS of text1[0..i) and text2[0..j); row 0 and column 0 are empty prefixes
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = text1[i - 1] === text2[j - 1]
        ? dp[i - 1][j - 1] + 1 // last chars match: extend
        : Math.max(dp[i - 1][j], dp[i][j - 1]); // drop one char from either side
    }
  }
  return dp[m][n];
}`;

const def: TraceDef<[string, string], number> = {
  id: 'longest-common-subsequence',
  title: 'Longest Common Subsequence',
  pattern: '2D DP',
  code,
  examples: [
    { label: 'text1 = "abcde", text2 = "ace"', args: ['abcde', 'ace'] },
    { label: 'text1 = "abc", text2 = "abc"', args: ['abc', 'abc'] },
    { label: 'text1 = "abc", text2 = "def"', args: ['abc', 'def'] },
  ],
  run(t, text1, text2) {
    const m = text1.length;
    const n = text2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
    const filled = new Set<string>();
    const view = (o: { i?: number; j?: number; match?: boolean; final?: boolean }): Viz[] => [
      {
        kind: 'grid',
        label: 'dp[i][j] = LCS de text1[0..i) y text2[0..j)',
        cells: dp.map((row, i) => row.map((v, j) => (i === 0 || j === 0 || filled.has(`${i},${j}`) ? v : null))),
        rowLabels: ['∅', ...text1],
        colLabels: ['∅', ...text2],
        marks: o.final
          ? [{ r: m, c: n, tone: 'found' }]
          : o.i !== undefined && o.j !== undefined
            ? [
                { r: o.i, c: o.j, tone: 'add' },
                ...(o.match ? [{ r: o.i - 1, c: o.j - 1, tone: 'focus' as const }] : [{ r: o.i - 1, c: o.j, tone: 'focus' as const }, { r: o.i, c: o.j - 1, tone: 'focus' as const }]),
              ]
            : [],
      },
    ];
    t.step('const dp', 'Una tabla de prefijos. La fila y la columna ∅ son prefijos vacíos: LCS 0.', view({}));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const match = text1[i - 1] === text2[j - 1];
        dp[i][j] = match ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        filled.add(`${i},${j}`);
        t.step('dp[i][j] = text1[i - 1] === text2[j - 1]', match
          ? `${q(text1[i - 1])} = ${q(text2[j - 1])}: coinciden. Extendemos la diagonal: ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.`
          : `${q(text1[i - 1])} ≠ ${q(text2[j - 1])}: tiramos una letra de algún lado y nos quedamos con lo mejor: max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}.`, view({ i, j, match }));
      }
    }
    t.step('return dp[m][n]', `La esquina: ${dp[m][n]}. O(m × n).`, view({ final: true }));
    return dp[m][n];
  },
  extraInputs: () => [['', 'abc'], ['ab', 'ba'], ['bsbininm', 'jmjkbkjkv']],
};

export default def;
