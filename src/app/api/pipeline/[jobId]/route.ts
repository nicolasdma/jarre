/**
 * GET /api/pipeline/:jobId
 *
 * Get pipeline job status.
 * Returns: { jobId, status, currentStage, stagesCompleted, totalStages, resourceId?, error? }
 */

import { withAuth } from '@/lib/api/middleware';
import { notFound } from '@/lib/api/errors';
import { jsonOk } from '@/lib/api/errors';
import { getPipelineStatus } from '@/lib/pipeline/orchestrator';

export const GET = withAuth<{ jobId: string }>(async (_request, { user, params }) => {
  const { jobId } = params;

  const status = await getPipelineStatus(jobId, user.id);
  if (!status) {
    throw notFound('Pipeline job not found');
  }

  return jsonOk(status);
});
