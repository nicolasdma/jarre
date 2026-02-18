'use client';

/**
 * Jarre - Voice Practice Session Hook
 *
 * Wrapper over useVoiceSession for guided practice (Socratic mentor mode).
 * - Uses practice system instruction (mentor guides, confirms, hints)
 * - Sets 7-minute max duration
 * - After disconnect, calls /api/evaluate/voice-practice-score
 * - Exposes practice state: idle → connecting → practicing → scoring → done
 * - Score is a gate (>=70%) — NOT saved to evaluations
 */

import { useState, useCallback, useRef } from 'react';
import { useVoiceSession, type TutorState } from './use-voice-session';
import { buildVoicePracticeInstruction } from '@/lib/llm/voice-practice-prompts';
import type { Language } from '@/lib/translations';
import type { ConnectionState } from '@/lib/voice/gemini-live';

// ============================================================================
// Types
// ============================================================================

interface ConceptForPractice {
  id: string;
  name: string;
  canonical_definition: string;
}

interface UseVoicePracticeSessionParams {
  resourceId: string;
  concepts: ConceptForPractice[];
  language: Language;
}

export type VoicePracticeState = 'idle' | 'connecting' | 'practicing' | 'scoring' | 'done' | 'error';

interface ConceptConsolidation {
  conceptName: string;
  idealAnswer: string;
  divergence: string;
  connections: string;
  reviewSuggestion: string;
}

interface PracticeResult {
  responses: Array<{
    questionIndex: number;
    isCorrect: boolean;
    score: number;
    feedback: string;
    neededHelp: boolean;
    understood: boolean;
    misconceptions?: string[];
    strengths?: string[];
  }>;
  overallScore: number;
  summary: string;
  passedGate: boolean;
  consolidation: ConceptConsolidation[];
}

interface VoicePracticeSession {
  practiceState: VoicePracticeState;
  tutorState: TutorState;
  connectionState: ConnectionState;
  error: string | null;
  elapsed: number;
  practiceResult: PracticeResult | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const PRACTICE_MAX_DURATION_MS = 7 * 60 * 1000; // 7 minutes

// ============================================================================
// Hook
// ============================================================================

export function useVoicePracticeSession({
  resourceId,
  concepts,
  language,
}: UseVoicePracticeSessionParams): VoicePracticeSession {
  const [practiceState, setPracticeState] = useState<VoicePracticeState>('idle');
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);

  const sessionIdForScoring = useRef<string | null>(null);

  const systemInstruction = buildVoicePracticeInstruction({
    concepts: concepts.map((c) => ({
      name: c.name,
      definition: c.canonical_definition,
    })),
    language,
  });

  const initialMessage = language === 'es'
    ? 'Estoy listo para practicar.'
    : 'I\'m ready to practice.';

  const scoreSession = useCallback(async (voiceSessionId: string) => {
    setPracticeState('scoring');
    setScoringError(null);

    try {
      const response = await fetch('/api/evaluate/voice-practice-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSessionId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to score voice practice');
      }

      const data = await response.json();
      setPracticeResult({
        responses: data.responses,
        overallScore: data.overallScore,
        summary: data.summary,
        passedGate: data.passedGate,
        consolidation: data.consolidation || [],
      });
      setPracticeState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed';
      setScoringError(msg);
      setPracticeState('error');
    }
  }, []);

  const handleSessionComplete = useCallback(() => {
    const sid = sessionIdForScoring.current;
    if (sid) {
      scoreSession(sid);
    }
  }, [scoreSession]);

  const voiceSession = useVoiceSession({
    sectionId: '',
    sectionContent: '',
    sectionTitle: '',
    language,
    onSessionComplete: handleSessionComplete,
    systemInstructionOverride: systemInstruction,
    sessionType: 'practice',
    resourceId,
    maxDurationMs: PRACTICE_MAX_DURATION_MS,
    initialMessage,
  });

  if (voiceSession.sessionId && voiceSession.sessionId !== sessionIdForScoring.current) {
    sessionIdForScoring.current = voiceSession.sessionId;
  }

  const derivedPracticeState = (() => {
    if (practiceState === 'scoring' || practiceState === 'done' || practiceState === 'error') {
      return practiceState;
    }
    if (voiceSession.connectionState === 'connecting') return 'connecting' as const;
    if (voiceSession.connectionState === 'connected' || voiceSession.connectionState === 'reconnecting') return 'practicing' as const;
    return practiceState;
  })();

  const connect = useCallback(async () => {
    setPracticeState('connecting');
    setPracticeResult(null);
    setScoringError(null);
    sessionIdForScoring.current = null;
    await voiceSession.connect();
  }, [voiceSession.connect]);

  const disconnect = useCallback(() => {
    const sid = sessionIdForScoring.current;
    voiceSession.disconnect();
    if (sid) {
      scoreSession(sid);
    }
  }, [voiceSession.disconnect, scoreSession]);

  return {
    practiceState: derivedPracticeState,
    tutorState: voiceSession.tutorState,
    connectionState: voiceSession.connectionState,
    error: scoringError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    practiceResult,
    connect,
    disconnect,
  };
}
