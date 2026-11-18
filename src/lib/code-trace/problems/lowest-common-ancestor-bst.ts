import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { treeFromLevel, treeViz, type TNode } from '../structures';

const code = `export interface TreeNode { val: number; left: TreeNode | null; right: TreeNode | null }

export function lowestCommonAncestor(root: TreeNode | null, p: number, q: number): TreeNode | null {
  let node = root;
  while (node) {
    if (p < node.val && q < node.val) node = node.left;       // both on the left
    else if (p > node.val && q > node.val) node = node.right; // both on the right
    else return node;                                         // they split here (or one is here)
  }
  return null;
}`;

const TREE = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5];

const def: TraceDef<[(number | null)[], number, number], number | null> = {
  id: 'lowest-common-ancestor-bst',
  title: 'Lowest Common Ancestor of a BST',
  pattern: 'BST walk',
  code,
  examples: [
    { label: 'root = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p = 2, q = 8', args: [TREE, 2, 8] },
    { label: 'el mismo árbol, p = 3, q = 5', args: [TREE, 3, 5] },
    { label: 'el mismo árbol, p = 2, q = 4', args: [TREE, 2, 4] },
  ],
  run(t, level, p, q) {
    const root = treeFromLevel(level);
    const byVal = (v: number, n: TNode | null): TNode | null => (!n ? null : n.val === v ? n : byVal(v, n.left) ?? byVal(v, n.right));
    const pq = [byVal(p, root), byVal(q, root)].filter((n): n is TNode => !!n).map((n) => ({ id: n.id, tone: 'focus' as const }));
    const walked: string[] = [];
    const view = (cur: TNode | null, found = false): Viz[] => [
      treeViz(`árbol · p = ${p}, q = ${q}`, root, [...walked.map((id) => ({ id, tone: 'visited' as const })), ...pq, ...(cur ? [{ id: cur.id, tone: found ? ('found' as const) : ('add' as const) }] : [])]),
    ];
    let node = root;
    t.step('let node = root', 'En un BST, lo chico va a la izquierda y lo grande a la derecha. Bajamos desde la raíz mientras p y q estén del mismo lado.', view(node));
    while (node) {
      if (p < node.val && q < node.val) {
        const at = node.val;
        walked.push(node.id);
        node = node.left;
        t.step('if (p < node.val && q < node.val) node = node.left', `${p} y ${q} son menores que ${at}: los dos están a la izquierda. Bajamos.`, view(node));
      } else if (p > node.val && q > node.val) {
        const at = node.val;
        walked.push(node.id);
        node = node.right;
        t.step('else if (p > node.val && q > node.val) node = node.right', `${p} y ${q} son mayores que ${at}: los dos están a la derecha. Bajamos.`, view(node));
      } else {
        t.step('else return node', `En ${node.val} se separan (o uno de ellos es ${node.val}): es el ancestro común más bajo. O(altura), sin recursión.`, view(node, true));
        return node.val;
      }
    }
    t.step('return null', 'Llegamos a null.', view(null));
    return null;
  },
  callReal: (mod, level, p, q) => (mod.lowestCommonAncestor as (r: TNode | null, p: number, q: number) => TNode | null)(treeFromLevel(level), p, q)?.val ?? null,
  extraInputs: () => [[[2, 1], 2, 1], [[2, 1, 3], 1, 3], [TREE, 7, 9]],
};

export default def;
