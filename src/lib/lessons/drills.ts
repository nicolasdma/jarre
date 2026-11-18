/**
 * Server-side reads of lesson drills (table `lesson_drills`, audio in the
 * private `lesson-audio` bucket). Uses the caller's RLS-bound client: drills
 * and their audio are readable by any authenticated user.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';
import type { PracticeDrill } from '@/components/practice/types';
import { segmentsFit, type PhraseSegment } from '@/lib/practice/phrase-segments';

export const LESSON_AUDIO_BUCKET = 'lesson-audio';
/**
 * Signed audio URLs are reused, not re-signed on every load: each signature is
 * a different URL, so the browser could never hit its cache and downloaded
 * every drill's audio on every visit. A URL is signed for 3 days and handed out
 * again while it has at least 12 h left (always longer than a session), per
 * server instance. Every authenticated user may read the bucket, so one cache
 * serves all of them.
 */
const SIGNED_URL_TTL_SECONDS = 3 * 24 * 60 * 60;
const SIGNED_URL_MIN_LIFE_MS = 12 * 60 * 60 * 1000;
const SIGNED_URL_CACHE_MAX = 2_000;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/** Signed URLs for lesson-audio paths, reusing still-fresh ones. Throws on a storage error. */
export async function signLessonAudio(
  supabase: SupabaseClient,
  paths: string[],
  now: number = Date.now(),
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const missing: string[] = [];
  for (const path of new Set(paths)) {
    const hit = signedUrlCache.get(path);
    if (hit && hit.expiresAt - now >= SIGNED_URL_MIN_LIFE_MS) out.set(path, hit.url);
    else missing.push(path);
  }
  if (missing.length === 0) return out;

  const { data: urls, error } = await supabase.storage
    .from(LESSON_AUDIO_BUCKET)
    .createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(`lesson-audio: ${error.message}`);
  const expiresAt = now + SIGNED_URL_TTL_SECONDS * 1000;
  for (const u of urls ?? []) {
    if (!u.path || !u.signedUrl) continue;
    out.set(u.path, u.signedUrl);
    signedUrlCache.delete(u.path);
    signedUrlCache.set(u.path, { url: u.signedUrl, expiresAt });
  }
  while (signedUrlCache.size > SIGNED_URL_CACHE_MAX) {
    const oldest = signedUrlCache.keys().next().value;
    if (oldest === undefined) break;
    signedUrlCache.delete(oldest);
  }
  return out;
}

/** Test hook. */
export function clearSignedAudioCache(): void {
  signedUrlCache.clear();
}

interface DrillRow {
  slug: string;
  title: string;
  priority: number;
  text_en: string;
  text_es: string | null;
  audio_path: string | null;
  /** Absent until supabase/migrations/20261111030000_lesson_drill_concept.sql is applied. */
  concept_id?: string | null;
  /** Absent until supabase/migrations/20261114010000_lesson_drill_segments.sql is applied. */
  segments?: unknown;
}

/** Phrase timings as stored: kept only when they are a well-formed list for this text. */
function storedSegments(text: string, value: unknown): PhraseSegment[] | null {
  if (!Array.isArray(value)) return null;
  const segments = value.map((s) => ({ start: Number((s as PhraseSegment)?.start), end: Number((s as PhraseSegment)?.end) }));
  return segmentsFit(text, segments) ? segments : null;
}

export async function fetchPracticeDrills(supabase: SupabaseClient, resourceId: string): Promise<PracticeDrill[]> {
  const { data, error } = await supabase
    .from(TABLES.lessonDrills)
    // `*`: concept_id and segments exist only once their migrations are applied.
    .select('*')
    .eq('resource_id', resourceId)
    .order('priority', { ascending: true })
    .order('slug', { ascending: true });
  if (error) throw new Error(`lesson_drills: ${error.message}`);
  const rows = (data ?? []) as DrillRow[];

  const paths = rows.map((r) => r.audio_path).filter((p): p is string => Boolean(p));
  const signed = paths.length > 0 ? await signLessonAudio(supabase, paths) : new Map<string, string>();

  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    priority: r.priority,
    textEn: r.text_en,
    textEs: r.text_es,
    audioUrl: r.audio_path ? signed.get(r.audio_path) ?? null : null,
    conceptId: r.concept_id ?? null,
    segments: storedSegments(r.text_en, r.segments),
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
