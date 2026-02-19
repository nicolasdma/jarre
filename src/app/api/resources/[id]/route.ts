/**
 * GET /api/resources/[id]
 *
 * Returns a user resource with its concept links and curriculum concept details.
 */

import { withAuth } from '@/lib/api/middleware';
import { notFound, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('UserResource');

export const GET = withAuth<{ id: string }>(async (_request, { supabase, user, params }) => {
  const { id } = params;

  // Fetch resource
  const { data: resource, error } = await supabase
    .from(TABLES.userResources)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !resource) {
    throw notFound('Resource not found');
  }

  // Fetch concept links with curriculum concept details
  const { data: links } = await supabase
    .from(TABLES.userResourceConcepts)
    .select('*, concept:concepts(id, name, definition)')
    .eq('user_resource_id', id);

  // Fetch mastery levels for linked concepts
  const conceptIds = (links || []).map((l: any) => l.concept_id);
  let progressMap: Record<string, number> = {};
  if (conceptIds.length > 0) {
    const { data: progress } = await supabase
      .from(TABLES.conceptProgress)
      .select('concept_id, level')
      .eq('user_id', user.id)
      .in('concept_id', conceptIds);

    if (progress) {
      progressMap = progress.reduce((acc: Record<string, number>, p: any) => {
        acc[p.concept_id] = parseInt(p.level);
        return acc;
      }, {});
    }
  }

  return jsonOk({
    resource,
    links: (links || []).map((l: any) => ({
      ...l,
      conceptName: l.concept?.name || 'Unknown',
      conceptDefinition: l.concept?.definition || '',
      masteryLevel: progressMap[l.concept_id] || 0,
    })),
  });
});

export const DELETE = withAuth<{ id: string }>(async (_request, { supabase, user, params }) => {
  const { id } = params;

  const { error } = await supabase
    .from(TABLES.userResources)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    log.error('Failed to delete resource:', error.message);
    throw new Error('Failed to delete resource');
  }

  return jsonOk({ ok: true });
});
