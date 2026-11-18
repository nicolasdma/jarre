'use client';

/**
 * Code as a picture: an editor window (traffic lights, a file name, line
 * numbers, light syntax color), the way people post code screenshots. Two
 * themes: a dark editor and a "printed" paper one. The tokenizer is a few
 * regexes for TypeScript/JavaScript: enough color to read as code, no parser.
 */

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { tokenizeLine } from '../code-tokens';

const THEMES = {
  dark: { bg: '#0d1117', bar: '#161b22', ink: '#e6edf3', dim: '#6e7681', kw: '#ff7b72', str: '#a5d6ff', com: '#8b949e', num: '#79c0ff', fn: '#d2a8ff', fade: '#0d1117' },
  paper: { bg: '#fbfaf6', bar: '#efece3', ink: '#24292f', dim: '#a19d90', kw: '#a626a4', str: '#50a14f', com: '#9a978d', num: '#986801', fn: '#4078f2', fade: '#fbfaf6' },
} as const;

export function CodeImage({
  code,
  filename,
  theme = 'dark',
  maxLines = 14,
  fontSize = 12.5,
  expandable = true,
  className,
}: {
  code: string;
  filename: string;
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

  return (
    <div
      className={cn('overflow-hidden rounded-[10px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]', className)}
      style={{ background: c.bg, color: c.ink }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: c.bar }}>
        <span aria-hidden className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
        <span aria-hidden className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
        <span aria-hidden className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[11px]" style={{ color: c.dim }}>{filename}</span>
      </div>
      <div className="relative">
        <pre className="overflow-x-auto px-3 py-3 font-mono leading-[1.6]" style={{ fontSize }}>
          <code lang="en">
            {shown.map((line, i) => (
              <div key={i} className="whitespace-pre">
                <span aria-hidden className="mr-3 inline-block select-none text-right" style={{ color: c.dim, width: `${gutter}ch` }}>
                  {i + 1}
                </span>
                {tokenizeLine(line).map((tok, j) =>
                  tok.k === 'txt' ? (
                    <span key={j}>{tok.t}</span>
                  ) : (
                    <span key={j} style={{ color: c[tok.k], fontStyle: tok.k === 'com' ? 'italic' : undefined }}>{tok.t}</span>
                  ),
                )}
              </div>
            ))}
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
