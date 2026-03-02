/**
 * Jarre - Token Budget Rate Limiting
 *
 * Enforces monthly token budgets for managed mode:
 * - Self-hosted: always allowed (no limits)
 * - BYOK users: always allowed (no limits)
 * - Managed free trial: 50K tokens/month
 * - Managed paid: 2M tokens/month
 *
 * Queries the token_usage table for current month consumption.
 */

import { IS_SELF_HOSTED } from '@/lib/config';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { FREE_VOICE_HARD_LIMIT_SECONDS } from '@/lib/constants';
import type { SupabaseClient } from '@supabase/supabase-js';

const log = createLogger('RateLimit');

const FREE_TRIAL_LIMIT = 50_000;
const PAID_LIMIT = 2_000_000;

export interface BudgetCheck {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

export interface VoiceTimeBudget {
  allowed: boolean;
  usedSeconds: number;
  limitSeconds: number;
  remainingSeconds: number;
}

/**
 * Check if a user has remaining token budget.
 *
 * Returns { allowed: true } for self-hosted, BYOK, or users within budget.
 * Returns { allowed: false } when managed users exceed their monthly cap.
 */
export async function checkTokenBudget(
  supabase: SupabaseClient,
  userId: string,
  hasByokKeys: boolean,
): Promise<BudgetCheck> {
  // Self-hosted and BYOK users have no limits
  if (IS_SELF_HOSTED || hasByokKeys) {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity };
  }

  // Get current month boundaries (UTC)
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  // Sum tokens for current month
  const { data, error } = await supabase
    .from(TABLES.tokenUsage)
    .select('tokens')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', monthEnd.toISOString());

  if (error) {
    log.error('Failed to check token budget:', error.message);
    // Fail closed — block requests if we can't verify budget
    return { allowed: false, used: 0, limit: 0, remaining: 0 };
  }

  const used = (data || []).reduce((sum, row) => sum + (row.tokens || 0), 0);

  // Check subscription status for paid vs free limit
  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('subscription_status')
    .eq('id', userId)
    .single();

  const limit = profile?.subscription_status === 'active' ? PAID_LIMIT : FREE_TRIAL_LIMIT;

  const remaining = Math.max(0, limit - used);
  // 10% tolerance margin: concurrent requests can read stale `used` values and both pass
  // the check. This is acceptable — the overshoot is bounded and the cost is tokens, not money.
  const allowed = used < limit * 1.1;

  if (!allowed) {
    log.info(`User ${userId} exceeded token budget: ${used}/${limit}`);
  }

  return { allowed, used, limit, remaining };
}

/**
 * Check if a user has remaining voice time budget for the current month.
 *
 * Returns unlimited for self-hosted, BYOK, and Pro users.
 * Free tier gets FREE_VOICE_HARD_LIMIT_SECONDS per month (actual hard limit).
 */
export async function checkVoiceTimeBudget(
  supabase: SupabaseClient,
  userId: string,
  hasByokKeys: boolean,
): Promise<VoiceTimeBudget> {
  // Self-hosted, BYOK, and paid users have no voice time limits
  if (IS_SELF_HOSTED || hasByokKeys) {
    return { allowed: true, usedSeconds: 0, limitSeconds: Infinity, remainingSeconds: Infinity };
  }

  // Check subscription status
  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('subscription_status')
    .eq('id', userId)
    .single();

  if (profile?.subscription_status === 'active') {
    return { allowed: true, usedSeconds: 0, limitSeconds: Infinity, remainingSeconds: Infinity };
  }

  // Free tier — sum duration_seconds from voice_sessions this month
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { data, error } = await supabase
    .from(TABLES.voiceSessions)
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())
    .lt('created_at', monthEnd.toISOString());

  if (error) {
    log.error('Failed to check voice time budget:', error.message);
    return { allowed: false, usedSeconds: 0, limitSeconds: 0, remainingSeconds: 0 };
  }

  const usedSeconds = (data || []).reduce((sum, row) => sum + (row.duration_seconds || 0), 0);
  const limitSeconds = FREE_VOICE_HARD_LIMIT_SECONDS;
  const remainingSeconds = Math.max(0, limitSeconds - usedSeconds);
  const allowed = usedSeconds < limitSeconds * 1.1; // 10% tolerance

  if (!allowed) {
    log.info(`User ${userId} exceeded voice time budget: ${usedSeconds}/${limitSeconds}s`);
  }

  return { allowed, usedSeconds, limitSeconds, remainingSeconds };
}
