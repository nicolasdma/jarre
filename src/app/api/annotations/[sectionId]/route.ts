import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Annotations');

/**
 * GET /api/annotations/[sectionId]
 * Fetch all annotations for the current user + section.
 */
export const GET = withAuth<{ sectionId: string }>(async (_request, { supabase, user, params }) => {
  try {
    const { sectionId } = params;

    const { data, error } = await supabase
      .from(TABLES.sectionAnnotations)
      .select('*')
      .eq('user_id', user.id)
      .eq('section_id', sectionId)
      .order('created_at', { ascending: true });

    if (error) {
      log.error('GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    log.error('GET unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/annotations/[sectionId]
 * Create a new annotation (highlight + optional note).
 * Body: { selectedText, prefix, suffix, segmentIndex, note? }
 */
export const POST = withAuth<{ sectionId: string }>(async (request, { supabase, user, params }) => {
  try {
    const { sectionId } = params;

    const body = await request.json();
    const { selectedText, prefix, suffix, segmentIndex, note } = body;

    if (!selectedText || typeof selectedText !== 'string') {
      return NextResponse.json({ error: 'Missing selectedText' }, { status: 400 });
    }

    if (typeof segmentIndex !== 'number') {
      return NextResponse.json({ error: 'Missing segmentIndex' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLES.sectionAnnotations)
      .insert({
        user_id: user.id,
        section_id: sectionId,
        selected_text: selectedText,
        prefix: prefix || '',
        suffix: suffix || '',
        segment_index: segmentIndex,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      log.error('POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info(`Created annotation ${data.id} for section ${sectionId}`);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    log.error('POST unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create annotation' },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/annotations/[sectionId]
 * Update an annotation's note.
 * Body: { annotationId, note }
 */
export const PATCH = withAuth<{ sectionId: string }>(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { annotationId, note } = body;

    if (!annotationId) {
      return NextResponse.json({ error: 'Missing annotationId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(TABLES.sectionAnnotations)
      .update({ note: note ?? null, updated_at: new Date().toISOString() })
      .eq('id', annotationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      log.error('PATCH error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    log.error('PATCH unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update annotation' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/annotations/[sectionId]
 * Remove an annotation.
 * Body: { annotationId }
 */
export const DELETE = withAuth<{ sectionId: string }>(async (request, { supabase, user }) => {
  try {
    const body = await request.json();
    const { annotationId } = body;

    if (!annotationId) {
      return NextResponse.json({ error: 'Missing annotationId' }, { status: 400 });
    }

    const { error } = await supabase
      .from(TABLES.sectionAnnotations)
      .delete()
      .eq('id', annotationId)
      .eq('user_id', user.id);

    if (error) {
      log.error('DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('DELETE unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete annotation' },
      { status: 500 }
    );
  }
});
