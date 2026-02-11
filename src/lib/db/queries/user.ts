/**
 * User data queries — eliminates language fetching duplication.
 */

import { TABLES } from '../tables';
import type { SupportedLanguage } from '@/lib/llm/prompts';
import type { createClient } from '@/lib/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetch user's language preference. Defaults to 'es' if not set.
 */
export async function getUserLanguage(
  supabase: SupabaseClient,
  userId: string,
): Promise<SupportedLanguage> {
  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('language')
    .eq('id', userId)
    .single();

  return ((profile?.language as string) || 'es') as SupportedLanguage;
}
