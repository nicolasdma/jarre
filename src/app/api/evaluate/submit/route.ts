import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callDeepSeek, parseJsonResponse } from '@/lib/llm/deepseek';
import { EvaluateAnswersResponseSchema } from '@/lib/llm/schemas';
import { buildEvaluateAnswersPrompt, SYSTEM_PROMPT_EVALUATOR, PROMPT_VERSIONS } from '@/lib/llm/prompts';

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
    const { resourceId, resourceTitle, questions, userId } = body;

    if (!resourceId || !questions?.length || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user matches
    if (user.id !== userId) {
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 });
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
    });

    // Call DeepSeek
    const { content, tokensUsed } = await callDeepSeek({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_EVALUATOR },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // More deterministic for evaluation
      maxTokens: 2000,
      responseFormat: 'json',
    });

    // Parse and validate response
    const parsed = parseJsonResponse(content, EvaluateAnswersResponseSchema);

    // Save evaluation to database
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        user_id: user.id,
        resource_id: resourceId,
        status: 'completed',
        overall_score: Math.round(parsed.overallScore),
        prompt_version: PROMPT_VERSIONS.EVALUATE_ANSWERS,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (evalError) {
      console.error('[Evaluate] Error saving evaluation:', evalError);
      // Continue anyway - user should see results
    }

    // Save questions and responses
    if (evaluation) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const r = parsed.responses.find((res) => res.questionIndex === i) || parsed.responses[i];

        // Insert question
        const { data: savedQuestion } = await supabase
          .from('evaluation_questions')
          .insert({
            evaluation_id: evaluation.id,
            concept_id: q.conceptId || null, // May not have concept_id mapped
            type: q.type,
            question: q.question,
          })
          .select()
          .single();

        // Insert response
        if (savedQuestion && r) {
          await supabase.from('evaluation_responses').insert({
            question_id: savedQuestion.id,
            user_answer: q.userAnswer,
            is_correct: r.isCorrect,
            score: r.score,
            feedback: r.feedback,
          });
        }

        // Update concept progress if score >= 50
        if (r && r.score >= 50 && q.conceptName) {
          // Find concept by name
          const { data: concept } = await supabase
            .from('concepts')
            .select('id')
            .eq('name', q.conceptName)
            .single();

          if (concept) {
            // Upsert progress - set to level 1 (understood) if not already higher
            const { data: existingProgress } = await supabase
              .from('concept_progress')
              .select('level')
              .eq('user_id', user.id)
              .eq('concept_id', concept.id)
              .single();

            const currentLevel = existingProgress ? parseInt(existingProgress.level) : 0;
            const newLevel = Math.max(currentLevel, 1); // At least level 1 if passed

            await supabase.from('concept_progress').upsert(
              {
                user_id: user.id,
                concept_id: concept.id,
                level: newLevel.toString(),
                last_evaluated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,concept_id' }
            );
          }
        }
      }

      // Update user profile stats
      await supabase
        .from('user_profiles')
        .update({
          total_evaluations: (await supabase
            .from('evaluations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)).count || 0,
          last_active_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    console.log(`[Evaluate] Completed evaluation for ${resourceId}, score: ${parsed.overallScore}, tokens: ${tokensUsed}`);

    return NextResponse.json({
      responses: parsed.responses,
      overallScore: Math.round(parsed.overallScore),
      summary: parsed.summary,
      evaluationId: evaluation?.id,
      tokensUsed,
    });
  } catch (error) {
    console.error('[Evaluate] Error evaluating answers:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to evaluate answers' },
      { status: 500 }
    );
  }
}
