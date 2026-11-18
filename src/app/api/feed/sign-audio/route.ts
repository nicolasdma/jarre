/**
 * POST /api/feed/sign-audio
 * Body: { resourceId, slugs: string[] }
 * Response: { urls: Record<slug, string | null> }
 *
 * Re-signs the audio of a batch of drills for the feed. The page already signs
 * the whole lesson's audio on load (fetchPracticeDrills, 4 h TTL); this is the
 * refresh for a session that runs longer than the TTL. Same bucket and same
 * RLS-bound client as practice (src/lib/lessons/drills.ts): a signed URL is
 * only handed back for a drill the user may read.
 *
 * Reads only. No writes, no model calls.
 */

import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { LESSON_AUDIO_BUCKET } from '@/lib/lessons/drills';

const SIGNED_URL_TTL_SECONDS = 4 * 60 * 60;

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
  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data: urls, error: signError } = await supabase.storage
      .from(LESSON_AUDIO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    if (signError) throw badRequest(`lesson-audio: ${signError.message}`);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }

  const out: Record<string, string | null> = {};
  for (const slug of slugs) {
    const path = pathBySlug.get(slug);
    out[slug] = path ? signed.get(path) ?? null : null;
  }
  return jsonOk({ urls: out });
});
