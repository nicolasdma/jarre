import { withAuth } from '@/lib/api/middleware';
import { ApiError, badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { getUserLanguage } from '@/lib/db/queries/user';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { EvaluateAnswersResponseSchema } from '@/lib/llm/schemas';
import { buildEvaluateAnswersPrompt, getSystemPrompt, PROMPT_VERSIONS } from '@/lib/llm/prompts';
import { saveEvaluationResults } from '@/lib/evaluate/save-results';
import { logTokenUsage } from '@/lib/db/token-usage';

const log = createLogger('Evaluate/Submit');

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    // Get user's language preference
    const language = await getUserLanguage(supabase, user.id);

    const body = await request.json();
    const { resourceId, resourceTitle, questions, userId, predictedScore } = body;

    if (!resourceId || !questions?.length || !userId) {
      throw badRequest('Missing required fields');
    }

    // Verify user matches
    if (user.id !== userId) {
      throw new ApiError(403, 'User mismatch');
    }

    // Build prompt
    const userPrompt = buildEvaluateAnswersPrompt({
      resourceTitle,
      questions: questions.map((q: {
        type: string;
        question: string;
        conceptName: string;
        conceptDefinition: string;
        userAnswer: string;
      }) => ({
        type: q.type,
        question: q.question,
        conceptName: q.conceptName,
        conceptDefinition: q.conceptDefinition,
        userAnswer: q.userAnswer,
      })),
      language,
    });

    // Call DeepSeek
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: getSystemPrompt(language) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // More deterministic for evaluation
      maxTokens: 2000,
      responseFormat: 'json',
    });

    // Parse and validate response
    const parsed = parseJsonResponse(content, EvaluateAnswersResponseSchema);

    // Save evaluation + update mastery + award XP (shared logic)
    const { evaluationId, saved, xp } = await saveEvaluationResults({
      supabase,
      userId: user.id,
      resourceId,
      parsed,
      questions: questions.map((q: { conceptId?: string; conceptName?: string; type: string; question: string; userAnswer: string }) => ({
        conceptId: q.conceptId,
        conceptName: q.conceptName,
        type: q.type,
        question: q.question,
        userAnswer: q.userAnswer,
      })),
      predictedScore,
      promptVersion: PROMPT_VERSIONS.EVALUATE_ANSWERS,
      evalMethod: 'text',
    });

    logTokenUsage({ userId: user.id, category: 'evaluation', tokens: tokensUsed });

    log.info(`Completed evaluation for ${resourceId}, score: ${parsed.overallScore}, tokens: ${tokensUsed}`);

    return jsonOk({
      responses: parsed.responses,
      overallScore: Math.round(parsed.overallScore),
      summary: parsed.summary,
      evaluationId,
      saved,
      tokensUsed,
      xp,
    });
  } catch (error) {
    log.error('Error evaluating answers:', error);
    return errorResponse(error);
  }
});
