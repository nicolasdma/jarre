/**
 * Server-side reads of lesson drills (table `lesson_drills`, audio in the
 * private `lesson-audio` bucket). Uses the caller's RLS-bound client: drills
 * and their audio are readable by any authenticated user.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';
import type { PracticeDrill } from '@/components/practice/types';

export const LESSON_AUDIO_BUCKET = 'lesson-audio';
/** Long enough for a practice session; the page re-signs on every load. */
const SIGNED_URL_TTL_SECONDS = 4 * 60 * 60;

interface DrillRow {
  slug: string;
  title: string;
  priority: number;
  text_en: string;
  text_es: string | null;
  audio_path: string | null;
  /** Absent until supabase/migrations/20261111030000_lesson_drill_concept.sql is applied. */
  concept_id?: string | null;
}

export async function fetchPracticeDrills(supabase: SupabaseClient, resourceId: string): Promise<PracticeDrill[]> {
  const { data, error } = await supabase
    .from(TABLES.lessonDrills)
    // `*`: concept_id exists only once its migration is applied.
    .select('*')
    .eq('resource_id', resourceId)
    .order('priority', { ascending: true })
    .order('slug', { ascending: true });
  if (error) throw new Error(`lesson_drills: ${error.message}`);
  const rows = (data ?? []) as DrillRow[];

  const paths = rows.map((r) => r.audio_path).filter((p): p is string => Boolean(p));
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls, error: signError } = await supabase.storage
      .from(LESSON_AUDIO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    if (signError) throw new Error(`lesson-audio: ${signError.message}`);
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
    }
  }

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    priority: r.priority,
    textEn: r.text_en,
    textEs: r.text_es,
    audioUrl: r.audio_path ? signed.get(r.audio_path) ?? null : null,
    conceptId: r.concept_id ?? null,
  }));
}

/** Which of these resources have practice drills. Missing table → none. */
export async function resourcesWithDrills(supabase: SupabaseClient, resourceIds: string[]): Promise<Set<string>> {
  if (resourceIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from(TABLES.lessonDrills)
    .select('resource_id')
    .in('resource_id', resourceIds);
  if (error) return new Set();
  return new Set((data ?? []).map((r: { resource_id: string }) => r.resource_id));
}
