import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const log = createLogger('Layout');

const LayoutBodySchema = z.object({
  split_position: z.number().int().min(20).max(80),
});

/**
 * PUT /api/notes/[resourceId]/layout
 * Save split pane position for the authenticated user and resource
 */
export const PUT = withAuth<{ resourceId: string }>(async (request, { supabase, user, params }) => {
  try {
    const { resourceId } = params;

    const body = await request.json();

    // Validate request body
    const parseResult = LayoutBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid layout data', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { split_position } = parseResult.data;

    // Upsert layout
    const { error } = await supabase.from(TABLES.resourceNotes).upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        split_position,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,resource_id' }
    );

    if (error) {
      log.error('Error saving layout:', error);
      return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('Error saving layout:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save layout' },
      { status: 500 }
    );
  }
});
