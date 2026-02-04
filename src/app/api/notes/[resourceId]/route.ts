import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { NoteSection } from '@/types/notes';

// Validation schema for sections
const NoteSubsectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  order: z.number().int().min(0),
  content: z.string().max(50000), // ~50KB max per subsection
});

const NoteSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  order: z.number().int().min(0),
  subsections: z.array(NoteSubsectionSchema),
});

const NotesBodySchema = z.object({
  sections: z.array(NoteSectionSchema),
});

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

/**
 * GET /api/notes/[resourceId]
 * Fetch notes for the authenticated user and resource
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { resourceId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notes, error } = await supabase
      .from('resource_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (ok, return empty)
      console.error('[Notes] Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({
      sections: (notes?.sections as NoteSection[]) || [],
    });
  } catch (error) {
    console.error('[Notes] Error fetching notes:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notes/[resourceId]
 * Upsert notes for the authenticated user and resource
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
    const parseResult = NotesBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid notes format', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { sections } = parseResult.data;

    // Upsert notes
    const { error } = await supabase.from('resource_notes').upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        sections,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,resource_id' }
    );

    if (error) {
      console.error('[Notes] Error saving notes:', error);
      return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sections });
  } catch (error) {
    console.error('[Notes] Error saving notes:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save notes' },
      { status: 500 }
    );
  }
}
