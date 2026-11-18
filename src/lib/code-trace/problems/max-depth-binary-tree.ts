import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';
import { treeFromLevel, treeViz, type TNode } from '../structures';

const code = `export interface TreeNode { val: number; left: TreeNode | null; right: TreeNode | null }

export function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`;

const def: TraceDef<[(number | null)[]], number> = {
  id: 'max-depth-binary-tree',
  title: 'Maximum Depth of Binary Tree',
  pattern: 'Tree DFS',
  code,
  examples: [
    { label: 'root = [3, 9, 20, null, null, 15, 7]', args: [[3, 9, 20, null, null, 15, 7]] },
    { label: 'root = [1, null, 2]', args: [[1, null, 2]] },
  ],
  run(t, level) {
    const root = treeFromLevel(level);
    const done = new Map<string, number>();
    const path: string[] = [];
    const view = (current?: TNode): Viz[] => {
      const marks: { id: string; tone: Tone }[] = [...done.keys()].map((id) => ({ id, tone: 'visited' as const }));
      for (const id of path) if (!done.has(id)) marks.push({ id, tone: 'focus' });
      if (current && done.has(current.id)) marks.push({ id: current.id, tone: 'found' });
      return [
        treeViz('árbol · al lado, lo que devolvió cada llamada', root, marks, [...done].map(([id, d]) => ({ id, text: `= ${d}` }))),
        { kind: 'stack', label: 'llamadas abiertas (la pila de recursión)', items: path.map((id) => `maxDepth(${findVal(root, id)})`) },
      ];
    };
    const depth = (node: TNode | null, from?: TNode): number => {
      if (!node) {
        t.step('if (!root) return 0', `${from ? `El hijo de ${from.val} es` : 'El árbol es'} null: profundidad 0.`, view(from));
        return 0;
      }
      path.push(node.id);
      t.step('return 1 + Math.max', `Visitamos ${node.val}. Su profundidad es 1 + la del hijo más profundo: primero preguntamos a la izquierda, después a la derecha.`, view(node));
      const l = depth(node.left, node);
      const r = depth(node.right, node);
      const d = 1 + Math.max(l, r);
      done.set(node.id, d);
      path.pop();
      t.step('return 1 + Math.max', `${node.val}: 1 + max(${l}, ${r}) = ${d}. Vuelve ${d} a quien lo llamó.`, view(node));
      return d;
    };
    const d = depth(root);
    return d;
  },
  callReal: (mod, level) => (mod.maxDepth as (r: TNode | null) => unknown)(treeFromLevel(level)),
  extraInputs: () => [[[]], [[1]], [[1, 2, null, 3, null, 4]]],
};

function findVal(root: TNode | null, id: string): number | string {
  if (!root) return '?';
  if (root.id === id) return root.val;
  const l = findVal(root.left, id);
  return l !== '?' ? l : findVal(root.right, id);
}

export default def;
