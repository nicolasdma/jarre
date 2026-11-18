import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function evalRPN(tokens: string[]): number {
  const stack: number[] = [];
  for (const t of tokens) {
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop() as number; // right operand comes out first
      const a = stack.pop() as number;
      if (t === '+') stack.push(a + b);
      else if (t === '-') stack.push(a - b);
      else if (t === '*') stack.push(a * b);
      else stack.push(Math.trunc(a / b));
    } else {
      stack.push(Number(t));
    }
  }
  return stack[0];
}`;

const def: TraceDef<[string[]], number> = {
  id: 'evaluate-rpn',
  title: 'Evaluate Reverse Polish Notation',
  pattern: 'Stack',
  code,
  examples: [
    { label: 'tokens = ["2", "1", "+", "3", "*"]', args: [['2', '1', '+', '3', '*']] },
    { label: 'tokens = ["4", "13", "5", "/", "+"]', args: [['4', '13', '5', '/', '+']] },
  ],
  run(tr, tokens) {
    const stack: number[] = [];
    const view = (o: { k?: number; pushed?: boolean }): Viz[] => [
      { kind: 'array', label: 'tokens', items: tokens, pointers: o.k !== undefined ? [{ name: 't', index: o.k }] : [], marks: tokens.map((_, i) => ({ index: i, tone: 'visited' as const })).filter((m) => o.k !== undefined && m.index < o.k) },
      { kind: 'stack', label: 'stack', items: [...stack], pushed: o.pushed },
    ];
    tr.step('const stack', 'En notación polaca inversa, el operador viene después de sus dos números. Una pila guarda los números que esperan su operador.', view({}));
    tokens.forEach((t, k) => {
      if (t === '+' || t === '-' || t === '*' || t === '/') {
        const b = stack.pop()!;
        const a = stack.pop()!;
        tr.step('const a = stack.pop()', `${t} es un operador: sacamos dos números. Primero sale b = ${fmt(b)}, después a = ${fmt(a)} (el orden importa en − y /).`, view({ k }));
        let r: number;
        let anchor: string;
        if (t === '+') {
          r = a + b;
          anchor = "if (t === '+') stack.push(a + b)";
        } else if (t === '-') {
          r = a - b;
          anchor = "else if (t === '-') stack.push(a - b)";
        } else if (t === '*') {
          r = a * b;
          anchor = "else if (t === '*') stack.push(a * b)";
        } else {
          r = Math.trunc(a / b);
          anchor = 'else stack.push(Math.trunc(a / b))';
        }
        stack.push(r);
        tr.step(anchor, `${fmt(a)} ${t} ${fmt(b)} = ${fmt(r)}${t === '/' ? ' (la división trunca hacia 0)' : ''}. El resultado vuelve a la pila: ahora es un número para el próximo operador.`, view({ k, pushed: true }));
      } else {
        stack.push(Number(t));
        tr.step('stack.push(Number(t))', `${t} es un número: a la pila.`, view({ k, pushed: true }));
      }
    });
    tr.step('return stack[0]', `Queda un solo número: ${fmt(stack[0])}. Una pasada, O(n).`, view({}));
    return stack[0];
  },
  extraInputs: () => [[['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+']], [['3', '4', '-']], [['7']]],
};

export default def;
