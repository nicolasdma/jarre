'use client';

/**
 * The visual primitives of a trace step, one component per kind of state
 * (src/lib/code-trace/types.ts). Each draws a full snapshot, emphasised with
 * the same tones everywhere (focus, found, add, drop, visited, muted) so a
 * learner reads one visual language across patterns. Purely presentational:
 * the caption is the text alternative, so the drawings are aria-hidden except
 * for their labels.
 */

import type { ReactNode } from 'react';
import type {
  ArrayViz,
  Cell,
  GraphViz,
  GridViz,
  HeapViz,
  IntervalsViz,
  ListViz,
  MapViz,
  QueueViz,
  SetViz,
  StackViz,
  TextViz,
  Tone,
  TreeViz,
  VarsViz,
  Viz,
} from '@/lib/code-trace/types';
import { cellText } from '@/lib/code-trace/format';
import styles from './code-trace.module.css';

const TONE: Record<Tone, string> = {
  focus: 'border-j-info bg-j-info-bg text-j-text ring-2 ring-j-info/40',
  found: 'border-j-success bg-j-success-bg text-j-success font-semibold',
  add: `border-j-warm-dark bg-j-highlight text-j-text ${styles.flash}`,
  drop: 'border-j-error bg-j-error-bg text-j-error line-through',
  visited: 'border-j-border bg-j-accent-light text-j-text-secondary',
  muted: 'border-j-border bg-j-bg-alt text-j-text-tertiary opacity-50',
};
const BASE = 'border-j-border bg-j-bg-white text-j-text';

/** SVG fills per tone (SVG can't take the Tailwind border/bg classes). */
const SVG_TONE: Record<Tone | 'base', { fill: string; stroke: string; text: string }> = {
  base: { fill: 'var(--j-bg-white)', stroke: 'var(--j-border-input)', text: 'var(--j-text)' },
  focus: { fill: 'var(--j-info-bg)', stroke: 'var(--j-info)', text: 'var(--j-text)' },
  found: { fill: 'var(--j-success-bg)', stroke: 'var(--j-success)', text: 'var(--j-success)' },
  add: { fill: 'var(--j-highlight)', stroke: 'var(--j-warm-dark)', text: 'var(--j-text)' },
  drop: { fill: 'var(--j-error-bg)', stroke: 'var(--j-error)', text: 'var(--j-error)' },
  visited: { fill: 'var(--j-accent-light)', stroke: 'var(--j-border-input)', text: 'var(--j-text-secondary)' },
  muted: { fill: 'var(--j-bg-alt)', stroke: 'var(--j-border)', text: 'var(--j-text-tertiary)' },
};

function same(a: Cell | undefined, b: Cell | undefined): boolean {
  return a !== undefined && b !== undefined && a === b;
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-j-text-tertiary">{children}</p>;
}

function Frame({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      {label && <Label>{label}</Label>}
      {children}
    </div>
  );
}

// ── array ───────────────────────────────────────────────────────────────────

