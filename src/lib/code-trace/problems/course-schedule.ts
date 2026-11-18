import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';

const code = `export function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  const indegree = new Array<number>(numCourses).fill(0);
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course); // pre -> course
    indegree[course]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i);
  let head = 0; // index pointer: shift() would be O(n) per pop
  while (head < queue.length) {
    const node = queue[head++];
    for (const next of adj[node]) {
      if (--indegree[next] === 0) queue.push(next);
    }
  }
  return queue.length === numCourses; // everything got taken: no cycle
}`;

const def: TraceDef<[number, number[][]], boolean> = {
  id: 'course-schedule',
  title: 'Course Schedule',
  pattern: 'Topological sort (Kahn)',
  code,
  examples: [
    { label: 'numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]', args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]] },
    { label: 'numCourses = 2, prerequisites = [[1,0],[0,1]] (ciclo)', args: [2, [[1, 0], [0, 1]]] },
    { label: 'numCourses = 2, prerequisites = [[1,0]]', args: [2, [[1, 0]]] },
  ],
  run(t, numCourses, prerequisites) {
    const adj: number[][] = Array.from({ length: numCourses }, () => []);
    const indegree = new Array<number>(numCourses).fill(0);
    const queue: number[] = [];
    let head = 0;
    const taken = new Set<number>();
    const view = (o: { node?: number; edge?: [number, number]; flash?: number }): Viz[] => {
      const marks: { id: string; tone: Tone }[] = [];
      for (const n of taken) marks.push({ id: String(n), tone: 'visited' });
      for (const n of queue.slice(head)) marks.push({ id: String(n), tone: 'focus' });
      if (o.node !== undefined) marks.push({ id: String(o.node), tone: 'found' });
      return [
        {
          kind: 'graph',
          label: 'materias · una flecha pre → materia',
          nodes: Array.from({ length: numCourses }, (_, i) => ({ id: String(i), label: String(i) })),
          edges: prerequisites.map(([course, pre]) => ({ from: String(pre), to: String(course), directed: true, tone: o.edge && o.edge[0] === pre && o.edge[1] === course ? ('focus' as const) : undefined })),
          marks,
        },
        { kind: 'array', label: 'indegree · cuántos prerrequisitos le faltan', items: [...indegree], marks: o.flash !== undefined ? [{ index: o.flash, tone: 'add' }] : [] },
        { kind: 'queue', label: 'queue · listas para cursar', items: [...queue], head },
      ];
    };
    for (const [course, pre] of prerequisites) {
      adj[pre].push(course);
      indegree[course]++;
      t.step('indegree[course]++', `${course} necesita ${pre}: flecha ${pre} → ${course}, y a ${course} le falta un prerrequisito más (${indegree[course]}).`, view({ edge: [pre, course], flash: course }));
    }
    for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i);
    t.step('for (let i = 0; i < numCourses; i++) if (indegree[i] === 0) queue.push(i)', queue.length
      ? `Las que no tienen prerrequisitos se pueden cursar ya: ${queue.join(', ')}. Entran a la cola.`
      : 'Ninguna materia arranca sin prerrequisitos: no hay por dónde empezar.', view({}));
    while (head < queue.length) {
      const node = queue[head++];
      taken.add(node);
      t.step('const node = queue[head++]', `Cursamos ${node}.`, view({ node }));
      for (const next of adj[node]) {
        indegree[next]--;
        if (indegree[next] === 0) queue.push(next);
        t.step('if (--indegree[next] === 0) queue.push(next)', indegree[next] === 0
          ? `A ${next} ya no le falta nada: entra a la cola.`
          : `A ${next} le quedan ${indegree[next]} prerrequisito${indegree[next] === 1 ? '' : 's'}.`, view({ node, flash: next }));
      }
    }
    const ok = queue.length === numCourses;
    t.step('return queue.length === numCourses', ok
      ? `Pasaron por la cola las ${numCourses}: se pueden cursar todas. true.`
      : `Solo ${queue.length} de ${numCourses} pasaron por la cola: las demás se esperan entre sí, hay un ciclo. false.`, view({}));
    return ok;
  },
  extraInputs: () => [[1, []], [3, [[1, 0], [2, 1], [0, 2]]], [3, [[0, 1], [0, 2], [1, 2]]]],
};

export default def;
