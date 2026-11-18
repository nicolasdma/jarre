import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `export function groupAnagrams(strs: string[]): string[][] {
  const groupByKey = new Map<string, string[]>();
  for (const word of strs) {
    const key = [...word].sort().join('');
    const group = groupByKey.get(key);
    if (group) group.push(word);
    else groupByKey.set(key, [word]);
  }
  return [...groupByKey.values()];
}`;

const def: TraceDef<[string[]], string[][]> = {
  id: 'group-anagrams',
  title: 'Group Anagrams',
  pattern: 'Hash map with a canonical key',
  code,
  examples: [
    { label: '["eat", "tea", "tan", "ate", "nat", "bat"]', args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']] },
    { label: '[""]', args: [['']] },
    { label: '["a"]', args: [['a']] },
  ],
  run(t, strs) {
    const groups = new Map<string, string[]>();
    const view = (o: { i?: number; key?: string; flash?: string; hit?: string; probe?: boolean }): Viz[] => [
      {
        kind: 'array',
        label: 'strs',
        items: strs,
        pointers: o.i !== undefined ? [{ name: 'word', index: o.i }] : [],
        marks: strs.map((_, k) => ({ index: k, tone: 'visited' as const })).filter((m) => o.i !== undefined && m.index < o.i),
      },
      ...(o.key !== undefined ? [{ kind: 'vars' as const, vars: [{ name: 'key', value: q(o.key), changed: !o.probe }] }] : []),
      {
        kind: 'map',
        label: 'groupByKey',
        keyLabel: 'letras ordenadas',
        valueLabel: 'grupo',
        entries: [...groups].map(([key, value]) => ({ key: q(key), value: [...value] })),
        flash: o.flash !== undefined ? q(o.flash) : undefined,
        hit: o.hit !== undefined ? q(o.hit) : undefined,
        probe: o.probe && o.key !== undefined ? { key: q(o.key), found: groups.has(o.key) } : undefined,
      },
    ];

    t.step('const groupByKey', 'Un Map de "firma" → palabras. Dos anagramas tienen las mismas letras, así que ordenadas dan la misma firma.', view({}));
    for (let i = 0; i < strs.length; i++) {
      const word = strs[i];
      t.step('for (const word of strs)', `Tomamos ${q(word)}.`, view({ i }));
      const key = [...word].sort().join('');
      t.step('const key =', `Ordenamos sus letras: ${q(word)} → ${q(key)}. Esa es su firma.`, view({ i, key }));
      const group = groups.get(key);
      if (group) {
        group.push(word);
        t.step('if (group) group.push(word)', `Ya hay un grupo con firma ${q(key)}: sumamos ${q(word)} ahí.`, view({ i, key, hit: key }));
      } else {
        t.step('const group =', `¿Hay grupo con firma ${q(key)}? Todavía no.`, view({ i, key, probe: true }));
        groups.set(key, [word]);
        t.step('else groupByKey.set', `Abrimos un grupo nuevo: ${q(key)} → [${q(word)}].`, view({ i, key, flash: key }));
      }
    }
    const out = [...groups.values()];
    t.step('return [...groupByKey.values()]', `Devolvemos los grupos: ${out.map((g) => `[${g.map(q).join(', ')}]`).join(', ')}. Ordenar cada palabra cuesta k log k: total O(n · k log k).`, view({}));
    return out;
  },
  normalize: (r) => (r as string[][]).map((g) => [...g].sort()).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  extraInputs: () => [[[]], [['abc', 'bca', 'cab', 'xyz']], [['ab', 'ba', 'abc']]],
};

export default def;
