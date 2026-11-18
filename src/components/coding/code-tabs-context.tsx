'use client';

/**
 * Whether the current lesson shows code in JS | TS tabs. Provided once near
 * the top of the lesson (LearnFlow) so every code surface under it — the
 * reading markdown, the reference solutions, the Big-O drill — reads the same
 * flag without threading a prop through each layer. No provider → `false`, so
 * any other place that renders this code is untouched.
 */

import { createContext, useContext, useEffect } from 'react';

const CodeTabsContext = createContext<boolean>(false);

export function CodeTabsProvider({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  // Warm the (lazy) tabs chunk when the lesson opts in, so the first block
  // does not flash the plain source before the tabs arrive.
  useEffect(() => {
    if (enabled) void import('./code-tabs');
  }, [enabled]);
  return <CodeTabsContext.Provider value={enabled}>{children}</CodeTabsContext.Provider>;
}

export function useCodeTabsEnabled(): boolean {
  return useContext(CodeTabsContext);
}
