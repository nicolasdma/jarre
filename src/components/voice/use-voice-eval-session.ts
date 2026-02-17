'use client';

/**
 * Jarre - Voice Evaluation Session Hook
 *
 * Wrapper over useVoiceSession that:
 * - Uses evaluation system instruction instead of teaching
 * - Sets 10-minute max duration
 * - After disconnect, calls /api/evaluate/voice-score for scoring
 * - Exposes evaluation state: idle → connecting → conversing → scoring → done
 */

import { useState, useCallback, useRef } from 'react';
import { useVoiceSession, type TutorState } from './use-voice-session';
import { buildVoiceEvalInstruction } from '@/lib/llm/voice-eval-prompts';
import type { Language } from '@/lib/translations';
import type { ConnectionState } from '@/lib/voice/gemini-live';

// ============================================================================
// Types
// ============================================================================

interface ConceptForEval {
  id: string;
  name: string;
  canonical_definition: string;
}

interface UseVoiceEvalSessionParams {
  resourceId: string;
  concepts: ConceptForEval[];
  language: Language;
}

export type VoiceEvalState = 'idle' | 'connecting' | 'conversing' | 'scoring' | 'done' | 'error';

export interface EvaluationResult {
  responses: Array<{
    questionIndex: number;
    isCorrect: boolean;
    score: number;
    feedback: string;
  }>;
  overallScore: number;
  summary: string;
  evaluationId: string | null;
  saved: boolean;
}

export interface VoiceEvalSession {
  evalState: VoiceEvalState;
  tutorState: TutorState;
  connectionState: ConnectionState;
  error: string | null;
  elapsed: number;
  evaluationResult: EvaluationResult | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const EVAL_MAX_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// Hook
// ============================================================================

export function useVoiceEvalSession({
  resourceId,
  concepts,
  language,
}: UseVoiceEvalSessionParams): VoiceEvalSession {
  const [evalState, setEvalState] = useState<VoiceEvalState>('idle');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);

  // Track the session ID for scoring after disconnect
  const sessionIdForScoring = useRef<string | null>(null);

  // Build the evaluation system instruction
  const systemInstruction = buildVoiceEvalInstruction({
    concepts: concepts.map((c) => ({
      name: c.name,
      definition: c.canonical_definition,
    })),
    language,
  });

  const initialMessage = language === 'es'
    ? 'Estoy listo para la evaluación.'
    : 'I\'m ready for the evaluation.';

  // Score the session via the backend
  const scoreSession = useCallback(async (voiceSessionId: string) => {
    setEvalState('scoring');
    setScoringError(null);

    try {
      const response = await fetch('/api/evaluate/voice-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSessionId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to score voice evaluation');
      }

      const data = await response.json();
      setEvaluationResult({
        responses: data.responses,
        overallScore: data.overallScore,
        summary: data.summary,
        evaluationId: data.evaluationId,
        saved: data.saved,
      });
      setEvalState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed';
      setScoringError(msg);
      setEvalState('error');
    }
  }, []);

  // When the AI completes the session (says "quiz"), auto-score
  const handleSessionComplete = useCallback(() => {
    const sid = sessionIdForScoring.current;
    if (sid) {
      scoreSession(sid);
    }
  }, [scoreSession]);

  const voiceSession = useVoiceSession({
    sectionId: '', // Not used for evaluation
    sectionContent: '',
    sectionTitle: '',
    language,
    onSessionComplete: handleSessionComplete,
    systemInstructionOverride: systemInstruction,
    sessionType: 'evaluation',
    resourceId,
    maxDurationMs: EVAL_MAX_DURATION_MS,
    initialMessage,
  });

  // Track session ID for scoring
  if (voiceSession.sessionId && voiceSession.sessionId !== sessionIdForScoring.current) {
    sessionIdForScoring.current = voiceSession.sessionId;
  }

  // Derive eval state from voice session state
  const derivedEvalState = (() => {
    if (evalState === 'scoring' || evalState === 'done' || evalState === 'error') {
      return evalState;
    }
    if (voiceSession.connectionState === 'connecting') return 'connecting' as const;
    if (voiceSession.connectionState === 'connected') return 'conversing' as const;
    return evalState;
  })();

  // Wrap connect to reset state
  const connect = useCallback(async () => {
    setEvalState('connecting');
    setEvaluationResult(null);
    setScoringError(null);
    sessionIdForScoring.current = null;
    await voiceSession.connect();
  }, [voiceSession.connect]);

  // Wrap disconnect to trigger scoring
  const disconnect = useCallback(() => {
    const sid = sessionIdForScoring.current;
    voiceSession.disconnect();
    // Manual disconnect also triggers scoring (unlike teaching mode)
    if (sid) {
      scoreSession(sid);
    }
  }, [voiceSession.disconnect, scoreSession]);

  return {
    evalState: derivedEvalState,
    tutorState: voiceSession.tutorState,
    connectionState: voiceSession.connectionState,
    error: scoringError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    evaluationResult,
    connect,
    disconnect,
  };
}
