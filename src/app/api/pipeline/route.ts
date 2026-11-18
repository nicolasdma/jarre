/**
 * POST /api/pipeline
 *
 * Start a new source → Course pipeline job (YouTube or PDF).
 * Body: { url?: string, title?: string, resourceId?: string }
 * Returns: { jobId, status: 'queued' }
 */

import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { badRequest } from '@/lib/api/errors';
import { jsonOk } from '@/lib/api/errors';
import { startPipeline } from '@/lib/pipeline/orchestrator';
import { extractYoutubeId } from '@/lib/utils/youtube';
import { getUserLanguage } from '@/lib/db/queries/user';
import { TABLES } from '@/lib/db/tables';
import { checkTokenBudget } from '@/lib/api/rate-limit';
import { syncPipelineResourceToUserKnowledge } from '@/lib/pipeline/sync-user-resource';
import { detectPipelineSourceType, normalizePdfLikeUrl } from '@/lib/utils/resource-url';

function buildUserVideoResourceId(videoId: string, userId: string): string {
  return `yt-${videoId}-${userId.slice(0, 8)}`;
}

function buildUserPdfResourceId(pdfUrl: string, userId: string): string {
  const hash = createHash('sha1').update(pdfUrl).digest('hex').slice(0, 12);
  return `pdf-${hash}-${userId.slice(0, 8)}`;
}

export const POST = withAuth(async (request, { supabase, user, byokKeys }) => {
  const body = await request.json();
  const {
    url: requestedUrl,
    title: requestedTitle,
    resourceId: requestedResourceId,
  } = body as { url?: string; title?: string; resourceId?: string };

  let effectiveUrl = typeof requestedUrl === 'string' ? requestedUrl.trim() : '';
  let effectiveTitle = typeof requestedTitle === 'string' ? requestedTitle.trim() : '';
  let targetResourceId: string | undefined;

  if (requestedResourceId) {
    const { data: targetResource, error: targetErr } = await supabase
      .from(TABLES.resources)
      .select('id, title, url, created_by')
      .eq('id', requestedResourceId)
      .maybeSingle();

    if (targetErr) {
      throw new Error(`Failed to load target resource: ${targetErr.message}`);
    }
    if (!targetResource) {
      throw badRequest('Target resource not found');
    }

    // Allow backfill for public resources and the user's own generated resources.
    if (targetResource.created_by && targetResource.created_by !== user.id) {
      throw badRequest('You do not have access to regenerate this resource');
    }

    targetResourceId = targetResource.id;
    effectiveTitle = effectiveTitle || targetResource.title || '';
    effectiveUrl = (effectiveUrl || targetResource.url || '').trim();
  }

  if (!effectiveUrl) {
    throw badRequest('URL is required');
  }

  const sourceType = detectPipelineSourceType(effectiveUrl);
  if (sourceType === 'unsupported') {
    throw badRequest('Invalid source URL. Supported sources: YouTube links or direct PDF links.');
  }

  // For curriculum backfill, reuse the existing resource ID.
  // For ad-hoc generation, keep user-scoped deterministic ID.
  const normalizedUrl = sourceType === 'pdf' ? normalizePdfLikeUrl(effectiveUrl) : effectiveUrl;
  const videoId = sourceType === 'youtube' ? extractYoutubeId(normalizedUrl) : null;

  if (sourceType === 'youtube' && !videoId) {
    throw badRequest('Invalid YouTube URL. Supported formats: youtube.com/watch?v=..., youtu.be/..., shorts, embed, or live.');
  }

  const resourceId = targetResourceId
    || (sourceType === 'youtube' && videoId
      ? buildUserVideoResourceId(videoId, user.id)
      : buildUserPdfResourceId(normalizedUrl, user.id));

  // Skip pipeline if this resource is already fully processed.
  const { data: existing } = await supabase
    .from(TABLES.resources)
    .select('id')
    .eq('id', resourceId)
    .maybeSingle();

  if (existing) {
    const { count: sectionCount } = await supabase
      .from(TABLES.resourceSections)
      .select('id', { count: 'exact', head: true })
      .eq('resource_id', resourceId);

    // A pipeline-generated resource should have at least 2 sections.
    // If it has fewer, treat it as incomplete and regenerate instead of short-circuiting.
    if ((sectionCount ?? 0) >= 2) {
      await syncPipelineResourceToUserKnowledge({
        supabase,
        userId: user.id,
        resourceId,
      }).catch(() => {});

      return jsonOk({ resourceId, status: 'completed', alreadyExists: true });
    }
  }

  // Get user's preferred language
  const language = await getUserLanguage(supabase, user.id);

  const budget = await checkTokenBudget(supabase, user.id, !!byokKeys.deepseek);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: budget.message, reason: budget.reason, used: budget.used, limit: budget.limit },
      { status: 429 },
    );
  }

  const jobId = randomUUID();
  await startPipeline({
    jobId,
    userId: user.id,
    url: normalizedUrl,
    title: effectiveTitle || undefined,
    targetResourceId,
    targetLanguage: language,
    deepseekApiKey: byokKeys.deepseek,
  });

  return jsonOk({ jobId, status: 'queued' });
});
