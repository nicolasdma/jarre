import type { TraceDef } from '../trace';
import type { Viz } from '../types';
import { fmt } from '../format';

const code = `export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export interface Session { id: string; authId: string; units: number; status: SessionStatus }
export interface Auth { id: string; approvedUnits: number; endDate: string } // 'YYYY-MM-DD', inclusive

export function remainingUnits(auths: Auth[], sessions: Session[], today: string): { id: string; remaining: number }[] {
  const usedByAuth = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    usedByAuth.set(s.authId, (usedByAuth.get(s.authId) ?? 0) + s.units);
  }
  return auths
    .filter((a) => a.endDate >= today) // inclusive; 'YYYY-MM-DD' strings compare in date order
    .map((a) => ({ id: a.id, remaining: a.approvedUnits - (usedByAuth.get(a.id) ?? 0) }))
    .sort((a, b) => a.remaining - b.remaining);
}`;

type Status = 'scheduled' | 'completed' | 'cancelled';
interface Session { id: string; authId: string; units: number; status: Status }
interface Auth { id: string; approvedUnits: number; endDate: string }
type Out = { id: string; remaining: number }[];

const AUTHS: Auth[] = [
  { id: 'A1', approvedUnits: 10, endDate: '2026-12-31' },
  { id: 'A2', approvedUnits: 8, endDate: '2026-11-17' },
  { id: 'A3', approvedUnits: 5, endDate: '2026-11-01' },
];
const SESSIONS: Session[] = [
  { id: 's1', authId: 'A1', units: 3, status: 'completed' },
  { id: 's2', authId: 'A1', units: 2, status: 'scheduled' },
  { id: 's3', authId: 'A2', units: 4, status: 'completed' },
  { id: 's4', authId: 'A1', units: 1, status: 'cancelled' },
];

const def: TraceDef<[Auth[], Session[], string], Out> = {
  id: 'debug-remaining-units',
  title: 'Debug: remaining units',
  pattern: 'Read & debug',
  code,
  examples: [
    { label: "today = '2026-11-17' (A1, A2, A3; 4 sesiones)", args: [AUTHS, SESSIONS, '2026-11-17'] },
    {
      label: 'una autorización sin sesiones',
      args: [
        [{ id: 'B1', approvedUnits: 6, endDate: '2026-11-30' }, { id: 'B2', approvedUnits: 4, endDate: '2026-12-15' }],
        [{ id: 's1', authId: 'B1', units: 5, status: 'completed' }],
        '2026-11-17',
      ],
    },
  ],
  run(t, auths, sessions, today) {
    const used = new Map<string, number>();
    const sessionRows = (k?: number): Viz => ({
      kind: 'grid',
      label: 'sessions',
      cells: sessions.map((s) => [s.id, s.authId, s.units, s.status]),
      colLabels: ['id', 'authId', 'units', 'status'],
      marks: k === undefined ? [] : [0, 1, 2, 3].map((c) => ({ r: k, c, tone: sessions[k].status === 'completed' ? ('focus' as const) : ('muted' as const) })),
    });
    const usedMap = (flash?: string, probe?: string): Viz => ({
      kind: 'map',
      label: 'usedByAuth',
      keyLabel: 'authId',
      valueLabel: 'unidades usadas',
      entries: [...used].map(([key, value]) => ({ key, value })),
      flash,
      probe: probe !== undefined ? { key: probe, found: used.has(probe) } : undefined,
      hit: probe !== undefined && used.has(probe) ? probe : undefined,
    });
    const authRows = (tones: Record<number, 'found' | 'drop' | 'focus'>): Viz => ({
      kind: 'grid',
      label: `auths (today = ${today})`,
      cells: auths.map((a) => [a.id, a.approvedUnits, a.endDate]),
      colLabels: ['id', 'approvedUnits', 'endDate'],
      marks: Object.entries(tones).flatMap(([r, tone]) => [0, 1, 2].map((c) => ({ r: Number(r), c, tone }))),
    });

    t.step('const usedByAuth', 'Primero contamos cuántas unidades usó cada autorización. Un Map authId → unidades, vacío.', [sessionRows(), usedMap()]);
    for (let k = 0; k < sessions.length; k++) {
      const s = sessions[k];
      t.step('for (const s of sessions)', `Sesión ${s.id}: ${s.units} unidades de ${s.authId}, estado ${s.status}.`, [sessionRows(k), usedMap()]);
      if (s.status !== 'completed') {
        t.step("if (s.status !== 'completed') continue", `No está completed: no gasta unidades. Seguimos. (El bug era un = en este if: asignaba en vez de comparar y contaba todas.)`, [sessionRows(k), usedMap()]);
        continue;
      }
      const before = used.get(s.authId) ?? 0;
      used.set(s.authId, before + s.units);
      t.step('usedByAuth.set', `Completed: ${s.authId} pasa de ${before} a ${before} + ${s.units} = ${before + s.units}. El ?? 0 hace que la primera vez sume desde 0 y no dé NaN.`, [sessionRows(k), usedMap(s.authId)]);
    }
    const tones: Record<number, 'found' | 'drop' | 'focus'> = {};
    t.step('return auths', 'Ahora una cadena sobre auths: filter (las vigentes) → map (cuánto queda) → sort (de menor a mayor).', [authRows(tones), usedMap()]);
    const kept: Auth[] = [];
    auths.forEach((a, r) => {
      const ok = a.endDate >= today;
      tones[r] = ok ? 'found' : 'drop';
      t.step('.filter((a) => a.endDate >= today)', ok
        ? `${a.id} termina el ${a.endDate} ≥ ${today}: sigue vigente${a.endDate === today ? ' (termina hoy, y el fin es inclusivo: por eso >= y no >)' : ''}.`
        : `${a.id} terminó el ${a.endDate} < ${today}: vencida, afuera.`, [authRows({ ...tones }), usedMap()]);
      if (ok) kept.push(a);
    });
    const out: Out = [];
    for (const a of kept) {
      const u = used.get(a.id) ?? 0;
      out.push({ id: a.id, remaining: a.approvedUnits - u });
      t.step('.map((a) =>', `${a.id}: ${a.approvedUnits} aprobadas − ${u} usadas = ${fmt(a.approvedUnits - u)}${used.has(a.id) ? '' : ' (no tiene sesiones: el ?? 0 evita un NaN)'}.`, [
        usedMap(undefined, a.id),
        { kind: 'text', label: 'resultado parcial', value: out.map((o) => `${o.id}: ${o.remaining}`).join(' · ') },
      ]);
    }
    out.sort((a, b) => a.remaining - b.remaining);
    if (out.length >= 2) {
      t.step('.sort((a, b) => a.remaining - b.remaining)', `Ordenamos por lo que queda, de menor a mayor: ${out.map((o) => `${o.id} (${o.remaining})`).join(', ')}. La clínica ve primero la que se está por agotar.`, [
        { kind: 'text', label: 'resultado', value: out.map((o) => `${o.id}: ${o.remaining}`).join(' · '), tone: 'found' },
      ]);
    }
    return out;
  },
  extraInputs: () => [
    [[], [], '2026-11-17'],
    [[{ id: 'C1', approvedUnits: 2, endDate: '2026-11-17' }], [{ id: 'x', authId: 'C1', units: 5, status: 'completed' }], '2026-11-17'],
    [AUTHS, [], '2026-11-02'],
  ],
};

export default def;
