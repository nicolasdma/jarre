'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createGeminiLiveClient,
  arrayBufferToBase64,
  type GeminiLiveClientInstance,
  type ConnectionState,
  preloadGeminiSdk,
} from '@/lib/voice/gemini-live';
import { buildLearningSession, TUTOR_PROMPT_VERSION } from '@/lib/llm/voice-tutor-session';
import { DEFAULT_LIVE_VOICE, resolveVoiceLiveModel, TURN_TAKING, type LiveVoice, type TurnTaking } from '@/lib/voice/live-models';
import { formatMemoryForPrompt, type LearnerConceptMemory } from '@/lib/learner-memory';
import { MicActivity, type MicHealth } from '@/lib/voice/mic-activity';
import { TurnDetector } from '@/lib/voice/turn-detector';
import { createLogger } from '@/lib/logger';
import { VOICE_COMPRESS_THRESHOLD, VOICE_FALLBACK_RECENT_TURNS } from '@/lib/constants';
import type { Language } from '@/lib/translations';
import type { Tool, FunctionCall, FunctionResponse } from '@google/genai';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import { decideSessionEnd, type SessionEndPolicy } from '@/lib/voice/session-end';
import {
  TranscriptOutbox,
  postTranscriptBatch,
  resendStoredOutboxes,
  webStorageOutboxStore,
  type OutboxStore,
} from '@/lib/voice/transcript-outbox';
import { SessionTimeline } from '@/lib/voice/session-timeline';
import { buildLessonMap } from '@/lib/tutor/lesson-map';
import { buildLearnerBrief } from '@/lib/tutor/learner-brief';
import { recentTalkBlock, rememberTalk } from '@/lib/tutor/recent-talk';
import type { EvidenceRow } from '@/lib/tutor/evidence';
import { MUTE_AFTER_TOOL_MS } from '@/lib/tutor/section-tools';

const log = createLogger('VoiceSession');

/** Drains a session's transcript outbox, then closes the session server-side. */
async function finishSession(
  sessionId: string,
  writeToken: string | null,
  outbox: TranscriptOutbox | null,
  diag: Record<string, unknown>,
): Promise<void> {
  if (outbox) {
    const drained = await outbox.drain({ keepalive: true }).catch(() => false);
    if (!drained) log.error(`[Disconnect] ${outbox.pending} transcript event(s) not stored sid=${sessionId}`);
  }
  await postSessionEnd(sessionId, writeToken, diag).catch(() => {});
  log.info('[Disconnect] /api/voice/session/end fired');
}

function postSessionEnd(sessionId: string, writeToken: string | null, diag: Record<string, unknown>): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (writeToken) headers['X-Voice-Session-Token'] = writeToken;
  return fetch('/api/voice/session/end', {
    method: 'POST',
    keepalive: true,
    headers,
    body: JSON.stringify({ sessionId, writeToken, diag }),
  }).then(() => undefined);
}

function browserOutboxStore(): OutboxStore | undefined {
  try {
    return typeof window !== 'undefined' && window.localStorage ? webStorageOutboxStore(window.localStorage) : undefined;
  } catch {
    return undefined;
  }
}

/** Once per page load: send what a killed tab or a crash left unsent, and close those sessions. */
let storedOutboxesResent = false;
function resendLeftovers(liveSessionId: string | null): void {
  if (storedOutboxesResent || typeof window === 'undefined') return;
  storedOutboxesResent = true;
  try {
    void resendStoredOutboxes(
      window.localStorage,
      postTranscriptBatch,
      (target) => postSessionEnd(target.sessionId, target.writeToken, { endReason: 'resent' }),
      { skipSessionId: liveSessionId },
    ).then((ids) => {
      if (ids.length) log.info(`[Outbox] Resent ${ids.length} session(s) left by an earlier page`);
    }).catch(() => {});
  } catch {
    // Storage blocked.
  }
}

// ============================================================================
// Types
// ============================================================================

interface UseVoiceSessionParams {
  sectionId: string;
  sectionContent: string;
  sectionTitle: string;
  language: Language;
  onSessionComplete?: () => void;
  /** Override the system instruction (used by eval sessions) */
  systemInstructionOverride?: string;
  /** Session type for backend tracking */
  sessionType?: 'teaching' | 'evaluation' | 'practice' | 'exploration' | 'freeform' | 'debate';
  /** Resource ID for evaluation sessions */
  resourceId?: string;
  /** Custom initial text message to send after connecting */
  initialMessage?: string;
  /** Concept IDs for learner memory fetch */
  conceptIds?: string[];
  /** Tool declarations to pass to Gemini */
  tools?: Tool[];
  /** Callback when Gemini invokes tool calls */
  onToolCall?: (functionCalls: FunctionCall[]) => void;
  /**
   * The whole lesson, for the learning tutor: it quizzes on every section,
   * starting with the one being studied (`sectionTitle`). Without it the
   * lesson is just this section.
   */
  lessonTitle?: string;
  lessonSections?: { id?: string; conceptId?: string; title: string; content: string }[];
  /**
   * How long a pause ends the learner's turn. 'patient' is for answers in a
   * second language, where people stop to find the word.
   */
  turnTaking?: TurnTaking;
  /** The tutor's voice; the token is minted for it. Default Kore. */
  voiceName?: LiveVoice;
  /**
   * Who may end the session by what the tutor says (src/lib/voice/session-end.ts).
   * `learning`: only after the learner agrees; `interview`: only the end
   * phrase; `default`: the end phrase or a farewell.
   */
  endPolicy?: SessionEndPolicy;
  /** Learning: work each idea in Spanish, then have the learner say it in English. */
  bilingual?: boolean;
  /** After a dropped connection is restored (the coding mock re-sends what the model must see). */
  onReconnected?: () => void;
  /** Learning: the connection declares the lesson tools (src/lib/tutor/section-tools.ts) and the prompt explains them. */
  lessonTools?: boolean;
  /** Every utterance, once complete (the section tutor detects the sections the learner names). */
  onUtterance?: (role: 'user' | 'model', text: string) => void;
  /** The tutor finished a turn: the moment to add context for the next one. */
  onModelTurnComplete?: () => void;
}



export type TutorState = 'idle' | 'listening' | 'thinking' | 'speaking';

/** GET /api/voice/session/context. */
interface VoiceContext {
  summary?: string;
  learnerMemory?: LearnerConceptMemory[];
  practicesEnglish?: boolean;
  lessonMemory?: { evidence: EvidenceRow[]; preferences: EvidenceRow[] };
}

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

