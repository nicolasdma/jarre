'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useVoiceSession } from './use-voice-session';
import { buildVoiceExplorationInstruction } from '@/lib/llm/voice-exploration-prompts';
import { formatMemoryForPrompt, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';
import type { Language } from '@/lib/translations';

const log = createLogger('VoiceExploration');

export type VoiceExplorationState = 'idle' | 'loading' | 'connecting' | 'exploring' | 'summarizing' | 'done' | 'error';

interface UseVoiceExplorationParams {
  userResourceId: string;
  language: Language;
  onComplete?: (result: ExplorationResult) => void;
}

interface ExplorationResult {
  summary: string | null;
  discoveredConnections: number;
  openQuestions: string[];
}

interface VoiceExplorationSession {
  state: VoiceExplorationState;
  error: string | null;
  elapsed: number;
  start: () => Promise<void>;
  stop: () => void;
  result: ExplorationResult | null;
}

export function useVoiceExplorationSession({
  userResourceId,
  language,
  onComplete,
}: UseVoiceExplorationParams): VoiceExplorationSession {
  const [state, setState] = useState<VoiceExplorationState>('idle');
  const [explorationError, setExplorationError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplorationResult | null>(null);
  const [systemInstruction, setSystemInstruction] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [conceptIds, setConceptIds] = useState<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Use the base voice session hook once we have the system instruction
  const voiceSession = useVoiceSession({
    sectionId: userResourceId, // Used as session key (exploration doesn't need real sectionId)
    sectionContent: '', // Not used when systemInstructionOverride is set
    sectionTitle: '', // Not used when systemInstructionOverride is set
    language,
    systemInstructionOverride: systemInstruction || undefined,
    sessionType: 'exploration',
    maxDurationMs: 20 * 60 * 1000, // 20 min
    initialMessage,
    conceptIds,
  });

  // Map voice session states to exploration states
  useEffect(() => {
    if (state === 'loading' || state === 'summarizing' || state === 'done') return;

    if (voiceSession.connectionState === 'connected') {
      setState('exploring');
    } else if (voiceSession.connectionState === 'connecting') {
      setState('connecting');
    } else if (voiceSession.connectionState === 'error') {
      setState('error');
      setExplorationError(voiceSession.error);
    }
  }, [voiceSession.connectionState, voiceSession.error, state]);

  const start = useCallback(async () => {
    setState('loading');
    setExplorationError(null);
    setResult(null);

    try {
      // Fetch exploration context
      const contextUrl = new URL('/api/voice/session/context', window.location.origin);
      contextUrl.searchParams.set('userResourceId', userResourceId);

      const res = await fetch(contextUrl.toString());
      if (!res.ok) throw new Error('Failed to fetch resource context');
      const context = await res.json();

      if (!context.resource) {
        throw new Error('Resource not found');
      }

      // Build system instruction from exploration context
      const links = (context.links || []).map((l: any) => ({
        extractedName: l.extracted_concept_name || l.extractedConceptName,
        relationship: l.relationship,
        curriculumConceptName: l.conceptName,
        curriculumDefinition: l.conceptDefinition || '',
        explanation: l.explanation || '',
      }));

      const conceptProgress = (context.links || []).map((l: any) => ({
        conceptName: l.conceptName,
        level: l.masteryLevel || 0,
      }));

      // Set concept IDs for learner memory
      const cIds = (context.links || []).map((l: any) => l.concept_id).filter(Boolean);
      setConceptIds(cIds);

      let instruction = buildVoiceExplorationInstruction({
        resource: {
          title: context.resource.title,
          type: context.resource.type,
          summary: context.resource.summary || '',
          userNotes: context.resource.user_notes,
        },
        links,
        conceptProgress,
        language,
      });

      // Inject learner memory if available
      const learnerMemory: LearnerConceptMemory[] = context.learnerMemory || [];
      const memoryText = formatMemoryForPrompt(learnerMemory, language);
      if (memoryText) {
        instruction += `\n\n${memoryText}`;
      }

      setSystemInstruction(instruction);

      const msg = language === 'es'
        ? `Vi "${context.resource.title}" y quiero discutirlo.`
        : `I watched/read "${context.resource.title}" and I want to discuss it.`;
      setInitialMessage(msg);

      // Small delay to let state propagate, then connect
      await new Promise((resolve) => setTimeout(resolve, 100));
      await voiceSession.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start exploration';
      log.error('Exploration start failed:', msg);
      setExplorationError(msg);
      setState('error');
    }
  }, [userResourceId, language, voiceSession]);

  const stop = useCallback(async () => {
    voiceSession.disconnect();

    // Generate summary if we had a session
    const sessionId = voiceSession.sessionId;
    if (sessionId) {
      setState('summarizing');
      try {
        const res = await fetch('/api/resources/exploration-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userResourceId }),
        });

        if (res.ok) {
          const data = await res.json();
          const explorationResult: ExplorationResult = {
            summary: data.summary,
            discoveredConnections: data.discoveredConnections?.length || 0,
            openQuestions: data.openQuestions || [],
          };
          setResult(explorationResult);
          onCompleteRef.current?.(explorationResult);
        }
      } catch (err) {
        log.error('Exploration summary failed:', err);
      }
    }

    setState('done');
  }, [voiceSession, userResourceId]);

  return {
    state,
    error: explorationError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    start,
    stop,
    result,
  };
}
