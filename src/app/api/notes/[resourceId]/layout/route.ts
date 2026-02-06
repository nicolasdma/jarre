import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const LayoutBodySchema = z.object({
  split_position: z.number().int().min(20).max(80),
});

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

/**
 * PUT /api/notes/[resourceId]/layout
 * Save split pane position for the authenticated user and resource
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { resourceId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const { error } = await supabase.from('resource_notes').upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        split_position,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,resource_id' }
    );

    if (error) {
      console.error('[Layout] Error saving layout:', error);
      return NextResponse.json({ error: 'Failed to save layout' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Layout] Error saving layout:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save layout' },
      { status: 500 }
    );
  }
}
