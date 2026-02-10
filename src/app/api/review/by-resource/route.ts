import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/review/by-resource?resourceId=ddia-ch5
 * Returns ALL active question_bank questions for concepts covered by a resource.
 * Questions are matched via resource_sections (concept_id) and ordered by concept + difficulty.
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

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Missing resourceId' }, { status: 400 });
    }

    // Get concept IDs from resource_sections for this resource
    const { data: sections, error: secError } = await supabase
      .from('resource_sections')
      .select('id, concept_id')
      .eq('resource_id', resourceId);

    if (secError) {
      console.error('[Review/ByResource] Error fetching sections:', secError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    if (!sections || sections.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const conceptIds = [...new Set(sections.map((s) => s.concept_id))];

    // Build a map: conceptId → sectionId for matching
    const conceptToSection: Record<string, string> = {};
    for (const s of sections) {
      conceptToSection[s.concept_id] = s.id;
    }

    // Fetch all active questions for these concepts
    const { data: questions, error: qError } = await supabase
      .from('question_bank')
      .select(`
        id,
        concept_id,
        resource_section_id,
        question_text,
        expected_answer,
        type,
        difficulty,
        concepts!concept_id ( name )
      `)
      .eq('is_active', true)
      .in('concept_id', conceptIds)
      .order('concept_id')
      .order('difficulty');

    if (qError) {
      console.error('[Review/ByResource] Error fetching questions:', qError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    const mapped = (questions || []).map((q) => {
      const conceptRow = q.concepts as unknown as { name: string } | { name: string }[];
      const conceptName = Array.isArray(conceptRow) ? conceptRow[0]?.name : conceptRow?.name;

      return {
        questionId: q.id,
        conceptId: q.concept_id,
        conceptName: conceptName || q.concept_id,
        sectionId: q.resource_section_id || conceptToSection[q.concept_id] || null,
        questionText: q.question_text,
        expectedAnswer: q.expected_answer,
        type: q.type,
        difficulty: q.difficulty,
      };
    });

    return NextResponse.json({ questions: mapped });
  } catch (error) {
    console.error('[Review/ByResource] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
