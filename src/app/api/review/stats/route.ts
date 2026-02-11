import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Review/Stats');

/**
 * GET /api/review/stats
 * Returns review statistics for the current user.
 */
export const GET = withAuth(async (_request, { supabase, user }) => {
  try {
    const now = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count due cards
    const { count: totalDue } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', now);

    // Count cards reviewed today
    const { count: completedToday } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_reviewed_at', todayStart.toISOString());

    // Get longest current streak across all cards
    const { data: streakData } = await supabase
      .from(TABLES.reviewSchedule)
      .select('streak')
      .eq('user_id', user.id)
      .order('streak', { ascending: false })
      .limit(1)
      .single();

    // Total cards in schedule
    const { count: totalCards } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      totalDue: totalDue || 0,
      completedToday: completedToday || 0,
      currentStreak: streakData?.streak || 0,
      totalCards: totalCards || 0,
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
});
