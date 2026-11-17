'use client';

/**
 * The lesson's coding round, shared by the reading sections (their code
 * exercises) and the mock step. Built once in LearnFlow from the stored
 * interview block; null when the lesson has no coding round.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CodingConfig } from '@/lib/coding/format';
import { loadSolved, markSolved } from './coding-store';

export interface CodingDrillText {
  slug: string;
  title: string;
  textEn: string;
}

interface CodingContextValue {
  resourceId: string;
  config: CodingConfig;
  /** The lesson's drills by slug, for the phrase guides. */
  drills: ReadonlyMap<string, CodingDrillText>;
  solved: Record<string, string>;
  markSolved: (exerciseId: string) => void;
}

const CodingContext = createContext<CodingContextValue | null>(null);

export function useCoding(): CodingContextValue | null {
  return useContext(CodingContext);
}

export function CodingProvider({
  resourceId,
  config,
  drills,
  children,
}: {
  resourceId: string;
  config: CodingConfig;
  drills: CodingDrillText[];
  children: React.ReactNode;
}) {
  const [solved, setSolved] = useState<Record<string, string>>({});
  useEffect(() => setSolved(loadSolved(resourceId)), [resourceId]);
  const mark = useCallback((exerciseId: string) => setSolved(markSolved(resourceId, exerciseId)), [resourceId]);
  const drillMap = useMemo(() => new Map(drills.map((d) => [d.slug, d])), [drills]);
  const value = useMemo(
    () => ({ resourceId, config, drills: drillMap, solved, markSolved: mark }),
    [resourceId, config, drillMap, solved, mark],
  );
  return <CodingContext.Provider value={value}>{children}</CodingContext.Provider>;
}

/** The phrases of a drill, as the guide lists them: its text cut at " / ". */
export function drillPhraseList(text: string): string[] {
  return text
    .split(/\s+\/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
