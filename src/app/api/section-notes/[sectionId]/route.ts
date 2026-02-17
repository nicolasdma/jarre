import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('SectionNotes');

/**
 * GET /api/section-notes/[sectionId]
 * Fetch the notebook HTML for the current user + section.
 */
export const GET = withAuth<{ sectionId: string }>(async (_request, { supabase, user, params }) => {
  const { sectionId } = params;

  const { data, error } = await supabase
    .from(TABLES.sectionNotes)
    .select('content')
    .eq('user_id', user.id)
    .eq('section_id', sectionId)
    .maybeSingle();

  if (error) {
    log.error('GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data?.content ?? '' });
});

/**
 * PUT /api/section-notes/[sectionId]
 * Upsert the notebook HTML for the current user + section.
 */
export const PUT = withAuth<{ sectionId: string }>(async (request, { supabase, user, params }) => {
  const { sectionId } = params;
  const body = await request.json();
  const { content } = body;

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'content must be a string' }, { status: 400 });
  }

  const { error } = await supabase
    .from(TABLES.sectionNotes)
    .upsert(
      {
        user_id: user.id,
        section_id: sectionId,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,section_id' }
    );

  if (error) {
    log.error('PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});
