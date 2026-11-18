/**
 * Jarre - Spend caps and request rate limits
 *
 * Every route that spends the owner's keys (DeepSeek, Gemini Live) checks one
 * of these before calling the provider. Three layers, in this order:
 *
 * 1. A per-user request rate limit (in memory, per server instance). It stops
 *    a loop or a script, not a determined attacker spread over instances; the
 *    allow-list (allow-list.ts) is what keeps strangers out.
 * 2. A per-user daily cap over the last 24 hours, enforced in EVERY mode.
 *    Production runs as `self-hosted` (NEXT_PUBLIC_APP_MODE unset), and until
 *    2026-11-18 that meant no cap at all. A BYOK header no longer skips it
 *    either: any value in X-DeepSeek-Key used to.
 * 3. The managed-mode monthly plan limits (free trial / paid), as before.
 *
 * Defaults are ~3x the owner's heaviest day on record (token_usage and
 * voice_sessions, read 2026-11-18: 1.09M tokens, 48 voice sessions in a day).
 * Override with env vars:
 *   JARRE_DAILY_TOKEN_CAP          tokens per user per 24 h   (default 3,000,000)
 *   JARRE_DAILY_VOICE_SESSIONS     voice sessions per 24 h    (default 150)
 *   JARRE_DAILY_VOICE_SECONDS      voice seconds per 24 h     (default 14,400 = 4 h)
 *   JARRE_LLM_REQUESTS_PER_MINUTE  LLM requests per minute    (default 60)
 *   JARRE_VOICE_TOKENS_PER_MINUTE  voice tokens per minute    (default 20)
 *
 * The daily sums are read with the admin client, so a user cannot lower them
 * by editing their own rows.
 */

import { IS_SELF_HOSTED } from '@/lib/config';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { FREE_VOICE_HARD_LIMIT_SECONDS } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const log = createLogger('RateLimit');

const FREE_TRIAL_LIMIT = 50_000;
const PAID_LIMIT = 2_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type LimitReason = 'rate_limit' | 'daily_cap' | 'monthly_cap' | 'check_failed';

export interface BudgetCheck {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** Why it was refused (only when `allowed` is false). */
  reason?: LimitReason;
  /** Human-readable refusal, safe to return to the client. */
  message: string;
}

export interface VoiceTimeBudget {
  allowed: boolean;
  usedSeconds: number;
  limitSeconds: number;
  remainingSeconds: number;
  reason?: LimitReason;
  message: string;
}

// ---------------------------------------------------------------------------
// Limits (env-overridable)
// ---------------------------------------------------------------------------

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function spendLimits() {
  return {
    dailyTokens: envInt('JARRE_DAILY_TOKEN_CAP', 3_000_000),
    dailyVoiceSessions: envInt('JARRE_DAILY_VOICE_SESSIONS', 150),
    dailyVoiceSeconds: envInt('JARRE_DAILY_VOICE_SECONDS', 4 * 60 * 60),
    llmPerMinute: envInt('JARRE_LLM_REQUESTS_PER_MINUTE', 60),
    voiceTokensPerMinute: envInt('JARRE_VOICE_TOKENS_PER_MINUTE', 20),
  };
}

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limit
// ---------------------------------------------------------------------------

const windows = new Map<string, number[]>();
const MAX_KEYS = 5_000;

/**
 * Record one request for `key` and say whether it fits in `limit` per
 * `windowMs`. Refused requests are not recorded.
 */
export function takeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { allowed: boolean; retryAfterMs: number } {
  const since = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((t) => t > since);
  if (hits.length >= limit) {
    windows.set(key, hits);
    return { allowed: false, retryAfterMs: Math.max(0, hits[0] + windowMs - now) };
  }
  hits.push(now);
  windows.set(key, hits);
  if (windows.size > MAX_KEYS) {
    // Drop the oldest key: Map keeps insertion order.
    const oldest = windows.keys().next().value;
    if (oldest !== undefined) windows.delete(oldest);
  }
  return { allowed: true, retryAfterMs: 0 };
}

/** Test hook. */
export function resetRateLimits(): void {
  windows.clear();
}

// ---------------------------------------------------------------------------
// Daily sums
// ---------------------------------------------------------------------------

