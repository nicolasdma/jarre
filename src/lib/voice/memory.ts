/**
 * Jarre - Voice Tutor Memory
 *
 * Generates conversation summaries from past voice transcripts
 * using DeepSeek. Used to give the tutor cross-session memory.
 */

import { callDeepSeek } from '@/lib/llm/deepseek';
import { createLogger } from '@/lib/logger';
import { logTokenUsage } from '@/lib/db/token-usage';

const log = createLogger('VoiceMemory');

interface TranscriptTurn {
  role: 'user' | 'model';
  text: string;
}

/**
 * Generate a concise summary of past voice conversations.
 * Returns null if generation fails (graceful degradation).
 */
export async function generateConversationSummary(
  transcripts: TranscriptTurn[],
  sectionTitle: string,
  userId?: string,
): Promise<string | null> {
  if (transcripts.length === 0) return null;

  const conversation = transcripts
    .map((t) => `${t.role === 'user' ? 'Student' : 'Tutor'}: ${t.text}`)
    .join('\n');

  try {
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content: `You summarize past tutoring conversations for a voice tutor's memory.
Output 3-5 bullet points capturing:
- Key topics discussed
- What the student understood well
- What the student struggled with or got wrong
- Where the conversation left off

Be concise. Each bullet should be one sentence. Output plain text with "- " bullets, no markdown headers.`,
        },
        {
          role: 'user',
          content: `Summarize this past tutoring conversation about "${sectionTitle}":\n\n${conversation}`,
        },
      ],
      temperature: 0.2,
      maxTokens: 500,
      responseFormat: 'text',
    });

    if (!content.trim()) {
      log.error('Empty summary returned from DeepSeek');
      return null;
    }

    if (userId) {
      logTokenUsage({ userId, category: 'voice_memory', tokens: tokensUsed });
    }
    log.info(`Summary generated (${content.length} chars) for "${sectionTitle}", tokens: ${tokensUsed}`);
    return content.trim();
  } catch (err) {
    log.error('Failed to generate conversation summary:', err);
    return null;
  }
}
