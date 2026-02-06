import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_CANVAS_SIZE = 10 * 1024 * 1024; // 10MB limit

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

/**
 * PUT /api/notes/[resourceId]/canvas
 * Save canvas data for the authenticated user and resource
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
    const { error } = await supabase.from('resource_notes').upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        canvas_data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,resource_id' }
    );

    if (error) {
      console.error('[Canvas] Error saving canvas:', error);
      return NextResponse.json({ error: 'Failed to save canvas' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Canvas] Error saving canvas:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save canvas' },
      { status: 500 }
    );
  }
}
