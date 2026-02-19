/**
 * GET /api/concepts/definitions?ids=id1,id2,id3
 *
 * Returns concept names and canonical definitions for the given IDs.
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';

export const GET = withAuth(async (request, { supabase }) => {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    throw badRequest('ids query parameter is required');
  }

  const ids = idsParam.split(',').filter(Boolean);
  if (ids.length === 0) {
    return jsonOk({ definitions: {} });
  }

  const { data: concepts, error } = await supabase
    .from(TABLES.concepts)
    .select('id, name, canonical_definition')
    .in('id', ids);

  if (error) {
    throw new Error('Failed to fetch concepts');
  }

  const definitions: Record<string, string> = {};
  for (const c of concepts || []) {
    definitions[c.name] = c.canonical_definition || '';
  }

  return jsonOk({ definitions });
});
