import { withAuth } from '@/lib/api/middleware';
import { errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('User/TokenUsage');

/**
 * GET /api/user/token-usage
 *
 * Returns aggregated token usage for the authenticated user.
 * Response: { total, byCategory, last30Days }
 */
export const GET = withAuth(async (_request, { supabase, user }) => {
  try {
    // Fetch all token usage rows for this user
    const { data, error } = await supabase
      .from(TABLES.tokenUsage)
      .select('category, tokens, created_at')
      .eq('user_id', user.id);

    if (error) {
      log.error('Failed to fetch token usage:', error.message);
      throw error;
    }

    const rows = data || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let total = 0;
    let last30Days = 0;
    const byCategory: Record<string, number> = {};

    for (const row of rows) {
      total += row.tokens;

      byCategory[row.category] = (byCategory[row.category] || 0) + row.tokens;

      if (new Date(row.created_at) >= thirtyDaysAgo) {
        last30Days += row.tokens;
      }
    }

    return jsonOk({ total, byCategory, last30Days });
  } catch (error) {
    log.error('Error fetching token usage:', error);
    return errorResponse(error);
  }
});
