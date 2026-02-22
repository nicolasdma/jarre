'use client';

/**
 * Jarre - Unified Voice Session Hook
 *
 * Single hook that replaces all 6 mode-specific voice hooks.
 * Wraps useVoiceSession with:
 * - Mode-specific prompt building via buildUnifiedSystemInstruction
 * - Tool call handling (scroll, show_definition, end_session, mark_discussed)
 * - Post-session scoring/summarizing per mode
 * - Unified state machine
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVoiceSession, type TutorState } from './use-voice-session';
import type { FunctionResponse } from '@google/genai';
import {
  buildUnifiedSystemInstruction,
  type VoiceMode,
  type ModeParams,
  type SessionContext,
  type ContextStaleness,
  type ConceptForSession,
} from '@/lib/llm/voice-unified-prompt';
import { formatMemoryForPrompt, type LearnerConceptMemory } from '@/lib/learner-memory';
import { TUTOR_TOOLS } from '@/lib/voice/tool-declarations';
import { handleToolCall, type ToolAction, type ToolDispatch } from '@/lib/voice/tool-handler';
import { createLogger } from '@/lib/logger';
import type { Language } from '@/lib/translations';
import type { FunctionCall } from '@google/genai';

const log = createLogger('UnifiedVoice');

// ============================================================================
// Types
// ============================================================================

export type UnifiedSessionState =
  | 'idle'
  | 'loading'       // fetching context
  | 'connecting'
  | 'active'        // conversation in progress
  | 'scoring'       // post-session scoring (eval/practice/teach)
  | 'summarizing'   // post-session summary (exploration)
  | 'done'
  | 'error';

// ---- Result types per mode ----

interface ConceptConsolidation {
  conceptName: string;
  idealAnswer: string;
  divergence: string;
  connections: string;
  reviewSuggestion: string;
}

export interface EvalResult {
  responses: Array<{
    questionIndex: number;
    isCorrect: boolean;
    score: number;
    feedback: string;
    misconceptions?: string[];
    strengths?: string[];
  }>;
  overallScore: number;
  summary: string;
  evaluationId: string | null;
  saved: boolean;
  consolidation: ConceptConsolidation[];
}

export interface PracticeResult {
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

export interface ExplorationResult {
  summary: string | null;
  discoveredConnections: number;
  openQuestions: string[];
}

export type UnifiedSessionResult =
  | { mode: 'eval'; evaluationResult: EvalResult }
  | { mode: 'practice'; practiceResult: PracticeResult }
  | { mode: 'teach'; teachResult: TeachResult }
  | { mode: 'exploration'; explorationResult: ExplorationResult }
  | { mode: 'debate' }
  | { mode: 'freeform' };

// ---- Params ----

interface DebateTopic {
  topic: string;
  position: string;
  conceptIds: string[];
}

export interface UseUnifiedVoiceSessionParams {
  mode: VoiceMode;
  language: Language;

  // Eval/Practice/Learning
  resourceId?: string;
  concepts?: ConceptForSession[];
  masteryLevel?: number;
  resourceTitle?: string;

  // Exploration
  userResourceId?: string;

  // Debate
  debateTopic?: DebateTopic;

  // Teach
  conceptForTeach?: ConceptForSession;

  // Learning (sidebar tutor) — sectionId for DB type 'teaching'
  sectionId?: string;

  // Tool handling
  onToolAction?: ToolDispatch;

  // Completion callbacks
  onSessionComplete?: () => void;
  onExplorationComplete?: (result: ExplorationResult) => void;
}

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

export interface UnifiedVoiceSession {
  state: UnifiedSessionState;
  tutorState: TutorState;
  error: string | null;
  elapsed: number;
  sessionId: string | null;
  result: UnifiedSessionResult | null;
  /** Live transcript entries */
  transcript: TranscriptEntry[];
  /** Mic MediaStream for audio level analysis */
  stream: MediaStream | null;
  /** AnalyserNode for tutor playback audio frequency data */
  playbackAnalyser: AnalyserNode | null;

  start: () => Promise<void>;
  stop: () => void;
  retryPostProcess: () => void;
}

// ============================================================================
// Session type mapping
// ============================================================================