function trustedClient(fallback: SupabaseClient): SupabaseClient {
  try {
    return createAdminClient() as unknown as SupabaseClient;
  } catch {
    return fallback;
  }
}

/** Pure decision for the token budget, exported for tests. */
export function decideTokenBudget(input: {
  usedToday: number;
  dailyCap: number;
  monthly?: { used: number; limit: number } | null;
}): BudgetCheck {
  const { usedToday, dailyCap, monthly } = input;
  if (usedToday >= dailyCap) {
    return {
      allowed: false,
      used: usedToday,
      limit: dailyCap,
      remaining: 0,
      reason: 'daily_cap',
      message: 'Daily AI usage limit reached. It resets over the next 24 hours.',
    };
  }
  if (monthly) {
    // 10% tolerance: concurrent requests can read a stale `used` and both pass.
    const allowed = monthly.used < monthly.limit * 1.1;
    return {
      allowed,
      used: monthly.used,
      limit: monthly.limit,
      remaining: Math.max(0, monthly.limit - monthly.used),
      ...(allowed ? {} : { reason: 'monthly_cap' as const }),
      message: allowed ? 'ok' : 'Monthly token limit exceeded',
    };
  }
  return {
    allowed: true,
    used: usedToday,
    limit: dailyCap,
    remaining: dailyCap - usedToday,
    message: 'ok',
  };
}

/**
 * Check if a user may make one more LLM call.
 *
 * Always: the per-minute rate limit and the 24-hour token cap. Managed mode
 * without BYOK keys: the monthly plan limit too. Fails closed.
 */
export async function checkTokenBudget(
  supabase: SupabaseClient,
  userId: string,
  hasByokKeys: boolean,
): Promise<BudgetCheck> {
  const limits = spendLimits();

  const rate = takeRateLimit(`llm:${userId}`, limits.llmPerMinute, 60_000);
  if (!rate.allowed) {
    log.info(`User ${userId} hit the LLM rate limit`);
    return {
      allowed: false,
      used: limits.llmPerMinute,
      limit: limits.llmPerMinute,
      remaining: 0,
      reason: 'rate_limit',
      message: 'Too many requests. Try again in a minute.',
    };
  }

  const db = trustedClient(supabase);
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { data: dayRows, error: dayError } = await db
    .from(TABLES.tokenUsage)
    .select('tokens')
    .eq('user_id', userId)
    .gte('created_at', since);

  if (dayError) {
    log.error('Failed to check daily token cap:', dayError.message);
    return { allowed: false, used: 0, limit: 0, remaining: 0, reason: 'check_failed', message: 'Usage check failed' };
  }
  const usedToday = (dayRows || []).reduce((sum, row) => sum + Math.max(0, row.tokens || 0), 0);

  let monthly: { used: number; limit: number } | null = null;
  if (!IS_SELF_HOSTED && !hasByokKeys) {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const { data, error } = await db
      .from(TABLES.tokenUsage)
      .select('tokens')
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString())
      .lt('created_at', monthEnd.toISOString());
    if (error) {
      log.error('Failed to check token budget:', error.message);
      return { allowed: false, used: 0, limit: 0, remaining: 0, reason: 'check_failed', message: 'Usage check failed' };
    }
    const used = (data || []).reduce((sum, row) => sum + Math.max(0, row.tokens || 0), 0);
    const { data: profile } = await db
      .from(TABLES.userProfiles)
      .select('subscription_status')
      .eq('id', userId)
      .single();
    monthly = { used, limit: profile?.subscription_status === 'active' ? PAID_LIMIT : FREE_TRIAL_LIMIT };
  }

  const result = decideTokenBudget({ usedToday, dailyCap: limits.dailyTokens, monthly });
  if (!result.allowed) {
    log.info(`User ${userId} refused (${result.reason}): ${result.used}/${result.limit}`);
  }
  return result;
}

