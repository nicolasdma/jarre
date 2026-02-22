'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { VoiceMode, ConceptForSession } from '@/lib/llm/voice-unified-prompt';

interface TutorContextOverride {
  mode: VoiceMode;
  resourceId?: string;
  concepts?: ConceptForSession[];
  resourceTitle?: string;
  sectionId?: string;
}

interface TutorContextValue {
  override: TutorContextOverride | null;
  setOverride: (override: TutorContextOverride | null) => void;
}

const TutorContext = createContext<TutorContextValue>({
  override: null,
  setOverride: () => {},
});

export function TutorContextProvider({ children }: { children: ReactNode }) {
  const [override, setOverride] = useState<TutorContextOverride | null>(null);
  return (
    <TutorContext.Provider value={{ override, setOverride }}>
      {children}
    </TutorContext.Provider>
  );
}

export function useTutorContext() {
  return useContext(TutorContext);
}