interface VoiceSession {
  connectionState: ConnectionState;
  tutorState: TutorState;
  error: string | null;
  elapsed: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Current session ID (null before connect) */
  sessionId: string | null;
  /** Live transcript entries */
  transcript: TranscriptEntry[];
  /** Mic MediaStream for audio level analysis */
  stream: MediaStream | null;
  /** Whether the mic delivers signal and the model transcribes it (src/lib/voice/mic-activity.ts). */
  micHealth: MicHealth;
  /** Last time the mic carried the learner's voice (Date.now clock), or null: known at once, unlike the transcript. */
  micLastVoiceAt: () => number | null;
  /** The learner pressed a key in the editor: with `adaptive` turn taking, a pause now is thinking, not the end of the turn. */
  noteTyping: () => void;
  /** Send tool responses back to Gemini */
  sendToolResponse: (responses: FunctionResponse[]) => void;
  /** AnalyserNode for tutor playback audio frequency data */
  playbackAnalyser: AnalyserNode | null;
  /**
   * Text into the live conversation: `respond` asks the model to speak now,
   * otherwise it is context for its next turn. No-op when not connected.
   */
  sendText: (text: string, options?: { respond?: boolean }) => void;
  /** The learner's memory for this lesson, as the context request brought it (null before connect or without it). */
  lessonMemory: VoiceContext['lessonMemory'] | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Under the token's 10-minute window to open a socket (src/lib/voice/live-token.ts). */
const PREFETCHED_TOKEN_MAX_AGE_MS = 8 * 60 * 1000;
/**
 * The token is prefetched once the learner stays on a section this long, not on
 * every section that flashes by: each prefetch mints a Gemini token and counts
 * toward JARRE_VOICE_TOKENS_PER_MINUTE (20), so flipping through the table of
 * contents used to spend the minute's budget and the real "start" got a 429.
 */
const PREFETCH_SETTLE_MS = 2500;
const MIC_CHUNK_INTERVAL_MS = 100;
/** How many times one session replaces a socket that does not hear before it only says so on screen. */
const MAX_DEAF_RECOVERIES = 3;
// What ends a session on its own: src/lib/voice/session-end.ts.
const SESSION_END_WINDOW_CHARS = 320;

// ============================================================================
// Hook
// ============================================================================

export function useVoiceSession({
  sectionId,
  sectionContent,
  sectionTitle,
  language,
  onSessionComplete,
  systemInstructionOverride,
  sessionType = 'teaching',
  resourceId,
  initialMessage,
  conceptIds,
  tools,
  onToolCall,
  lessonTitle,
  lessonSections,
  turnTaking = 'default',
  voiceName = DEFAULT_LIVE_VOICE,
  endPolicy = 'default',
  bilingual = false,
  onReconnected,
  lessonTools = false,
  onUtterance,
  onModelTurnComplete,
}: UseVoiceSessionParams): VoiceSession {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micHealth, setMicHealth] = useState<MicHealth>('ok');
  const micActivityRef = useRef(new MicActivity());
  /** Replaces a session that stopped hearing (set in an effect below; startMic calls it through the ref). */
  const recoverDeafRef = useRef<(client: GeminiLiveClientInstance, mic: MicActivity) => void>(() => {});
  const deafRecoveryRef = useRef({ busy: false, count: 0 });
  /** Set in `adaptive` turn taking: the page marks the learner's turns. */
  const turnDetectorRef = useRef<TurnDetector | null>(null);
  /** The last key pressed in an editor the learner types in while talking (noteTyping). */
  const lastKeyAtRef = useRef<number | null>(null);
  const [lessonMemory, setLessonMemory] = useState<VoiceContext['lessonMemory'] | null>(null);
  /** Audio arrived in the reply being generated (for the mute-after-tool nudge). */
  const audioInTurnRef = useRef(false);
  const muteNudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muteNudgedThisTurnRef = useRef(false);

  const clientRef = useRef<GeminiLiveClientInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const sessionWriteTokenRef = useRef<string | null>(null);
  const transcriptSeqRef = useRef(0);
  /** The current session's transcript outbox (src/lib/voice/transcript-outbox.ts). */
  const transcriptOutboxRef = useRef<TranscriptOutbox | null>(null);
  /** What the client saw, sent with /session/end and stored with the session (session-timeline.ts). */
  const timelineRef = useRef(new SessionTimeline());

  // Session end keyword detection — debounce to prevent multiple disconnects
  const sessionEndDetectedRef = useRef(false);
  const endKeywordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelTranscriptWindowRef = useRef('');

  // State logging: track last logged state to avoid repetitive logs (e.g., every audio chunk)
  const lastLoggedStateRef = useRef<TutorState>('idle');

  const logTransition = useCallback((next: TutorState, reason: string) => {
    const prev = lastLoggedStateRef.current;
    if (prev === next) return; // Skip duplicate transitions
    log.info(`[State] ${prev} → ${next} (${reason})`);
    lastLoggedStateRef.current = next;
  }, []);

  // Reconnect refs
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Layer 1: Session resumption handle from Gemini
  const resumptionHandleRef = useRef<string | null>(null);
  // Layer 2: Local transcript buffer for fallback context reconstruction
  const transcriptBufferRef = useRef<{ role: 'user' | 'model'; text: string; ts: number }[]>([]);
  // Pre-compressed summary from onGoAway — avoids waiting for API during reconnect
  const compressedSummaryRef = useRef<string | null>(null);

  // Pre-fetch refs
  const prefetchedTokenRef = useRef<string | null>(null);
  // When the prefetched token was minted: past PREFETCHED_TOKEN_MAX_AGE_MS it is
  // dropped, because a Live token only opens a socket for 10 min (live-token.ts).
  const prefetchedTokenAtRef = useRef(0);
  const prefetchedContextRef = useRef<VoiceContext | null>(null);
  const prefetchSectionIdRef = useRef<string | null>(null);

  // Track params in ref so callbacks don't go stale
  const paramsRef = useRef({ sectionId, sectionContent, sectionTitle, language, systemInstructionOverride, sessionType, resourceId, initialMessage, conceptIds, tools, onToolCall, lessonTitle, lessonSections, turnTaking, voiceName, endPolicy, bilingual, lessonTools, onUtterance, onModelTurnComplete });
  paramsRef.current = { sectionId, sectionContent, sectionTitle, language, systemInstructionOverride, sessionType, resourceId, initialMessage, conceptIds, tools, onToolCall, lessonTitle, lessonSections, turnTaking, voiceName, endPolicy, bilingual, lessonTools, onUtterance, onModelTurnComplete };

