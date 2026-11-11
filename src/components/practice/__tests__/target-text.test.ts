import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { toKeyTerm } from '@/lib/practice/key-terms';
import { alignWords } from '@/lib/practice/scoring';
import { TargetText } from '../target-text';

const TERMS = [
  toKeyTerm({ term: 'Supabase', heard_as: ['super bass'], say: 'SÚ-pa-beis' }),
  toKeyTerm({ term: 'row-level security' }),
  toKeyTerm({ term: '45/55', heard_as: ['4555'] }),
];
const TEXT = 'Week one is the foundation: the full schema in Supabase, row-level security on every table, the 45/55 split.';

/** The markup without attributes: tags and text in order, which is what decides the layout besides the classes. */
function skeleton(html: string): string {
  return html.replace(/<(\/?\w+)[^>]*>/g, '<$1>');
}

function render(heard: string | null, opts: { pendingTail?: boolean; showRespelling?: boolean } = {}): string {
  const alignment = alignWords(TEXT, heard ?? '', { terms: TERMS, pendingTail: opts.pendingTail });
  return renderToStaticMarkup(
    createElement(TargetText, { words: alignment.words, terms: TERMS, colored: heard !== null, showRespelling: opts.showRespelling }),
  );
}

describe('TargetText', () => {
  it('renders the same tags and text before, while and after an attempt: no inserted words, no reflow', () => {
    const before = render(null);
    const speaking = render('week one is the maximum foundation the', { pendingTail: true });
    const after = render('week one is the maximum foundation the full payroll in super bass row level on every table the 4555 split');
    expect(skeleton(speaking)).toBe(skeleton(before));
    expect(skeleton(after)).toBe(skeleton(before));
    expect(after).not.toContain('maximum');
    expect(after).not.toContain('payroll');
  });

  it('changes only the color classes between states, never size, weight or spacing', () => {
    const before = render(null);
    const after = render('week one is the foundation the full schema in super bass');
    const layoutClasses = (html: string) =>
      [...html.matchAll(/class="([^"]*)"/g)].map((m) =>
        m[1].split(/\s+/).filter((c) => /^(text-(xs|sm|base|lg|xl|\[)|font-|leading-|tracking-|p[xytrbl]?-|m[xytrbl]?-|gap-|inline|block)/.test(c)).sort().join(' '),
      );
    expect(layoutClasses(after)).toEqual(layoutClasses(before));
    expect(after).toContain('data-word-state="alias"');
    expect(after).toContain('data-word-state="missed"');
  });

  it('puts the respelling under the key terms only when asked', () => {
    expect(render(null)).not.toContain('<rt');
    const on = render(null, { showRespelling: true });
    expect(on.match(/<rt/g)).toHaveLength(1);
    expect(on).toContain('SÚ-pa-beis');
    expect(skeleton(render('week one super bass', { showRespelling: true }))).toBe(skeleton(on));
  });
});
