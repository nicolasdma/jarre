/**
 * GET /api/voice/practice-result?resourceId=X
 *
 * Returns the last persisted practice result for a given resource.
 * Used to restore previous feedback when the user navigates back to practice-eval.
 *
 * Response: { practiceResult, completedAt } or { practiceResult: null }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';

export const GET = withAuth(async (request, { supabase, user }) => {
  const url = new URL(request.url);
  const resourceId = url.searchParams.get('resourceId');

  if (!resourceId) {
    throw badRequest('resourceId query param is required');
  }

  const { data, error } = await supabase
    .from(TABLES.voiceSessions)
    .select('practice_result, ended_at')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .eq('session_type', 'practice')
    .not('practice_result', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw badRequest('Failed to fetch practice result');
  }

  if (!data) {
    return jsonOk({ practiceResult: null });
  }

  return jsonOk({
    practiceResult: data.practice_result,
    completedAt: data.ended_at,
  });
});
