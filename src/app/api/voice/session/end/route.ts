/**
 * POST /api/voice/session/end
 *
 * Finalizes a voice session (src/lib/voice/session-digest.ts): ended_at,
 * duration, turn_count, the client's diagnostics, and the digest after the response.
 * Supports auth via:
 * - Session write token (preferred for reliability in teardown paths)
 * - Cookie session (fallback)
 *
 * Body: { sessionId: string, writeToken?: string, diag?: client counters, timeline and usage
 *   (stored in voice_sessions.client_diag, never conversation text) }
 * Response: { ok: true }
 */

import { NextResponse, after } from 'next/server';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { verifyVoiceSessionWriteToken } from '@/lib/voice/session-write-token';
import { formatClientDiag, sanitizeClientDiag } from '@/lib/voice/session-diag';
import { finalizeSession, runSessionDigest } from '@/lib/voice/session-digest';
import '@/lib/voice/digest-steps';

const log = createLogger('VoiceSession');

/** The digest (DeepSeek) runs inside this function's lifetime, after the response. */
export const maxDuration = 60;

async function resolveUserIdFromRequest(
  request: Request,
  body: Record<string, unknown>,
  sessionId: string,
): Promise<string | null> {
  const token =
    (typeof body.writeToken === 'string' ? body.writeToken : null) ||
    request.headers.get('x-voice-session-token');

  if (token) {
    const payload = verifyVoiceSessionWriteToken(token);
    if (payload && payload.sid === sessionId) {
      return payload.uid;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;

    if (!sessionId) {
      throw badRequest('sessionId is required');
    }

    const userId = await resolveUserIdFromRequest(request, body ?? {}, sessionId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    const diag = sanitizeClientDiag(body?.diag);
    let result;
    try {
      result = await finalizeSession(admin, { sessionId, userId, diag });
    } catch (err) {
      log.error('Failed to end voice session:', err instanceof Error ? err.message : err);
      throw badRequest('Session not found');
    }

    log.info(`Voice session ended: ${sessionId}${formatClientDiag(body?.diag)}`);

    // The digest (summary, learner memory) runs after the response, inside the
    // function's lifetime (`after`), not as a floating promise that a
    // serverless runtime may kill: ac028b04 (2026-11-18) closed without one.
    if (result.digest) {
      const durable = result.durable;
      after(async () => {
        await runSessionDigest(admin, sessionId, userId, { durable });
      });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
