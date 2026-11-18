import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function dailyTemperatures(temps: number[]): number[] {
  const answer = new Array<number>(temps.length).fill(0);
  const stack: number[] = []; // indices, temperatures strictly decreasing from bottom to top
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
      const j = stack.pop() as number;
      answer[j] = i - j;
    }
    stack.push(i);
  }
  return answer;
}`;

const def: TraceDef<[number[]], number[]> = {
  id: 'daily-temperatures',
  title: 'Daily Temperatures',
  pattern: 'Monotonic stack',
  code,
  examples: [
    { label: 'temps = [73, 74, 75, 71, 69, 72, 76, 73]', args: [[73, 74, 75, 71, 69, 72, 76, 73]] },
    { label: 'temps = [30, 40, 50, 60]', args: [[30, 40, 50, 60]] },
  ],
  run(t, temps) {
    const answer = new Array<number>(temps.length).fill(0);
    const stack: number[] = [];
    const view = (o: { i?: number; j?: number; pushed?: boolean; popped?: number }): Viz[] => [
      {
        kind: 'array',
        label: 'temps',
        items: temps,
        pointers: [...(o.i !== undefined ? [{ name: 'i', index: o.i }] : []), ...(o.j !== undefined ? [{ name: 'j', index: o.j }] : [])],
        marks: stack.map((k) => ({ index: k, tone: 'visited' as const })),
      },
      { kind: 'stack', label: 'stack · índices esperando un día más caluroso', items: stack.map((k) => `${k} (${temps[k]}°)`), pushed: o.pushed, popped: o.popped !== undefined ? `${o.popped} (${temps[o.popped]}°)` : undefined },
      { kind: 'array', label: 'answer', items: [...answer], marks: o.j !== undefined ? [{ index: o.j, tone: 'add' }] : [] },
    ];
    t.step('const stack', 'La pila guarda los días que todavía no encontraron uno más caluroso, con temperaturas que bajan de abajo hacia arriba.', view({}));
    for (let i = 0; i < temps.length; i++) {
      t.step('for (let i = 0', `Día ${i}: ${temps[i]}°.`, view({ i }));
      while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
        const j = stack.pop()!;
        answer[j] = i - j;
        t.step('answer[j] = i - j', `${temps[i]}° > ${temps[j]}° del día ${j}: el día ${j} por fin encontró uno más caluroso, ${i} − ${j} = ${i - j} día${i - j === 1 ? '' : 's'} después. Sale de la pila.`, view({ i, j, popped: j }));
      }
      stack.push(i);
      t.step('stack.push(i)', `El día ${i} se queda esperando en la pila.`, view({ i, pushed: true }));
    }
    t.step('return answer', `Los que quedaron en la pila nunca encontraron uno más caluroso: se quedan en 0. Cada día entra y sale una vez: O(n). Resultado: ${fmt(answer)}.`, view({}));
    return answer;
  },
  extraInputs: () => [[[]], [[50]], [[60, 50, 40]], [[30, 60, 90]]],
};

export default def;
