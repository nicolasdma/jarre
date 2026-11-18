/**
 * POST /api/feed/sign-audio
 * Body: { resourceId, slugs: string[] }
 * Response: { urls: Record<slug, string | null> }
 *
 * Signed audio URLs for a batch of drills for the feed. The page already signs
 * the whole lesson's audio on load (fetchPracticeDrills); this is the refresh
 * for a session that runs long. Both go through signLessonAudio, which hands
 * out the same URL again while it is fresh, so the browser cache works. Same bucket and same
 * RLS-bound client as practice (src/lib/lessons/drills.ts): a signed URL is
 * only handed back for a drill the user may read.
 *
 * Reads only. No writes, no model calls.
 */

import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { signLessonAudio } from '@/lib/lessons/drills';

const BodySchema = z.object({
  resourceId: z.string().min(1),
  slugs: z.array(z.string().min(1).max(200)).min(1).max(40),
});

export const POST = withAuth(async (request, { supabase }) => {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest('resourceId and slugs are required');
  const { resourceId, slugs } = parsed.data;

  const { data, error } = await supabase
    .from(TABLES.lessonDrills)
    .select('slug, audio_path')
    .eq('resource_id', resourceId)
    .in('slug', slugs);
  if (error) throw badRequest(`lesson_drills: ${error.message}`);

  const rows = (data ?? []) as { slug: string; audio_path: string | null }[];
  const pathBySlug = new Map<string, string>();
  for (const r of rows) if (r.audio_path) pathBySlug.set(r.slug, r.audio_path);

  const paths = [...pathBySlug.values()];
  let signed = new Map<string, string>();
  if (paths.length > 0) {
    try {
      signed = await signLessonAudio(supabase, paths);
    } catch (err) {
      throw badRequest(err instanceof Error ? err.message : 'lesson-audio: signing failed');
    }
  }

  const out: Record<string, string | null> = {};
  for (const slug of slugs) {
    const path = pathBySlug.get(slug);
    out[slug] = path ? signed.get(path) ?? null : null;
  }
  return jsonOk({ urls: out });
});
