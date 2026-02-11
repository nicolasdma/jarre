import { withAuth } from '@/lib/api/middleware';
import { errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Evaluate/History');

/**
 * GET /api/evaluate/history
 *
 * Lists completed evaluations for the authenticated user.
 *
 * Query params:
 * - resourceId (optional): Filter by specific resource
 * - limit (optional): Number of results, default 10, max 50
 * - offset (optional): Pagination offset, default 0
 */
export const GET = withAuth(async (request, { supabase, user }) => {
  try {

    // Parse query params
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from(TABLES.evaluations)
      .select(`
        id,
        overall_score,
        created_at,
        completed_at,
        status,
        resource:resources(id, title, type)
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }

    // Get total count for pagination
    const countQuery = supabase
      .from(TABLES.evaluations)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    if (resourceId) {
      countQuery.eq('resource_id', resourceId);
    }

    const [{ data: evaluations, error }, { count }] = await Promise.all([
      query.range(offset, offset + limit - 1),
      countQuery,
    ]);

    if (error) {
      log.error('Error fetching evaluations:', error);
      return errorResponse(new Error('Failed to fetch evaluations'));
    }

    // Get question counts for each evaluation
    const evaluationIds = evaluations?.map(e => e.id) || [];

    let questionCounts: Record<string, number> = {};
    if (evaluationIds.length > 0) {
      const { data: counts } = await supabase
        .from(TABLES.evaluationQuestions)
        .select('evaluation_id')
        .in('evaluation_id', evaluationIds);

      if (counts) {
        questionCounts = counts.reduce((acc, q) => {
          acc[q.evaluation_id] = (acc[q.evaluation_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Transform response
    const response = evaluations?.map(e => ({
      id: e.id,
      overallScore: e.overall_score,
      createdAt: e.created_at,
      completedAt: e.completed_at,
      status: e.status,
      resource: e.resource,
      questionCount: questionCounts[e.id] || 0,
    })) || [];

    return jsonOk({
      evaluations: response,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return errorResponse(error);
  }
});
