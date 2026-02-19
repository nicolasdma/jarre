/**
 * GET /api/insights — Fetch pending suggestions for the user
 * POST /api/insights — Trigger insight generation
 * PATCH /api/insights — Update suggestion status (accept/dismiss)
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import {
  generateMasteryCatalystInsights,
  generateGapDetectionInsights,
  generateDebateTopicInsights,
  saveInsightSuggestions,
} from '@/lib/insights/generate-insights';
import { createLogger } from '@/lib/logger';

const log = createLogger('InsightsAPI');

export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: suggestions, error } = await supabase
    .from(TABLES.insightSuggestions)
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    log.error('Failed to fetch suggestions:', error.message);
    return jsonOk({ suggestions: [] });
  }

  return jsonOk({ suggestions: suggestions || [] });
});

export const POST = withAuth(async (request, { supabase, user }) => {
  const body = await request.json().catch(() => null);
  const triggerType = body?.type; // 'resource_added' | 'periodic' | 'manual'
  const userResourceId = body?.userResourceId;

  const allSuggestions = [];

  // Resource-specific insights
  if (triggerType === 'resource_added' && userResourceId) {
    const catalystInsights = await generateMasteryCatalystInsights(supabase, user.id, userResourceId);
    allSuggestions.push(...catalystInsights);
  }

  // Gap detection (always run)
  const gapInsights = await generateGapDetectionInsights(supabase, user.id);
  allSuggestions.push(...gapInsights);

  // Debate topics (on manual or periodic trigger)
  if (triggerType === 'manual' || triggerType === 'periodic') {
    const debateInsights = await generateDebateTopicInsights(supabase, user.id);
    allSuggestions.push(...debateInsights);
  }

  const saved = await saveInsightSuggestions(supabase, user.id, allSuggestions);

  log.info(`Generated ${allSuggestions.length} insights, saved ${saved} for user ${user.id}`);

  return jsonOk({
    generated: allSuggestions.length,
    saved,
  });
});

export const PATCH = withAuth(async (request, { supabase, user }) => {
  const body = await request.json().catch(() => null);
  const suggestionId = body?.id;
  const status = body?.status;

  if (!suggestionId || typeof suggestionId !== 'string') {
    throw badRequest('id is required');
  }
  if (status !== 'accepted' && status !== 'dismissed') {
    throw badRequest('status must be "accepted" or "dismissed"');
  }

  const { error } = await supabase
    .from(TABLES.insightSuggestions)
    .update({ status })
    .eq('id', suggestionId)
    .eq('user_id', user.id);

  if (error) {
    log.error('Failed to update suggestion:', error.message);
    throw new Error('Failed to update suggestion');
  }

  return jsonOk({ ok: true });
});
