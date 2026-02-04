import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('evaluations')
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
      .from('evaluations')
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
      console.error('[History] Error fetching evaluations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch evaluations' },
        { status: 500 }
      );
    }

    // Get question counts for each evaluation
    const evaluationIds = evaluations?.map(e => e.id) || [];

    let questionCounts: Record<string, number> = {};
    if (evaluationIds.length > 0) {
      const { data: counts } = await supabase
        .from('evaluation_questions')
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

    return NextResponse.json({
      evaluations: response,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error) {
    console.error('[History] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
