/**
 * POST /api/voice/session/end
 *
 * Finalizes a voice session: sets ended_at, duration, and turn_count.
 * After responding, generates a conversation summary in background
 * and caches it for the next session (latency optimization).
 *
 * Body: { sessionId: string }
 * Response: { ok: true }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { generateConversationSummary } from '@/lib/voice/memory';
import { createAdminClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceSession');

export const POST = withAuth(async (request, { supabase, user }) => {
  const body = await request.json().catch(() => null);
  const sessionId = body?.sessionId;

  if (!sessionId || typeof sessionId !== 'string') {
    throw badRequest('sessionId is required');
  }

  // Count transcripts for this session
  const { count } = await supabase
    .from(TABLES.voiceTranscripts)
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  // Get session start time and section_id to calculate duration + generate summary
  const { data: session } = await supabase
    .from(TABLES.voiceSessions)
    .select('started_at, section_id, session_type, user_resource_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session) {
    throw badRequest('Session not found');
  }

  const durationSeconds = Math.floor(
    (Date.now() - new Date(session.started_at).getTime()) / 1000,
  );

  const { error } = await supabase
    .from(TABLES.voiceSessions)
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      turn_count: count ?? 0,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    log.error('Failed to end voice session:', error.message);
    throw new Error('Failed to end voice session');
  }

  log.info(`Voice session ended: ${sessionId} (${durationSeconds}s, ${count ?? 0} turns)`);

  // Generate summary in background (skip for exploration — handled by exploration-summary endpoint)
  if (session.session_type !== 'exploration') {
    generateSummaryCached(sessionId, session.section_id, user.id).catch((err) => {
      log.error('Background summary generation failed:', err);
    });
  }

  return jsonOk({ ok: true });
});

/**
 * Background task: fetch transcripts for the session, generate a summary
 * via DeepSeek, and save it to cached_summary on the voice_sessions row.
 * Uses admin client since the request's auth context is gone by the time this runs.
 */
async function generateSummaryCached(
  sessionId: string,
  sectionId: string,
  userId: string,
): Promise<void> {
  const admin = createAdminClient();

  // Fetch all transcripts from this session
  const { data: transcripts, error: txError } = await admin
    .from(TABLES.voiceTranscripts)
    .select('role, text, timestamp')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (txError || !transcripts || transcripts.length === 0) {
    log.info(`No transcripts to summarize for session ${sessionId}`);
    return;
  }

  // Get section title for context
  const { data: section } = await admin
    .from(TABLES.resourceSections)
    .select('section_title')
    .eq('id', sectionId)
    .single();

  const sectionTitle = section?.section_title ?? 'Unknown section';

  const summary = await generateConversationSummary(
    transcripts.map((t) => ({ role: t.role as 'user' | 'model', text: t.text })),
    sectionTitle,
    userId,
  );

  if (!summary) {
    log.info(`Summary generation returned null for session ${sessionId}`);
    return;
  }

  // Save to the session row — use admin client to bypass RLS
  const { error: updateError } = await admin
    .from(TABLES.voiceSessions)
    .update({ cached_summary: summary })
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (updateError) {
    log.error('Failed to save cached_summary:', updateError.message);
    return;
  }

  log.info(`Cached summary saved for session ${sessionId} (${summary.length} chars)`);
}
