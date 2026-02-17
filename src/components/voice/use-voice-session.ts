'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createGeminiLiveClient,
  arrayBufferToBase64,
  type GeminiLiveClientInstance,
  type ConnectionState,
} from '@/lib/voice/gemini-live';
import { buildVoiceSystemInstruction } from '@/lib/llm/voice-prompts';
import type { Language } from '@/lib/translations';

// ============================================================================
// Types
// ============================================================================

interface UseVoiceSessionParams {
  sectionId: string;
  sectionContent: string;
  sectionTitle: string;
  language: Language;
  onSessionComplete?: () => void;
}

type TutorState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceSession {
  connectionState: ConnectionState;
  tutorState: TutorState;
  error: string | null;
  elapsed: number;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const VOICE_NAME = 'Kore';
const MIC_CHUNK_INTERVAL_MS = 100;
const MAX_SESSION_DURATION_MS = 30 * 60 * 1000; // 30 min
const WARNING_BEFORE_END_MS = 5 * 60 * 1000; // warn at 25 min

// ============================================================================
// Hook
// ============================================================================

export function useVoiceSession({
  sectionId,
  sectionContent,
  sectionTitle,
  language,
  onSessionComplete,
}: UseVoiceSessionParams): VoiceSession {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const clientRef = useRef<GeminiLiveClientInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Pre-fetch refs
  const prefetchedTokenRef = useRef<string | null>(null);
  const prefetchedContextRef = useRef<{ summary?: string } | null>(null);
  const prefetchSectionIdRef = useRef<string | null>(null);

  // Track params in ref so callbacks don't go stale
  const paramsRef = useRef({ sectionId, sectionContent, sectionTitle, language });
  paramsRef.current = { sectionId, sectionContent, sectionTitle, language };

  // Stable ref for onSessionComplete to avoid stale closures
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  // ---- Pre-fetch token + context on mount / sectionId change ----

  useEffect(() => {
    // Invalidate previous pre-fetch if section changed
    prefetchedTokenRef.current = null;
    prefetchedContextRef.current = null;
    prefetchSectionIdRef.current = sectionId;

    const currentSectionId = sectionId;

    Promise.all([
      fetch('/api/voice/token', { method: 'POST' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/voice/session/context?sectionId=${currentSectionId}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([tokenData, contextData]) => {
      // Only store if sectionId hasn't changed while fetching
      if (prefetchSectionIdRef.current !== currentSectionId) return;
      if (tokenData?.token) prefetchedTokenRef.current = tokenData.token;
      if (contextData) prefetchedContextRef.current = contextData;
    });
  }, [sectionId]);

  // ---- Playback: schedule PCM audio chunks on AudioContext ----

  const playAudioChunk = useCallback((pcmData: ArrayBuffer) => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    const ctx = playbackContextRef.current;

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
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  }, []);

  const stopPlayback = useCallback(() => {
    // Reset playback scheduling so any queued chunks are effectively skipped
    nextPlayTimeRef.current = 0;
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
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setElapsed(0);
  }, []);

  // Ref for disconnect so saveTranscript can call it without circular dependency
  const disconnectRef = useRef<() => void>(() => {});

  // ---- Transcript saving (fire-and-forget) ----

  const saveTranscript = useCallback((role: 'user' | 'model', text: string) => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    fetch('/api/voice/session/transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, role, text }),
    }).catch(() => {
      // Fire-and-forget: don't block audio for transcript failures
    });

    // Detect AI-driven session completion: the prompt instructs the tutor
    // to say "quiz" when wrapping up. When we see it in the model's
    // transcript, wait for the audio to finish, then auto-disconnect.
    if (role === 'model' && /quiz/i.test(text)) {
      setTimeout(() => {
        disconnectRef.current();
        onSessionCompleteRef.current?.();
      }, 3000);
    }
  }, []);

  // ---- Connect ----

  const connect = useCallback(async () => {
    setError(null);

    try {
      const { sectionId: secId, sectionContent: sc, sectionTitle: st, language: lang } = paramsRef.current;

      // Use pre-fetched token if available, otherwise fetch fresh
      const tokenPromise = prefetchedTokenRef.current
        ? Promise.resolve(prefetchedTokenRef.current)
        : fetch('/api/voice/token', { method: 'POST' })
            .then((r) => {
              if (!r.ok) throw new Error('Failed to get voice token');
              return r.json();
            })
            .then((d) => d.token as string);

      // Use pre-fetched context if available, otherwise fetch fresh
      const contextPromise: Promise<{ summary?: string }> = prefetchedContextRef.current
        ? Promise.resolve(prefetchedContextRef.current)
        : fetch(`/api/voice/session/context?sectionId=${secId}`)
            .then((r) => (r.ok ? r.json() : {}))
            .catch(() => ({}));

      // Start session (always fresh) + resolve token/context in parallel
      const [sessionRes, token, context] = await Promise.all([
        fetch('/api/voice/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId: secId }),
        }),
        tokenPromise,
        contextPromise,
      ]);

      // Consume pre-fetched data (one-time use)
      prefetchedTokenRef.current = null;
      prefetchedContextRef.current = null;

      // Extract session ID (non-blocking if fails)
      if (sessionRes.ok) {
        const { sessionId } = await sessionRes.json();
        sessionIdRef.current = sessionId;
      }

      const summary = context?.summary;

      // 2. Build system instruction with optional memory summary
      let systemInstruction = buildVoiceSystemInstruction({
        sectionContent: sc,
        sectionTitle: st,
        language: lang,
      });

      if (summary) {
        systemInstruction += `\n\nPREVIOUS CONVERSATION SUMMARY:\nYou've discussed this section with the student before. Here's what happened:\n${summary}\n\nUse this context naturally. Don't say "last time we talked about..." — just pick up where you left off or build on what they already understand.`;
      }

      // 3. Create Gemini Live client
      const client = createGeminiLiveClient({
        onAudioResponse: (audioChunk) => {
          setTutorState('speaking');
          playAudioChunk(audioChunk);
        },
        onTurnComplete: () => {
          setTutorState('listening');
        },
        onInterrupted: () => {
          stopPlayback();
          setTutorState('listening');
        },
        onConnectionStateChange: setConnectionState,
        onError: (err) => {
          setError(err);
          setTutorState('idle');
        },
        onTranscript: saveTranscript,
      });
      clientRef.current = client;

      // 4. Connect WebSocket
      await client.connect(token, {
        model: MODEL,
        systemInstruction,
        voiceName: VOICE_NAME,
      });

      // 5. Start mic
      await startMic(client);
      setTutorState('listening');

      // 6. Send a context-only message — the model should jump straight to a question
      const prompt = summary
        ? (lang === 'es'
            ? 'Ya leí esta sección y la vez pasada hablamos. Preguntame algo nuevo.'
            : 'I\'ve read this section and we talked before. Ask me something new.')
        : (lang === 'es'
            ? 'Ya leí esta sección.'
            : 'I\'ve read this section.');
      client.sendText(prompt);

      // 7. Start session timer with auto-disconnect
      startTimer();
      warningTimerRef.current = setTimeout(() => {
        setError('La sesión se desconectará en 5 minutos');
      }, MAX_SESSION_DURATION_MS - WARNING_BEFORE_END_MS);
      maxTimerRef.current = setTimeout(() => {
        disconnect();
      }, MAX_SESSION_DURATION_MS);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      setConnectionState('error');
      setTutorState('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playAudioChunk, stopPlayback, startMic, startTimer, saveTranscript]);

  // ---- Disconnect ----

  const disconnect = useCallback(() => {
    // End session in backend (fire-and-forget)
    if (sessionIdRef.current) {
      fetch('/api/voice/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
      }).catch(() => {});
      sessionIdRef.current = null;
    }

    stopMic();
    stopPlayback();
    stopTimer();
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setTutorState('idle');
    setConnectionState('disconnected');
    setError(null);
    // NOTE: manual disconnect does NOT call onSessionComplete.
    // Only AI-driven completion (via transcript detection) unlocks the quiz.
  }, [stopMic, stopPlayback, stopTimer]);

  // Keep disconnectRef in sync so saveTranscript can call it
  disconnectRef.current = disconnect;

  // ---- Cleanup on unmount ----

  useEffect(() => {
    return () => {
      stopMic();
      stopPlayback();
      stopTimer();
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [stopMic, stopPlayback, stopTimer]);

  return {
    connectionState,
    tutorState,
    error,
    elapsed,
    connect,
    disconnect,
  };
}
