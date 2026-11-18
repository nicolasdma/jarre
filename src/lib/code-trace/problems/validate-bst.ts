import type { TraceDef } from '../trace';
import type { Tone, Viz } from '../types';
import { fmt } from '../format';
import { treeFromLevel, treeViz, type TNode } from '../structures';

const code = `export interface TreeNode { val: number; left: TreeNode | null; right: TreeNode | null }

export function isValidBST(root: TreeNode | null): boolean {
  function check(node: TreeNode | null, low: number, high: number): boolean {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false; // outside the inherited range
    return check(node.left, low, node.val) && check(node.right, node.val, high);
  }
  return check(root, -Infinity, Infinity);
}`;

const def: TraceDef<[(number | null)[]], boolean> = {
  id: 'validate-bst',
  title: 'Validate Binary Search Tree',
  pattern: 'Tree DFS with bounds',
  code,
  examples: [
    { label: 'root = [5, 1, 4, null, null, 3, 6]', args: [[5, 1, 4, null, null, 3, 6]] },
    { label: 'root = [8, 4, 12, 2, 6, 10, 14]', args: [[8, 4, 12, 2, 6, 10, 14]] },
    { label: 'root = [5, 4, 6, null, null, 3, 7]', args: [[5, 4, 6, null, null, 3, 7]] },
  ],
  run(t, levelArr) {
    const root = treeFromLevel(levelArr);
    const ok = new Set<string>();
    const bounds = new Map<string, string>();
    const view = (current?: TNode, tone: Tone = 'focus'): Viz[] => [
      treeViz('árbol · al lado, el rango permitido', root, [
        ...[...ok].map((id) => ({ id, tone: 'visited' as const })),
        ...(current ? [{ id: current.id, tone }] : []),
      ], [...bounds].map(([id, text]) => ({ id, text }))),
    ];
    t.step('return check(root, -Infinity, Infinity)', 'No alcanza con comparar cada nodo con sus hijos: un nodo tiene que respetar el rango que heredó de TODOS sus ancestros. La raíz puede ser cualquier cosa: (−∞, ∞).', view());
    const check = (node: TNode | null, low: number, high: number, from?: TNode): boolean => {
      if (!node) {
        t.step('if (!node) return true', `${from ? `Un hijo vacío de ${from.val}` : 'Árbol vacío'}: nada que violar. true.`, view(from));
        return true;
      }
      bounds.set(node.id, `(${fmt(low)}, ${fmt(high)})`);
      if (node.val <= low || node.val >= high) {
        t.step('if (node.val <= low || node.val >= high) return false', `${node.val} tiene que estar entre ${fmt(low)} y ${fmt(high)}, y no está. No es un BST: false.`, view(node, 'drop'));
        return false;
      }
      t.step('if (node.val <= low || node.val >= high) return false', `${node.val} está en (${fmt(low)}, ${fmt(high)}): bien. A la izquierda todo debe ser < ${node.val}; a la derecha, > ${node.val}.`, view(node));
      const left = check(node.left, low, node.val, node);
      if (!left) {
        t.step('return check(node.left, low, node.val) && check(node.right, node.val, high)', `La izquierda de ${node.val} falló: el && ni mira la derecha. false.`, view(node, 'drop'));
        return false;
      }
      const right = check(node.right, node.val, high, node);
      if (right) ok.add(node.id);
      t.step('return check(node.left, low, node.val) && check(node.right, node.val, high)', right ? `Todo el subárbol de ${node.val} es válido. true.` : `La derecha de ${node.val} falló. false.`, view(node, right ? 'found' : 'drop'));
      return right;
    };
    const res = check(root, -Infinity, Infinity);
    return res;
  },
  callReal: (mod, level) => (mod.isValidBST as (r: TNode | null) => unknown)(treeFromLevel(level)),
  extraInputs: () => [[[]], [[2, 1, 3]], [[2, 2, 2]], [[1, null, 1]]],
};

export default def;
