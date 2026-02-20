/**
 * Jarre - Gemini Live Client (SDK-based)
 *
 * Uses @google/genai SDK for Live API connection.
 * The SDK handles WebSocket auth with ephemeral tokens correctly.
 *
 * Audio flow:
 * - Client sends PCM 16kHz mono as base64 via session.sendRealtimeInput()
 * - Server responds with PCM 24kHz audio chunks via callbacks
 * - VAD and interruption are handled server-side by Gemini
 */

import {
  GoogleGenAI,
  Modality,
  type Session,
  type Tool,
  type FunctionCall,
  type FunctionResponse,
} from '@google/genai';
import { createLogger } from '@/lib/logger';

const log = createLogger('GeminiLive');

// ============================================================================
// Types
// ============================================================================

interface GeminiLiveConfig {
  model: string;
  systemInstruction: string;
  voiceName?: string;
  resumptionHandle?: string;
  tools?: Tool[];
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface GeminiLiveCallbacks {
  onAudioResponse: (pcmData: ArrayBuffer) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onConnectionStateChange: (state: ConnectionState) => void;
  onError: (error: string) => void;
  onTranscript?: (role: 'user' | 'model', text: string) => void;
  onInputTranscriptionComplete?: () => void;
  onReconnectNeeded?: (attempt: number) => void;
  onGoAway?: (timeLeftMs: number) => void;
  onResumptionUpdate?: (handle: string, resumable: boolean, lastIndex?: string) => void;
  onToolCall?: (functionCalls: FunctionCall[]) => void;
  onToolCallCancellation?: (cancelledIds: string[]) => void;
}

// ============================================================================
// Helpers
// ============================================================================

/** Convert base64 string to ArrayBuffer */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Convert ArrayBuffer to base64 string */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Parse GoAway time string (e.g., "60s", "120s") to milliseconds */
function parseTimeLeft(timeStr: string): number {
  const match = timeStr.match(/^(\d+(?:\.\d+)?)s$/);
  if (match) return Math.round(parseFloat(match[1]) * 1000);
  // Fallback: try parsing as raw seconds
  const num = parseFloat(timeStr);
  return isNaN(num) ? 0 : Math.round(num * 1000);
}

// ============================================================================
// Client
// ============================================================================

const MAX_RETRIES = 3;
// Codes where retrying is pointless (structural/permanent errors).
// Everything else triggers reconnection — safer than a whitelist since
// unexpected codes (like 1008 from Gemini context limits) get retried by default.
const NON_RETRYABLE_CLOSE_CODES = new Set([1000, 1002, 1003, 1007, 1009, 1010]);

export function createGeminiLiveClient(callbacks: GeminiLiveCallbacks) {
  let session: Session | null = null;
  let state: ConnectionState = 'disconnected';
  let intentionalClose = false;
  let retryCount = 0;
  let lastConfig: GeminiLiveConfig | null = null;

  function setState(next: ConnectionState) {
    state = next;
    callbacks.onConnectionStateChange(next);
  }

  return {
    async connect(ephemeralToken: string, config: GeminiLiveConfig): Promise<void> {
      setState('connecting');
      lastConfig = config;
      retryCount = 0;

      try {
        const client = new GoogleGenAI({
          apiKey: ephemeralToken,
        });

        session = await client.live.connect({
          model: config.model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: config.voiceName ?? 'Kore',
                },
              },
            },
            systemInstruction: {
              parts: [{ text: config.systemInstruction }],
            },
            ...(config.tools ? { tools: config.tools } : {}),
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            ...(config.resumptionHandle ? {
              sessionResumption: { handle: config.resumptionHandle },
            } : {}),
            // NOTE: contextWindowCompression removed — not supported on native audio models
            // (causes WebSocket 1008 "Operation is not implemented"). Sessions limited to ~15 min
            // without compression. Our 3-layer reconnection handles this gracefully.
          },
          callbacks: {
            onopen: () => {
              log.info('Session opened');
              setState('connected');
            },
            onmessage: (message) => {
              // Audio response from model
              if (message.serverContent?.modelTurn?.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    const audioBuffer = base64ToArrayBuffer(part.inlineData.data);
                    callbacks.onAudioResponse(audioBuffer);
                  }
                }
              }

              // Audio transcriptions (both input and output come as separate fields)
              const serverContent = (message as unknown as Record<string, unknown>).serverContent;
              if (serverContent && typeof serverContent === 'object') {
                const sc = serverContent as Record<string, unknown>;

                // Model output audio transcription
                if ('outputTranscription' in sc) {
                  const transcription = sc.outputTranscription;
                  if (
                    transcription &&
                    typeof transcription === 'object' &&
                    'text' in (transcription as Record<string, unknown>)
                  ) {
                    const text = (transcription as Record<string, unknown>).text;
                    if (typeof text === 'string' && text.trim() && callbacks.onTranscript) {
                      callbacks.onTranscript('model', text.trim());
                    }
                  }
                }

                // User input audio transcription
                if ('inputTranscription' in sc) {
                  const transcription = sc.inputTranscription;
                  if (
                    transcription &&
                    typeof transcription === 'object' &&
                    'text' in (transcription as Record<string, unknown>)
                  ) {
                    const text = (transcription as Record<string, unknown>).text;
                    if (typeof text === 'string' && text.trim() && callbacks.onTranscript) {
                      callbacks.onTranscript('user', text.trim());
                    }
                  }
                  // Signal that user speech has been processed — model is now "thinking"
                  callbacks.onInputTranscriptionComplete?.();
                }
              }

              // Interruption: model was cut off by user speech
              if (message.serverContent?.interrupted) {
                callbacks.onInterrupted();
              }

              // Turn complete: model finished speaking
              if (message.serverContent?.turnComplete) {
                callbacks.onTurnComplete();
              }

              // GoAway: server is about to close the session
              const msg = message as unknown as Record<string, unknown>;
              if (msg.goAway && callbacks.onGoAway) {
                const goAway = msg.goAway as Record<string, unknown>;
                const timeLeft = typeof goAway.timeLeft === 'string'
                  ? parseTimeLeft(goAway.timeLeft)
                  : 0;
                log.info(`GoAway received, time left: ${timeLeft}ms`);
                callbacks.onGoAway(timeLeft);
              }

              // Tool calls from model
              if (msg.toolCall && callbacks.onToolCall) {
                const toolCall = msg.toolCall as Record<string, unknown>;
                const functionCalls = toolCall.functionCalls as FunctionCall[] | undefined;
                if (functionCalls?.length) {
                  callbacks.onToolCall(functionCalls);
                }
              }

              // Tool call cancellation
              if (msg.toolCallCancellation && callbacks.onToolCallCancellation) {
                const cancellation = msg.toolCallCancellation as Record<string, unknown>;
                const ids = cancellation.ids as string[] | undefined;
                if (ids?.length) {
                  callbacks.onToolCallCancellation(ids);
                }
              }

              // Session resumption update: new handle available
              if (msg.sessionResumptionUpdate && callbacks.onResumptionUpdate) {
                const update = msg.sessionResumptionUpdate as Record<string, unknown>;
                const handle = typeof update.newHandle === 'string' ? update.newHandle : '';
                const resumable = update.resumable === true;
                const lastIndex = typeof update.lastContentIndex === 'string'
                  ? update.lastContentIndex
                  : undefined;
                if (handle) {
                  log.info(`Resumption handle updated (resumable: ${resumable})`);
                  callbacks.onResumptionUpdate(handle, resumable, lastIndex);
                }
              }
            },
            onerror: (error) => {
              log.error('Session error:', error);
              setState('error');
              const msg = error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'message' in error
                  ? String((error as unknown as Record<string, unknown>).message)
                  : 'Session error';
              callbacks.onError(msg);
            },
            onclose: (event) => {
              if (intentionalClose) {
                log.info('Session closed (user disconnected)');
                return;
              }

              const closeCode = event instanceof CloseEvent ? event.code : 0;
              const reason = event instanceof CloseEvent
                ? `code=${event.code} reason=${event.reason}`
                : String(event);

              // Retry unless the close code indicates a permanent/structural error
              if (
                !NON_RETRYABLE_CLOSE_CODES.has(closeCode) &&
                retryCount < MAX_RETRIES &&
                callbacks.onReconnectNeeded
              ) {
                log.info(`Retryable disconnect (${reason}), attempt ${retryCount + 1}/${MAX_RETRIES}`);
                session = null;
                setState('reconnecting');
                callbacks.onReconnectNeeded(retryCount);
                return;
              }

              log.error('Session closed unexpectedly:', reason);
              if (state !== 'disconnected') {
                callbacks.onError(`Disconnected: ${reason}`);
                setState('disconnected');
              }
            },
          },
        });

        // If onopen hasn't fired yet, session creation success means connected
        if (state === 'connecting') {
          setState('connected');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed';
        log.error('Connect failed:', msg);
        setState('error');
        throw err;
      }
    },

    async reconnect(ephemeralToken: string, resumptionHandle?: string): Promise<void> {
      if (!lastConfig) {
        throw new Error('No previous config to reconnect with');
      }
      retryCount++;
      const savedRetryCount = retryCount;
      // Reuse the stored config, injecting resumption handle if provided
      const reconnectConfig = resumptionHandle
        ? { ...lastConfig, resumptionHandle }
        : lastConfig;
      await this.connect(ephemeralToken, reconnectConfig);
      // Restore retry count (connect() resets it, but during reconnect we need to keep tracking)
      retryCount = savedRetryCount;
    },

    resetRetryCount() {
      retryCount = 0;
    },

    sendAudio(base64Audio: string) {
      if (!session || state !== 'connected') return;

      try {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio,
          },
        });
      } catch (err) {
        log.error('Failed to send audio:', err);
      }
    },

    /** Send tool responses back to Gemini after processing tool calls */
    sendToolResponse(responses: FunctionResponse[]) {
      if (!session || state !== 'connected') return;

      try {
        session.sendToolResponse({ functionResponses: responses });
      } catch (err) {
        log.error('Failed to send tool response:', err);
      }
    },

    /** Send a text message to prompt the model to speak (e.g., greeting) */
    sendText(text: string) {
      if (!session || state !== 'connected') return;

      try {
        session.sendClientContent({ turns: text });
      } catch (err) {
        log.error('Failed to send text:', err);
      }
    },

    disconnect() {
      intentionalClose = true;
      setState('disconnected');
      if (session) {
        try {
          session.close();
        } catch {
          // Session may already be closed
        }
        session = null;
      }
    },

    getState(): ConnectionState {
      return state;
    },
  };
}

export type GeminiLiveClientInstance = ReturnType<typeof createGeminiLiveClient>;
