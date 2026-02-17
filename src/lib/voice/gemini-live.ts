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

import { GoogleGenAI, Modality, type Session } from '@google/genai';
import { createLogger } from '@/lib/logger';

const log = createLogger('GeminiLive');

// ============================================================================
// Types
// ============================================================================

export interface GeminiLiveConfig {
  model: string;
  systemInstruction: string;
  voiceName?: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface GeminiLiveCallbacks {
  onAudioResponse: (pcmData: ArrayBuffer) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onConnectionStateChange: (state: ConnectionState) => void;
  onError: (error: string) => void;
  onTranscript?: (role: 'user' | 'model', text: string) => void;
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

// ============================================================================
// Client
// ============================================================================

export function createGeminiLiveClient(callbacks: GeminiLiveCallbacks) {
  let session: Session | null = null;
  let state: ConnectionState = 'disconnected';
  let intentionalClose = false;

  function setState(next: ConnectionState) {
    state = next;
    callbacks.onConnectionStateChange(next);
  }

  return {
    async connect(ephemeralToken: string, config: GeminiLiveConfig): Promise<void> {
      setState('connecting');

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
            inputAudioTranscription: {},
            outputAudioTranscription: {},
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
              const reason = event instanceof CloseEvent
                ? `code=${event.code} reason=${event.reason}`
                : String(event);
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
