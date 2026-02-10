import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/learn/progress?resourceId=xxx
 * Returns the user's saved learn progress for a resource, or null.
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

    const { data, error } = await supabase
      .from('learn_progress')
      .select('current_step, active_section, completed_sections, section_state, review_state')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new resources)
      console.error('[Learn/Progress] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      currentStep: data.current_step,
      activeSection: data.active_section,
      completedSections: data.completed_sections,
      sectionState: data.section_state,
      reviewState: data.review_state,
    });
  } catch (error) {
    console.error('[Learn/Progress] GET unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learn/progress
 * Upserts learn progress for a resource.
 *
 * Body: { resourceId, currentStep, activeSection, completedSections, sectionState }
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
    const { resourceId, currentStep, activeSection, completedSections, sectionState, reviewState } = body;

    if (!resourceId || !currentStep) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('learn_progress')
      .upsert(
        {
          user_id: user.id,
          resource_id: resourceId,
          current_step: currentStep,
          active_section: activeSection ?? 0,
          completed_sections: completedSections ?? [],
          section_state: sectionState ?? {},
          review_state: reviewState ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,resource_id' }
      );

    if (error) {
      console.error('[Learn/Progress] POST upsert error:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Learn/Progress] POST unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save progress' },
      { status: 500 }
    );
  }
}
