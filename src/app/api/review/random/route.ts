import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/review/random?concepts=id1,id2,id3
 * Returns a random question from the question bank.
 * If `concepts` param is provided, scopes to those concept IDs.
 * Otherwise, scopes to concepts the user has studied (concept_progress).
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine which concepts to filter by
    const { searchParams } = new URL(request.url);
    const conceptsParam = searchParams.get('concepts');
    const excludeId = searchParams.get('exclude');

    let conceptIds: string[];

    if (conceptsParam) {
      // Scoped to specific concepts (from resource card)
      conceptIds = conceptsParam.split(',').filter(Boolean);
    } else {
      // Default: all concepts the user has studied
      const { data: progress } = await supabase
        .from('concept_progress')
        .select('concept_id')
        .eq('user_id', user.id);

      conceptIds = (progress || []).map((p) => p.concept_id);
    }

    if (conceptIds.length === 0) {
      return NextResponse.json(
        { error: 'No hay conceptos para repasar.' },
        { status: 404 }
      );
    }

    // Build base query filters
    let countQuery = supabase
      .from('question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('concept_id', conceptIds);

    if (excludeId) {
      countQuery = countQuery.neq('id', excludeId);
    }

    const { count } = await countQuery;

    if (!count || count === 0) {
      return NextResponse.json(
        { error: 'No hay preguntas disponibles para estos conceptos.' },
        { status: 404 }
      );
    }

    // Pick a random offset
    const randomOffset = Math.floor(Math.random() * count);

    let questionQuery = supabase
      .from('question_bank')
      .select(`
        id,
        concept_id,
        question_text,
        expected_answer,
        type,
        difficulty,
        concepts!concept_id ( name )
      `)
      .eq('is_active', true)
      .in('concept_id', conceptIds);

    if (excludeId) {
      questionQuery = questionQuery.neq('id', excludeId);
    }

    const { data: question, error } = await questionQuery
      .range(randomOffset, randomOffset)
      .single();

    if (error || !question) {
      console.error('[Review/Random] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch question', details: error?.message },
        { status: 500 }
      );
    }

    const conceptRow = question.concepts as unknown as { name: string } | { name: string }[];
    const conceptName = Array.isArray(conceptRow) ? conceptRow[0]?.name : conceptRow?.name;

    return NextResponse.json({
      questionId: question.id,
      conceptId: question.concept_id,
      conceptName: conceptName || question.concept_id,
      questionText: question.question_text,
      expectedAnswer: question.expected_answer,
      type: question.type,
      difficulty: question.difficulty,
    });
  } catch (error) {
    console.error('[Review/Random] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
