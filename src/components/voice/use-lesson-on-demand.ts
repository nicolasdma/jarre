'use client';

/**
 * Jarre - The section tutor's other sections on demand, inside a live call
 *
 * Glue between useVoiceSession and LessonOnDemand (src/lib/tutor/section-tools.ts):
 * detects the sections the learner names, sends their notes as context when
 * the tutor's turn ends, answers the tool calls from the lesson the page
 * already has, and exposes the "Ir a la sección N" chip. One LessonOnDemand
 * per connection: a reconnect starts a fresh context, so the notes go again.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { FunctionCall, FunctionResponse } from '@google/genai';
import { buildLessonMap, sectionsNamedIn } from '@/lib/tutor/lesson-map';
import { LessonOnDemand, type SectionChip } from '@/lib/tutor/section-tools';
import type { EvidenceRow } from '@/lib/tutor/evidence';
import { createLogger } from '@/lib/logger';

const log = createLogger('LessonOnDemand');

interface LiveHandles {
  sendText: (text: string, options?: { respond?: boolean }) => void;
  sendToolResponse: (responses: FunctionResponse[]) => void;
  lessonMemory: { evidence: EvidenceRow[] } | null;
}

export function useLessonOnDemand(
  lesson: { sections: { id?: string; conceptId?: string; title: string; content: string }[] } | null,
  sectionId: string,
) {
  const map = useMemo(() => (lesson ? buildLessonMap(lesson.sections) : null), [lesson]);
  const focusIndex = useMemo(() => Math.max(0, lesson?.sections.findIndex((s) => s.id === sectionId) ?? 0), [lesson, sectionId]);
  const liveRef = useRef<LiveHandles | null>(null);
  const stateRef = useRef<LessonOnDemand | null>(null);
  const [chip, setChip] = useState<SectionChip | null>(null);

  const fresh = useCallback(() => {
    if (!map || !lesson) return null;
    stateRef.current = new LessonOnDemand(
      map,
      lesson.sections.map((s) => s.content),
      focusIndex,
      () => liveRef.current?.lessonMemory?.evidence ?? [],
    );
    return stateRef.current;
  }, [map, lesson, focusIndex]);

  const state = useCallback(() => stateRef.current ?? fresh(), [fresh]);

  /** A new session or a reconnect: its context has none of the notes. */
  const reset = useCallback(() => {
    fresh();
    setChip(null);
  }, [fresh]);

  const onUtterance = useCallback(
    (role: 'user' | 'model', text: string) => {
      if (role !== 'user' || !map) return;
      const named = sectionsNamedIn(text, map).filter((n) => n !== focusIndex + 1);
      if (named.length) state()?.learnerNamed(named);
    },
    [map, focusIndex, state],
  );

  const onModelTurnComplete = useCallback(() => {
    const notes = state()?.takePendingNotes() ?? [];
    if (!notes.length || !liveRef.current) return;
    log.info(`[Notes] Injecting section(s) ${notes.map((x) => x.n).join(', ')}`);
    liveRef.current.sendText(notes.map((x) => x.text).join('\n\n'), { respond: false });
  }, [state]);

  const onToolCall = useCallback(
    (calls: FunctionCall[]) => {
      const s = state();
      if (!s || !liveRef.current) return;
      const outcome = s.answer(calls);
      if (outcome.chip) setChip(outcome.chip);
      liveRef.current.sendToolResponse(outcome.responses);
    },
    [state],
  );

  const bind = useCallback((live: LiveHandles) => {
    liveRef.current = live;
  }, []);
  const clearChip = useCallback(() => setChip(null), []);

  return {
    enabled: !!map && map.length > 1,
    chip,
    clearChip,
    reset,
    bind,
    onUtterance,
    onModelTurnComplete,
    onToolCall,
  };
}
