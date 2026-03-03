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
import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { checkTokenBudget, checkVoiceTimeBudget } from '@/lib/api/rate-limit';

const log = createLogger('VoiceToken');

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === 'string' ? body.reason : 'unspecified';
  const sessionType = typeof body?.sessionType === 'string' ? body.sessionType : 'unknown';

  // Keep budget checks active for managed mode users without BYOK keys.
  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: 'Monthly token limit exceeded', used: budget.used, limit: budget.limit },
      { status: 429 },
    );
  }

  const voiceBudget = await checkVoiceTimeBudget(supabase, user.id, !!byokKeys.gemini);
  if (!voiceBudget.allowed) {
    return NextResponse.json(
      { error: 'Monthly voice time limit exceeded', remainingSeconds: 0 },
      { status: 429 },
    );
  }

  // Temporary approach while Gemini ephemeral tokens remain unstable.
  const apiKey = byokKeys.gemini || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log.error('GEMINI_API_KEY not configured');
    throw new Error('Voice service not configured');
  }

  log.info(`Voice session token issued (reason=${reason}, sessionType=${sessionType})`);

  const remainingSeconds = Number.isFinite(voiceBudget.remainingSeconds)
    ? voiceBudget.remainingSeconds
    : null;
  return jsonOk({ token: apiKey, remainingSeconds });
});
