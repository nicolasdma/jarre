import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';
import { treeFromLevel, treeViz, type TNode } from '../structures';

const code = `export interface TreeNode { val: number; left: TreeNode | null; right: TreeNode | null }

export function levelOrder(root: TreeNode | null): number[][] {
  const result: number[][] = [];
  if (!root) return result;
  const queue: TreeNode[] = [root];
  let head = 0; // dequeue with an index: O(1), no shift()
  while (head < queue.length) {
    const levelEnd = queue.length; // nodes of this level are queue[head..levelEnd)
    const level: number[] = [];
    while (head < levelEnd) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}`;

const def: TraceDef<[(number | null)[]], number[][]> = {
  id: 'level-order-traversal',
  title: 'Binary Tree Level Order Traversal',
  pattern: 'Tree BFS',
  code,
  examples: [
    { label: 'root = [3, 9, 20, null, null, 15, 7]', args: [[3, 9, 20, null, null, 15, 7]] },
    { label: 'root = [1, 2, 3, 4, null, null, 5]', args: [[1, 2, 3, 4, null, null, 5]] },
  ],
  run(t, levelArr) {
    const root = treeFromLevel(levelArr);
    const result: number[][] = [];
    const queue: TNode[] = [];
    let head = 0;
    let level: number[] = [];
    const view = (o: { node?: TNode; pushed?: boolean; levelEnd?: number }): Viz[] => [
      treeViz('árbol', root, [
        ...queue.slice(0, head).map((n) => ({ id: n.id, tone: 'visited' as const })),
        ...queue.slice(head, o.levelEnd ?? head).map((n) => ({ id: n.id, tone: 'focus' as const })),
        ...(o.node ? [{ id: o.node.id, tone: 'found' as const }] : []),
      ]),
      { kind: 'queue', label: 'queue', items: queue.map((n) => n.val), head, pushed: o.pushed },
      { kind: 'text', label: 'level (el nivel que estamos armando)', value: fmt(level) },
      { kind: 'text', label: 'result', value: fmt(result) },
    ];
    if (!root) {
      t.step('if (!root) return result', 'Árbol vacío: no hay niveles. Devolvemos [].', view({}));
      return result;
    }
    queue.push(root);
    t.step('const queue', `BFS: una cola que arranca con la raíz (${root.val}). Sacamos por adelante, agregamos los hijos por atrás: sale nivel por nivel.`, view({ pushed: true }));
    while (head < queue.length) {
      const levelEnd = queue.length;
      level = [];
      t.step('const levelEnd = queue.length', `Ahora mismo la cola tiene exactamente un nivel completo: ${levelEnd - head} nodo${levelEnd - head === 1 ? '' : 's'} (${queue.slice(head, levelEnd).map((n) => n.val).join(', ')}). Los sacamos a esos y nada más.`, view({ levelEnd }));
      while (head < levelEnd) {
        const node = queue[head++];
        level.push(node.val);
        t.step('level.push(node.val)', `Sale ${node.val} de la cola y entra al nivel.`, view({ node, levelEnd }));
        const kids = [node.left, node.right].filter((n): n is TNode => !!n);
        for (const kid of kids) queue.push(kid);
        if (kids.length) t.step('if (node.right) queue.push(node.right)', `Sus hijos (${kids.map((k) => k.val).join(', ')}) entran al final de la cola: son del nivel siguiente.`, view({ node, pushed: true, levelEnd }));
      }
      result.push(level);
      t.step('result.push(level)', `Nivel completo: ${fmt(level)}.`, view({}));
    }
    t.step('  return result;', `La cola se vació: ${fmt(result)}. Cada nodo entra y sale una vez: O(n).`, view({}));
    return result;
  },
  callReal: (mod, level) => (mod.levelOrder as (r: TNode | null) => unknown)(treeFromLevel(level)),
  extraInputs: () => [[[]], [[1]], [[1, 2, 3, 4, 5, 6, 7]]],
};

export default def;
