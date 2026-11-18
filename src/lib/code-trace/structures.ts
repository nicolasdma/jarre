/**
 * Linked lists and binary trees for trace generators: built from the plain
 * arrays the lessons use (level order for trees, with null for a missing
 * child), each node with a stable id so a snapshot can name it. The real
 * solutions receive the same shape ({ val, next } / { val, left, right }); the
 * extra `id` is ignored by them.
 */

import type { ListViz, Tone, TreeViz } from './types';

export interface TNode {
  id: string;
  val: number;
  left: TNode | null;
  right: TNode | null;
}

export interface LNode {
  id: string;
  val: number;
  next: LNode | null;
}

/** A tree from its level-order array, as LeetCode writes it: [3, 9, 20, null, null, 15, 7]. */
export function treeFromLevel(a: (number | null)[]): TNode | null {
  if (a.length === 0 || a[0] === null || a[0] === undefined) return null;
  let made = 0;
  const node = (val: number): TNode => ({ id: `t${made++}`, val, left: null, right: null });
  const root = node(a[0]);
  const queue: TNode[] = [root];
  let head = 0;
  let i = 1;
  while (i < a.length && head < queue.length) {
    const cur = queue[head++];
    const l = a[i++];
    if (l !== null && l !== undefined) {
      cur.left = node(l);
      queue.push(cur.left);
    }
    const r = i < a.length ? a[i++] : null;
    if (r !== null && r !== undefined) {
      cur.right = node(r);
      queue.push(cur.right);
    }
  }
  return root;
}

/** Every node of a tree, pre-order. */
export function treeNodes(root: TNode | null): TNode[] {
  const out: TNode[] = [];
  const walk = (n: TNode | null) => {
    if (!n) return;
    out.push(n);
    walk(n.left);
    walk(n.right);
  };
  walk(root);
  return out;
}

export function treeViz(
  label: string,
  root: TNode | null,
  marks: { id: string; tone: Tone }[] = [],
  notes: { id: string; text: string }[] = [],
): TreeViz {
  return {
    kind: 'tree',
    label,
    root: root?.id ?? null,
    nodes: treeNodes(root).map((n) => ({ id: n.id, value: n.val, left: n.left?.id ?? null, right: n.right?.id ?? null })),
    marks,
    notes,
  };
}

/** A list from its values; `cycleTo` makes the tail point back to that index; `prefix` keeps ids apart when two lists share a drawing. */
export function listFromArray(a: number[], cycleTo = -1, prefix = 'l'): { head: LNode | null; nodes: LNode[] } {
  const nodes: LNode[] = a.map((val, i) => ({ id: `${prefix}${i}`, val, next: null }));
  nodes.forEach((n, i) => {
    n.next = nodes[i + 1] ?? null;
  });
  if (cycleTo >= 0 && nodes.length) nodes[nodes.length - 1].next = nodes[cycleTo] ?? null;
  return { head: nodes[0] ?? null, nodes };
}

/** Values of a list from its head (stops on a cycle). */
export function listValues(head: { val: number; next: unknown } | null): number[] {
  const out: number[] = [];
  const seen = new Set<unknown>();
  let n = head as { val: number; next: unknown } | null;
  while (n && !seen.has(n)) {
    seen.add(n);
    out.push(n.val);
    n = n.next as { val: number; next: unknown } | null;
  }
  return out;
}

/** Draw a list in a fixed order (the original one), with its current arrows. */
export function listViz(
  label: string,
  nodes: LNode[],
  pointers: { name: string; node: LNode | null }[],
  marks: { id: string; tone: Tone }[] = [],
): ListViz {
  return {
    kind: 'list',
    label,
    nodes: nodes.map((n) => ({ id: n.id, value: n.val })),
    next: Object.fromEntries(nodes.map((n) => [n.id, n.next?.id ?? null])),
    pointers: pointers.map((p) => ({ name: p.name, id: p.node?.id ?? null })),
    marks,
  };
}
