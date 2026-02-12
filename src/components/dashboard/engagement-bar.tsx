'use client';

import { StreakBadge } from './streak-badge';
import { XPBadge } from './xp-badge';
import { DailyProgress } from './daily-progress';

interface EngagementBarProps {
  streakDays: number;
  streakAlive: boolean;
  longestStreak: number;
  totalXp: number;
  xpLevel: number;
  dailyXp: number;
  dailyTarget: number;
}

export function EngagementBar({
  streakDays,
  streakAlive,
  totalXp,
  xpLevel,
  dailyXp,
  dailyTarget,
}: EngagementBarProps) {
  return (
    <div className="flex items-center gap-6 mb-8 pb-6 border-b border-j-border">
      <StreakBadge days={streakDays} alive={streakAlive} />
      <XPBadge totalXp={totalXp} level={xpLevel} />
      <DailyProgress earned={dailyXp} target={dailyTarget} />
    </div>
  );
}
