'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVoiceSession } from './use-voice-session';
import { buildVoiceDebateInstruction } from '@/lib/llm/voice-debate-prompts';
import { formatMemoryForPrompt, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';
import type { Language } from '@/lib/translations';

const log = createLogger('VoiceDebate');

export type VoiceDebateState = 'idle' | 'loading' | 'connecting' | 'debating' | 'done' | 'error';

interface DebateTopic {
  topic: string;
  position: string;
  conceptIds: string[];
}

interface UseVoiceDebateParams {
  debateTopic: DebateTopic;
  language: Language;
}

interface VoiceDebateSession {
  state: VoiceDebateState;
  error: string | null;
  elapsed: number;
  start: () => Promise<void>;
  stop: () => void;
}

export function useVoiceDebateSession({
  debateTopic,
  language,
}: UseVoiceDebateParams): VoiceDebateSession {
  const [state, setState] = useState<VoiceDebateState>('idle');
  const [debateError, setDebateError] = useState<string | null>(null);
  const [systemInstruction, setSystemInstruction] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [conceptIds, setConceptIds] = useState<string[]>([]);

  const voiceSession = useVoiceSession({
    sectionId: `debate-${debateTopic.topic}`, // placeholder key
    sectionContent: '',
    sectionTitle: '',
    language,
    systemInstructionOverride: systemInstruction || undefined,
    sessionType: 'debate',
    maxDurationMs: 15 * 60 * 1000, // 15 min
    initialMessage,
    conceptIds,
  });

  useEffect(() => {
    if (state === 'loading' || state === 'done') return;
    if (voiceSession.connectionState === 'connected') setState('debating');
    else if (voiceSession.connectionState === 'connecting') setState('connecting');
    else if (voiceSession.connectionState === 'error') {
      setState('error');
      setDebateError(voiceSession.error);
    }
  }, [voiceSession.connectionState, voiceSession.error, state]);

  const start = useCallback(async () => {
    setState('loading');
    setDebateError(null);

    try {
      // Fetch concept definitions and learner memory for debate concepts
      const contextUrl = new URL('/api/voice/session/context', window.location.origin);
      contextUrl.searchParams.set('sectionId', 'debate'); // placeholder
      if (debateTopic.conceptIds.length > 0) {
        contextUrl.searchParams.set('conceptIds', debateTopic.conceptIds.join(','));
      }

      const contextRes = await fetch(contextUrl.toString());
      const context = contextRes.ok ? await contextRes.json() : {};

      // Fetch concept definitions
      const defsRes = await fetch(`/api/concepts/definitions?ids=${debateTopic.conceptIds.join(',')}`).catch(() => null);
      const defsData = defsRes?.ok ? await defsRes.json() : { definitions: {} };

      const learnerMemory: LearnerConceptMemory[] = context.learnerMemory || [];
      setConceptIds(debateTopic.conceptIds);

      const instruction = buildVoiceDebateInstruction({
        topic: debateTopic.topic,
        position: debateTopic.position,
        conceptIds: debateTopic.conceptIds,
        conceptDefinitions: defsData.definitions || {},
        learnerMemory,
        language,
      });

      // Inject learner memory
      const memoryText = formatMemoryForPrompt(learnerMemory, language);
      const fullInstruction = memoryText ? `${instruction}\n\n${memoryText}` : instruction;

      setSystemInstruction(fullInstruction);

      const msg = language === 'es'
        ? `No estoy de acuerdo con que "${debateTopic.position}". Debatamos.`
        : `I disagree that "${debateTopic.position}". Let's debate.`;
      setInitialMessage(msg);

      await new Promise((resolve) => setTimeout(resolve, 100));
      await voiceSession.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start debate';
      log.error('Debate start failed:', msg);
      setDebateError(msg);
      setState('error');
    }
  }, [debateTopic, language, voiceSession]);

  const stop = useCallback(() => {
    voiceSession.disconnect();
    setState('done');
  }, [voiceSession]);

  return {
    state,
    error: debateError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    start,
    stop,
  };
}
