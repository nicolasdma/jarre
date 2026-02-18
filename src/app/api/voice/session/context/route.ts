/**
 * GET /api/voice/session/context?sectionId=xxx[&conceptIds=id1,id2,...]
 *
 * Returns cached conversation summary + learner concept memory
 * for the voice tutor. Memory provides misconceptions/strengths
 * to personalize the session.
 *
 * Response: { summary?: string, learnerMemory?: LearnerConceptMemory[] }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { getLearnerConceptMemory, type LearnerConceptMemory } from '@/lib/learner-memory';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceContext');

export const GET = withAuth(async (request, { supabase, user }) => {
  const url = new URL(request.url);
  const sectionId = url.searchParams.get('sectionId');
  const conceptIdsParam = url.searchParams.get('conceptIds');

  if (!sectionId) {
    throw badRequest('sectionId query param is required');
  }

  // Fetch conversation summary and learner memory in parallel
  const summaryPromise = supabase
    .from(TABLES.voiceSessions)
    .select('cached_summary')
    .eq('user_id', user.id)
    .eq('section_id', sectionId)
    .not('ended_at', 'is', null)
    .not('cached_summary', 'is', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  let memoryPromise: Promise<LearnerConceptMemory[]> = Promise.resolve([]);
  if (conceptIdsParam) {
    const conceptIds = conceptIdsParam.split(',').filter(Boolean);
    if (conceptIds.length > 0) {
      memoryPromise = getLearnerConceptMemory(supabase, user.id, conceptIds);
    }
  }

  const [summaryResult, learnerMemory] = await Promise.all([
    summaryPromise,
    memoryPromise,
  ]);

  const summary = summaryResult.data?.cached_summary || null;

  if (summary) {
    log.info(`Cached summary found for section ${sectionId} (${summary.length} chars)`);
  } else {
    log.info(`No cached summary for section ${sectionId}`);
  }

  if (learnerMemory.length > 0) {
    log.info(`Learner memory found for ${learnerMemory.length} concepts`);
  }

  return jsonOk({
    ...(summary ? { summary } : {}),
    ...(learnerMemory.length > 0 ? { learnerMemory } : {}),
  });
});
