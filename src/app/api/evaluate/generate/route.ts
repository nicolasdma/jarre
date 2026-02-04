import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { GenerateQuestionsResponseSchema } from '@/lib/llm/schemas';
import { buildGenerateQuestionsPrompt, SYSTEM_PROMPT_EVALUATOR, PROMPT_VERSIONS } from '@/lib/llm/prompts';

export async function POST(request: Request) {
  try {
    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resourceId, resourceTitle, resourceType, concepts } = body;

    if (!resourceId || !resourceTitle || !concepts?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build prompt
    const userPrompt = buildGenerateQuestionsPrompt({
      resourceTitle,
      resourceType,
      concepts,
      questionCount: Math.min(5, concepts.length + 2), // 5 questions or fewer for few concepts
    });

    // Call DeepSeek
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_EVALUATOR },
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

    console.log(`[Evaluate] Generated ${questions.length} questions for ${resourceId}, tokens: ${tokensUsed}`);

    return NextResponse.json({
      questions,
      promptVersion: PROMPT_VERSIONS.GENERATE_QUESTIONS,
      tokensUsed,
    });
  } catch (error) {
    console.error('[Evaluate] Error generating questions:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
