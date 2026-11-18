import { beforeEach, describe, expect, it } from 'vitest';
import { decideTokenBudget, decideVoiceBudget, resetRateLimits, spendLimits, takeRateLimit } from '../rate-limit';

describe('takeRateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('lets `limit` requests through per window and refuses the next', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(takeRateLimit('k', 3, 60_000, t0 + i).allowed).toBe(true);
    const refused = takeRateLimit('k', 3, 60_000, t0 + 10);
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfterMs).toBe(60_000 - 10);
    // Other keys are independent; the window slides.
    expect(takeRateLimit('other', 3, 60_000, t0 + 10).allowed).toBe(true);
    expect(takeRateLimit('k', 3, 60_000, t0 + 60_001).allowed).toBe(true);
  });
});

describe('decideTokenBudget', () => {
  it('refuses at the daily cap in every mode', () => {
    const r = decideTokenBudget({ usedToday: 3_000_000, dailyCap: 3_000_000, monthly: null });
    expect(r).toMatchObject({ allowed: false, reason: 'daily_cap', remaining: 0 });
  });

  it('allows under the cap when there is no monthly plan (self-hosted)', () => {
    expect(decideTokenBudget({ usedToday: 10, dailyCap: 100 })).toMatchObject({ allowed: true, remaining: 90 });
  });

  it('applies the monthly plan limit with its 10% tolerance', () => {
    expect(decideTokenBudget({ usedToday: 0, dailyCap: 100, monthly: { used: 54_000, limit: 50_000 } }).allowed).toBe(true);
    expect(decideTokenBudget({ usedToday: 0, dailyCap: 100, monthly: { used: 56_000, limit: 50_000 } })).toMatchObject({
      allowed: false,
      reason: 'monthly_cap',
    });
  });
});

describe('decideVoiceBudget', () => {
  const base = { dailySessions: 150, dailySeconds: 14_400 };

  it('refuses on either daily limit', () => {
    expect(decideVoiceBudget({ ...base, sessionsToday: 150, secondsToday: 0 }).reason).toBe('daily_cap');
    expect(decideVoiceBudget({ ...base, sessionsToday: 1, secondsToday: 14_400 }).reason).toBe('daily_cap');
  });

  it('reports the smaller of the daily and monthly remainders', () => {
    const r = decideVoiceBudget({ ...base, sessionsToday: 2, secondsToday: 14_000, monthly: { usedSeconds: 100, limitSeconds: 720 } });
    expect(r).toMatchObject({ allowed: true, remainingSeconds: 400 });
  });
});

describe('spendLimits', () => {
  it('has sane defaults and reads overrides', () => {
    const before = process.env.JARRE_DAILY_TOKEN_CAP;
    delete process.env.JARRE_DAILY_TOKEN_CAP;
    expect(spendLimits().dailyTokens).toBe(3_000_000);
    process.env.JARRE_DAILY_TOKEN_CAP = '500';
    expect(spendLimits().dailyTokens).toBe(500);
    process.env.JARRE_DAILY_TOKEN_CAP = 'nonsense';
    expect(spendLimits().dailyTokens).toBe(3_000_000);
    if (before === undefined) delete process.env.JARRE_DAILY_TOKEN_CAP;
    else process.env.JARRE_DAILY_TOKEN_CAP = before;
  });
});
