import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { listFromArray, listValues, listViz, type LNode } from '../structures';

const code = `export interface ListNode { val: number; next: ListNode | null }

export function removeNthFromEnd(head: ListNode | null, n: number): ListNode | null {
  const dummy: ListNode = { val: 0, next: head };
  let fast: ListNode | null = dummy;
  let slow: ListNode = dummy;
  for (let i = 0; i <= n; i++) fast = (fast as ListNode).next; // gap of n + 1
  while (fast) {
    fast = fast.next;
    slow = slow.next as ListNode;
  }
  slow.next = (slow.next as ListNode).next; // skip the target
  return dummy.next;
}`;

const def: TraceDef<[number[], number], number[]> = {
  id: 'remove-nth-from-end',
  title: 'Remove Nth Node From End of List',
  pattern: 'Two pointers with a gap',
  code,
  examples: [
    { label: 'head = [1, 2, 3, 4, 5], n = 2', args: [[1, 2, 3, 4, 5], 2] },
    { label: 'head = [1], n = 1', args: [[1], 1] },
  ],
  run(t, values, n) {
    const { head, nodes } = listFromArray(values);
    const dummy: LNode = { id: 'd', val: 0, next: head };
    let fast: LNode | null = dummy;
    let slow: LNode = dummy;
    const all = [dummy, ...nodes];
    const view = (o: { cut?: LNode }): Viz[] => [
      listViz('dummy (0) + la lista', all, [{ name: 'slow', node: slow }, { name: 'fast', node: fast }], [{ id: 'd', tone: 'muted' }, ...(o.cut ? [{ id: o.cut.id, tone: 'drop' as const }] : [])]),
    ];
    t.step('let slow: ListNode = dummy', 'Un dummy antes de la cabeza (por si hay que borrar la cabeza). fast y slow arrancan ahí.', view({}));
    for (let i = 0; i <= n; i++) fast = fast!.next;
    t.step('for (let i = 0; i <= n; i++) fast', `fast se adelanta ${n + 1} pasos. Ahora entre slow y fast hay un hueco fijo de ${n + 1}.`, view({}));
    while (fast) {
      fast = fast.next;
      slow = slow.next!;
      t.step('slow = slow.next as ListNode', `Avanzan los dos, con el mismo hueco: slow → ${slow.val}, fast → ${fast ? fast.val : 'null'}.`, view({}));
    }
    const cut = slow.next!;
    t.step('while (fast)', `fast llegó a null. Por el hueco, slow quedó justo antes del ${n}° desde el final: ${cut.val}.`, view({ cut }));
    slow.next = cut.next;
    t.step('slow.next = (slow.next as ListNode).next', `Lo salteamos: slow apunta directo al siguiente. Una sola pasada, O(n).`, view({ cut }));
    t.step('return dummy.next', `Resultado: ${listValues(dummy.next).join(' → ') || 'vacío'}.`, view({}));
    return listValues(dummy.next);
  },
  callReal: (mod, values, n) => listValues((mod.removeNthFromEnd as (h: LNode | null, n: number) => LNode | null)(listFromArray(values).head, n)),
  extraInputs: () => [[[1, 2], 1], [[1, 2], 2], [[1, 2, 3], 3]],
};

export default def;