  const onReconnectedRef = useRef(onReconnected);
  onReconnectedRef.current = onReconnected;

  // Stable ref for onSessionComplete to avoid stale closures
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  // ---- Pre-fetch token + context on mount / sectionId change ----

  const prefetchTokenAndContext = useCallback(async () => {
    // The Live SDK is not in the page bundle (gemini-live.ts): fetch it now.
    preloadGeminiSdk();
    // Invalidate previous pre-fetch if section changed
    prefetchedTokenRef.current = null;
    prefetchedContextRef.current = null;
    prefetchSectionIdRef.current = sectionId;

    const currentSectionId = sectionId;

    // For evaluation sessions, skip context fetching (no section memory needed)
    const contextUrl = new URL('/api/voice/session/context', window.location.origin);
    contextUrl.searchParams.set('sectionId', currentSectionId);
    if (resourceId && sessionType === 'teaching') contextUrl.searchParams.set('resourceId', resourceId);
    if (conceptIds?.length) {
      contextUrl.searchParams.set('conceptIds', conceptIds.join(','));
    }

    const contextFetch = sessionType === 'evaluation'
      ? Promise.resolve(null)
      : fetch(contextUrl.toString())
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

    const [tokenData, contextData] = await Promise.all([
      fetchWithKeys('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'prefetch', sessionType, model: resolveVoiceLiveModel(), voiceName: paramsRef.current.voiceName }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      contextFetch,
    ]);

    // Only store if sectionId hasn't changed while fetching
    if (prefetchSectionIdRef.current !== currentSectionId) return;
    if (tokenData?.token) {
      prefetchedTokenRef.current = tokenData.token;
      prefetchedTokenAtRef.current = Date.now();
    }
    if (contextData) prefetchedContextRef.current = contextData;
  }, [sectionId, sessionType, conceptIds, resourceId]);

  // Skip prefetch when systemInstructionOverride is provided — the caller
  // (e.g. useUnifiedVoiceSession) manages its own context fetching and will
  // call connect() with the instruction already built. Prefetching here would
  // cause duplicate token/context requests and 400 errors from empty sectionId.
  // Keyed on the section, not on the callback: re-renders that rebuild it (a new
  // conceptIds array) must not keep pushing the timer back.
  const prefetchRef = useRef(prefetchTokenAndContext);
  prefetchRef.current = prefetchTokenAndContext;
  useEffect(() => {
    if (systemInstructionOverride) return;
    const timer = setTimeout(() => void prefetchRef.current(), PREFETCH_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [sectionId, sessionType, resourceId, systemInstructionOverride]);

  useEffect(() => {
    resendLeftovers(sessionIdRef.current);
  }, []);

  // ---- Playback: schedule PCM audio chunks on AudioContext ----

  const playAudioChunk = useCallback((pcmData: ArrayBuffer) => {
    if (!playbackContextRef.current) {
      const ctx = new AudioContext({ sampleRate: 24000 });
      playbackContextRef.current = ctx;

      // Create AnalyserNode for tutor audio frequency analysis
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyser.connect(ctx.destination);
      playbackAnalyserRef.current = analyser;
    }
    const ctx = playbackContextRef.current;
    const analyser = playbackAnalyserRef.current;

    // PCM 16-bit LE mono → Float32
    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    // Route through analyser: source → analyser → destination
    source.connect(analyser ?? ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  }, []);

  const stopPlayback = useCallback(() => {
    // Reset playback scheduling so any queued chunks are effectively skipped
    nextPlayTimeRef.current = 0;
    playbackAnalyserRef.current = null;
    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
  }, []);

  // ---- Mic: capture PCM 16kHz via AudioWorklet ----

  const startMic = useCallback(async (client: GeminiLiveClientInstance) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    streamRef.current = stream;
    setStream(stream);

    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    const mic = new MicActivity();
    micActivityRef.current = mic;
    deafRecoveryRef.current = { busy: false, count: 0 };
    const detector = paramsRef.current.turnTaking === 'adaptive' ? new TurnDetector() : null;
    turnDetectorRef.current = detector;
    mic.start(Date.now());
    setMicHealth('ok');

    // Load the AudioWorklet processor inline via Blob
    const workletCode = `
      class PcmCaptureProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const input = inputs[0];
          if (input.length > 0) {
            const samples = input[0];
            const int16 = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
              const s = Math.max(-1, Math.min(1, samples[i]));
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(int16.buffer, [int16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-capture', PcmCaptureProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    await audioContext.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, 'pcm-capture');
    workletNodeRef.current = workletNode;

    // Buffer chunks and send periodically to avoid flooding WebSocket
    let pcmBuffer: Int16Array[] = [];
    let sendTimer: ReturnType<typeof setInterval> | null = null;

    workletNode.port.onmessage = (event) => {
      pcmBuffer.push(new Int16Array(event.data));
    };

    const reportHealth = () => {
      const health = mic.health(Date.now());
      setMicHealth((prev) => (prev === health ? prev : health));
      Object.assign(timelineRef.current.facts, mic.facts());
      // A session that stopped hearing is replaced, not waited on.
      if (health === 'unheard') recoverDeafRef.current(client, mic);
    };

    sendTimer = setInterval(() => {
      if (pcmBuffer.length === 0) {
        reportHealth();
        return;
      }

      // Concatenate buffered chunks
      const totalLength = pcmBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Int16Array(totalLength);
      let offset = 0;
      for (const chunk of pcmBuffer) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      pcmBuffer = [];

      // The tutor's own voice coming back through the mic is signal, not the learner talking.
      const playback = playbackContextRef.current;
      const echo = playback !== null && nextPlayTimeRef.current > playback.currentTime;
      const now = Date.now();
      const voiced = mic.feed(merged, audioContext.sampleRate, now, echo);
      if (!detector) {
        client.sendAudio(arrayBufferToBase64(merged.buffer));
        timelineRef.current.counters.audioChunksSent += 1;
      } else {
        // The page marks the turns: nothing is sent between them (turn-detector.ts).
        for (const out of detector.feed({ chunk: merged, voiced, now, lastKeyAt: lastKeyAtRef.current })) {
          if (out.type === 'audio') {
            client.sendAudio(arrayBufferToBase64(out.chunk.buffer as ArrayBuffer));
            timelineRef.current.counters.audioChunksSent += 1;
          } else {
            client.sendActivity(out.type);
            timelineRef.current.mark(out.type === 'start' ? 'turn_start' : 'turn_end');
          }
        }
      }
      reportHealth();
    }, MIC_CHUNK_INTERVAL_MS);

    source.connect(workletNode);
    workletNode.connect(audioContext.destination); // required for worklet to process

    // Store sendTimer for cleanup
    workletNode.port.onmessageerror = () => {
      if (sendTimer) clearInterval(sendTimer);
    };

    // Attach cleanup data
    (workletNode as unknown as Record<string, unknown>).__sendTimer = sendTimer;
  }, []);

  const stopMic = useCallback(() => {
    if (workletNodeRef.current) {
      const timer = (workletNodeRef.current as unknown as Record<string, unknown>).__sendTimer;
      if (timer) clearInterval(timer as ReturnType<typeof setInterval>);
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // ---- Session timer ----

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsed(0);
  }, []);

  // Ref for disconnect so saveTranscript can call it without circular dependency
  const disconnectRef = useRef<() => void>(() => {});

  // ---- Transcript saving (queued + batched) ----
  //
  // The Live API streams transcriptions in fragments of a few characters, each
  // with its own leading space. One stored row per utterance (not per
  // fragment) is what scoring, reconnection context and the UI read.

  const utteranceRef = useRef<{ role: 'user' | 'model'; text: string } | null>(null);
  /** The learner's last utterance, for the learning end policy. */
  const lastLearnerTextRef = useRef<string | null>(null);

  const persistUtterance = useCallback((role: 'user' | 'model', text: string) => {
    const sid = sessionIdRef.current;
    const outbox = transcriptOutboxRef.current;
    if (!sid || !outbox) return;

    const preview = text.length > 140 ? `${text.slice(0, 140)}...` : text;
    log.info(`[Transcript] role=${role} sid=${sid} text="${preview}"`);

    // Accumulate in local buffer for Layer 2 fallback context
    transcriptBufferRef.current.push({ role, text, ts: Date.now() });

    paramsRef.current.onUtterance?.(role, text);

    const seq = ++transcriptSeqRef.current;
    timelineRef.current.counters.stored += 1;
    outbox.push({
      turnId: `${sid}-${seq}`,
      seq,
      role,
      text,
      timestamp: new Date().toISOString(),
    });
  }, []);

  /** Close the utterance being transcribed and store it. */
  const commitUtterance = useCallback(() => {
    const utterance = utteranceRef.current;
    utteranceRef.current = null;
    if (!utterance) return;
    const text = utterance.text.replace(/\s+/g, ' ').trim();
    if (text) persistUtterance(utterance.role, text);
  }, [persistUtterance]);

  const saveTranscript = useCallback((role: 'user' | 'model', text: string) => {
    if (!sessionIdRef.current) return;
    if (role === 'user') {
      timelineRef.current.userFragment();
      micActivityRef.current.heard();
    }
    else timelineRef.current.counters.modelFragments += 1;

    if (utteranceRef.current && utteranceRef.current.role !== role) commitUtterance();
    const starting = !utteranceRef.current;
    if (!utteranceRef.current) utteranceRef.current = { role, text: '' };
    utteranceRef.current.text += text;
    const live = utteranceRef.current.text.replace(/\s+/g, ' ').trim();
    if (role === 'user') lastLearnerTextRef.current = live;

    // Update React state for UI consumption: one line per utterance, growing.
    setTranscript((prev) =>
      starting || prev.length === 0
        ? [...prev, { role, text: live }]
        : [...prev.slice(0, -1), { role, text: live }],
    );

    // Detect AI-driven session completion from model transcript window.
    // Gemini often streams transcripts in chunks, so we inspect a rolling window
    // instead of only the current chunk.
    if (role === 'model' && !sessionEndDetectedRef.current) {
      // Raw fragments carry their own spaces: join them as they come.
      const combined = `${modelTranscriptWindowRef.current}${text}`.replace(/\s+/g, ' ');
      modelTranscriptWindowRef.current = combined.slice(-SESSION_END_WINDOW_CHARS);

      const elapsedS = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const decision = decideSessionEnd({
        policy: paramsRef.current.endPolicy,
        modelWindow: modelTranscriptWindowRef.current,
        elapsedS,
        lastLearnerText: lastLearnerTextRef.current,
      });
      if (decision.end) {
        sessionEndDetectedRef.current = true;
        log.info(`[Session] ${decision.signal} end signal: ${decision.reason}; auto-disconnecting in 1s`);
        endKeywordTimerRef.current = setTimeout(() => {
          commitUtterance();
          disconnectRef.current();
          onSessionCompleteRef.current?.();
        }, 1000);
      } else if (decision.signal) {
        log.info(`[Session] ${decision.signal} end signal ignored: ${decision.reason}`);
      }
    }
  }, [commitUtterance]);

  // ---- Compress conversation via API ----

  const compressConversation = useCallback(async (
    turns: { role: 'user' | 'model'; text: string }[],
    title: string,
  ): Promise<string | null> => {
    const conversation = turns
      .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text}`)
      .join('\n');
    try {
      const res = await fetchWithKeys('/api/voice/session/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation, sectionTitle: title }),
      });
      if (!res.ok) return null;
      const { summary } = await res.json();
      return summary || null;
    } catch {
      return null;
    }
  }, []);

  // ---- Build fallback context from buffer (Layer 2) ----

  const buildFallbackContext = useCallback(async (): Promise<string | null> => {
    const buffer = transcriptBufferRef.current;
    const { language: lang, sectionTitle: st } = paramsRef.current;

    if (buffer.length === 0) return null;

    const instruction = lang === 'es'
      ? 'Hubo una reconexión. Continuá la conversación desde donde se interrumpió.'
      : 'There was a reconnection. Continue the conversation from where it was interrupted.';

    // If buffer is large, compress old turns to preserve full context
    if (buffer.length > VOICE_COMPRESS_THRESHOLD) {
      const recentTurns = buffer.slice(-VOICE_FALLBACK_RECENT_TURNS);
      const recentTranscript = recentTurns
        .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text}`)
        .join('\n');

      // Use pre-compressed summary if available (from onGoAway), otherwise compress now
      const preCompressed = compressedSummaryRef.current;
      const compressed = preCompressed
        ?? await compressConversation(buffer.slice(0, buffer.length - VOICE_FALLBACK_RECENT_TURNS), st);

      if (compressed) {
        log.info(`[Fallback] Using compressed summary (${compressed.length} chars) + ${recentTurns.length} recent turns`);
        return `COMPRESSED SUMMARY OF EARLIER CONVERSATION:\n${compressed}\n\nRECENT CONVERSATION:\n${recentTranscript}\n\n${instruction}`;
      }

      // Compression failed — fall back to old truncation strategy
      log.info('[Fallback] Compression failed, using truncation fallback');
      const fallbackEntries = [...buffer.slice(0, 30), ...buffer.slice(-70)];
      const fallbackTranscript = fallbackEntries
        .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text}`)
        .join('\n');
      return `CONVERSATION SO FAR:\n${fallbackTranscript}\n\n${instruction}`;
    }

    // Buffer is small enough to send as-is
    const transcript = buffer
      .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text}`)
      .join('\n');

    return `CONVERSATION SO FAR:\n${transcript}\n\n${instruction}`;
  }, [compressConversation]);

  /** The page keeps the end of a lesson talk for the next session, until its digest lands (recent-talk.ts). */
  const keepRecentTalk = useCallback((sid: string | null) => {
    const { resourceId: resId, sessionType: sessType, sectionTitle: st, lessonSections: ls, sectionId: secId } = paramsRef.current;
    if (!sid || !resId || sessType !== 'teaching') return;
    const n = (ls?.findIndex((s) => s.id === secId) ?? -1) + 1;
    rememberTalk(resId, {
      sessionId: sid,
      sectionLabel: n > 0 ? `section ${n} (${st})` : st,
      lines: transcriptBufferRef.current.map(({ role, text }) => ({ role, text })),
    });
  }, []);

  // ---- Connect ----

  const connect = useCallback(async () => {
    setError(null);

    // Reset resilience refs for fresh session
    resumptionHandleRef.current = null;
    compressedSummaryRef.current = null;
    transcriptBufferRef.current = [];
    // A previous session's outbox keeps draining on its own; never clear it here.
    transcriptOutboxRef.current = null;
    transcriptSeqRef.current = 0;
    const timeline = new SessionTimeline();
    timeline.mark('mic_click');
    timelineRef.current = timeline;
    sessionWriteTokenRef.current = null;
    setTranscript([]);
    utteranceRef.current = null;
    modelTranscriptWindowRef.current = '';
    lastLoggedStateRef.current = 'idle';
    sessionEndDetectedRef.current = false;
    if (endKeywordTimerRef.current) {
      clearTimeout(endKeywordTimerRef.current);
      endKeywordTimerRef.current = null;
    }

    try {
      const { sectionId: secId, sectionContent: sc, sectionTitle: st, language: lang, systemInstructionOverride: sysOverride, sessionType: sessType, resourceId: resId, initialMessage: initMsg, conceptIds: cIds } = paramsRef.current;

      // Use pre-fetched token if available, otherwise fetch fresh
      const prefetchedFresh = Date.now() - prefetchedTokenAtRef.current < PREFETCHED_TOKEN_MAX_AGE_MS;
      const tokenPromise = prefetchedTokenRef.current && prefetchedFresh
        ? Promise.resolve(prefetchedTokenRef.current)
        : fetchWithKeys('/api/voice/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'connect', sessionType: sessType, model: resolveVoiceLiveModel(), voiceName: paramsRef.current.voiceName }),
          })
            .then((r) => {
              if (!r.ok) throw new Error('Failed to get voice token');
              return r.json();
            })
            .then((d) => d.token as string);

      // Use pre-fetched context if available, otherwise fetch fresh.
      // When systemInstructionOverride is set, the caller already built the prompt
      // with its own context — skip fetching here to avoid duplicate requests.
      const contextPromise: Promise<VoiceContext> = sysOverride
        ? Promise.resolve({})
        : prefetchedContextRef.current
          ? Promise.resolve(prefetchedContextRef.current)
          : (() => {
              const ctxUrl = new URL('/api/voice/session/context', window.location.origin);
              ctxUrl.searchParams.set('sectionId', secId);
              if (resId && sessType === 'teaching') ctxUrl.searchParams.set('resourceId', resId);
              if (cIds?.length) ctxUrl.searchParams.set('conceptIds', cIds.join(','));
              return fetch(ctxUrl.toString())
                .then((r) => (r.ok ? r.json() : {}))
                .catch(() => ({}));
            })();

      // Start session (always fresh) + resolve token/context in parallel
      const startBody: Record<string, unknown> = { sessionType: sessType };
      // Route sectionId to the correct API field based on session type
      if (secId) {
        if (sessType === 'teaching') startBody.sectionId = secId;
        else if (sessType === 'exploration') startBody.userResourceId = secId;
      }
      if (resId) startBody.resourceId = resId;

      const [sessionRes, token, context] = await Promise.all([
        fetch('/api/voice/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(startBody),
        }).then((r) => {
          timeline.mark('session_started');
          return r;
        }),
        tokenPromise.then((t) => {
          timeline.mark('token_ready');
          return t;
        }),
        contextPromise.then((c) => {
          timeline.mark('context_ready');
          return c;
        }),
      ]);

      // Consume pre-fetched data (one-time use)
      prefetchedTokenRef.current = null;
      prefetchedContextRef.current = null;

      // Session ID is required — without it transcripts can't be saved and scoring is impossible
      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to start voice session');
      }
      const { sessionId: sid, writeToken } = await sessionRes.json();
      if (!writeToken || typeof writeToken !== 'string') {
        throw new Error('Failed to start voice session: missing write token');
      }
      sessionIdRef.current = sid;
      sessionWriteTokenRef.current = writeToken;
      transcriptOutboxRef.current = new TranscriptOutbox({
        target: { sessionId: sid, writeToken },
        send: postTranscriptBatch,
        store: browserOutboxStore(),
        onError: (err, pending) => {
          const message = err instanceof Error ? err.message : String(err);
          timeline.counters.lastError = message.slice(0, 120);
          log.warn(`[TranscriptFlush] Failed sid=${sid} pending=${pending} err=${message}`);
        },
      });
      setSessionId(sid);

      const summary = context?.summary;
      const learnerMemory: LearnerConceptMemory[] = context?.learnerMemory || [];

      // 2. Build system instruction (use override if provided, otherwise build from section content)
      let systemInstruction: string;
      let opener: string | undefined;
      if (sysOverride) {
        // Override already includes learner memory (injected by the caller, e.g. useUnifiedVoiceSession)
        systemInstruction = sysOverride;
      } else {
        const { lessonTitle: lt, lessonSections: ls, bilingual: bi } = paramsRef.current;
        const sections = ls?.length ? ls : [{ id: secId, title: st, content: sc }];
        const byId = sections.findIndex((s) => 'id' in s && s.id === secId);
        const focus = Math.max(0, byId >= 0 ? byId : sections.findIndex((s) => s.title === st));
        // What earlier sessions on this lesson showed (learner-brief.ts), plus
        // the talk that just ended in this page if its digest is not in yet.
        const lm = context?.lessonMemory;
        const brief = lm
          ? buildLearnerBrief({ map: buildLessonMap(sections), focusIndex: focus, evidence: lm.evidence, preferences: lm.preferences })
          : null;
        const recent = resId ? recentTalkBlock(resId, new Set((lm?.evidence ?? []).map((e) => e.sessionId ?? ''))) : null;
        const learnerBrief = [brief, recent].filter(Boolean).join('\n\n') || null;
        timeline.facts.briefChars = learnerBrief?.length ?? 0;
        timeline.facts.lessonSections = sections.length;
        const session = buildLearningSession({
          language: lang,
          lesson: { title: lt || st, sections },
          focusSectionIndex: focus,
          learnerNotes: formatMemoryForPrompt(learnerMemory, lang) || null,
          // The prose summary only when there is no evidence to brief from (not migrated, or nothing yet).
          previousSummary: learnerBrief ? null : summary ?? null,
          learnerBrief,
          sectionTools: paramsRef.current.lessonTools,
          bilingual: bi || context?.practicesEnglish === true,
        });
        setLessonMemory(lm ?? null);
        systemInstruction = session.instruction;
        opener = session.opener;
      }

      // 3. Create Gemini Live client
      const client = createGeminiLiveClient({
        onAudioResponse: (audioChunk) => {
          timeline.audio();
          audioInTurnRef.current = true;
          if (muteNudgeTimerRef.current) {
            clearTimeout(muteNudgeTimerRef.current);
            muteNudgeTimerRef.current = null;
          }
          setTutorState((prev) => {
            if (prev !== 'speaking') logTransition('speaking', 'first_audio_chunk');
            return 'speaking';
          });
          playAudioChunk(audioChunk);
        },
        onTurnComplete: () => {
          timeline.turnComplete();
          commitUtterance();
          audioInTurnRef.current = false;
          muteNudgedThisTurnRef.current = false;
          paramsRef.current.onModelTurnComplete?.();
          logTransition('listening', 'turn_complete');
          setTutorState('listening');
        },
        onInterrupted: () => {
          timeline.mark('interrupted');
          audioInTurnRef.current = false;
          commitUtterance();
          stopPlayback();
          logTransition('listening', 'interrupted');
          setTutorState('listening');
        },
        onInputTranscriptionComplete: () => {
          setTutorState((prev) => {
            if (prev === 'listening') {
              logTransition('thinking', 'input_transcription');
              return 'thinking';
            }
            return prev;
          });
        },
        onConnectionStateChange: setConnectionState,
        onError: (err) => {
          timeline.counters.lastError = `live: ${String(err)}`.slice(0, 120);
          timeline.mark('error');
          logTransition('idle', `error: ${err}`);
          setError(err);
          setTutorState('idle');
        },
        onTranscript: saveTranscript,
        onToolCall: (functionCalls) => {
          for (const call of functionCalls) timeline.mark('tool_call', { name: call.name ?? '?' });
          log.info(
            `[ToolCall] Forwarding ${functionCalls.length} call(s): ${functionCalls
              .map((call) => call.name || 'unknown')
              .join(', ')}`,
          );
          paramsRef.current.onToolCall?.(functionCalls);
        },
        onUsage: (usage) => timeline.addUsage(usage),
        onSocketClose: (code) => timeline.mark('socket_close', { code }),
        onResumptionUpdate: (handle, resumable) => {
          // A handle sent mid-generation cannot resume the session: keep the last resumable one.
          if (!resumable) return;
          resumptionHandleRef.current = handle;
          log.info('Resumption handle stored');
        },
        onGoAway: (timeLeftMs) => {
          if (sessionEndDetectedRef.current || !sessionIdRef.current) {
            log.info('[Reconnect] GoAway ignored because session is ending/ended');
            return;
          }
          log.info(`GoAway received, ${timeLeftMs}ms remaining — initiating proactive reconnect`);

          // Pre-compress buffer for Layer 2 in case Layer 1 fails
          const buffer = transcriptBufferRef.current;
          if (buffer.length > VOICE_COMPRESS_THRESHOLD) {
            const { sectionTitle: st } = paramsRef.current;
            const oldTurns = buffer.slice(0, buffer.length - VOICE_FALLBACK_RECENT_TURNS);
            compressConversation(oldTurns, st).then((summary) => {
              if (summary) {
                compressedSummaryRef.current = summary;
                log.info(`[GoAway] Pre-compressed ${oldTurns.length} turns (${summary.length} chars)`);
              }
            });
          }

          const handle = resumptionHandleRef.current;
          if (!handle) {
            log.info('No resumption handle available, letting onclose handle reconnect');
            return;
          }
          // Proactive reconnect before the WebSocket drops
          (async () => {
            try {
              const res = await fetchWithKeys('/api/voice/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'goaway_reconnect', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel(), voiceName: paramsRef.current.voiceName }),
              });
              if (!res.ok) throw new Error('Failed to get token for proactive reconnect');
              const { token: freshToken } = await res.json();
              const c = clientRef.current;
              if (!c) return;
              await c.reconnect(freshToken, handle);
              c.resetRetryCount();
              log.info('[Reconnect] Proactive GoAway succeeded (session resumed)');
              onReconnectedRef.current?.();
              // A turn left open on the old socket does not exist on the new one.
              turnDetectorRef.current?.reset();
              timeline.mark('reconnected');
              logTransition('listening', 'goaway_reconnect');
              setTutorState('listening');
            } catch (err) {
              log.error('[Reconnect] Proactive GoAway failed, onclose will handle:', err);
              // Don't set error — let onclose trigger the normal 3-layer flow
            }
          })();
        },
        onReconnectNeeded: (attempt) => {
          if (sessionEndDetectedRef.current || !sessionIdRef.current) {
            log.info('[Reconnect] Skipping reconnect because session is ending/ended');
            return;
          }
          const delay = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
          log.info(`[Reconnect] Scheduling in ${delay}ms (attempt ${attempt + 1})`);

          // Clear stale playback
          stopPlayback();

          // Ensure only one reconnect timer is active at a time
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }

          reconnectTimerRef.current = setTimeout(async () => {
            reconnectTimerRef.current = null;
            try {
              // Fetch a fresh ephemeral token
              const res = await fetchWithKeys('/api/voice/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'reconnect', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel(), voiceName: paramsRef.current.voiceName }),
              });
              if (!res.ok) throw new Error('Failed to get fresh token for reconnect');
              const { token: freshToken } = await res.json();

              const c = clientRef.current;
              if (!c) return;

              // Layer 1: Try resuming with handle
              const handle = resumptionHandleRef.current;
              if (handle) {
                try {
                  await c.reconnect(freshToken, handle);
                  c.resetRetryCount();
                  log.info('[Reconnect] Layer 1 succeeded (session resumed with handle)');
                  onReconnectedRef.current?.();
                  // A turn left open on the old socket does not exist on the new one.
                  turnDetectorRef.current?.reset();
                  timeline.mark('reconnected');
                  logTransition('listening', 'layer1_reconnect');
                  setTutorState('listening');
                  return;
                } catch (layer1Err) {
                  log.info('[Reconnect] Layer 1 failed (handle expired?), falling back to Layer 2:', layer1Err);
                  resumptionHandleRef.current = null;
                  // Need a fresh token since the previous one was consumed
                  const res2 = await fetchWithKeys('/api/voice/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'reconnect_layer2', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel(), voiceName: paramsRef.current.voiceName }),
                  });
                  if (!res2.ok) throw new Error('Failed to get token for Layer 2');
                  const { token: freshToken2 } = await res2.json();
                  await c.reconnect(freshToken2);
                  c.resetRetryCount();
                  // Send reconstructed context
                  const fallbackContext = await buildFallbackContext();
                  if (fallbackContext) {
                    c.sendText(fallbackContext);
                  }
                  log.info('[Reconnect] Layer 2 succeeded (context reconstructed from buffer)');
                  onReconnectedRef.current?.();
                  // A turn left open on the old socket does not exist on the new one.
                  turnDetectorRef.current?.reset();
                  timeline.mark('reconnected');
                  logTransition('listening', 'layer2_reconnect');
                  setTutorState('listening');
                  return;
                }
              }

              // No handle available — go straight to Layer 2
              await c.reconnect(freshToken);
              c.resetRetryCount();
              const fallbackContext = await buildFallbackContext();
              if (fallbackContext) {
                c.sendText(fallbackContext);
              }
              log.info('[Reconnect] Layer 2 succeeded (no handle, context from buffer)');
              onReconnectedRef.current?.();
              // A turn left open on the old socket does not exist on the new one.
              turnDetectorRef.current?.reset();
              timeline.mark('reconnected');
              logTransition('listening', 'layer2_reconnect');
              setTutorState('listening');
            } catch (err) {
              // Layer 3: All reconnect attempts exhausted — show honest error
              const { language: currentLang } = paramsRef.current;
              const msg = currentLang === 'es'
                ? 'La sesión se interrumpió. Tu progreso está guardado.'
                : 'The session was interrupted. Your progress is saved.';
              log.error('[Reconnect] All layers exhausted:', err);
              logTransition('idle', 'reconnect_exhausted');
              setError(msg);
              setConnectionState('error');
              setTutorState('idle');
            }
          }, delay);
        },
      });
      clientRef.current = client;

      timeline.facts.model = resolveVoiceLiveModel();
      timeline.facts.instructionChars = systemInstruction.length;
      timeline.facts.promptVersion = TUTOR_PROMPT_VERSION;

      // 4. Connect WebSocket
      await client.connect(token, {
        model: resolveVoiceLiveModel(),
        systemInstruction,
        voiceName: paramsRef.current.voiceName,
        realtimeInputConfig: TURN_TAKING[paramsRef.current.turnTaking],
        ...(paramsRef.current.tools ? { tools: paramsRef.current.tools } : {}),
      });

      timeline.mark('socket_ready');

      // 5. Start mic
      await startMic(client);
      timeline.mark('mic_capturing');
      logTransition('listening', 'session_started');
      setTutorState('listening');

      // 6. Send initial message — the model should jump straight to a question
      const prompt = initMsg ?? opener ?? (lang === 'es' ? 'Estoy listo.' : "I'm ready.");
      client.sendText(prompt);
      timeline.openerSent();

      // 7. Start session timer (display only — no auto-disconnect)
      startTimer();

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      setConnectionState('error');
      setTutorState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAudioChunk, stopPlayback, startMic, startTimer, saveTranscript, commitUtterance, buildFallbackContext, logTransition]);

  // ---- Disconnect ----

  const disconnect = useCallback(() => {
    const sid = sessionIdRef.current;
    const writeToken = sessionWriteTokenRef.current;
    log.info(`[Disconnect] Requested sid=${sid ?? 'none'}`);
    commitUtterance();
    const outbox = transcriptOutboxRef.current;
    const diag = timelineRef.current.toDiag('disconnect');
    keepRecentTalk(sid);

    if (muteNudgeTimerRef.current) {
      clearTimeout(muteNudgeTimerRef.current);
      muteNudgeTimerRef.current = null;
    }

    // Cancel any pending reconnect attempt
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Freeze session refs immediately so no more transcript events are queued.
    // The outbox keeps its own session and drains below.
    transcriptOutboxRef.current = null;
    sessionIdRef.current = null;
    sessionWriteTokenRef.current = null;
    setSessionId(null);

    stopMic();
    stopPlayback();
    stopTimer();
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    // Reset resilience refs
    resumptionHandleRef.current = null;
    transcriptBufferRef.current = [];
    modelTranscriptWindowRef.current = '';
    sessionEndDetectedRef.current = false;
    if (endKeywordTimerRef.current) {
      clearTimeout(endKeywordTimerRef.current);
      endKeywordTimerRef.current = null;
    }

    logTransition('idle', 'disconnect');
    setTutorState('idle');
    setConnectionState('disconnected');
    setError(null);

    // Drain the transcript outbox, then end the session in the backend (best effort).
    if (sid) void finishSession(sid, writeToken, outbox, diag);

    // NOTE: manual disconnect does NOT call onSessionComplete.
    // Only AI-driven completion (via transcript detection) unlocks the quiz.
  }, [commitUtterance, logTransition, stopMic, stopPlayback, stopTimer]);

  // Keep disconnectRef in sync so saveTranscript can call it
  disconnectRef.current = disconnect;

  // Expose sendToolResponse for tool-use pipeline. A tool answered before the
  // first word can leave the reply mute on 3.8 (the landing's measurement): if
  // no audio comes within MUTE_AFTER_TOOL_MS, one text turn asks for the voice.
  const sendToolResponse = useCallback((responses: FunctionResponse[]) => {
    const client = clientRef.current;
    if (!client) return;
    client.sendToolResponse(responses);
    if (audioInTurnRef.current || muteNudgedThisTurnRef.current || muteNudgeTimerRef.current) return;
    muteNudgeTimerRef.current = setTimeout(() => {
      muteNudgeTimerRef.current = null;
      if (audioInTurnRef.current || clientRef.current !== client) return;
      muteNudgedThisTurnRef.current = true;
      timelineRef.current.mark('mute_nudge');
      const lang = paramsRef.current.language;
      client.sendText(lang === 'es' ? 'Respondé ahora en voz alta, desde donde estabas.' : 'Answer now, out loud, from where you were.');
    }, MUTE_AFTER_TOOL_MS);
  }, []);

  // ---- A session that does not hear: replace it ----
  //
  // gemini-3.8-live sometimes opens a session that speaks but never takes the
  // microphone: no input transcription, no answer to anything said, while a
  // text turn still gets a reply. 5 of 28 probe sessions on 2026-11-20, with
  // and without notes sent meanwhile (docs/research/voice-probe/
  // coding-mock-deaf.md), and the owner's session 522c1b71: 150 s of talking,
  // nothing transcribed. MicActivity sees it (voice on the mic, nothing
  // transcribed for 15 s); the fix is a fresh socket fed the conversation so
  // far, and one line asking the tutor to say it lost them and to ask again.
  useEffect(() => {
    recoverDeafRef.current = (client, mic) => {
      if (deafRecoveryRef.current.busy || deafRecoveryRef.current.count >= MAX_DEAF_RECOVERIES) return;
      if (clientRef.current !== client || sessionEndDetectedRef.current || !sessionIdRef.current) return;
      deafRecoveryRef.current.busy = true;
      deafRecoveryRef.current.count += 1;
      timelineRef.current.mark('deaf_restart', { n: deafRecoveryRef.current.count });
      log.info(`[Deaf] Voice on the mic and nothing transcribed: restarting the session (${deafRecoveryRef.current.count})`);
      stopPlayback();
      void (async () => {
        try {
          const res = await fetchWithKeys('/api/voice/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'deaf_restart', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel(), voiceName: paramsRef.current.voiceName }),
          });
          if (!res.ok) throw new Error('Failed to get a token to restart a deaf session');
          const { token } = await res.json();
          if (clientRef.current !== client) return;
          resumptionHandleRef.current = null;
          await client.restart(token);
          client.resetRetryCount();
          const context = await buildFallbackContext();
          const sorry =
            paramsRef.current.language === 'es'
              ? 'El audio se cortó un momento y no escuchaste lo último que dijo. Decí en una frase corta que lo perdiste un momento y pedile que lo repita.'
              : 'The audio dropped for a moment and you did not hear what they just said. Say, in one short sentence, that you lost them for a moment, and ask them to say it again.';
          client.sendText([context?.replace(/\n\n[^\n]+$/, ''), `[${sorry}]`].filter(Boolean).join('\n\n'));
          turnDetectorRef.current?.reset();
          onReconnectedRef.current?.();
          timelineRef.current.mark('reconnected');
          setTutorState('listening');
        } catch (err) {
          log.error('[Deaf] Restart failed:', err);
          timelineRef.current.counters.lastError = `deaf_restart: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200);
        } finally {
          // What was said into the deaf session is gone: the count starts again on the new one.
          mic.heard();
          deafRecoveryRef.current.busy = false;
        }
      })();
    };
  }, [buildFallbackContext, stopPlayback]);

  const micLastVoiceAt = useCallback(() => micActivityRef.current.lastVoiceAt, []);
  const noteTyping = useCallback(() => {
    lastKeyAtRef.current = Date.now();
  }, []);

  const sendText = useCallback((text: string, options?: { respond?: boolean }) => {
    clientRef.current?.sendText(text, options?.respond ?? false);
  }, []);

  // ---- Tab closed or navigated away: store what was said ----
  //
  // React cleanups do not run when the page unloads, so a learner's answer the
  // model had not answered yet (still an open utterance) and the last 500 ms of
  // queue were lost on close or reload. The first request starts synchronously.

  useEffect(() => {
    const onPageHide = (event: PageTransitionEvent) => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      commitUtterance();
      const outbox = transcriptOutboxRef.current;
      if (!event.persisted) {
        // The page is going away for good: close the session now, so it is
        // digested and in the memory of the next one (what is still unsent
        // stays in localStorage for the next page load).
        void finishSession(sid, sessionWriteTokenRef.current, outbox, timelineRef.current.toDiag('pagehide'));
      } else {
        void outbox?.flush({ keepalive: true });
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [commitUtterance]);

  // ---- Cleanup on unmount ----

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      commitUtterance();
      const sid = sessionIdRef.current;
      const writeToken = sessionWriteTokenRef.current;
      const outbox = transcriptOutboxRef.current;
      transcriptOutboxRef.current = null;
      keepRecentTalk(sid);
      if (sid) void finishSession(sid, writeToken, outbox, timelineRef.current.toDiag('unmount'));

      stopMic();
      stopPlayback();
      stopTimer();
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [commitUtterance, stopMic, stopPlayback, stopTimer]);

  return {
    connectionState,
    tutorState,
    error,
    elapsed,
    connect,
    disconnect,
    sessionId,
    transcript,
    stream,
    micHealth,
    micLastVoiceAt,
    noteTyping,
    sendToolResponse,
    playbackAnalyser: playbackAnalyserRef.current,
    sendText,
    lessonMemory,
  };
}
