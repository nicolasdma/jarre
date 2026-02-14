import { withAuth } from '@/lib/api/middleware';
import { ApiError, errorResponse, jsonOk } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Evaluate/RetrySave');

/**
 * POST /api/evaluate/retry-save
 *
 * Emergency save route for when the primary submit fails to persist.
 * Accepts the FULL evaluation payload (questions, answers, rubrics)
 * so no data is lost on retry.
 */
export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const {
      resourceId,
      overallScore,
      predictedScore,
      promptVersion,
      questions,
      responses,
    } = body as {
      resourceId: string;
      overallScore: number;
      predictedScore?: number;
      promptVersion?: string;
      questions?: Array<{
        type: string;
        question: string;
        conceptId?: string;
        userAnswer: string;
      }>;
      responses?: Array<{
        questionIndex: number;
        isCorrect: boolean;
        score: number;
        feedback: string;
      }>;
    };

    if (!resourceId) {
      throw new ApiError(400, 'Missing resourceId');
    }

    // Save the evaluation record
    const { data: evaluation, error: evalError } = await supabase
      .from(TABLES.evaluations)
      .insert({
        user_id: user.id,
        resource_id: resourceId,
        status: 'completed',
        overall_score: overallScore,
        predicted_score: predictedScore ?? null,
        prompt_version: promptVersion ?? 'unknown',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (evalError) {
      log.error('Retry save failed (evaluation):', evalError);
      return jsonOk({ saved: false });
    }

    // Save individual questions and responses if provided
    if (evaluation && questions?.length && responses?.length) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const r = responses.find((res) => res.questionIndex === i) || responses[i];

        const { data: savedQuestion } = await supabase
          .from(TABLES.evaluationQuestions)
          .insert({
            evaluation_id: evaluation.id,
            concept_id: q.conceptId || null,
            type: q.type,
            question: q.question,
          })
          .select()
          .single();

        if (savedQuestion && r) {
          await supabase.from(TABLES.evaluationResponses).insert({
            question_id: savedQuestion.id,
            user_answer: q.userAnswer,
            is_correct: r.isCorrect,
            score: r.score,
            feedback: r.feedback,
          });
        }
      }

      log.info(
        `Retry save: persisted ${questions.length} questions for evaluation ${evaluation.id}`
      );
    }

    log.info(`Retry save succeeded for ${resourceId}, evaluation ${evaluation.id}`);
    return jsonOk({ saved: true, evaluationId: evaluation.id });
  } catch (error) {
    log.error('Error in retry save:', error);
    return errorResponse(error);
  }
});
