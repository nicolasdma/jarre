'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createGeminiLiveClient,
  arrayBufferToBase64,
  type GeminiLiveClientInstance,
  type ConnectionState,
} from '@/lib/voice/gemini-live';
import { buildLearningSession } from '@/lib/llm/voice-tutor-session';
import { resolveVoiceLiveModel, TURN_TAKING, type TurnTaking } from '@/lib/voice/live-models';
import { formatMemoryForPrompt, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';
import { VOICE_COMPRESS_THRESHOLD, VOICE_FALLBACK_RECENT_TURNS } from '@/lib/constants';
import type { Language } from '@/lib/translations';
import type { Tool, FunctionCall, FunctionResponse } from '@google/genai';
import { fetchWithKeys } from '@/lib/api/fetch-with-keys';
import { decideSessionEnd, type SessionEndPolicy } from '@/lib/voice/session-end';

const log = createLogger('VoiceSession');

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
  lessonSections?: { title: string; content: string }[];
  /**
   * How long a pause ends the learner's turn. 'patient' is for answers in a
   * second language, where people stop to find the word.
   */
  turnTaking?: TurnTaking;
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
}



export type TutorState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
}

interface QueuedTranscriptEvent {
  turnId: string;
  seq: number;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
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
  /** Send tool responses back to Gemini */
  sendToolResponse: (responses: FunctionResponse[]) => void;
  /** AnalyserNode for tutor playback audio frequency data */
  playbackAnalyser: AnalyserNode | null;
  /**
   * Text into the live conversation: `respond` asks the model to speak now,
   * otherwise it is context for its next turn. No-op when not connected.
   */
  sendText: (text: string, options?: { respond?: boolean }) => void;
}

// ============================================================================
// Constants
// ============================================================================

