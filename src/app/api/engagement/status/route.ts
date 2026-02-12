import { withAuth } from '@/lib/api/middleware';
import { jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import type { EngagementStatus } from '@/types';

/**
 * GET /api/engagement/status
 * Returns the user's engagement data (XP, streak, daily goal).
 */
export const GET = withAuth(async (_request, { supabase, user }) => {
  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('total_xp, xp_level, daily_xp_earned, daily_xp_date, daily_xp_target, streak_days, longest_streak, last_active_at')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const defaults: EngagementStatus = {
      totalXp: 0,
      xpLevel: 1,
      dailyXp: 0,
      dailyTarget: 50,
      dailyGoalComplete: false,
      streakDays: 0,
      longestStreak: 0,
      streakAlive: false,
    };
    return jsonOk(defaults);
  }

  // Reset daily XP if date has rolled over
  const isToday = profile.daily_xp_date === new Date().toISOString().slice(0, 10);
  const dailyXp = isToday ? profile.daily_xp_earned : 0;

  // Streak is alive if last active was today or yesterday
  const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null;
  const now = new Date();
  const diffMs = lastActive ? now.getTime() - lastActive.getTime() : Infinity;
  const streakAlive = diffMs < 2 * 24 * 60 * 60 * 1000; // within 48 hours

  const status: EngagementStatus = {
    totalXp: profile.total_xp,
    xpLevel: profile.xp_level,
    dailyXp: dailyXp,
    dailyTarget: profile.daily_xp_target,
    dailyGoalComplete: dailyXp >= profile.daily_xp_target,
    streakDays: profile.streak_days,
    longestStreak: profile.longest_streak,
    streakAlive,
  };

  return jsonOk(status);
});
