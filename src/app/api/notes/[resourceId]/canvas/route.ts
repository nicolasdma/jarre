import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { MAX_CANVAS_SIZE } from '@/lib/constants';

const log = createLogger('Canvas');

/**
 * PUT /api/notes/[resourceId]/canvas
 * Save canvas data for the authenticated user and resource
 */
export const PUT = withAuth<{ resourceId: string }>(async (request, { supabase, user, params }) => {
  try {
    const { resourceId } = params;

    const body = await request.json();
    const { canvas_data } = body;

    // Validate canvas data size
    const serialized = JSON.stringify(canvas_data);
    if (serialized.length > MAX_CANVAS_SIZE) {
      return NextResponse.json(
        { error: 'Canvas data exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Upsert canvas data
    const { error } = await supabase.from(TABLES.resourceNotes).upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        canvas_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,resource_id' }
    );

    if (error) {
      log.error('Error saving canvas:', error);
      return NextResponse.json({ error: 'Failed to save canvas' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error saving canvas:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save canvas' },
      { status: 500 }
    );
  }
});
