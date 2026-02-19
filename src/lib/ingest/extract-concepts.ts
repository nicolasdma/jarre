/**
 * Jarre - Concept Extraction
 *
 * Step 1 of ingestion: DeepSeek analyzes raw content and extracts
 * a summary + a list of technical concepts discussed.
 */

import { z } from 'zod';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { logTokenUsage } from '@/lib/db/token-usage';
import { createLogger } from '@/lib/logger';
import type { ExtractionResult } from './types';

const log = createLogger('ExtractConcepts');

const ExtractionResponseSchema = z.object({
  summary: z.string().min(10),
  concepts: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(5),
    relevance: z.number().min(0).max(1),
  })).min(1).max(30),
});

/**
 * Extract summary and concepts from resource content using DeepSeek.
 */
export async function extractConcepts(params: {
  title: string;
  content: string;
  type: string;
  userId: string;
  language?: string;
}): Promise<ExtractionResult> {
  const { title, content, type, userId, language = 'en' } = params;

  // Truncate content to avoid token limits (approx 12K tokens = ~48K chars)
  const truncatedContent = content.length > 48000
    ? content.slice(0, 48000) + '\n\n[Content truncated...]'
    : content;

  const { content: responseText, tokensUsed } = await callDeepSeek({
    messages: [
      {
        role: 'system',
        content: `You are a technical knowledge analyst. Given content from a ${type} titled "${title}", extract a summary and concepts.

Focus on computer science, distributed systems, AI/ML, and software engineering concepts.
Only extract concepts that are substantively discussed, not merely mentioned.
${language === 'es' ? 'Respond with summary and descriptions in Spanish.' : 'Respond with summary and descriptions in English.'}

You MUST respond with valid JSON using EXACTLY this schema:
{
  "summary": "3-5 sentence summary of the key ideas",
  "concepts": [
    {
      "name": "short identifier (e.g., consensus protocols, memory management)",
      "description": "one-sentence description of how the concept appears in this content",
      "relevance": 0.8
    }
  ]
}

The root keys MUST be "summary" and "concepts" (not "technical_concepts" or any other name).`,
      },
      {
        role: 'user',
        content: `Analyze this ${type}:\n\nTitle: ${title}\n\nContent:\n${truncatedContent}`,
      },
    ],
    temperature: 0.2,
    maxTokens: 2000,
    responseFormat: 'json',
    timeoutMs: 60000,
  });

  const parsed = parseJsonResponse(responseText, ExtractionResponseSchema);

  // Log token usage (fire-and-forget)
  logTokenUsage({ userId, category: 'ingest_extract', tokens: tokensUsed }).catch(() => {});

  log.info(`Extracted ${parsed.concepts.length} concepts from "${title}" (${tokensUsed} tokens)`);

  return {
    summary: parsed.summary,
    concepts: parsed.concepts,
    tokensUsed,
  };
}
