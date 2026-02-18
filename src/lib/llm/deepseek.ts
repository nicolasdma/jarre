/**
 * DeepSeek API Client
 *
 * Primary LLM for evaluations. Cheap and capable.
 * API is OpenAI-compatible.
 */

import { z } from 'zod';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat'; // DeepSeek V3

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call DeepSeek API with retry logic.
 */
export async function callDeepSeek(params: {
  messages: DeepSeekMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  timeoutMs?: number;
}): Promise<{ content: string; tokensUsed: number }> {
  const { messages, temperature = 0.3, maxTokens = 2000, responseFormat = 'json', timeoutMs = 45_000 } = params;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const body = {
    model: DEFAULT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(responseFormat === 'json' && { response_format: { type: 'json_object' } }),
  };

  let lastError: Error | null = null;

  // Retry up to 3 times with exponential backoff
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
      }

      const data: DeepSeekResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      return { content, tokensUsed };
    } catch (error) {
      lastError = error as Error;
      // Don't retry on timeout - the request already took too long
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error(`La solicitud al modelo tardó demasiado (timeout ${Math.round(timeoutMs / 1000)}s). Intenta de nuevo.`);
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('La solicitud al modelo fue cancelada.');
      }
      if (attempt < 2) {
        // Wait before retry: 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('DeepSeek API call failed');
}

/**
 * Parse and validate JSON response from LLM.
 */
export function parseJsonResponse<T>(content: string, schema: z.ZodSchema<T>): T {
  try {
    // Try to extract JSON from the response
    let jsonStr = content;

    // If wrapped in markdown code blocks, extract
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);
    return schema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse LLM response:', content);
    throw new Error(`Invalid LLM response format: ${(error as Error).message}`);
  }
}
