'use client';

/**
 * Loads the JS | TS tabs (and the Sucrase transform behind them) in a split
 * chunk, so lessons that don't use the tabs never pay for them. While the
 * chunk arrives, the plain snippet is already on screen as the fallback, so
 * there is no empty gap. Every code surface in a tabbed lesson renders through
 * here.
 */

import { lazy, Suspense } from 'react';
import { CodeBlock } from './code-block';

const CodeTabs = lazy(() => import('./code-tabs'));

export function CodeTabsBlock({ code, lang }: { code: string; lang?: string }) {
  return (
    <Suspense fallback={<CodeBlock code={code} />}>
      <CodeTabs code={code} lang={lang} />
    </Suspense>
  );
}