const VOICE_NAME = 'Kore';
/** Under the token's 10-minute window to open a socket (src/lib/voice/live-token.ts). */
const PREFETCHED_TOKEN_MAX_AGE_MS = 8 * 60 * 1000;
const MIC_CHUNK_INTERVAL_MS = 100;
const TRANSCRIPT_FLUSH_INTERVAL_MS = 500;
const TRANSCRIPT_BATCH_SIZE = 40;
const TRANSCRIPT_MAX_RETRY_DELAY_MS = 4000;
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
  endPolicy = 'default',
  bilingual = false,
  onReconnected,
}: UseVoiceSessionParams): VoiceSession {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
  const transcriptQueueRef = useRef<QueuedTranscriptEvent[]>([]);
  const transcriptFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptFlushInFlightRef = useRef(false);
  const transcriptRetryDelayRef = useRef(250);
  const transcriptFlushPromiseRef = useRef<Promise<boolean> | null>(null);

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
  const prefetchedContextRef = useRef<{ summary?: string; learnerMemory?: LearnerConceptMemory[] } | null>(null);
  const prefetchSectionIdRef = useRef<string | null>(null);

  // Track params in ref so callbacks don't go stale
  const paramsRef = useRef({ sectionId, sectionContent, sectionTitle, language, systemInstructionOverride, sessionType, resourceId, initialMessage, conceptIds, tools, onToolCall, lessonTitle, lessonSections, turnTaking, endPolicy, bilingual });
  paramsRef.current = { sectionId, sectionContent, sectionTitle, language, systemInstructionOverride, sessionType, resourceId, initialMessage, conceptIds, tools, onToolCall, lessonTitle, lessonSections, turnTaking, endPolicy, bilingual };

  const onReconnectedRef = useRef(onReconnected);
  onReconnectedRef.current = onReconnected;

  // Stable ref for onSessionComplete to avoid stale closures
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  // ---- Pre-fetch token + context on mount / sectionId change ----

  const prefetchTokenAndContext = useCallback(async () => {
    // Invalidate previous pre-fetch if section changed
    prefetchedTokenRef.current = null;
    prefetchedContextRef.current = null;
    prefetchSectionIdRef.current = sectionId;

    const currentSectionId = sectionId;

    // For evaluation sessions, skip context fetching (no section memory needed)
    const contextUrl = new URL('/api/voice/session/context', window.location.origin);
    contextUrl.searchParams.set('sectionId', currentSectionId);
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
        body: JSON.stringify({ reason: 'prefetch', sessionType, model: resolveVoiceLiveModel() }),
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
  }, [sectionId, sessionType, conceptIds]);

  // Skip prefetch when systemInstructionOverride is provided — the caller
  // (e.g. useUnifiedVoiceSession) manages its own context fetching and will
  // call connect() with the instruction already built. Prefetching here would
  // cause duplicate token/context requests and 400 errors from empty sectionId.
  useEffect(() => {
    if (!systemInstructionOverride) {
      prefetchTokenAndContext();
    }
  }, [prefetchTokenAndContext, systemInstructionOverride]);

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

    sendTimer = setInterval(() => {
      if (pcmBuffer.length === 0) return;

      // Concatenate buffered chunks
      const totalLength = pcmBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
      const merged = new Int16Array(totalLength);
      let offset = 0;
      for (const chunk of pcmBuffer) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      pcmBuffer = [];

      client.sendAudio(arrayBufferToBase64(merged.buffer));
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

  // ---- Transcript queue + flushing ----

  const flushTranscriptQueue = useCallback(
    async (opts?: {
      keepalive?: boolean;
      forceAll?: boolean;
      reason?: string;
      sessionId?: string;
      writeToken?: string;
    }): Promise<boolean> => {
      if (transcriptFlushInFlightRef.current) return false;

      const sid = opts?.sessionId ?? sessionIdRef.current;
      const writeToken = opts?.writeToken ?? sessionWriteTokenRef.current;
      if (!sid || !writeToken) return false;
      if (transcriptQueueRef.current.length === 0) return true;

      transcriptFlushInFlightRef.current = true;
      const forceAll = !!opts?.forceAll;
      let sentAny = false;

      try {
        do {
          const batch = transcriptQueueRef.current.slice(0, TRANSCRIPT_BATCH_SIZE);
          if (batch.length === 0) break;

          const res = await fetch('/api/voice/session/transcript', {
            method: 'POST',
            keepalive: !!opts?.keepalive,
            headers: {
              'Content-Type': 'application/json',
              'X-Voice-Session-Token': writeToken,
            },
            body: JSON.stringify({
              sessionId: sid,
              writeToken,
              events: batch.map((event) => ({
                turnId: event.turnId,
                seq: event.seq,
                role: event.role,
                text: event.text,
                timestamp: event.timestamp,
              })),
            }),
          });

          if (!res.ok) {
            if (res.status === 401) {
              log.warn(
                `[TranscriptFlush] Unauthorized sid=${sid} reason=${opts?.reason ?? 'unknown'}`,
              );
            }
            throw new Error(`Transcript flush failed with ${res.status}`);
          }

          transcriptQueueRef.current.splice(0, batch.length);
          transcriptRetryDelayRef.current = 250;
          sentAny = true;
        } while (forceAll && transcriptQueueRef.current.length > 0);

        if (transcriptQueueRef.current.length > 0 && !transcriptFlushTimerRef.current) {
          transcriptFlushTimerRef.current = setTimeout(() => {
            transcriptFlushTimerRef.current = null;
            const pending = flushTranscriptQueue({ reason: 'follow_up' });
            transcriptFlushPromiseRef.current = pending;
            pending.catch(() => {});
          }, 0);
        }

        return sentAny;
      } catch (err) {
        const delay = transcriptRetryDelayRef.current;
        transcriptRetryDelayRef.current = Math.min(
          TRANSCRIPT_MAX_RETRY_DELAY_MS,
          delay * 2,
        );
        if (!transcriptFlushTimerRef.current) {
          transcriptFlushTimerRef.current = setTimeout(() => {
            transcriptFlushTimerRef.current = null;
            const pending = flushTranscriptQueue({ reason: 'retry' });
            transcriptFlushPromiseRef.current = pending;
            pending.catch(() => {});
          }, delay);
        }
        log.warn(
          `[TranscriptFlush] Failed sid=${sid} reason=${opts?.reason ?? 'unknown'} queue=${transcriptQueueRef.current.length} err=${err instanceof Error ? err.message : String(err)}`,
        );
        return false;
      } finally {
        transcriptFlushInFlightRef.current = false;
        transcriptFlushPromiseRef.current = null;
      }
    },
    [],
  );

  const scheduleTranscriptFlush = useCallback((delayMs = TRANSCRIPT_FLUSH_INTERVAL_MS) => {
    if (transcriptFlushTimerRef.current) return;
    if (transcriptQueueRef.current.length === 0) return;

    transcriptFlushTimerRef.current = setTimeout(() => {
      transcriptFlushTimerRef.current = null;
      const pending = flushTranscriptQueue({ reason: 'scheduled' });
      transcriptFlushPromiseRef.current = pending;
      pending.catch(() => {});
    }, delayMs);
  }, [flushTranscriptQueue]);

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
    if (!sid) return;

    const preview = text.length > 140 ? `${text.slice(0, 140)}...` : text;
    log.info(`[Transcript] role=${role} sid=${sid} text="${preview}"`);

    // Accumulate in local buffer for Layer 2 fallback context
    transcriptBufferRef.current.push({ role, text, ts: Date.now() });

    const seq = ++transcriptSeqRef.current;
    transcriptQueueRef.current.push({
      turnId: `${sid}-${seq}`,
      seq,
      role,
      text,
      timestamp: new Date().toISOString(),
    });

    if (transcriptQueueRef.current.length >= TRANSCRIPT_BATCH_SIZE) {
      const pending = flushTranscriptQueue({ reason: 'batch_full' });
      transcriptFlushPromiseRef.current = pending;
      pending.catch(() => {});
    } else {
      scheduleTranscriptFlush();
    }
  }, [flushTranscriptQueue, scheduleTranscriptFlush]);

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

  // ---- Connect ----

  const connect = useCallback(async () => {
    setError(null);

    // Reset resilience refs for fresh session
    resumptionHandleRef.current = null;
    compressedSummaryRef.current = null;
    transcriptBufferRef.current = [];
    transcriptQueueRef.current = [];
    transcriptSeqRef.current = 0;
    transcriptRetryDelayRef.current = 250;
    sessionWriteTokenRef.current = null;
    if (transcriptFlushTimerRef.current) {
      clearTimeout(transcriptFlushTimerRef.current);
      transcriptFlushTimerRef.current = null;
    }
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
            body: JSON.stringify({ reason: 'connect', sessionType: sessType, model: resolveVoiceLiveModel() }),
          })
            .then((r) => {
              if (!r.ok) throw new Error('Failed to get voice token');
              return r.json();
            })
            .then((d) => d.token as string);

      // Use pre-fetched context if available, otherwise fetch fresh.
      // When systemInstructionOverride is set, the caller already built the prompt
      // with its own context — skip fetching here to avoid duplicate requests.
      const contextPromise: Promise<{ summary?: string; learnerMemory?: LearnerConceptMemory[]; practicesEnglish?: boolean }> = sysOverride
        ? Promise.resolve({})
        : prefetchedContextRef.current
          ? Promise.resolve(prefetchedContextRef.current)
          : (() => {
              const ctxUrl = new URL('/api/voice/session/context', window.location.origin);
              ctxUrl.searchParams.set('sectionId', secId);
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
        }),
        tokenPromise,
        contextPromise,
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
        const sections = ls?.length ? ls : [{ title: st, content: sc }];
        const focus = Math.max(0, sections.findIndex((s) => s.title === st));
        const session = buildLearningSession({
          language: lang,
          lesson: { title: lt || st, sections },
          focusSectionIndex: focus,
          learnerNotes: formatMemoryForPrompt(learnerMemory, lang) || null,
          previousSummary: summary ?? null,
          bilingual: bi || context?.practicesEnglish === true,
        });
        systemInstruction = session.instruction;
        opener = session.opener;
      }

      // 3. Create Gemini Live client
      const client = createGeminiLiveClient({
        onAudioResponse: (audioChunk) => {
          setTutorState((prev) => {
            if (prev !== 'speaking') logTransition('speaking', 'first_audio_chunk');
            return 'speaking';
          });
          playAudioChunk(audioChunk);
        },
        onTurnComplete: () => {
          commitUtterance();
          logTransition('listening', 'turn_complete');
          setTutorState('listening');
        },
        onInterrupted: () => {
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
          logTransition('idle', `error: ${err}`);
          setError(err);
          setTutorState('idle');
        },
        onTranscript: saveTranscript,
        onToolCall: (functionCalls) => {
          log.info(
            `[ToolCall] Forwarding ${functionCalls.length} call(s): ${functionCalls
              .map((call) => call.name || 'unknown')
              .join(', ')}`,
          );
          paramsRef.current.onToolCall?.(functionCalls);
        },
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
                body: JSON.stringify({ reason: 'goaway_reconnect', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel() }),
              });
              if (!res.ok) throw new Error('Failed to get token for proactive reconnect');
              const { token: freshToken } = await res.json();
              const c = clientRef.current;
              if (!c) return;
              await c.reconnect(freshToken, handle);
              c.resetRetryCount();
              log.info('[Reconnect] Proactive GoAway succeeded (session resumed)');
              onReconnectedRef.current?.();
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
                body: JSON.stringify({ reason: 'reconnect', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel() }),
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
                    body: JSON.stringify({ reason: 'reconnect_layer2', sessionType: paramsRef.current.sessionType, model: resolveVoiceLiveModel() }),
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

      // 4. Connect WebSocket
      await client.connect(token, {
        model: resolveVoiceLiveModel(),
        systemInstruction,
        voiceName: VOICE_NAME,
        realtimeInputConfig: TURN_TAKING[paramsRef.current.turnTaking],
        ...(paramsRef.current.tools ? { tools: paramsRef.current.tools } : {}),
      });

      // 5. Start mic
      await startMic(client);
      logTransition('listening', 'session_started');
      setTutorState('listening');

      // 6. Send initial message — the model should jump straight to a question
      const prompt = initMsg ?? opener ?? (lang === 'es' ? 'Estoy listo.' : "I'm ready.");
      client.sendText(prompt);

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

    // Cancel any pending reconnect attempt
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (transcriptFlushTimerRef.current) {
      clearTimeout(transcriptFlushTimerRef.current);
      transcriptFlushTimerRef.current = null;
    }

    // Freeze session refs immediately so no more transcript events are queued.
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

    // Flush pending transcript queue + end session in backend (best effort).
    if (sid) {
      (async () => {
        if (transcriptQueueRef.current.length > 0 && writeToken) {
          const pending = flushTranscriptQueue({
            keepalive: true,
            forceAll: true,
            reason: 'disconnect',
            sessionId: sid,
            writeToken,
          });
          transcriptFlushPromiseRef.current = pending;
          await pending.catch(() => false);
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (writeToken) {
          headers['X-Voice-Session-Token'] = writeToken;
        }
        await fetch('/api/voice/session/end', {
          method: 'POST',
          keepalive: true,
          headers,
          body: JSON.stringify({ sessionId: sid, writeToken }),
        }).catch(() => {});
        log.info('[Disconnect] /api/voice/session/end fired');
      })();
    } else {
      transcriptQueueRef.current = [];
    }

    // NOTE: manual disconnect does NOT call onSessionComplete.
    // Only AI-driven completion (via transcript detection) unlocks the quiz.
  }, [commitUtterance, flushTranscriptQueue, logTransition, stopMic, stopPlayback, stopTimer]);

  // Keep disconnectRef in sync so saveTranscript can call it
  disconnectRef.current = disconnect;

  // Expose sendToolResponse for tool-use pipeline
  const sendToolResponse = useCallback((responses: FunctionResponse[]) => {
    clientRef.current?.sendToolResponse(responses);
  }, []);

  const sendText = useCallback((text: string, options?: { respond?: boolean }) => {
    clientRef.current?.sendText(text, options?.respond ?? false);
  }, []);

  // ---- Cleanup on unmount ----

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (transcriptFlushTimerRef.current) {
        clearTimeout(transcriptFlushTimerRef.current);
        transcriptFlushTimerRef.current = null;
      }

      commitUtterance();
      const sid = sessionIdRef.current;
      const writeToken = sessionWriteTokenRef.current;
      if (sid) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (writeToken) {
          headers['X-Voice-Session-Token'] = writeToken;
        }

        void flushTranscriptQueue({
          keepalive: true,
          forceAll: true,
          reason: 'unmount',
          sessionId: sid,
          writeToken: writeToken ?? undefined,
        }).finally(() => {
          fetch('/api/voice/session/end', {
            method: 'POST',
            keepalive: true,
            headers,
            body: JSON.stringify({ sessionId: sid, writeToken }),
          }).catch(() => {});
        });
      }

      stopMic();
      stopPlayback();
      stopTimer();
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [commitUtterance, flushTranscriptQueue, stopMic, stopPlayback, stopTimer]);

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
    sendToolResponse,
    playbackAnalyser: playbackAnalyserRef.current,
    sendText,
  };
}
