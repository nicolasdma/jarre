import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ evaluationId: string }>;
}

/**
 * GET /api/evaluate/[evaluationId]
 *
 * Returns complete evaluation detail including questions, responses, and feedback.
 * RLS ensures users can only access their own evaluations.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { evaluationId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch evaluation with nested questions and responses
    const { data: evaluation, error } = await supabase
      .from('evaluations')
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
      console.error('[EvaluationDetail] Error fetching evaluation:', error);
      return NextResponse.json(
        { error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // RLS should handle this, but double-check ownership
    if (evaluation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch questions with their responses
    const { data: questions, error: questionsError } = await supabase
      .from('evaluation_questions')
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
      console.error('[EvaluationDetail] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
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
        .from('evaluation_responses')
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

    return NextResponse.json({
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
    console.error('[EvaluationDetail] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}
