import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { RubricEvaluationSchema } from '@/lib/llm/schemas';
import {
  buildJustificationPrompt,
  getRubricSystemPrompt,
} from '@/lib/llm/review-prompts';
import { JUSTIFICATION_RUBRIC } from '@/lib/llm/rubrics';
import type { SupportedLanguage } from '@/lib/llm/prompts';

/**
 * POST /api/quiz/evaluate-justification
 *
 * Evaluates an MC2 justification with DeepSeek rubric evaluation.
 * Separate from /api/review/submit because inline quizzes:
 * - Are not in question_bank (they're in inline_quizzes)
 * - Don't require SM-2 or mastery advancement
 * - The client already has all quiz data (no DB lookup needed)
 *
 * Body: { quizId, questionText, options, correctAnswer, selectedAnswer, explanation, justification }
 * Returns: { overallResult, justificationScore, dimensionScores, feedback, reasoning }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      quizId,
      questionText,
      options,
      correctAnswer,
      selectedAnswer,
      explanation,
      justification,
    } = body;

    // Validate required fields
    if (!quizId || !questionText || !options || !correctAnswer || !selectedAnswer || !explanation || !justification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: 'Options must be an array with at least 2 items' }, { status: 400 });
    }

    if (typeof justification !== 'string' || justification.trim().length < 3) {
      return NextResponse.json({ error: 'Justification must be at least 3 characters' }, { status: 400 });
    }

    // Get user language
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .single();

    const language = (profile?.language || 'es') as SupportedLanguage;

    // Build prompt
    const prompt = buildJustificationPrompt({
      questionText,
      options,
      correctAnswer,
      selectedAnswer,
      explanation,
      justification: justification.trim(),
      rubric: JUSTIFICATION_RUBRIC,
      language,
    });

    // Call DeepSeek
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        {
          role: 'system',
          content: getRubricSystemPrompt({
            language,
            domain: language === 'en' ? 'technical concepts' : 'conceptos técnicos',
          }),
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
      maxTokens: 400,
      responseFormat: 'json',
    });

    // Parse response
    const rubricResult = parseJsonResponse(content, RubricEvaluationSchema);
    const scores = rubricResult.scores;
    const justTotal = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalizedScore = Math.round((justTotal / 6) * 100);

    // Combined scoring: MC choice + justification quality
    const mcCorrect = selectedAnswer === correctAnswer;
    let overallResult: 'correct' | 'partial' | 'incorrect';

    if (mcCorrect && justTotal >= 3) {
      overallResult = 'correct';
    } else if (mcCorrect && justTotal < 3) {
      overallResult = 'partial'; // possible lucky guess
    } else if (!mcCorrect && justTotal >= 4) {
      overallResult = 'partial'; // understands but chose wrong
    } else {
      overallResult = 'incorrect';
    }

    console.log(
      `[Quiz/EvalJustification] quiz=${quizId}, mc=${mcCorrect}, justTotal=${justTotal}, ` +
        `overall=${overallResult}, scores=${JSON.stringify(scores)}, tokens=${tokensUsed}`
    );

    return NextResponse.json({
      overallResult,
      justificationScore: normalizedScore,
      dimensionScores: scores,
      feedback: rubricResult.feedback,
      reasoning: rubricResult.reasoning,
    });
  } catch (error) {
    console.error('[Quiz/EvalJustification] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate justification' },
      { status: 500 }
    );
  }
}
