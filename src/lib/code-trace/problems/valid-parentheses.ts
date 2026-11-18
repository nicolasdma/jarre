import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { q } from '../format';

const code = `const OPENER_FOR = new Map<string, string>([
  [')', '('],
  [']', '['],
  ['}', '{'],
]);

export function isValid(s: string): boolean {
  if (s.length % 2 === 1) return false;
  const stack: string[] = [];
  for (const ch of s) {
    const opener = OPENER_FOR.get(ch);
    if (opener === undefined) {
      stack.push(ch);
    } else if (stack.pop() !== opener) {
      return false;
    }
  }
  return stack.length === 0;
}`;

const def: TraceDef<[string], boolean> = {
  id: 'valid-parentheses',
  title: 'Valid Parentheses',
  pattern: 'Stack',
  code,
  examples: [
    { label: 's = "()[]{}"', args: ['()[]{}'] },
    { label: 's = "{[]}"', args: ['{[]}'] },
    { label: 's = "(]"', args: ['(]'] },
    { label: 's = "([)]"', args: ['([)]'] },
    { label: 's = "(("', args: ['(('] },
  ],
  run(t, s) {
    const OPENER_FOR = new Map([[')', '('], [']', '['], ['}', '{']]);
    const stack: string[] = [];
    const chars = [...s];
    const view = (o: { i?: number; pushed?: boolean; popped?: string; tone?: 'found' | 'drop' }): Viz[] => [
      {
        kind: 'array',
        label: 's',
        items: chars,
        pointers: o.i !== undefined ? [{ name: 'ch', index: o.i }] : [],
        marks: [
          ...chars.map((_, k) => ({ index: k, tone: 'visited' as const })).filter((m) => o.i !== undefined && m.index < o.i),
          ...(o.i !== undefined && o.tone ? [{ index: o.i, tone: o.tone }] : []),
        ],
      },
      { kind: 'stack', label: 'stack', items: [...stack], pushed: o.pushed, popped: o.popped },
    ];

    t.intro('const OPENER_FOR', 'Una tabla fija: para cada cierre, qué apertura le corresponde. ")" cierra a "(".', [
      { kind: 'map', label: 'OPENER_FOR', keyLabel: 'cierre', valueLabel: 'apertura', entries: [...OPENER_FOR].map(([key, value]) => ({ key, value })) },
    ]);
    t.step('s.length % 2', `Largo ${chars.length}: ${chars.length % 2 === 1 ? 'impar, así que alguno queda sin pareja. Devolvemos false sin mirar nada más.' : 'par, puede estar bien. Seguimos.'}`, view({}));
    if (chars.length % 2 === 1) return false;
    t.step('const stack', 'La pila guarda las aperturas que todavía esperan su cierre. La última en entrar es la primera que tiene que cerrarse.', view({}));
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      t.step('for (const ch of s)', `Leemos ${q(ch)}.`, view({ i }));
      const opener = OPENER_FOR.get(ch);
      if (opener === undefined) {
        t.step('const opener', `${q(ch)} no es un cierre (no está en la tabla): es una apertura.`, view({ i }));
        stack.push(ch);
        t.step('stack.push(ch)', `La apilamos: queda esperando su cierre arriba de todo.`, view({ i, pushed: true }));
      } else {
        t.step('const opener', `${q(ch)} es un cierre: necesita que arriba de la pila haya un ${q(opener)}.`, view({ i }));
        const top = stack.pop();
        if (top !== opener) {
          t.step('stack.pop() !== opener', top === undefined
            ? `La pila está vacía: ${q(ch)} cierra algo que nunca se abrió.`
            : `Sacamos ${q(top)} de arriba, pero hacía falta ${q(opener)}: se cruzaron.`, view({ i, popped: top ?? undefined, tone: 'drop' }));
          t.step('      return false;', 'Devolvemos false.', view({ i, tone: 'drop' }));
          return false;
        }
        t.step('stack.pop() !== opener', `Sacamos ${q(top)} de arriba: es justo su pareja. Se cancelan.`, view({ i, popped: top, tone: 'found' }));
      }
    }
    const ok = stack.length === 0;
    t.step('return stack.length === 0', ok
      ? 'Terminamos y la pila quedó vacía: cada apertura encontró su cierre. true.'
      : `Terminamos, pero quedan ${stack.length} aperturas sin cerrar en la pila. false.`, view({}));
    return ok;
  },
  extraInputs: () => [[''], [']'], ['(['], ['((()))'], ['){'], ['[({})]']],
};

export default def;
