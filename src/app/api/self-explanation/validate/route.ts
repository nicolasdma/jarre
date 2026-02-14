import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { callDeepSeek } from '@/lib/llm/deepseek';
import { SELF_EXPLANATION_AUTO_GENUINE_LENGTH } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('SelfExplanation/Validate');

/**
 * POST /api/self-explanation/validate
 *
 * Lightweight LLM check: "Is this a genuine self-explanation attempt?"
 * Fire-and-forget from the client — doesn't block user advance.
 * Cost: ~$0.001 per call (~50 tokens prompt + ~10 tokens response).
 *
 * Body: { explanation: string, conceptName: string }
 * Returns: { isGenuine: boolean }
 */
export const POST = withAuth(async (request, { }) => {
  try {
    const { explanation, conceptName } = await request.json();

    if (!explanation || typeof explanation !== 'string') {
      return NextResponse.json({ isGenuine: true });
    }

    // Skip validation for substantial explanations
    if (explanation.trim().length > SELF_EXPLANATION_AUTO_GENUINE_LENGTH) {
      return NextResponse.json({ isGenuine: true });
    }

    const { content } = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content: 'You are a learning quality checker. Respond with ONLY "yes" or "no".',
        },
        {
          role: 'user',
          content: `Is the following a genuine attempt to explain "${conceptName}" in the student's own words? A genuine attempt shows some understanding, even if incomplete. Random text, single words, or "I don't know" are NOT genuine.\n\nStudent wrote: "${explanation.trim()}"\n\nAnswer yes or no:`,
        },
      ],
      temperature: 0,
      maxTokens: 5,
      responseFormat: 'text',
    });

    const isGenuine = content.toLowerCase().trim().startsWith('yes');
    return NextResponse.json({ isGenuine });
  } catch (error) {
    log.error('Error:', error);
    // On error, assume genuine — don't punish the user for API failures
    return NextResponse.json({ isGenuine: true });
  }
});
