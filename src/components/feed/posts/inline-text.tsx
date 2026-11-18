'use client';

/**
 * Lesson text with its `inline code` rendered as code (the lesson JSON writes
 * code in backticks), so "`[10, 9, 1].sort()`" reads as code on a card instead
 * of showing the backticks. Bold (**…**) is shown as bold. Nothing else is
 * interpreted.
 */

import { Fragment } from 'react';

export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              className="rounded-[5px] px-[0.3em] py-[0.05em] font-mono text-[0.88em]"
              style={{ background: 'color-mix(in srgb, currentColor 13%, transparent)' }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
