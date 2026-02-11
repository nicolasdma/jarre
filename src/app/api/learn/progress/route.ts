import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Learn/Progress');

/**
 * GET /api/learn/progress?resourceId=xxx
 * Returns the user's saved learn progress for a resource, or null.
 */
export const GET = withAuth(async (request, { supabase, user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    if (!resourceId) {
      return NextResponse.json({ error: 'Missing resourceId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLES.learnProgress)
      .select('current_step, active_section, completed_sections, section_state, review_state')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new resources)
      log.error('GET error:', error);
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
    log.error('GET unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch progress' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/learn/progress
 * Upserts learn progress for a resource.
 *
 * Body: { resourceId, currentStep, activeSection, completedSections, sectionState }
 */
export const POST = withAuth(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { resourceId, currentStep, activeSection, completedSections, sectionState, reviewState } = body;

    if (!resourceId || !currentStep) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TABLES.learnProgress)
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
      log.error('POST upsert error:', error);
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('POST unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save progress' },
      { status: 500 }
    );
  }
});
