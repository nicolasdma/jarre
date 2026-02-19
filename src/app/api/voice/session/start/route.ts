/**
 * POST /api/voice/session/start
 *
 * Creates a new voice session row for tracking.
 * Body: { sectionId?: string, sessionType?: 'teaching' | 'evaluation' | 'practice' | 'exploration' | 'freeform' | 'debate', resourceId?: string, conceptIds?: string[], userResourceId?: string }
 * Response: { sessionId: string }
 *
 * For teaching sessions: sectionId is required.
 * For evaluation sessions: resourceId and conceptIds are required.
 * For exploration sessions: userResourceId is required.
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('VoiceSession');

export const POST = withAuth(async (request, { supabase, user }) => {
  const body = await request.json().catch(() => null);

  const sessionType = body?.sessionType || 'teaching';
  const sectionId = body?.sectionId;
  const resourceId = body?.resourceId;

  const VALID_SESSION_TYPES = ['teaching', 'evaluation', 'practice', 'exploration', 'freeform', 'debate'];
  if (!VALID_SESSION_TYPES.includes(sessionType)) {
    throw badRequest(`sessionType must be one of: ${VALID_SESSION_TYPES.join(', ')}`);
  }

  // Validate required fields based on session type
  if (sessionType === 'teaching') {
    if (!sectionId || typeof sectionId !== 'string') {
      throw badRequest('sectionId is required for teaching sessions');
    }
  } else if (sessionType === 'exploration') {
    if (!body?.userResourceId || typeof body.userResourceId !== 'string') {
      throw badRequest('userResourceId is required for exploration sessions');
    }
  } else if (sessionType === 'evaluation' || sessionType === 'practice') {
    // Both evaluation and practice require resourceId
    if (!resourceId || typeof resourceId !== 'string') {
      throw badRequest('resourceId is required for evaluation/practice sessions');
    }
  }
  // Freeform and debate don't require specific resource/section
  // (they use concept-level context instead)

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    session_type: sessionType,
  };

  if (sectionId) {
    insertData.section_id = sectionId;
  }
  if (resourceId) {
    insertData.resource_id = resourceId;
  }
  if (body?.userResourceId) {
    insertData.user_resource_id = body.userResourceId;
  }

  const { data, error } = await supabase
    .from(TABLES.voiceSessions)
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    log.error('Failed to create voice session:', error.message);
    throw new Error('Failed to create voice session');
  }

  log.info(`Voice session started: ${data.id} (type: ${sessionType})`);

  return jsonOk({ sessionId: data.id });
});
