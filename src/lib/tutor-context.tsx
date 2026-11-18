'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { VoiceMode, ConceptForSession } from '@/lib/llm/voice-unified-prompt';

interface TutorContextOverride {
  mode: VoiceMode;
  resourceId?: string;
  concepts?: ConceptForSession[];
  resourceTitle?: string;
  sectionId?: string;
  sectionContent?: string;
  sectionTitle?: string;
  /**
   * Every section of the lesson, so the section tutor (VoicePanel) knows the
   * whole lesson: its map, any section on demand, and where to send the learner.
   */
  lessonSections?: { id?: string; conceptId?: string; title: string; content: string }[];
  /** Opens a section of the lesson (the tutor's "Ir a la sección N"). */
  goToSection?: (index: number) => void;
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
