import { withAuth } from '@/lib/api/middleware';
import { ApiError, errorResponse, notFound, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Evaluate/Detail');

/**
 * GET /api/evaluate/[evaluationId]
 *
 * Returns complete evaluation detail including questions, responses, and feedback.
 * RLS ensures users can only access their own evaluations.
 */
export const GET = withAuth<{ evaluationId: string }>(async (request, { supabase, user, params }) => {
  try {
    const { evaluationId } = params;

    // Fetch evaluation with nested questions and responses
    const { data: evaluation, error } = await supabase
      .from(TABLES.evaluations)
      .select(`
        id,
        user_id,
        overall_score,
        created_at,
        completed_at,
        status,
        prompt_version,
        resource:resources(id, title, type, author)
      `)
      .eq('id', evaluationId)
      .single();

    if (error || !evaluation) {
      log.error('Error fetching evaluation:', error);
      throw notFound('Evaluation not found');
    }

    // RLS should handle this, but double-check ownership
    if (evaluation.user_id !== user.id) {
      throw new ApiError(403, 'Access denied');
    }

    // Fetch questions with their responses
    const { data: questions, error: questionsError } = await supabase
      .from(TABLES.evaluationQuestions)
      .select(`
        id,
        type,
        question,
        concept_id,
        concept:concepts(id, name)
      `)
      .eq('evaluation_id', evaluationId)
      .order('id', { ascending: true });

    if (questionsError) {
      log.error('Error fetching questions:', questionsError);
      return errorResponse(new Error('Failed to fetch questions'));
    }

    // Fetch responses for all questions
    const questionIds = questions?.map(q => q.id) || [];
    let responsesMap: Record<string, {
      userAnswer: string;
      score: number;
      feedback: string;
      isCorrect: boolean;
    }> = {};

    if (questionIds.length > 0) {
      const { data: responses } = await supabase
        .from(TABLES.evaluationResponses)
        .select('question_id, user_answer, score, feedback, is_correct')
        .in('question_id', questionIds);

      if (responses) {
        responsesMap = responses.reduce((acc, r) => {
          acc[r.question_id] = {
            userAnswer: r.user_answer,
            score: r.score,
            feedback: r.feedback,
            isCorrect: r.is_correct,
          };
          return acc;
        }, {} as typeof responsesMap);
      }
    }

    // Transform questions with responses
    const questionsWithResponses = questions?.map(q => {
      // Supabase join returns object for 1:1 relationships
      const concept = q.concept as unknown as { id: string; name: string } | null;
      return {
        id: q.id,
        type: q.type,
        question: q.question,
        conceptId: q.concept_id,
        conceptName: concept?.name || null,
        response: responsesMap[q.id] || null,
      };
    }) || [];

    return jsonOk({
      id: evaluation.id,
      overallScore: evaluation.overall_score,
      createdAt: evaluation.created_at,
      completedAt: evaluation.completed_at,
      status: evaluation.status,
      promptVersion: evaluation.prompt_version,
      resource: evaluation.resource,
      questions: questionsWithResponses,
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return errorResponse(error);
  }
});
