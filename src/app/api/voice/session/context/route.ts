/**
 * GET /api/voice/session/context?sectionId=xxx
 *
 * Returns cached conversation summary for the voice tutor.
 * Reads from the most recent completed session's cached_summary column
 * (generated in background when that session ended).
 *
 * Response: { summary?: string }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceContext');

export const GET = withAuth(async (request, { supabase, user }) => {
  const url = new URL(request.url);
  const sectionId = url.searchParams.get('sectionId');

  if (!sectionId) {
    throw badRequest('sectionId query param is required');
  }

  // Read cached_summary from the most recent completed session
  const { data: session, error } = await supabase
    .from(TABLES.voiceSessions)
    .select('cached_summary')
    .eq('user_id', user.id)
    .eq('section_id', sectionId)
    .not('ended_at', 'is', null)
    .not('cached_summary', 'is', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !session?.cached_summary) {
    log.info(`No cached summary for section ${sectionId}`);
    return jsonOk({});
  }

  log.info(`Cached summary found for section ${sectionId} (${session.cached_summary.length} chars)`);

  return jsonOk({ summary: session.cached_summary });
});
