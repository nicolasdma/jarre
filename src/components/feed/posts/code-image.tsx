'use client';

/**
 * Code as a picture: an editor window (traffic lights, a file name, line
 * numbers, light syntax color), the way people post code screenshots. Two
 * themes: a dark editor and a "printed" paper one. The tokenizer is a few
 * regexes for TypeScript/JavaScript: enough color to read as code, no parser.
 *
 * Long lines soft-wrap with a hanging indent instead of scrolling sideways: in
 * a phone-width card a horizontal scroller hides half the signature with no
 * sign there is more. A wrapped line continues two columns past its own
 * indentation, so the structure still reads, and the line number stays on its
 * first row. The leading spaces stay in the text, so copying keeps them.
 *
 * Optional file tabs in the title bar (the JS | TS variants), drawn as editor
 * tabs: an ARIA tablist whose panel is the code.
 */

import { useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { tokenizeLine } from '../code-tokens';

const THEMES = {
  dark: { bg: '#0d1117', bar: '#161b22', ink: '#e6edf3', dim: '#6e7681', kw: '#ff7b72', str: '#a5d6ff', com: '#8b949e', num: '#79c0ff', fn: '#d2a8ff', fade: '#0d1117' },
  paper: { bg: '#fbfaf6', bar: '#efece3', ink: '#24292f', dim: '#a19d90', kw: '#a626a4', str: '#50a14f', com: '#9a978d', num: '#986801', fn: '#4078f2', fade: '#fbfaf6' },
} as const;

export interface CodeImageTabs {
  /** Accessible name of the tablist. */
  label: string;
  items: { id: string; filename: string }[];
  active: string;
  onSelect: (id: string) => void;
}

/** Editor-style file tabs; Left/Right/Home/End move between them. */
function FileTabs({ tabs, panelId, colors }: { tabs: CodeImageTabs; panelId: string; colors: (typeof THEMES)[keyof typeof THEMES] }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.items.findIndex((t) => t.id === tabs.active);
    const n = tabs.items.length;
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % n;
    else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else return;
    e.preventDefault();
    tabs.onSelect(tabs.items[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={tabs.label} className="ml-2 flex min-w-0 items-end gap-0.5 self-stretch">
      {tabs.items.map((t, n) => {
        const selected = t.id === tabs.active;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[n] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => tabs.onSelect(t.id)}
            onKeyDown={onKeyDown}
            className="-mb-px min-h-[34px] truncate rounded-t-[6px] px-2.5 font-mono text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
            style={selected ? { background: colors.bg, color: colors.ink } : { color: colors.dim }}
          >
            {t.filename}
          </button>
        );
      })}
    </div>
  );
}

export function CodeImage({
  code,
  filename,
  tabs,
  theme = 'dark',
  maxLines = 14,
  fontSize = 12.5,
  expandable = true,
  className,
}: {
  code: string;
  filename: string;
  /** File tabs in the title bar (replace the file name). */
  tabs?: CodeImageTabs;
  theme?: keyof typeof THEMES;
  maxLines?: number;
  fontSize?: number;
  expandable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const lines = useMemo(() => code.replace(/\t/g, '  ').split('\n'), [code]);
  const c = THEMES[theme];
  const clipped = !open && lines.length > maxLines;
  const shown = clipped ? lines.slice(0, maxLines) : lines;
  const gutter = String(lines.length).length;
  const panelId = useId();

  return (
    <div
      className={cn('overflow-hidden rounded-[10px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]', className)}
      style={{ background: c.bg, color: c.ink }}
    >
      <div className={cn('flex items-center gap-1.5 px-3', tabs ? 'pt-1.5' : 'py-2')} style={{ background: c.bar }}>
        <span aria-hidden className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#ff5f57]" />
        <span aria-hidden className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#febc2e]" />
        <span aria-hidden className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#28c840]" />
        {tabs ? (
          <FileTabs tabs={tabs} panelId={panelId} colors={c} />
        ) : (
          <span className="ml-2 font-mono text-[11px]" style={{ color: c.dim }}>{filename}</span>
        )}
      </div>
      <div className="relative" id={panelId} {...(tabs ? { role: 'tabpanel', 'aria-label': tabs.items.find((t) => t.id === tabs.active)?.filename } : {})}>
        <pre className="px-3 py-3 font-mono leading-[1.6]" style={{ fontSize }}>
          <code lang="en">
            {shown.map((line, i) => {
              // Hanging indent: the first row starts at the line's own
              // indentation (its spaces are in the text), continuations two
              // columns further in.
              const hang = (line.match(/^ */)?.[0].length ?? 0) + 2;
              return (
                <div key={i} className="flex">
                  <span aria-hidden className="mr-3 shrink-0 select-none text-right" style={{ color: c.dim, width: `${gutter}ch` }}>
                    {i + 1}
                  </span>
                  <span
                    className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]"
                    style={{ paddingLeft: `${hang}ch`, textIndent: `-${hang}ch` }}
                  >
                    {line === ''
                      ? ' '
                      : tokenizeLine(line).map((tok, j) =>
                          tok.k === 'txt' ? (
                            <span key={j}>{tok.t}</span>
                          ) : (
                            <span key={j} style={{ color: c[tok.k], fontStyle: tok.k === 'com' ? 'italic' : undefined }}>{tok.t}</span>
                          ),
                        )}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
        {clipped && expandable && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 pt-10" style={{ background: `linear-gradient(to top, ${c.fade} 40%, transparent)` }}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full px-3 py-1 font-mono text-[11px] focus-visible:outline focus-visible:outline-2"
              style={{ background: c.bar, color: c.ink }}
            >
              ver las {lines.length} líneas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
