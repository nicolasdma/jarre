import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { REVIEW_SESSION_CAP } from '@/lib/spaced-repetition';

/**
 * GET /api/review/due
 * Returns up to REVIEW_SESSION_CAP cards that are due for review.
 * Cards are ordered by most overdue first.
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

    const now = new Date().toISOString();

    const { data: dueCards, error } = await supabase
      .from('review_schedule')
      .select(`
        id,
        question_id,
        streak,
        repetition_count,
        next_review_at,
        question_bank!inner (
          id,
          concept_id,
          question_text,
          type,
          difficulty,
          concepts!concept_id (
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })
      .limit(REVIEW_SESSION_CAP);

    if (error) {
      console.error('[Review/Due] Error fetching due cards:', error);
      return NextResponse.json({ error: 'Failed to fetch due cards' }, { status: 500 });
    }

    const cards = (dueCards || []).map((card) => {
      const question = card.question_bank as unknown as {
        id: string;
        concept_id: string;
        question_text: string;
        type: string;
        difficulty: number;
        concepts: { name: string };
      };

      return {
        questionId: question.id,
        conceptId: question.concept_id,
        conceptName: question.concepts.name,
        questionText: question.question_text,
        type: question.type,
        difficulty: question.difficulty,
        streak: card.streak,
        repetitionCount: card.repetition_count,
      };
    });

    return NextResponse.json({ cards, total: cards.length });
  } catch (error) {
    console.error('[Review/Due] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
