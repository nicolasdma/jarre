/**
 * Token Usage Tracking
 *
 * Fire-and-forget utility to log DeepSeek token consumption.
 * Never throws — failures are logged but don't break the caller.
 */

import { createClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { TABLES } from './tables';

const log = createLogger('TokenUsage');

export async function logTokenUsage(params: {
  userId: string;
  category: string;
  tokens: number;
}): Promise<void> {
  if (params.tokens <= 0) return;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLES.tokenUsage).insert({
      user_id: params.userId,
      category: params.category,
      tokens: params.tokens,
    });

    if (error) {
      log.warn(`Failed to log ${params.tokens} tokens (${params.category}):`, error.message);
    }
  } catch (err) {
    log.warn('Token usage insert failed:', (err as Error).message);
  }
}
