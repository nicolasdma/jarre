'use client';

/**
 * Jarre - Voice Teach Session Hook
 *
 * For Level 3 → 4 advancement: student teaches a concept to a confused AI junior.
 * Similar to useVoiceEvalSession but:
 * - Uses teach prompt (junior role)
 * - 8-minute max duration
 * - Calls /api/evaluate/voice-teach-score for scoring
 * - Returns mastery advancement info
 */

import { useState, useCallback, useRef } from 'react';
import { useVoiceSession, type TutorState } from './use-voice-session';
import { buildVoiceTeachInstruction } from '@/lib/llm/voice-eval-prompts';
import type { Language } from '@/lib/translations';
import type { ConnectionState } from '@/lib/voice/gemini-live';

// ============================================================================
// Types
// ============================================================================

interface UseVoiceTeachSessionParams {
  conceptId: string;
  conceptName: string;
  conceptDefinition: string;
  language: Language;
}

export type VoiceTeachState = 'idle' | 'connecting' | 'teaching' | 'scoring' | 'done' | 'error';

export interface TeachResult {
  responses: Array<{
    questionIndex: number;
    isCorrect: boolean;
    score: number;
    feedback: string;
  }>;
  overallScore: number;
  summary: string;
  masteryAdvanced: boolean;
  previousLevel: number;
  newLevel: number;
}

export interface VoiceTeachSession {
  teachState: VoiceTeachState;
  tutorState: TutorState;
  connectionState: ConnectionState;
  error: string | null;
  elapsed: number;
  teachResult: TeachResult | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const TEACH_MAX_DURATION_MS = 8 * 60 * 1000; // 8 minutes

// ============================================================================
// Hook
// ============================================================================

export function useVoiceTeachSession({
  conceptId,
  conceptName,
  conceptDefinition,
  language,
}: UseVoiceTeachSessionParams): VoiceTeachSession {
  const [teachState, setTeachState] = useState<VoiceTeachState>('idle');
  const [teachResult, setTeachResult] = useState<TeachResult | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);

  const sessionIdForScoring = useRef<string | null>(null);

  const systemInstruction = buildVoiceTeachInstruction({
    conceptName,
    conceptDefinition,
    language,
  });

  const initialMessage = language === 'es'
    ? `Te voy a explicar ${conceptName}.`
    : `I'm going to explain ${conceptName} to you.`;

  const scoreSession = useCallback(async (voiceSessionId: string) => {
    setTeachState('scoring');
    setScoringError(null);

    try {
      const response = await fetch('/api/evaluate/voice-teach-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSessionId, conceptId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to score teaching session');
      }

      const data = await response.json();
      setTeachResult({
        responses: data.responses,
        overallScore: data.overallScore,
        summary: data.summary,
        masteryAdvanced: data.masteryAdvanced,
        previousLevel: data.previousLevel,
        newLevel: data.newLevel,
      });
      setTeachState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed';
      setScoringError(msg);
      setTeachState('error');
    }
  }, [conceptId]);

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
    sessionType: 'evaluation', // Reuse evaluation type for DB tracking
    maxDurationMs: TEACH_MAX_DURATION_MS,
    initialMessage,
  });

  if (voiceSession.sessionId && voiceSession.sessionId !== sessionIdForScoring.current) {
    sessionIdForScoring.current = voiceSession.sessionId;
  }

  const derivedTeachState = (() => {
    if (teachState === 'scoring' || teachState === 'done' || teachState === 'error') {
      return teachState;
    }
    if (voiceSession.connectionState === 'connecting') return 'connecting' as const;
    if (voiceSession.connectionState === 'connected' || voiceSession.connectionState === 'reconnecting') return 'teaching' as const;
    return teachState;
  })();

  const connect = useCallback(async () => {
    setTeachState('connecting');
    setTeachResult(null);
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
    teachState: derivedTeachState,
    tutorState: voiceSession.tutorState,
    connectionState: voiceSession.connectionState,
    error: scoringError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    teachResult,
    connect,
    disconnect,
  };
}