function sessionTypeForMode(mode: VoiceMode): 'teaching' | 'evaluation' | 'practice' | 'exploration' | 'freeform' | 'debate' {
  switch (mode) {
    case 'eval': return 'evaluation';
    case 'teach': return 'evaluation'; // Reuses evaluation type in DB
    case 'practice': return 'practice';
    case 'exploration': return 'exploration';
    case 'debate': return 'debate';
    case 'freeform': return 'freeform';
    case 'learning': return 'teaching';
  }
}

function sectionIdForMode(mode: VoiceMode, params: UseUnifiedVoiceSessionParams): string {
  switch (mode) {
    case 'exploration': return params.userResourceId || '';
    case 'debate': return `debate-${params.debateTopic?.topic || ''}`;
    case 'freeform': return 'freeform';
    case 'learning': return params.sectionId || '';
    default: return '';
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useUnifiedVoiceSession(params: UseUnifiedVoiceSessionParams): UnifiedVoiceSession {
  const {
    mode,
    language,
    resourceId,
    concepts,
    masteryLevel,
    resourceTitle,
    userResourceId,
    debateTopic,
    conceptForTeach,
    onToolAction,
    onSessionComplete,
    onExplorationComplete,
  } = params;

  const [state, setState] = useState<UnifiedSessionState>('idle');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [result, setResult] = useState<UnifiedSessionResult | null>(null);
  const [systemInstruction, setSystemInstruction] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [fetchedConceptIds, setFetchedConceptIds] = useState<string[]>([]);

  const sessionIdRef = useRef<string | null>(null);
  const postProcessStartedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const onToolActionRef = useRef(onToolAction);
  onToolActionRef.current = onToolAction;
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;
  const onExplorationCompleteRef = useRef(onExplorationComplete);
  onExplorationCompleteRef.current = onExplorationComplete;

  // ---- Tool call handling ----

  // Refs to break circular dependencies: handleGeminiToolCall needs handleSessionComplete
  // and sendToolResponse, but both are defined later.
  const sendToolResponseRef = useRef<(r: FunctionResponse[]) => void>(() => {});
  const handleSessionCompleteRef = useRef<() => void>(() => {});

  const handleGeminiToolCall = useCallback((functionCalls: FunctionCall[]) => {
    for (const call of functionCalls) {
      const result = handleToolCall(call, (action) => {
        onToolActionRef.current?.(action);
        if (action.type === 'END_SESSION') {
          handleSessionCompleteRef.current();
        }
      });
      sendToolResponseRef.current([{
        id: call.id,
        name: call.name!,
        response: { output: result },
      } as FunctionResponse]);
    }
  }, []);

  // ---- Post-session scoring ----

  const scoreEvalSession = useCallback(async (voiceSessionId: string) => {
    setState('scoring');
    try {
      const res = await fetch('/api/evaluate/voice-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSessionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to score evaluation');
      }
      const data = await res.json();
      setResult({
        mode: 'eval',
        evaluationResult: {
          responses: data.responses,
          overallScore: data.overallScore,
          summary: data.summary,
          evaluationId: data.evaluationId,
          saved: data.saved,
          consolidation: data.consolidation || [],
        },
      });
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed';
      setSessionError(msg);
      setState('error');
    }
  }, []);

  const scorePracticeSession = useCallback(async (voiceSessionId: string) => {
    setState('scoring');
    try {
      const res = await fetch('/api/evaluate/voice-practice-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSessionId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to score practice');
      }
      const data = await res.json();
      setResult({
        mode: 'practice',
        practiceResult: {
          responses: data.responses,
          overallScore: data.overallScore,
          summary: data.summary,
          passedGate: data.passedGate,
          consolidation: data.consolidation || [],
        },
      });
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed';
      setSessionError(msg);
      setState('error');
    }
  }, []);

  const scoreTeachSession = useCallback(async (voiceSessionId: string) => {
    setState('scoring');
    try {
      const res = await fetch('/api/evaluate/voice-teach-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSessionId, conceptId: conceptForTeach?.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to score teaching');
      }
      const data = await res.json();
      setResult({
        mode: 'teach',
        teachResult: {
          responses: data.responses,
          overallScore: data.overallScore,
          summary: data.summary,
          masteryAdvanced: data.masteryAdvanced,
          previousLevel: data.previousLevel,
          newLevel: data.newLevel,
        },
      });
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed';
      setSessionError(msg);
      setState('error');
    }
  }, [conceptForTeach?.id]);

  const generateExplorationSummary = useCallback(async (sessionId: string) => {
    setState('summarizing');
    try {
      const res = await fetch('/api/resources/exploration-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userResourceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate summary');
      }
      const data = await res.json();
      const explorationResult: ExplorationResult = {
        summary: data.summary,
        discoveredConnections: data.discoveredConnections?.length || 0,
        openQuestions: data.openQuestions || [],
      };
      setResult({ mode: 'exploration', explorationResult });
      setState('done');
      onExplorationCompleteRef.current?.(explorationResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Summary failed';
      setSessionError(msg);
      setState('error');
    }
  }, [userResourceId]);

  // ---- Post-session dispatch ----

  const runPostProcess = useCallback(async (sessionId: string) => {
    switch (mode) {
      case 'eval':
        await scoreEvalSession(sessionId);
        break;
      case 'practice':
        await scorePracticeSession(sessionId);
        break;
      case 'teach':
        await scoreTeachSession(sessionId);
        break;
      case 'exploration':
        await generateExplorationSummary(sessionId);
        break;
      case 'debate':
        setResult({ mode: 'debate' });
        setState('done');
        break;
      case 'freeform':
        setResult({ mode: 'freeform' });
        setState('done');
        break;
      case 'learning':
        setResult({ mode: 'freeform' });
        setState('done');
        break;
    }
  }, [mode, scoreEvalSession, scorePracticeSession, scoreTeachSession, generateExplorationSummary]);

  // ---- Handle session completion (from keyword or tool call) ----

  const handleSessionComplete = useCallback(() => {
    if (postProcessStartedRef.current) return;
    postProcessStartedRef.current = true;

    const sid = sessionIdRef.current;
    if (sid) {
      runPostProcess(sid);
    }
    onSessionCompleteRef.current?.();
  }, [runPostProcess]);

  // Keep ref in sync for tool call handler
  handleSessionCompleteRef.current = handleSessionComplete;

  // ---- Base voice session ----

  const voiceSession = useVoiceSession({
    sectionId: sectionIdForMode(mode, params),
    sectionContent: '',
    sectionTitle: '',
    language,
    onSessionComplete: handleSessionComplete,
    systemInstructionOverride: systemInstruction || 'pending',
    sessionType: sessionTypeForMode(mode),
    resourceId,
    initialMessage,
    conceptIds: fetchedConceptIds,
    tools: TUTOR_TOOLS,
    onToolCall: handleGeminiToolCall,
  });

  // Keep sendToolResponse ref in sync
  sendToolResponseRef.current = voiceSession.sendToolResponse;

  // Track session ID
  if (voiceSession.sessionId && voiceSession.sessionId !== sessionIdRef.current) {
    sessionIdRef.current = voiceSession.sessionId;
  }

  // ---- Derive state from base session ----

  useEffect(() => {
    if (state === 'loading' || state === 'scoring' || state === 'summarizing' || state === 'done') return;
    if (voiceSession.connectionState === 'connected' || voiceSession.connectionState === 'reconnecting') {
      setState('active');
    } else if (voiceSession.connectionState === 'connecting') {
      setState('connecting');
    } else if (voiceSession.connectionState === 'error') {
      setState('error');
      setSessionError(voiceSession.error);
    }
  }, [voiceSession.connectionState, voiceSession.error, state]);

  // ---- Context fetching + prompt building per mode ----

  const fetchContextAndBuildPrompt = useCallback(async (): Promise<{
    instruction: string;
    initialMsg: string;
    conceptIds: string[];
  }> => {
    let learnerMemory: LearnerConceptMemory[] = [];
    let summary: string | undefined;
    let staleness: ContextStaleness = 'stale';
    let modeParams: ModeParams;
    let initialMsg: string;
    let cIds: string[] = [];

    switch (mode) {
      case 'eval': {
        if (!concepts?.length) throw new Error('Concepts required for eval mode');
        modeParams = { mode: 'eval', concepts, masteryLevel };
        initialMsg = language === 'es' ? 'Estoy listo para la evaluación.' : "I'm ready for the evaluation.";
        cIds = concepts.map((c) => c.id);
        break;
      }
      case 'practice': {
        if (!concepts?.length) throw new Error('Concepts required for practice mode');
        modeParams = { mode: 'practice', concepts };
        initialMsg = language === 'es' ? 'Estoy listo para practicar.' : "I'm ready to practice.";
        cIds = concepts.map((c) => c.id);
        break;
      }
      case 'teach': {
        if (!conceptForTeach) throw new Error('Concept required for teach mode');
        modeParams = { mode: 'teach', concept: conceptForTeach };
        initialMsg = language === 'es'
          ? `Te voy a explicar ${conceptForTeach.name}.`
          : `I'm going to explain ${conceptForTeach.name} to you.`;
        cIds = [conceptForTeach.id];
        break;
      }
      case 'exploration': {
        if (!userResourceId) throw new Error('userResourceId required for exploration mode');
        const contextUrl = new URL('/api/voice/session/context', window.location.origin);
        contextUrl.searchParams.set('userResourceId', userResourceId);
        const res = await fetch(contextUrl.toString());
        if (!res.ok) throw new Error('Failed to fetch resource context');
        const context = await res.json();
        if (!context.resource) throw new Error('Resource not found');

        const links = (context.links || []).map((l: Record<string, unknown>) => ({
          extractedName: (l.extracted_concept_name || l.extractedConceptName) as string,
          relationship: l.relationship as string,
          curriculumConceptName: l.conceptName as string,
          curriculumDefinition: (l.conceptDefinition || '') as string,
          explanation: (l.explanation || '') as string,
        }));
        const conceptProgress = (context.links || []).map((l: Record<string, unknown>) => ({
          conceptName: l.conceptName as string,
          level: (l.masteryLevel || 0) as number,
        }));
        cIds = (context.links || []).map((l: Record<string, unknown>) => l.concept_id as string).filter(Boolean);
        learnerMemory = context.learnerMemory || [];

        modeParams = {
          mode: 'exploration',
          resource: {
            title: context.resource.title,
            type: context.resource.type,
            summary: context.resource.summary || '',
            userNotes: context.resource.user_notes,
          },
          links,
          conceptProgress,
        };
        initialMsg = language === 'es'
          ? `Vi "${context.resource.title}" y quiero discutirlo.`
          : `I watched/read "${context.resource.title}" and I want to discuss it.`;
        break;
      }
      case 'debate': {
        if (!debateTopic) throw new Error('debateTopic required for debate mode');
        const contextUrl = new URL('/api/voice/session/context', window.location.origin);
        contextUrl.searchParams.set('sectionId', 'debate');
        if (debateTopic.conceptIds.length > 0) {
          contextUrl.searchParams.set('conceptIds', debateTopic.conceptIds.join(','));
        }
        const contextRes = await fetch(contextUrl.toString());
        const context = contextRes.ok ? await contextRes.json() : {};
        learnerMemory = context.learnerMemory || [];

        const defsRes = await fetch(`/api/concepts/definitions?ids=${debateTopic.conceptIds.join(',')}`).catch(() => null);
        const defsData = defsRes?.ok ? await defsRes.json() : { definitions: {} };
        cIds = debateTopic.conceptIds;

        modeParams = {
          mode: 'debate',
          topic: debateTopic.topic,
          position: debateTopic.position,
          conceptDefinitions: defsData.definitions || {},
        };
        initialMsg = language === 'es'
          ? `No estoy de acuerdo con que "${debateTopic.position}". Debatamos.`
          : `I disagree that "${debateTopic.position}". Let's debate.`;
        break;
      }
      case 'freeform': {
        const progressRes = await fetch('/api/voice/freeform/context').then((r) => r.ok ? r.json() : null);
        if (!progressRes) throw new Error('Failed to fetch freeform context');
        learnerMemory = progressRes.learnerMemory || [];

        modeParams = {
          mode: 'freeform',
          conceptProgress: progressRes.conceptProgress || [],
          recentActivity: progressRes.recentActivity || [],
          aggregatedOpenQuestions: progressRes.openQuestions || [],
        };
        initialMsg = language === 'es'
          ? 'Estuve pensando en algunas cosas y quiero charlar.'
          : "I've been thinking about some things and want to chat.";
        break;
      }
      case 'learning': {
        if (!concepts?.length) throw new Error('Concepts required for learning mode');
        modeParams = { mode: 'learning', concepts, resourceTitle: resourceTitle || '' };
        initialMsg = language === 'es'
          ? 'Estoy estudiando el material y tengo algunas dudas.'
          : "I'm studying the material and have some questions.";
        cIds = concepts.map((c) => c.id);
        break;
      }
    }

    // Fetch learner memory for modes that don't fetch it themselves
    if (learnerMemory.length === 0 && cIds.length > 0 && mode !== 'exploration' && mode !== 'debate' && mode !== 'freeform') {
      const contextUrl = new URL('/api/voice/session/context', window.location.origin);
      contextUrl.searchParams.set('sectionId', '');
      contextUrl.searchParams.set('conceptIds', cIds.join(','));
      const ctxRes = await fetch(contextUrl.toString()).catch(() => null);
      if (ctxRes?.ok) {
        const ctx = await ctxRes.json();
        learnerMemory = ctx.learnerMemory || [];
        summary = ctx.summary;
      }
    }

    const sessionContext: SessionContext = {
      summary,
      learnerMemory,
      staleness,
    };

    let instruction = buildUnifiedSystemInstruction({
      mode,
      language,
      modeParams,
      context: sessionContext,
    });

    // Also inject formatted learner memory (for the base hook's legacy handling)
    const memoryText = formatMemoryForPrompt(learnerMemory, language);
    if (memoryText) {
      instruction += `\n\n${memoryText}`;
    }

    return { instruction, initialMsg, conceptIds: cIds };
  }, [mode, language, concepts, masteryLevel, resourceTitle, userResourceId, debateTopic, conceptForTeach]);

  // ---- Start ----

  const start = useCallback(async () => {
    // Abort any in-flight start
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    log.info(`[Start] mode=${mode}, resourceId=${resourceId ?? 'none'}, concepts=${concepts?.length ?? 0}`);
    setState('loading');
    setSessionError(null);
    setResult(null);
    sessionIdRef.current = null;
    postProcessStartedRef.current = false;

    try {
      const { instruction, initialMsg, conceptIds: cIds } = await fetchContextAndBuildPrompt();
      if (controller.signal.aborted) return;

      setSystemInstruction(instruction);
      setInitialMessage(initialMsg);
      setFetchedConceptIds(cIds);

      // Small delay to let state propagate through useVoiceSession
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (controller.signal.aborted) return;

      await voiceSession.connect();
    } catch (err) {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : 'Failed to start session';
      log.error(`${mode} start failed:`, msg);
      setSessionError(msg);
      setState('error');
    }
  }, [mode, fetchContextAndBuildPrompt, voiceSession]);

  // ---- Stop ----

  const stop = useCallback(() => {
    // Cancel any in-flight start() (context fetch, etc.)
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    const sid = sessionIdRef.current;
    voiceSession.disconnect();

    if (sid) {
      runPostProcess(sid);
    } else {
      setState('done');
    }
  }, [voiceSession, runPostProcess]);

  // ---- Retry post-processing ----

  const retryPostProcess = useCallback(() => {
    const sid = sessionIdRef.current;
    if (sid) {
      runPostProcess(sid);
    } else {
      // Error happened before session was created (e.g. context fetch failed) — restart
      start();
    }
  }, [runPostProcess, start]);

  return {
    state,
    tutorState: voiceSession.tutorState,
    error: sessionError || voiceSession.error,
    elapsed: voiceSession.elapsed,
    sessionId: voiceSession.sessionId,
    result,
    transcript: voiceSession.transcript,
    stream: voiceSession.stream,
    playbackAnalyser: voiceSession.playbackAnalyser,
    start,
    stop,
    retryPostProcess,
  };
}
