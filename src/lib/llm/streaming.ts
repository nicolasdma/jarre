/**
 * DeepSeek Streaming API Client
 *
 * Streaming wrapper for the DeepSeek API. Returns a ReadableStream
 * of Server-Sent Events suitable for direct use in API route responses.
 *
 * SSE output format:
 *   data: {"chunk":"partial text..."}\n\n
 *   data: [DONE]\n\n
 */

import { DeepSeekMessage } from './deepseek';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';

const encoder = new TextEncoder();

/**
 * Encode a string into a SSE-formatted Uint8Array.
 */
function sseEvent(data: string): Uint8Array {
  return encoder.encode(`data: ${data}\n\n`);
}

/**
 * Encode an error into a SSE error event.
 */
function sseError(message: string): Uint8Array {
  return sseEvent(JSON.stringify({ error: message }));
}

/**
 * Call DeepSeek API with streaming enabled.
 *
 * Returns a ReadableStream that emits SSE events:
 *   data: {"chunk":"..."}\n\n   — for each content delta
 *   data: [DONE]\n\n              — when generation is complete
 *   data: {"error":"..."}\n\n   — if something goes wrong
 */
export async function callDeepSeekStream(params: {
  messages: DeepSeekMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<ReadableStream> {
  const { messages, temperature = 0.3, maxTokens = 2000 } = params;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const body = {
    model: DEFAULT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  let response: Response;

  try {
    response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    return new ReadableStream({
      start(controller) {
        controller.enqueue(sseError(`DeepSeek fetch failed: ${message}`));
        controller.enqueue(sseEvent('[DONE]'));
        controller.close();
      },
    });
  }

  if (!response.ok) {
    let errorText: string;
    try {
      errorText = await response.text();
    } catch {
      errorText = 'Unable to read error body';
    }
    return new ReadableStream({
      start(controller) {
        controller.enqueue(sseError(`DeepSeek API error (${response.status}): ${errorText}`));
        controller.enqueue(sseEvent('[DONE]'));
        controller.close();
      },
    });
  }

  if (!response.body) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(sseError('DeepSeek response has no body'));
        controller.enqueue(sseEvent('[DONE]'));
        controller.close();
      },
    });
  }

  // Transform the raw DeepSeek SSE stream into our SSE format.
  // DeepSeek sends lines like:
  //   data: {"id":"...","choices":[{"delta":{"content":"token"},...}],...}
  //   data: [DONE]
  //
  // We re-emit as:
  //   data: {"chunk":"token"}
  //   data: [DONE]

  const upstreamReader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await upstreamReader.read();

        if (done) {
          // If there's leftover data in the buffer, process it
          if (buffer.trim()) {
            processLines(buffer, controller);
          }
          controller.enqueue(sseEvent('[DONE]'));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE lines are terminated by \n)
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          processSSELine(line.trim(), controller);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Stream read error';
        controller.enqueue(sseError(`Stream error: ${message}`));
        controller.enqueue(sseEvent('[DONE]'));
        controller.close();
      }
    },

    cancel() {
      upstreamReader.cancel();
    },
  });
}

/**
 * Process multiple lines from the buffer (used for final flush).
 */
function processLines(
  text: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  const lines = text.split('\n');
  for (const line of lines) {
    processSSELine(line.trim(), controller);
  }
}

/**
 * Process a single SSE line from the DeepSeek response.
 *
 * Extracts delta content from the JSON payload and re-emits
 * it in our simplified SSE format.
 */
function processSSELine(
  line: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void {
  // Skip empty lines and SSE comments
  if (!line || line.startsWith(':')) {
    return;
  }

  // Only process data lines
  if (!line.startsWith('data: ')) {
    return;
  }

  const payload = line.slice(6); // Strip "data: " prefix

  // DeepSeek signals end of stream with [DONE]
  if (payload === '[DONE]') {
    controller.enqueue(sseEvent('[DONE]'));
    controller.close();
    return;
  }

  try {
    const parsed = JSON.parse(payload);
    const content = parsed.choices?.[0]?.delta?.content;

    // Only emit if there's actual content (skip role-only deltas, etc.)
    if (content) {
      controller.enqueue(sseEvent(JSON.stringify({ chunk: content })));
    }
  } catch {
    // Malformed JSON from upstream — log but don't crash the stream
    console.error('[streaming] Failed to parse DeepSeek SSE payload:', payload);
  }
}
