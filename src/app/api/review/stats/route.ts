import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/review/stats
 * Returns review statistics for the current user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Count due cards
    const { count: totalDue } = await supabase
      .from('review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', now);

    // Count cards reviewed today
    const { count: completedToday } = await supabase
      .from('review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_reviewed_at', todayStart.toISOString());

    // Get longest current streak across all cards
    const { data: streakData } = await supabase
      .from('review_schedule')
      .select('streak')
      .eq('user_id', user.id)
      .order('streak', { ascending: false })
      .limit(1)
      .single();

    // Total cards in schedule
    const { count: totalCards } = await supabase
      .from('review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      totalDue: totalDue || 0,
      completedToday: completedToday || 0,
      currentStreak: streakData?.streak || 0,
      totalCards: totalCards || 0,
    });
  } catch (error) {
    console.error('[Review/Stats] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
