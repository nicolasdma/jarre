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

/**
 * Fetch user's language and current phase in a single query.
 * Avoids duplicate calls to user_profiles.
 */
export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ language: SupportedLanguage; currentPhase: string }> {
  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('language, current_phase')
    .eq('id', userId)
    .single();

  return {
    language: ((profile?.language as string) || 'es') as SupportedLanguage,
    currentPhase: (profile?.current_phase as string) || '1',
  };
}
