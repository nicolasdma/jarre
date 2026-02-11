import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/annotations/[sectionId]
 * Fetch all annotations for the current user + section.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('section_annotations')
      .select('*')
      .eq('user_id', user.id)
      .eq('section_id', sectionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Annotations/GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[Annotations/GET] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/annotations/[sectionId]
 * Create a new annotation (highlight + optional note).
 * Body: { selectedText, prefix, suffix, segmentIndex, note? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { selectedText, prefix, suffix, segmentIndex, note } = body;

    if (!selectedText || typeof selectedText !== 'string') {
      return NextResponse.json({ error: 'Missing selectedText' }, { status: 400 });
    }

    if (typeof segmentIndex !== 'number') {
      return NextResponse.json({ error: 'Missing segmentIndex' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('section_annotations')
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
      console.error('[Annotations/POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[Annotations/POST] Created annotation ${data.id} for section ${sectionId}`);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Annotations/POST] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to create annotation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/annotations/[sectionId]
 * Update an annotation's note.
 * Body: { annotationId, note }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    await params; // consume params for consistency
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { annotationId, note } = body;

    if (!annotationId) {
      return NextResponse.json({ error: 'Missing annotationId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('section_annotations')
      .update({ note: note ?? null, updated_at: new Date().toISOString() })
      .eq('id', annotationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Annotations/PATCH] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Annotations/PATCH] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update annotation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/annotations/[sectionId]
 * Remove an annotation.
 * Body: { annotationId }
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { annotationId } = body;

    if (!annotationId) {
      return NextResponse.json({ error: 'Missing annotationId' }, { status: 400 });
    }

    const { error } = await supabase
      .from('section_annotations')
      .delete()
      .eq('id', annotationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Annotations/DELETE] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Annotations/DELETE] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
