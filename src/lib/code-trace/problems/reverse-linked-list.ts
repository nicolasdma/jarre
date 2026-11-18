import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { listFromArray, listValues, listViz, type LNode } from '../structures';

const code = `export interface ListNode { val: number; next: ListNode | null }

export function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr) {
    const next = curr.next; // save the rest before flipping the arrow
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`;

const def: TraceDef<[number[]], number[]> = {
  id: 'reverse-linked-list',
  title: 'Reverse Linked List',
  pattern: 'Linked list pointers',
  code,
  examples: [
    { label: 'head = [1, 2, 3, 4, 5]', args: [[1, 2, 3, 4, 5]] },
    { label: 'head = [1, 2]', args: [[1, 2]] },
  ],
  run(t, values) {
    const { head, nodes } = listFromArray(values);
    let prev: LNode | null = null;
    let curr = head;
    let next: LNode | null = null;
    const view = (o: { showNext?: boolean; flipped?: LNode }): Viz[] => [
      listViz('lista (las flechas son los next)', nodes, [
        { name: 'prev', node: prev },
        { name: 'curr', node: curr },
        ...(o.showNext ? [{ name: 'next', node: next }] : []),
      ], o.flipped ? [{ id: o.flipped.id, tone: 'add' }] : []),
    ];
    t.step('let curr = head', 'prev = null (todavía no hay nada dado vuelta), curr = la cabeza. Vamos a girar una flecha por vuelta.', view({}));
    while (curr) {
      next = curr.next;
      t.step('const next = curr.next', `Antes de tocar nada, guardamos el resto: next = ${next ? next.val : 'null'}. Si no, al girar la flecha lo perdemos.`, view({ showNext: true }));
      curr.next = prev;
      t.step('curr.next = prev', `Giramos la flecha de ${curr.val}: ahora apunta a ${prev ? prev.val : 'null'}.`, view({ showNext: true, flipped: curr }));
      prev = curr;
      curr = next;
      t.step('curr = next', `Avanzamos los dos: prev = ${prev.val}, curr = ${curr ? curr.val : 'null'}.`, view({}));
    }
    t.step('return prev', `curr llegó a null. prev es la nueva cabeza: ${listValues(prev).join(' → ')}. O(n) tiempo, O(1) espacio.`, view({}));
    return listValues(prev);
  },
  callReal: (mod, values) => listValues((mod.reverseList as (h: LNode | null) => LNode | null)(listFromArray(values).head)),
  extraInputs: () => [[[]], [[7]], [[1, 2, 3]]],
};

export default def;
