import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { listFromArray, listViz, type LNode } from '../structures';

const code = `export interface ListNode { val: number; next: ListNode | null }

export function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = (slow as ListNode).next;
    fast = fast.next.next;
    if (slow === fast) return true; // fast lapped slow inside the cycle
  }
  return false;
}`;

const def: TraceDef<[number[], number], boolean> = {
  id: 'linked-list-cycle',
  title: 'Linked List Cycle',
  pattern: 'Fast and slow pointers',
  code,
  examples: [
    { label: 'head = [3, 2, 0, -4], la cola vuelve al índice 1', args: [[3, 2, 0, -4], 1] },
    { label: 'head = [1, 2, 3, 4, 5], sin ciclo', args: [[1, 2, 3, 4, 5], -1] },
    { label: 'head = [1], sin ciclo', args: [[1], -1] },
  ],
  run(t, values, pos) {
    const { head, nodes } = listFromArray(values, pos);
    let slow = head;
    let fast = head;
    const view = (o: { met?: boolean }): Viz[] => [
      listViz('lista', nodes, [{ name: 'slow', node: slow }, { name: 'fast', node: fast }], o.met && slow ? [{ id: slow.id, tone: 'found' }] : []),
    ];
    t.step('let fast = head', 'Dos punteros en la cabeza: slow avanza de a 1, fast de a 2. Si hay un ciclo, fast da la vuelta y alcanza a slow; si no, llega a null.', view({}));
    while (fast && fast.next) {
      slow = slow!.next;
      fast = fast.next.next;
      if (slow === fast) {
        t.step('if (slow === fast) return true', `slow y fast están en el mismo nodo (${slow!.val}): fast le sacó una vuelta. Hay ciclo: true.`, view({ met: true }));
        return true;
      }
      t.step('fast = fast.next.next', `slow → ${slow ? slow.val : 'null'}, fast → ${fast ? fast.val : 'null'}. Todavía no se encuentran.`, view({}));
    }
    t.step('return false', 'fast llegó al final (null): una lista con final no tiene ciclo. false. O(n), O(1) de espacio.', view({}));
    return false;
  },
  callReal: (mod, values, pos) => (mod.hasCycle as (h: LNode | null) => boolean)(listFromArray(values, pos).head),
  extraInputs: () => [[[], -1], [[1, 2], 0], [[1, 2, 3], 2]],
};

export default def;
