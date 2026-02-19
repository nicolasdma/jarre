/**
 * Jarre - Repair Mastery Endpoint (One-time use)
 *
 * Reprocesses historical evaluations to fix concept mastery levels
 * that were never updated due to missing conceptId in text evaluations.
 *
 * DELETE THIS FILE after running the repair.
 */

import { withAuth } from '@/lib/api/middleware';
import { errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { updateConceptMastery } from '@/lib/evaluate/save-results';
import { createLogger } from '@/lib/logger';
import type { EvaluationType } from '@/types';

const log = createLogger('Evaluate/RepairMastery');

export const POST = withAuth(async (_request, { supabase, user }) => {
  try {
    const stats = { repaired: 0, skipped: 0, errors: 0 };

    // 1. Fetch all completed evaluations for this user (chronological order)
    const { data: evaluations, error: evalError } = await supabase
      .from(TABLES.evaluations)
      .select('id, resource_id, overall_score, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (evalError) {
      log.error('Error fetching evaluations:', evalError);
      throw evalError;
    }

    if (!evaluations?.length) {
      return jsonOk({ message: 'No evaluations found', ...stats });
    }

    log.info(`Processing ${evaluations.length} evaluations for user ${user.id}`);

    for (const evaluation of evaluations) {
      // 2. Fetch questions + responses for this evaluation
      const { data: questions } = await supabase
        .from(TABLES.evaluationQuestions)
        .select(`
          id, concept_id, type,
          evaluation_responses!inner(score, is_correct)
        `)
        .eq('evaluation_id', evaluation.id);

      // 3. Get resource concepts for fallback resolution
      const { data: resourceConcepts } = await supabase
        .from(TABLES.resourceConcepts)
        .select('concept_id, is_prerequisite')
        .eq('resource_id', evaluation.resource_id);

      // Filter to only taught concepts (not prerequisites)
      const taughtConceptIds = new Set(
        (resourceConcepts || [])
          .filter((rc) => !rc.is_prerequisite)
          .map((rc) => rc.concept_id)
      );

      // Track which concepts were covered by individual questions
      const coveredConceptIds = new Set<string>();

      // Step A: Process individual questions if they exist
      if (questions?.length) {
        for (const q of questions) {
          const response = (q.evaluation_responses as unknown as Array<{ score: number; is_correct: boolean }>)?.[0];
          if (!response) {
            stats.skipped++;
            continue;
          }

          const conceptId = q.concept_id;
          if (!conceptId) {
            stats.skipped++;
            continue;
          }

          coveredConceptIds.add(conceptId);

          try {
            await updateConceptMastery({
              supabase,
              userId: user.id,
              conceptId,
              questionType: (q.type || 'explanation') as EvaluationType,
              score: response.score,
              evaluationId: evaluation.id,
              triggerType: 'evaluation',
            });
            stats.repaired++;
          } catch (err) {
            log.error(`Error repairing concept ${conceptId}:`, err);
            stats.errors++;
          }
        }
      }

      // Step B: Apply overall_score to ALL taught concepts not covered by questions
      const uncoveredConcepts = [...taughtConceptIds].filter((id) => !coveredConceptIds.has(id));
      for (const conceptId of uncoveredConcepts) {
        try {
          await updateConceptMastery({
            supabase,
            userId: user.id,
            conceptId,
            questionType: 'explanation' as EvaluationType,
            score: evaluation.overall_score ?? 0,
            evaluationId: evaluation.id,
            triggerType: 'evaluation',
          });
          stats.repaired++;
        } catch (err) {
          log.error(`Error repairing concept ${conceptId}:`, err);
          stats.errors++;
        }
      }
    }

    log.info(`Repair complete: ${JSON.stringify(stats)}`);
    return jsonOk({ message: 'Repair complete', ...stats });
  } catch (error) {
    log.error('Repair failed:', error);
    return errorResponse(error);
  }
});
