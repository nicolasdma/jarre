/**
 * POST /api/voice/session/compress
 * Body: { conversation: string, sectionTitle: string }
 * Response: { summary: string }
 *
 * Lightweight endpoint for progressive in-session compression.
 * Compresses older conversation turns into a running summary
 * so the client can maintain context without growing the buffer indefinitely.
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { logTokenUsage } from '@/lib/db/token-usage';
import { createLogger } from '@/lib/logger';
import { TOKEN_BUDGETS } from '@/lib/constants';

const log = createLogger('VoiceCompress');

export const POST = withAuth(async (request, { user }) => {
  const body = await request.json().catch(() => null);

  const conversation = body?.conversation;
  const sectionTitle = body?.sectionTitle;

  if (!conversation || typeof conversation !== 'string') {
    throw badRequest('conversation is required');
  }
  if (!sectionTitle || typeof sectionTitle !== 'string') {
    throw badRequest('sectionTitle is required');
  }

  try {
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content: `You compress an in-progress tutoring conversation into a concise running summary.
This summary will be injected as context if the voice session reconnects, so preserve:
- The current topic and sub-topic being discussed
- Key points the student made (correct or incorrect)
- Any misconceptions or struggles identified
- Where the conversation was heading next

Output 3-6 bullet points. Be factual and concise. One sentence per bullet. Plain text with "- " bullets.`,
        },
        {
          role: 'user',
          content: `Compress this ongoing conversation about "${sectionTitle}":\n\n${conversation}`,
        },
      ],
      temperature: 0.2,
      maxTokens: TOKEN_BUDGETS.VOICE_COMPRESS,
      responseFormat: 'text',
    });

    if (!content.trim()) {
      log.error('Empty compression result from DeepSeek');
      return jsonOk({ summary: '' });
    }

    logTokenUsage({ userId: user.id, category: 'voice_compress', tokens: tokensUsed });
    log.info(`Compressed conversation (${content.trim().length} chars), tokens: ${tokensUsed}`);

    return jsonOk({ summary: content.trim() });
  } catch (err) {
    log.error('Compression failed:', err);
    // Graceful degradation: return empty summary instead of failing
    return jsonOk({ summary: '' });
  }
});