/** Pure decision for the voice budget, exported for tests. */
export function decideVoiceBudget(input: {
  sessionsToday: number;
  secondsToday: number;
  dailySessions: number;
  dailySeconds: number;
  monthly?: { usedSeconds: number; limitSeconds: number } | null;
}): VoiceTimeBudget {
  const { sessionsToday, secondsToday, dailySessions, dailySeconds, monthly } = input;
  if (sessionsToday >= dailySessions || secondsToday >= dailySeconds) {
    return {
      allowed: false,
      usedSeconds: secondsToday,
      limitSeconds: dailySeconds,
      remainingSeconds: 0,
      reason: 'daily_cap',
      message: 'Daily voice limit reached. It resets over the next 24 hours.',
    };
  }
  const dailyRemaining = dailySeconds - secondsToday;
  if (monthly) {
    const allowed = monthly.usedSeconds < monthly.limitSeconds * 1.1;
    return {
      allowed,
      usedSeconds: monthly.usedSeconds,
      limitSeconds: monthly.limitSeconds,
      remainingSeconds: Math.min(dailyRemaining, Math.max(0, monthly.limitSeconds - monthly.usedSeconds)),
      ...(allowed ? {} : { reason: 'monthly_cap' as const }),
      message: allowed ? 'ok' : 'Monthly voice time limit exceeded',
    };
  }
  return {
    allowed: true,
    usedSeconds: secondsToday,
    limitSeconds: dailySeconds,
    remainingSeconds: dailyRemaining,
    message: 'ok',
  };
}

/**
 * Check if a user may open one more voice session (a Gemini Live token).
 *
 * Always: the per-minute token limit and the 24-hour cap on sessions and
 * seconds. Managed free tier without BYOK: the monthly voice minutes too.
 */
export async function checkVoiceTimeBudget(
  supabase: SupabaseClient,
  userId: string,
  hasByokKeys: boolean,
): Promise<VoiceTimeBudget> {
  const limits = spendLimits();

  const rate = takeRateLimit(`voice:${userId}`, limits.voiceTokensPerMinute, 60_000);
  if (!rate.allowed) {
    log.info(`User ${userId} hit the voice token rate limit`);
    return {
      allowed: false,
      usedSeconds: 0,
      limitSeconds: 0,
      remainingSeconds: 0,
      reason: 'rate_limit',
      message: 'Too many voice requests. Try again in a minute.',
    };
  }

  const db = trustedClient(supabase);
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { data: dayRows, error: dayError } = await db
    .from(TABLES.voiceSessions)
    .select('duration_seconds')
    .eq('user_id', userId)
    .gte('started_at', since);

  if (dayError) {
    log.error('Failed to check daily voice cap:', dayError.message);
    return { allowed: false, usedSeconds: 0, limitSeconds: 0, remainingSeconds: 0, reason: 'check_failed', message: 'Usage check failed' };
  }
  const sessionsToday = (dayRows || []).length;
  const secondsToday = (dayRows || []).reduce((sum, row) => sum + Math.max(0, row.duration_seconds || 0), 0);

  let monthly: { usedSeconds: number; limitSeconds: number } | null = null;
  if (!IS_SELF_HOSTED && !hasByokKeys) {
    const { data: profile } = await db
      .from(TABLES.userProfiles)
      .select('subscription_status')
      .eq('id', userId)
      .single();

    if (profile?.subscription_status !== 'active') {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const { data, error } = await db
        .from(TABLES.voiceSessions)
        .select('duration_seconds')
        .eq('user_id', userId)
        .gte('started_at', monthStart.toISOString())
        .lt('started_at', monthEnd.toISOString());
      if (error) {
        log.error('Failed to check voice time budget:', error.message);
        return { allowed: false, usedSeconds: 0, limitSeconds: 0, remainingSeconds: 0, reason: 'check_failed', message: 'Usage check failed' };
      }
      const usedSeconds = (data || []).reduce((sum, row) => sum + Math.max(0, row.duration_seconds || 0), 0);
      monthly = { usedSeconds, limitSeconds: FREE_VOICE_HARD_LIMIT_SECONDS };
    }
  }

  const result = decideVoiceBudget({
    sessionsToday,
    secondsToday,
    dailySessions: limits.dailyVoiceSessions,
    dailySeconds: limits.dailyVoiceSeconds,
    monthly,
  });
  if (!result.allowed) {
    log.info(`User ${userId} refused voice (${result.reason})`);
  }
  return result;
}
