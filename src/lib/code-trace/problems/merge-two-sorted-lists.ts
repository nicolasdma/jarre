import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { listFromArray, listValues, listViz, type LNode } from '../structures';

const code = `export interface ListNode { val: number; next: ListNode | null }

export function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy: ListNode = { val: 0, next: null };
  let tail = dummy;
  let a = list1;
  let b = list2;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; tail = a; a = a.next; }
    else { tail.next = b; tail = b; b = b.next; }
  }
  tail.next = a ?? b; // attach whatever is left
  return dummy.next;
}`;

const def: TraceDef<[number[], number[]], number[]> = {
  id: 'merge-two-sorted-lists',
  title: 'Merge Two Sorted Lists',
  pattern: 'Linked list, dummy node',
  code,
  examples: [
    { label: 'list1 = [1, 2, 4], list2 = [1, 3, 4]', args: [[1, 2, 4], [1, 3, 4]] },
    { label: 'list1 = [], list2 = [0]', args: [[], [0]] },
  ],
  run(t, l1, l2) {
    const A = listFromArray(l1, -1, 'a');
    const B = listFromArray(l2, -1, 'b');
    const dummy: LNode = { id: 'd', val: 0, next: null };
    let tail = dummy;
    let a = A.head;
    let b = B.head;
    const all = [dummy, ...A.nodes, ...B.nodes];
    const view = (o: { took?: LNode }): Viz[] => [
      listViz('dummy (0), list1 y list2 · las flechas son los next', all, [
        { name: 'tail', node: tail },
        { name: 'a', node: a },
        { name: 'b', node: b },
      ], o.took ? [{ id: o.took.id, tone: 'add' }, { id: 'd', tone: 'muted' }] : [{ id: 'd', tone: 'muted' }]),
      { kind: 'text', label: 'resultado hasta ahora (desde dummy.next)', value: listValues(dummy.next).join(' → ') || 'vacío' },
    ];
    t.step('let tail = dummy', 'Un nodo falso (dummy) antes del resultado: así el primer enganche no es un caso especial. tail es el último nodo del resultado.', view({}));
    while (a && b) {
      if (a.val <= b.val) {
        const took: LNode = a;
        tail.next = a;
        tail = a;
        a = a.next;
        t.step('if (a.val <= b.val)', `${took.val} ≤ ${b.val}: enganchamos el de list1 detrás de tail y avanzamos a.`, view({ took }));
      } else {
        const took: LNode = b;
        tail.next = b;
        tail = b;
        b = b.next;
        t.step('else { tail.next = b', `${took.val} < ${a.val}: enganchamos el de list2 y avanzamos b.`, view({ took }));
      }
    }
    tail.next = a ?? b;
    t.step('tail.next = a ?? b', a ?? b ? `Una lista se terminó: el resto de la otra (${listValues(a ?? b).join(' → ')}) ya está ordenado, lo enganchamos entero.` : 'Las dos se terminaron.', view({}));
    t.step('return dummy.next', `El resultado empieza después del dummy: ${listValues(dummy.next).join(' → ') || 'vacío'}. O(m + n), sin nodos nuevos.`, view({}));
    return listValues(dummy.next);
  },
  callReal: (mod, l1, l2) => listValues((mod.mergeTwoLists as (a: LNode | null, b: LNode | null) => LNode | null)(listFromArray(l1).head, listFromArray(l2).head)),
  extraInputs: () => [[[], []], [[5], [1, 2, 3]], [[1, 1], [1]]],
};

export default def;