function ArrayView({ v }: { v: ArrayViz }) {
  const tone = new Map(v.marks?.map((m) => [m.index, m.tone]));
  const ptrs = new Map<number, string[]>();
  for (const p of v.pointers ?? []) ptrs.set(p.index, [...(ptrs.get(p.index) ?? []), p.name]);
  const inWindow = (i: number) => !!v.window && i >= v.window.from && i <= v.window.to;
  const showIdx = v.indices !== false;
  // Pointers can sit one past the end (right = n): leave room for them.
  const slots = Math.max(v.items.length, ...[...ptrs.keys()].map((i) => i + 1), 0);
  return (
    <Frame label={v.label}>
      <div className="overflow-x-auto pb-1" aria-hidden>
        <div className="inline-flex flex-col">
          <div className="flex">
            {Array.from({ length: slots }, (_, i) => {
              const t = tone.get(i);
              const exists = i < v.items.length;
              return (
                <div
                  key={i}
                  className={
                    'relative flex h-9 min-w-9 items-center justify-center border px-1.5 font-mono text-sm transition-colors ' +
                    (i > 0 ? '-ml-px ' : '') +
                    (!exists ? 'border-dashed border-j-border text-j-text-tertiary ' : t ? TONE[t] : inWindow(i) ? 'border-j-accent-muted bg-j-accent-light text-j-text' : BASE)
                  }
                >
                  {exists ? cellText(v.items[i]) : ''}
                </div>
              );
            })}
          </div>
          {v.window && (
            <div className="flex">
              {Array.from({ length: slots }, (_, i) => (
                <div key={i} className={'h-1 min-w-9 flex-1 ' + (inWindow(i) ? 'bg-j-accent' : '')} />
              ))}
            </div>
          )}
          {showIdx && (
            <div className="flex">
              {Array.from({ length: slots }, (_, i) => (
                <div key={i} className="min-w-9 flex-1 text-center font-mono text-[10px] text-j-text-tertiary">
                  {i}
                </div>
              ))}
            </div>
          )}
          {ptrs.size > 0 && (
            <div className="flex">
              {Array.from({ length: slots }, (_, i) => (
                <div key={i} className="min-w-9 flex-1 text-center font-mono text-[11px] font-semibold leading-tight text-j-info">
                  {ptrs.has(i) && (
                    <>
                      <span className="block">↑</span>
                      {ptrs.get(i)!.map((n) => (
                        <span key={n} className="block">
                          {n}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {v.window?.label && <p className="mt-1 font-mono text-[11px] text-j-accent">{v.window.label}</p>}
    </Frame>
  );
}

// ── map / set ───────────────────────────────────────────────────────────────

function Probe({ k, found }: { k: Cell; found: boolean }) {
  return (
    <p className="mb-1.5 font-mono text-[11px] text-j-text-secondary">
      buscar <span className="font-semibold text-j-text">{cellText(k)}</span> →{' '}
      <span className={found ? 'font-semibold text-j-success' : 'text-j-error'}>{found ? 'está' : 'no está'}</span>
    </p>
  );
}

function MapView({ v }: { v: MapViz }) {
  return (
    <Frame label={`${v.label} · Map`}>
      {v.probe && <Probe k={v.probe.key} found={v.probe.found} />}
      <div aria-hidden className="inline-block min-w-[9rem] max-w-full overflow-x-auto rounded border border-j-border">
        <div className="flex border-b border-j-border bg-j-bg-alt font-mono text-[10px] uppercase tracking-wider text-j-text-tertiary">
          <span className="w-1/2 min-w-16 px-2 py-1">{v.keyLabel ?? 'clave'}</span>
          <span className="px-2 py-1">{v.valueLabel ?? 'valor'}</span>
        </div>
        {v.entries.length === 0 && <p className="px-2 py-1.5 font-mono text-xs italic text-j-text-tertiary">vacío</p>}
        {v.entries.map((e, n) => {
          const tone: Tone | null = same(e.key, v.hit) ? 'found' : same(e.key, v.flash) ? 'add' : same(e.key, v.dropped) ? 'drop' : same(e.key, v.probe?.key) ? 'focus' : null;
          return (
            <div key={`${String(e.key)}-${n}`} className={'flex border-b border-j-border font-mono text-sm last:border-b-0 ' + (tone ? TONE[tone] : '')}>
              <span className="w-1/2 min-w-16 px-2 py-1">{cellText(e.key)}</span>
              <span className="px-2 py-1">{cellText(e.value)}</span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

function SetView({ v }: { v: SetViz }) {
  return (
    <Frame label={`${v.label} · Set`}>
      {v.probe && <Probe k={v.probe.key} found={v.probe.found} />}
      <div aria-hidden className="flex flex-wrap gap-1.5">
        {v.items.length === 0 && <span className="font-mono text-xs italic text-j-text-tertiary">vacío</span>}
        {v.items.map((it, n) => {
          const tone: Tone | null = same(it, v.hit) ? 'found' : same(it, v.flash) ? 'add' : same(it, v.probe?.key) ? 'focus' : null;
          return (
            <span key={`${String(it)}-${n}`} className={'rounded-full border px-2.5 py-0.5 font-mono text-sm ' + (tone ? TONE[tone] : BASE)}>
              {cellText(it)}
            </span>
          );
        })}
      </div>
    </Frame>
  );
}

// ── stack / queue ───────────────────────────────────────────────────────────

function StackView({ v }: { v: StackViz }) {
  const top = v.items.length - 1;
  return (
    <Frame label={`${v.label} · pila`}>
      <div aria-hidden className="inline-flex min-w-[5rem] flex-col gap-1">
        {v.popped !== undefined && (
          <div className={'rounded border px-3 py-1 text-center font-mono text-sm ' + TONE.drop}>{cellText(v.popped)} ↑ sale</div>
        )}
        {v.items.length === 0 && <div className="rounded border border-dashed border-j-border px-3 py-1 text-center font-mono text-xs italic text-j-text-tertiary">vacía</div>}
        {[...v.items].reverse().map((it, n) => {
          const i = top - n;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className={'min-w-[3rem] rounded border px-3 py-1 text-center font-mono text-sm ' + (i === top && v.pushed ? TONE.add : i === top ? TONE.focus : BASE)}>
                {cellText(it)}
              </div>
              {i === top && <span className="font-mono text-[10px] text-j-text-tertiary">← tope</span>}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

function QueueView({ v }: { v: QueueViz }) {
  const head = v.head ?? 0;
  const last = v.items.length - 1;
  return (
    <Frame label={`${v.label} · cola`}>
      <div aria-hidden className="flex flex-wrap items-center gap-1">
        {v.items.map((it, i) => (
          <span
            key={i}
            className={
              'rounded border px-2 py-0.5 font-mono text-sm ' +
              (i < head ? TONE.muted + ' line-through' : i === head ? TONE.focus : i === last && v.pushed ? TONE.add : BASE)
            }
          >
            {cellText(it)}
          </span>
        ))}
        {v.items.length - head === 0 && <span className="font-mono text-xs italic text-j-text-tertiary">vacía</span>}
      </div>
      {v.items.length - head > 0 && <p className="mt-1 font-mono text-[10px] text-j-text-tertiary">sale por la izquierda · entra por la derecha</p>}
    </Frame>
  );
}

// ── vars / text ─────────────────────────────────────────────────────────────

function VarsView({ v }: { v: VarsViz }) {
  return (
    <div aria-hidden className="flex flex-wrap gap-1.5">
      {v.vars.map((x) => (
        <span
          key={x.name}
          className={'rounded border px-2 py-0.5 font-mono text-sm ' + (x.tone ? TONE[x.tone] : x.changed ? TONE.add : BASE)}
        >
          <span className="text-j-text-secondary">{x.name}</span> = {cellText(x.value)}
        </span>
      ))}
    </div>
  );
}

function TextView({ v }: { v: TextViz }) {
  return (
    <Frame label={v.label}>
      <p aria-hidden className={'inline-block max-w-full break-all rounded border px-2 py-1 font-mono text-sm ' + (v.tone ? TONE[v.tone] : BASE)}>
        {v.value}
      </p>
    </Frame>
  );
}

// ── intervals ───────────────────────────────────────────────────────────────

function IntervalsView({ v }: { v: IntervalsViz }) {
  const all = v.rows.flatMap((r) => r.items);
  if (all.length === 0) return null;
  const min = Math.min(...all.map((i) => i.start));
  const max = Math.max(...all.map((i) => i.end));
  const span = Math.max(1, max - min);
  const pct = (n: number) => `${((n - min) / span) * 100}%`;
  return (
    <div className="min-w-0 space-y-3" aria-hidden>
      {v.rows.map((r) => {
        // Overlapping intervals go to separate lanes, so an overlap is visible as a stack.
        const laneEnds: number[] = [];
        const lanes = r.items.map((it) => {
          let lane = laneEnds.findIndex((end) => it.start > end);
          if (lane === -1) lane = laneEnds.length;
          laneEnds[lane] = it.end;
          return lane;
        });
        const laneCount = Math.max(1, laneEnds.length);
        return (
          <div key={r.label}>
            <Label>{r.label}</Label>
            <div className="relative mx-3" style={{ height: laneCount * 22 + 16 }}>
              <div className="absolute inset-x-0 border-t border-dashed border-j-border" style={{ top: (laneCount * 22) / 2 }} />
              {r.items.length === 0 && <span className="absolute left-0 top-0 font-mono text-xs italic text-j-text-tertiary">vacío</span>}
              {r.items.map((it, n) => (
                <div key={n}>
                  <div
                    className={'absolute h-[18px] rounded border transition-all ' + (it.tone ? TONE[it.tone] : BASE)}
                    style={{ left: pct(it.start), width: `max(6px, calc(${pct(it.end)} - ${pct(it.start)}))`, top: lanes[n] * 22 }}
                  />
                  <span className="absolute -translate-x-1/2 font-mono text-[10px] text-j-text-secondary" style={{ left: pct(it.start), top: laneCount * 22 }}>
                    {it.start}
                  </span>
                  <span className="absolute -translate-x-1/2 font-mono text-[10px] text-j-text-secondary" style={{ left: pct(it.end), top: laneCount * 22 }}>
                    {it.end}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── grid ────────────────────────────────────────────────────────────────────

function GridView({ v }: { v: GridViz }) {
  const tone = new Map(v.marks?.map((m) => [`${m.r},${m.c}`, m.tone]));
  const cell = 'flex h-8 min-w-8 items-center justify-center border px-1 font-mono text-xs';
  return (
    <Frame label={v.label}>
      <div aria-hidden className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col">
          {v.colLabels && (
            <div className="flex">
              {v.rowLabels && <div className="min-w-8" />}
              {v.colLabels.map((c, i) => (
                <div key={i} className="min-w-8 flex-1 text-center font-mono text-[10px] text-j-text-tertiary">
                  {cellText(c)}
                </div>
              ))}
            </div>
          )}
          {v.cells.map((row, r) => (
            <div key={r} className="flex">
              {v.rowLabels && (
                <div className="flex min-w-8 items-center justify-end pr-1.5 font-mono text-[10px] text-j-text-tertiary">{cellText(v.rowLabels[r])}</div>
              )}
              {row.map((c, ci) => {
                const t = tone.get(`${r},${ci}`);
                return (
                  <div key={ci} className={cell + ' -mt-px ' + (ci > 0 ? '-ml-px ' : '') + (t ? TONE[t] : c === null ? 'border-j-border bg-j-bg-alt text-j-text-tertiary' : BASE)}>
                    {c === null ? '' : cellText(c)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

// ── trees ───────────────────────────────────────────────────────────────────

interface Placed {
  id: string;
  value: Cell;
  x: number;
  y: number;
  parent?: string;
}

function layoutTree(v: Pick<TreeViz, 'nodes' | 'root'>): Placed[] {
  const byId = new Map(v.nodes.map((n) => [n.id, n]));
  const out: Placed[] = [];
  let col = 0;
  const walk = (id: string | null, depth: number, parent?: string) => {
    if (!id) return;
    const n = byId.get(id);
    if (!n) return;
    walk(n.left, depth + 1, id);
    out.push({ id, value: n.value, x: col++, y: depth, parent });
    walk(n.right, depth + 1, id);
  };
  walk(v.root, 0);
  return out;
}

function TreeSvg({ v }: { v: Pick<TreeViz, 'nodes' | 'root' | 'marks' | 'notes'> }) {
  const placed = layoutTree(v);
  if (placed.length === 0) return <p className="font-mono text-xs italic text-j-text-tertiary">vacío (null)</p>;
  const tone = new Map(v.marks?.map((m) => [m.id, m.tone]));
  const notes = new Map(v.notes?.map((n) => [n.id, n.text]));
  const DX = 38;
  const DY = 48;
  const R = 15;
  const W = placed.length * DX + 20;
  const H = (Math.max(...placed.map((p) => p.y)) + 1) * DY + 14;
  const pos = new Map(placed.map((p) => [p.id, { x: 10 + p.x * DX + DX / 2, y: 22 + p.y * DY }]));
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-full" style={{ height: 'auto' }}>
      {placed.map((p) => {
        if (!p.parent) return null;
        const a = pos.get(p.parent)!;
        const b = pos.get(p.id)!;
        return <line key={`e-${p.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--j-border-input)" strokeWidth={1.2} />;
      })}
      {placed.map((p) => {
        const c = SVG_TONE[tone.get(p.id) ?? 'base'];
        const at = pos.get(p.id)!;
        const note = notes.get(p.id);
        return (
          <g key={p.id}>
            <circle cx={at.x} cy={at.y} r={R} fill={c.fill} stroke={c.stroke} strokeWidth={tone.get(p.id) ? 2 : 1.2} />
            <text x={at.x} y={at.y + 4} textAnchor="middle" fontSize={11} fontFamily="var(--j-font-mono)" fill={c.text}>
              {cellText(p.value)}
            </text>
            {note && (
              <text x={at.x + R + 2} y={at.y - R + 4} fontSize={9} fontFamily="var(--j-font-mono)" fill="var(--j-info)">
                {note}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TreeView({ v }: { v: TreeViz }) {
  return (
    <Frame label={v.label}>
      <div className="overflow-x-auto">
        <TreeSvg v={v} />
      </div>
    </Frame>
  );
}

function HeapView({ v }: { v: HeapViz }) {
  const nodes = v.items.map((value, i) => ({
    id: String(i),
    value,
    left: 2 * i + 1 < v.items.length ? String(2 * i + 1) : null,
    right: 2 * i + 2 < v.items.length ? String(2 * i + 2) : null,
  }));
  return (
    <div className="space-y-2">
      <ArrayView v={{ kind: 'array', label: v.label, items: v.items, marks: v.marks }} />
      <Frame label="como árbol: los hijos de i son 2i+1 y 2i+2">
        <div className="overflow-x-auto">
          <TreeSvg v={{ nodes, root: v.items.length ? '0' : null, marks: v.marks?.map((m) => ({ id: String(m.index), tone: m.tone })) }} />
        </div>
      </Frame>
    </div>
  );
}

// ── graph ───────────────────────────────────────────────────────────────────

function GraphView({ v }: { v: GraphViz }) {
  const n = v.nodes.length;
  const W = 260;
  const H = n <= 2 ? 90 : 200;
  const cx = W / 2;
  const cy = H / 2;
  const rad = n <= 2 ? 70 : 78;
  const R = 15;
  const pos = new Map(
    v.nodes.map((node, i) => {
      const a = n <= 2 ? Math.PI * i : -Math.PI / 2 + (2 * Math.PI * i) / n;
      return [node.id, { x: cx + rad * Math.cos(a), y: cy + (n <= 2 ? 0 : rad * Math.sin(a)) }];
    }),
  );
  const tone = new Map(v.marks?.map((m) => [m.id, m.tone]));
  return (
    <Frame label={v.label}>
      <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[300px]">
        <defs>
          <marker id="ct-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--j-text-secondary)" />
          </marker>
        </defs>
        {v.edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const c = e.tone ? SVG_TONE[e.tone].stroke : 'var(--j-text-tertiary)';
          return (
            <line
              key={i}
              x1={a.x + ux * R}
              y1={a.y + uy * R}
              x2={b.x - ux * (R + 2)}
              y2={b.y - uy * (R + 2)}
              stroke={c}
              strokeWidth={e.tone ? 2 : 1.2}
              markerEnd={e.directed ? 'url(#ct-arrow)' : undefined}
            />
          );
        })}
        {v.nodes.map((node) => {
          const p = pos.get(node.id)!;
          const c = SVG_TONE[tone.get(node.id) ?? 'base'];
          return (
            <g key={node.id}>
              <circle cx={p.x} cy={p.y} r={R} fill={c.fill} stroke={c.stroke} strokeWidth={tone.get(node.id) ? 2 : 1.2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontFamily="var(--j-font-mono)" fill={c.text}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </Frame>
  );
}

// ── linked list ─────────────────────────────────────────────────────────────

function ListView({ v }: { v: ListViz }) {
  const BW = 44;
  const GAP = 30;
  const W = v.nodes.length * (BW + GAP) + 30;
  const top = 26;
  const H = 96;
  const idx = new Map(v.nodes.map((n, i) => [n.id, i]));
  const xOf = (i: number) => 6 + i * (BW + GAP);
  const tone = new Map(v.marks?.map((m) => [m.id, m.tone]));
  const ptrs = new Map<string, string[]>();
  const nullPtrs: string[] = [];
  for (const p of v.pointers) {
    if (p.id === null) nullPtrs.push(p.name);
    else ptrs.set(p.id, [...(ptrs.get(p.id) ?? []), p.name]);
  }
  return (
    <Frame label={v.label}>
      <div className="overflow-x-auto">
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="max-w-none">
          <defs>
            <marker id="ct-list-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--j-text-secondary)" />
            </marker>
          </defs>
          {v.nodes.map((n, i) => {
            const nxt = v.next[n.id];
            const x = xOf(i);
            if (nxt === null || nxt === undefined) {
              // null sits in the gap to the right, where the arrow would start.
              return (
                <text key={`n-${n.id}`} x={x + BW + 4} y={top + 18} fontSize={11} fill="var(--j-text-tertiary)" fontFamily="var(--j-font-mono)">
                  ∅
                </text>
              );
            }
            const j = idx.get(nxt);
            if (j === undefined) return null;
            const fromX = j > i ? x + BW : x;
            const toX = j > i ? xOf(j) : xOf(j) + BW;
            const y = top + 14;
            if (j === i + 1) return <line key={`n-${n.id}`} x1={fromX} y1={y} x2={toX - 2} y2={y} stroke="var(--j-text-secondary)" strokeWidth={1.3} markerEnd="url(#ct-list-arrow)" />;
            const sx = x + BW / 2;
            const tx = xOf(j) + BW / 2;
            const lift = j < i ? -20 : 46;
            const sy = j < i ? top : top + 28;
            return (
              <path
                key={`n-${n.id}`}
                d={`M ${sx} ${sy} C ${sx} ${top + lift}, ${tx} ${top + lift}, ${tx} ${sy + (j < i ? -2 : 2)}`}
                fill="none"
                stroke="var(--j-text-secondary)"
                strokeWidth={1.3}
                markerEnd="url(#ct-list-arrow)"
              />
            );
          })}
          {v.nodes.map((n, i) => {
            const c = SVG_TONE[tone.get(n.id) ?? 'base'];
            const x = xOf(i);
            const names = ptrs.get(n.id);
            return (
              <g key={n.id}>
                <rect x={x} y={top} width={BW} height={28} rx={4} fill={c.fill} stroke={c.stroke} strokeWidth={tone.get(n.id) ? 2 : 1.2} />
                <text x={x + BW / 2} y={top + 19} textAnchor="middle" fontSize={13} fontFamily="var(--j-font-mono)" fill={c.text}>
                  {cellText(n.value)}
                </text>
                {names && (
                  <text x={x + BW / 2} y={top + 48} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily="var(--j-font-mono)" fill="var(--j-info)">
                    ↑ {names.join(', ')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {nullPtrs.length > 0 && <p className="font-mono text-[11px] font-semibold text-j-info">{nullPtrs.join(', ')} = null</p>}
    </Frame>
  );
}

// ── dispatch ────────────────────────────────────────────────────────────────

export function VizView({ v }: { v: Viz }) {
  switch (v.kind) {
    case 'array':
      return <ArrayView v={v} />;
    case 'map':
      return <MapView v={v} />;
    case 'set':
      return <SetView v={v} />;
    case 'stack':
      return <StackView v={v} />;
    case 'queue':
      return <QueueView v={v} />;
    case 'vars':
      return <VarsView v={v} />;
    case 'text':
      return <TextView v={v} />;
    case 'intervals':
      return <IntervalsView v={v} />;
    case 'grid':
      return <GridView v={v} />;
    case 'tree':
      return <TreeView v={v} />;
    case 'heap':
      return <HeapView v={v} />;
    case 'graph':
      return <GraphView v={v} />;
    case 'list':
      return <ListView v={v} />;
  }
}
