/**
 * POST /api/voice/session/transcript
 *
 * Saves a single transcript turn (fire-and-forget from client).
 * Body: { sessionId: string, role: 'user' | 'model', text: string }
 * Response: { ok: true }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';

export const POST = withAuth(async (request, { supabase }) => {
  const body = await request.json().catch(() => null);
  const { sessionId, role, text } = body ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    throw badRequest('sessionId is required');
  }
  if (!role || (role !== 'user' && role !== 'model')) {
    throw badRequest('role must be "user" or "model"');
  }
  if (!text || typeof text !== 'string') {
    throw badRequest('text is required');
  }

  // RLS ensures user can only write to their own sessions
  await supabase
    .from(TABLES.voiceTranscripts)
    .insert({
      session_id: sessionId,
      role,
      text,
    });

  return jsonOk({ ok: true });
});
