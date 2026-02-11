import { withAuth } from '@/lib/api/middleware';
import { badRequest, errorResponse, jsonOk } from '@/lib/api/errors';
import { getUserLanguage } from '@/lib/db/queries/user';
import { createLogger } from '@/lib/logger';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { GenerateQuestionsResponseSchema } from '@/lib/llm/schemas';
import { buildGenerateQuestionsPrompt, getSystemPrompt, PROMPT_VERSIONS } from '@/lib/llm/prompts';

const log = createLogger('Evaluate/Generate');

export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    // Get user's language preference
    const language = await getUserLanguage(supabase, user.id);

    const body = await request.json();
    const { resourceId, resourceTitle, resourceType, concepts } = body;

    if (!resourceId || !resourceTitle || !concepts?.length) {
      throw badRequest('Missing required fields');
    }

    // Build prompt
    const userPrompt = buildGenerateQuestionsPrompt({
      resourceTitle,
      resourceType,
      concepts,
      questionCount: Math.min(5, concepts.length + 2), // 5 questions or fewer for few concepts
      language,
    });

    // Call DeepSeek
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: getSystemPrompt(language) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4, // Slightly creative but consistent
      maxTokens: 2000,
      responseFormat: 'json',
    });

    // Parse and validate response
    const parsed = parseJsonResponse(content, GenerateQuestionsResponseSchema);

    // Add unique IDs to questions
    const questions = parsed.questions.map((q, i) => ({
      id: `q-${Date.now()}-${i}`,
      type: q.type,
      conceptName: q.conceptName,
      question: q.question,
      incorrectStatement: q.incorrectStatement,
      relatedConceptName: q.relatedConceptName,
    }));

    log.info(`Generated ${questions.length} questions for ${resourceId}, tokens: ${tokensUsed}`);

    return jsonOk({
      questions,
      promptVersion: PROMPT_VERSIONS.GENERATE_QUESTIONS,
      tokensUsed,
    });
  } catch (error) {
    log.error('Error generating questions:', error);
    return errorResponse(error);
  }
});
