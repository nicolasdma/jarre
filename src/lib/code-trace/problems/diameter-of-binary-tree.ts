import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { treeFromLevel, treeViz, type TNode } from '../structures';

const code = `export interface TreeNode { val: number; left: TreeNode | null; right: TreeNode | null }

export function diameterOfBinaryTree(root: TreeNode | null): number {
  let best = 0;
  function height(node: TreeNode | null): number {
    if (!node) return 0;
    const l = height(node.left);
    const r = height(node.right);
    best = Math.max(best, l + r); // longest path bending at this node, in edges
    return 1 + Math.max(l, r);
  }
  height(root);
  return best;
}`;

const def: TraceDef<[(number | null)[]], number> = {
  id: 'diameter-of-binary-tree',
  title: 'Diameter of Binary Tree',
  pattern: 'Tree DFS (post-order)',
  code,
  examples: [
    { label: 'root = [1, 2, 3, 4, 5]', args: [[1, 2, 3, 4, 5]] },
    { label: 'root = [1, 2, null, 3, 4, 5, null, null, 6]', args: [[1, 2, null, 3, 4, 5, null, null, 6]] },
  ],
  run(t, level) {
    const root = treeFromLevel(level);
    let best = 0;
    let bestAt: string | null = null;
    const heights = new Map<string, number>();
    const view = (cur?: TNode): Viz[] => [
      treeViz('árbol · al lado, la altura que devolvió', root, [
        ...[...heights.keys()].map((id) => ({ id, tone: 'visited' as const })),
        ...(bestAt ? [{ id: bestAt, tone: 'found' as const }] : []),
        ...(cur ? [{ id: cur.id, tone: 'focus' as const }] : []),
      ], [...heights].map(([id, h]) => ({ id, text: `h ${h}` }))),
      { kind: 'vars', vars: [{ name: 'best', value: best }] },
    ];
    t.step('height(root);', 'Post-orden: primero los hijos, después el nodo. Cada nodo pregunta la altura de sus dos lados; el camino más largo que dobla en él mide izquierda + derecha.', view());
    const height = (node: TNode | null): number => {
      if (!node) return 0;
      const l = height(node.left);
      const r = height(node.right);
      const before = best;
      best = Math.max(best, l + r);
      if (best > before) bestAt = node.id;
      t.step('best = Math.max(best, l + r)', best > before
        ? `En ${node.val}: izquierda ${l} + derecha ${r} = ${l + r} aristas. Es el camino más largo hasta ahora: best = ${best}.`
        : `En ${node.val}: izquierda ${l} + derecha ${r} = ${l + r}, no supera ${best}.`, view(node));
      heights.set(node.id, 1 + Math.max(l, r));
      t.step('return 1 + Math.max(l, r)', `${node.val} devuelve su altura, 1 + max(${l}, ${r}) = ${1 + Math.max(l, r)}, a su padre.`, view(node));
      return 1 + Math.max(l, r);
    };
    height(root);
    t.step('return best', `El diámetro es ${best}. Una visita por nodo: O(n).`, view());
    return best;
  },
  callReal: (mod, level) => (mod.diameterOfBinaryTree as (r: TNode | null) => number)(treeFromLevel(level)),
  extraInputs: () => [[[]], [[1]], [[1, 2]]],
};

export default def;
