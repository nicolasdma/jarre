-- ============================================================================
-- Engagement Loop: XP system, streak tracking, daily goals
-- ============================================================================

-- Extend user_profiles with engagement columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS daily_xp_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_xp_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS daily_xp_target INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;

-- XP events audit trail (append-only)
CREATE TABLE xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user ON xp_events(user_id, created_at DESC);

-- RLS: users read/insert own
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own xp_events"
  ON xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own xp_events"
  ON xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- award_xp RPC: atomic XP grant + streak + level update
-- ============================================================================
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source TEXT,
  p_source_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_new_daily INTEGER;
  v_streak INTEGER;
  v_longest INTEGER;
  v_daily_goal_hit BOOLEAN := FALSE;
  v_level_up BOOLEAN := FALSE;
  v_streak_milestone INTEGER := 0;
BEGIN
  -- Lock user_profiles row for race-safe update
  SELECT total_xp, xp_level, daily_xp_earned, daily_xp_date,
         daily_xp_target, streak_days, longest_streak, last_active_at
  INTO v_profile
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  -- Reset daily XP if new day
  IF v_profile.daily_xp_date < CURRENT_DATE THEN
    v_new_daily := p_xp_amount;
  ELSE
    v_new_daily := v_profile.daily_xp_earned + p_xp_amount;
  END IF;

  -- Update streak
  IF v_profile.last_active_at IS NOT NULL THEN
    IF v_profile.last_active_at::date = CURRENT_DATE THEN
      -- Same day: keep streak
      v_streak := v_profile.streak_days;
    ELSIF v_profile.last_active_at::date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Yesterday: increment streak
      v_streak := v_profile.streak_days + 1;
    ELSE
      -- Gap: reset streak
      v_streak := 1;
    END IF;
  ELSE
    v_streak := 1;
  END IF;

  -- Update longest streak
  v_longest := GREATEST(v_profile.longest_streak, v_streak);

  -- Calculate new totals
  v_new_total := v_profile.total_xp + p_xp_amount;

  -- Level: floor(sqrt(total_xp / 100)) + 1
  v_new_level := FLOOR(SQRT(v_new_total::NUMERIC / 100)) + 1;

  -- Check daily goal completion (transition from incomplete to complete)
  IF v_profile.daily_xp_earned < v_profile.daily_xp_target
     AND v_new_daily >= v_profile.daily_xp_target THEN
    v_daily_goal_hit := TRUE;
    -- Bonus XP for hitting daily goal
    v_new_total := v_new_total + 10;
    v_new_daily := v_new_daily + 10;
    v_new_level := FLOOR(SQRT(v_new_total::NUMERIC / 100)) + 1;
  END IF;

  -- Check level up
  IF v_new_level > v_profile.xp_level THEN
    v_level_up := TRUE;
  END IF;

  -- Check streak milestones
  IF v_streak IN (3, 7, 14, 30, 50, 100) AND v_streak > v_profile.streak_days THEN
    v_streak_milestone := v_streak;
  END IF;

  -- Update user_profiles
  UPDATE user_profiles SET
    total_xp = v_new_total,
    xp_level = v_new_level,
    daily_xp_earned = v_new_daily,
    daily_xp_date = CURRENT_DATE,
    streak_days = v_streak,
    longest_streak = v_longest,
    last_active_at = NOW()
  WHERE id = p_user_id;

  -- Insert XP event audit trail
  INSERT INTO xp_events (user_id, xp_amount, source, source_id)
  VALUES (p_user_id, p_xp_amount, p_source, p_source_id);

  -- If daily goal bonus was awarded, log it too
  IF v_daily_goal_hit THEN
    INSERT INTO xp_events (user_id, xp_amount, source, source_id)
    VALUES (p_user_id, 10, 'daily_goal_bonus', NULL);
  END IF;

  RETURN jsonb_build_object(
    'totalXp', v_new_total,
    'xpLevel', v_new_level,
    'dailyXp', v_new_daily,
    'dailyTarget', v_profile.daily_xp_target,
    'dailyGoalHit', v_daily_goal_hit,
    'streakDays', v_streak,
    'longestStreak', v_longest,
    'levelUp', v_level_up,
    'streakMilestone', v_streak_milestone,
    'xpAwarded', p_xp_amount
  );
END;
$$;
