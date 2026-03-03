/**
 * POST /api/voice/session/end
 *
 * Finalizes a voice session: sets ended_at, duration, and turn_count.
 * Supports auth via:
 * - Session write token (preferred for reliability in teardown paths)
 * - Cookie session (fallback)
 *
 * Body: { sessionId: string, writeToken?: string }
 * Response: { ok: true }
 */

import { NextResponse } from 'next/server';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { generateConversationSummary } from '@/lib/voice/memory';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { verifyVoiceSessionWriteToken } from '@/lib/voice/session-write-token';

const log = createLogger('VoiceSession');

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

    // Get current session state first (idempotent close behavior).
    const { data: session, error: sessionError } = await admin
      .from(TABLES.voiceSessions)
      .select('started_at, section_id, session_type, ended_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError || !session) {
      throw badRequest('Session not found');
    }

    // Count transcripts for this session.
    const { count } = await admin
      .from(TABLES.voiceTranscripts)
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    const durationSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000),
    );

    const { error: updateError } = await admin
      .from(TABLES.voiceSessions)
      .update({
        ended_at: session.ended_at || new Date().toISOString(),
        duration_seconds: durationSeconds,
        turn_count: count ?? 0,
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (updateError) {
      log.error('Failed to end voice session:', updateError.message);
      throw new Error('Failed to end voice session');
    }

    log.info(
      `Voice session ended: ${sessionId} (${durationSeconds}s, ${count ?? 0} turns)`,
    );

    // Generate summary in background (skip exploration sessions).
    if (session.session_type !== 'exploration') {
      generateSummaryCached(sessionId, session.section_id, userId).catch((err) => {
        log.error('Background summary generation failed:', err);
      });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Background task: summarize the session transcript and cache it on voice_sessions.
 */
async function generateSummaryCached(
  sessionId: string,
  sectionId: string | null,
  userId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: transcripts, error: txError } = await admin
    .from(TABLES.voiceTranscripts)
    .select('role, text, timestamp')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (txError || !transcripts || transcripts.length === 0) {
    log.info(`No transcripts to summarize for session ${sessionId}`);
    return;
  }

  let sectionTitle = 'Unknown section';
  if (sectionId) {
    const { data: section } = await admin
      .from(TABLES.resourceSections)
      .select('section_title')
      .eq('id', sectionId)
      .single();
    sectionTitle = section?.section_title ?? sectionTitle;
  }

  const summary = await generateConversationSummary(
    transcripts.map((t) => ({ role: t.role as 'user' | 'model', text: t.text })),
    sectionTitle,
    userId,
  );

  if (!summary) {
    log.info(`Summary generation returned null for session ${sessionId}`);
    return;
  }

  const { error: cacheError } = await admin
    .from(TABLES.voiceSessions)
    .update({ cached_summary: summary })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (cacheError) {
    log.error('Failed to save cached_summary:', cacheError.message);
    return;
  }

  log.info(`Cached summary saved for session ${sessionId} (${summary.length} chars)`);
}
