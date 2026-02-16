/**
 * Jarre - Voice Session Token Route
 *
 * Returns the Gemini API key for client-side Live API connection.
 * Protected by auth — only logged-in users can request it.
 *
 * NOTE: Ephemeral tokens are the ideal approach, but they have a known issue
 * where system_instruction is ignored and sessions close immediately.
 * See: https://discuss.ai.google.dev/t/live-api-with-ephemeral-token-ignores-the-system-instruction/113346
 * When Google fixes this, migrate back to ephemeral tokens.
 *
 * POST /api/voice/token
 * Response: { token: string }
 */

import { withAuth } from '@/lib/api/middleware';
import { jsonOk } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceToken');

export const POST = withAuth(async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log.error('GEMINI_API_KEY not configured');
    throw new Error('Voice service not configured');
  }

  log.info('Voice session token issued');

  return jsonOk({ token: apiKey });
});
