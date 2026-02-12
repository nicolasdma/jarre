/**
 * XP module — awards experience points via the award_xp RPC.
 *
 * Fire-and-forget safe: logs errors, never throws.
 * All XP is granted atomically in the database (streak + level included).
 */

import { createLogger } from '@/lib/logger';
import type { XPResult } from '@/types';

const log = createLogger('XP');

/**
 * Award XP to a user. Returns the result or null on failure.
 * Safe to call fire-and-forget — errors are logged, never thrown.
 *
 * Accepts any Supabase client (server or client-side).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function awardXP(
  supabase: { rpc: (...args: any[]) => any },
  userId: string,
  amount: number,
  source: string,
  sourceId?: string
): Promise<XPResult | null> {
  try {
    const { data, error } = await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_xp_amount: amount,
      p_source: source,
      p_source_id: sourceId ?? null,
    });

    if (error) {
      log.error(`Failed to award ${amount} XP (${source}):`, error);
      return null;
    }

    const result = data as XPResult;
    log.info(`Awarded ${amount} XP (${source}) → total=${result.totalXp}, level=${result.xpLevel}`);
    return result;
  } catch (err) {
    log.error(`Unexpected error awarding XP (${source}):`, err);
    return null;
  }
}
