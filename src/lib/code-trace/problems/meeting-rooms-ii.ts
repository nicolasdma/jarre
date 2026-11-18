import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export function minMeetingRooms(intervals: number[][]): number {
  const starts = intervals.map((x) => x[0]).sort((a, b) => a - b);
  const ends = intervals.map((x) => x[1]).sort((a, b) => a - b);
  let rooms = 0;
  let e = 0; // earliest end not yet reused
  for (const s of starts) {
    if (s >= ends[e]) e++; // a meeting has ended: reuse its room
    else rooms++; // everyone is still busy: open a room
  }
  return rooms;
}`;

const def: TraceDef<[number[][]], number> = {
  id: 'meeting-rooms-ii',
  title: 'Meeting Rooms II',
  pattern: 'Intervals (sweep)',
  code,
  examples: [
    { label: 'intervals = [[0,30],[5,10],[15,20]]', args: [[[0, 30], [5, 10], [15, 20]]] },
    { label: 'intervals = [[7,10],[2,4]]', args: [[[7, 10], [2, 4]]] },
    { label: 'intervals = [[1,5],[2,6],[3,7],[6,9]]', args: [[[1, 5], [2, 6], [3, 7], [6, 9]]] },
  ],
  run(t, intervals) {
    const starts = intervals.map((x) => x[0]).sort((a, b) => a - b);
    const ends = intervals.map((x) => x[1]).sort((a, b) => a - b);
    let rooms = 0;
    let e = 0;
    const view = (o: { si?: number; reuse?: boolean }): Viz[] => [
      { kind: 'intervals', rows: [{ label: 'reuniones', items: intervals.map(([s, en]) => ({ start: s, end: en, tone: o.si !== undefined && s === starts[o.si] ? ('focus' as const) : undefined })) }] },
      { kind: 'array', label: 'starts (ordenados)', items: starts, pointers: o.si !== undefined ? [{ name: 's', index: o.si }] : [] },
      { kind: 'array', label: 'ends (ordenados)', items: ends, pointers: [{ name: 'e', index: e }], marks: ends.map((_, k) => ({ index: k, tone: 'muted' as const })).filter((m) => m.index < e) },
      { kind: 'vars', vars: [{ name: 'rooms', value: rooms, changed: o.reuse === false }] },
    ];
    t.step('const ends', `Separamos inicios y finales y los ordenamos: ${fmt(starts)} y ${fmt(ends)}. No importa qué reunión termina, solo cuándo se libera una sala.`, view({}));
    for (let si = 0; si < starts.length; si++) {
      const s = starts[si];
      if (s >= ends[e]) {
        e++;
        t.step('if (s >= ends[e]) e++', `Arranca una reunión a las ${s}. La primera que termina, a las ${ends[e - 1]}, ya terminó: reusamos su sala. rooms sigue en ${rooms}.`, view({ si, reuse: true }));
      } else {
        rooms++;
        t.step('else rooms++', `Arranca una a las ${s} y la que termina primero lo hace a las ${ends[e]}: todas ocupadas. Abrimos otra sala: rooms = ${rooms}.`, view({ si, reuse: false }));
      }
    }
    t.step('return rooms', `Hacen falta ${rooms} sala${rooms === 1 ? '' : 's'}. El costo es ordenar: O(n log n).`, view({}));
    return rooms;
  },
  extraInputs: () => [[[]], [[[1, 2]]], [[[1, 10], [10, 20]]], [[[9, 10], [4, 9], [4, 17]]]],
};

export default def;
