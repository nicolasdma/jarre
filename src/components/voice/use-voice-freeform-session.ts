'use client';

import { useState, useCallback, useEffect } from 'react';
import { useVoiceSession } from './use-voice-session';
import { buildVoiceFreeformInstruction } from '@/lib/llm/voice-freeform-prompts';
import { formatMemoryForPrompt, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';
import type { Language } from '@/lib/translations';

const log = createLogger('VoiceFreeform');

export type VoiceFreeformState = 'idle' | 'loading' | 'connecting' | 'exploring' | 'done' | 'error';

interface UseVoiceFreeformParams {
  language: Language;
}

interface VoiceFreeformSession {
  state: VoiceFreeformState;
  error: string | null;
  elapsed: number;
  start: () => Promise<void>;
  stop: () => void;
}

export function useVoiceFreeformSession({
  language,
}: UseVoiceFreeformParams): VoiceFreeformSession {
  const [state, setState] = useState<VoiceFreeformState>('idle');
  const [freeformError, setFreeformError] = useState<string | null>(null);
  const [systemInstruction, setSystemInstruction] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);

  const voiceSession = useVoiceSession({
    sectionId: 'freeform', // placeholder key
    sectionContent: '',
    sectionTitle: '',
    language,
    systemInstructionOverride: systemInstruction || undefined,
    sessionType: 'freeform',
    maxDurationMs: 30 * 60 * 1000, // 30 min
    initialMessage,
  });

  useEffect(() => {
    if (state === 'loading' || state === 'done') return;
    if (voiceSession.connectionState === 'connected') setState('exploring');
    else if (voiceSession.connectionState === 'connecting') setState('connecting');
    else if (voiceSession.connectionState === 'error') {
      setState('error');
      setFreeformError(voiceSession.error);
    }
  }, [voiceSession.connectionState, voiceSession.error, state]);

  const start = useCallback(async () => {
    setState('loading');
    setFreeformError(null);

    try {
      // Fetch concept progress, recent activity, and learner memory
      const progressRes = await fetch('/api/voice/freeform/context').then((r) => r.ok ? r.json() : null);

      if (!progressRes) {
        throw new Error('Failed to fetch freeform context');
      }

      const instruction = buildVoiceFreeformInstruction({
        conceptProgress: progressRes.conceptProgress || [],
        recentActivity: progressRes.recentActivity || [],
        learnerMemory: progressRes.learnerMemory || [],
        aggregatedOpenQuestions: progressRes.openQuestions || [],
        language,
      });

      // Inject learner memory
      const memoryText = formatMemoryForPrompt(progressRes.learnerMemory || [], language);
      const fullInstruction = memoryText ? `${instruction}\n\n${memoryText}` : instruction;

      setSystemInstruction(fullInstruction);

      const msg = language === 'es'
        ? 'Estuve pensando en algunas cosas y quiero charlar.'
        : 'I\'ve been thinking about some things and want to chat.';
      setInitialMessage(msg);

      await new Promise((resolve) => setTimeout(resolve, 100));
      await voiceSession.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start freeform session';
      log.error('Freeform start failed:', msg);
      setFreeformError(msg);
      setState('error');
    }
  }, [language, voiceSession]);

  const stop = useCallback(() => {
    voiceSession.disconnect();
    setState('done');
  }, [voiceSession]);

  return {
    state,
    error: freeformError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    start,
    stop,
  };
}
