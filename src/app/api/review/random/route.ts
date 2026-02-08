import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/review/random
 * Returns a random question from the question bank.
 * No review_schedule needed — works for any active question.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total count of active questions
    const { count } = await supabase
      .from('question_bank')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (!count || count === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 404 });
    }

    // Pick a random offset
    const randomOffset = Math.floor(Math.random() * count);

    const { data: question, error } = await supabase
      .from('question_bank')
      .select(`
        id,
        concept_id,
        question_text,
        expected_answer,
        type,
        difficulty,
        concepts!inner ( name )
      `)
      .eq('is_active', true)
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
