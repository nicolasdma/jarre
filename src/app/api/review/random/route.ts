import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/review/random?concepts=id1,id2,id3&sectionId=uuid
 * Returns a random question from the question bank.
 * If `sectionId` is provided, tries section-scoped questions first,
 * then falls back to concept-scoped questions.
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
    const sectionId = searchParams.get('sectionId');

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

    // Helper: count + fetch a random question with given filters
    const fetchRandom = async (filters: { useSectionId?: boolean }) => {
      let cq = supabase
        .from('question_bank')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('concept_id', conceptIds);

      if (filters.useSectionId && sectionId) {
        cq = cq.eq('resource_section_id', sectionId);
      }
      if (excludeId) {
        cq = cq.neq('id', excludeId);
      }

      const { count } = await cq;
      if (!count || count === 0) return null;

      const randomOffset = Math.floor(Math.random() * count);

      let qq = supabase
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

      if (filters.useSectionId && sectionId) {
        qq = qq.eq('resource_section_id', sectionId);
      }
      if (excludeId) {
        qq = qq.neq('id', excludeId);
      }

      const { data, error: qErr } = await qq
        .range(randomOffset, randomOffset)
        .single();

      if (qErr || !data) return null;
      return data;
    };

    // Try section-scoped first, then fall back to concept-scoped
    const question = sectionId
      ? (await fetchRandom({ useSectionId: true })) ?? (await fetchRandom({ useSectionId: false }))
      : await fetchRandom({ useSectionId: false });

    if (!question) {
      return NextResponse.json(
        { error: 'No hay preguntas disponibles para estos conceptos.' },
        { status: 404 }
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
