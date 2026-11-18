'use client';

/**
 * The feed's side of the JS | TS tabs: the same decision the lesson's CodeTabs
 * makes (src/lib/coding/code-tabs-model.ts, the JS generated from the TS by
 * stripping types), loaded in its own chunk so a lesson without tabs never
 * pays for the transpiler. Gated per lesson by lessonHasCodeTabs, like the
 * lesson view. The feed warms the chunk on mount (warmCodeVariants), so by the
 * time a code card scrolls in the module is usually already here.
 */

import { useEffect, useMemo, useState } from 'react';

type ModelModule = typeof import('@/lib/coding/code-tabs-model');

let loaded: ModelModule | null = null;
let loading: Promise<ModelModule> | null = null;

export function warmCodeVariants(): Promise<ModelModule> {
  loading ??= import('@/lib/coding/code-tabs-model').then((m) => (loaded = m));
  return loading;
}

/** The JS and TS of a TypeScript snippet, or null (tabs off, still loading, or nothing to strip). */
export function useCodeVariants(code: string, enabled: boolean): { js: string; ts: string } | null {
  const [mod, setMod] = useState<ModelModule | null>(loaded);
  useEffect(() => {
    if (!enabled || mod) return;
    let alive = true;
    void warmCodeVariants().then((m) => {
      if (alive) setMod(m);
    });
    return () => {
      alive = false;
    };
  }, [enabled, mod]);
  return useMemo(() => {
    if (!enabled || !mod) return null;
    const model = mod.codeTabsModel(code, 'ts');
    return model.tabs && model.js != null ? { js: model.js, ts: model.ts } : null;
  }, [code, enabled, mod]);
}
