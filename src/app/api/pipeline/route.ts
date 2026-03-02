/**
 * POST /api/pipeline
 *
 * Start a new YouTube → Course pipeline job.
 * Body: { url: string, title?: string }
 * Returns: { jobId, status: 'queued' }
 */

import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { badRequest } from '@/lib/api/errors';
import { jsonOk } from '@/lib/api/errors';
import { startPipeline } from '@/lib/pipeline/orchestrator';
import { extractYouTubeVideoId } from '@/lib/pipeline/stages/resolve-youtube';
import { getUserLanguage } from '@/lib/db/queries/user';
import { TABLES } from '@/lib/db/tables';
import { checkTokenBudget } from '@/lib/api/rate-limit';

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const body = await request.json();
  const { url, title } = body as { url?: string; title?: string };

  if (!url || typeof url !== 'string') {
    throw badRequest('URL is required');
  }

  // Validate it's a YouTube URL
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw badRequest('Invalid YouTube URL. Supported formats: youtube.com/watch?v=... or youtu.be/...');
  }

  // Skip pipeline if this video was already processed
  const resourceId = `yt-${videoId}`;
  const { data: existing } = await supabase
    .from(TABLES.resources)
    .select('id')
    .eq('id', resourceId)
    .single();

  if (existing) {
    return jsonOk({ resourceId, status: 'completed', alreadyExists: true });
  }

  // Get user's preferred language
  const language = await getUserLanguage(supabase, user.id);

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: 'Monthly token limit exceeded', used: budget.used, limit: budget.limit },
      { status: 429 },
    );
  }

  const jobId = randomUUID();
  await startPipeline({
    jobId,
    userId: user.id,
    url,
    title,
    targetLanguage: language,
    deepseekApiKey: byokKeys.deepseek,
  });

  return jsonOk({ jobId, status: 'queued' });
});
