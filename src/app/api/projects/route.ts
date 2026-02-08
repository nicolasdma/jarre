import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/projects
 * Returns all projects with their concept mappings and user progress.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all projects
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('phase');

    if (projError) {
      console.error('[Projects] Error fetching projects:', projError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Fetch project-concept mappings
    const { data: projectConcepts } = await supabase
      .from('project_concepts')
      .select('project_id, concept_id');

    // Fetch user's project progress
    const { data: progress } = await supabase
      .from('project_progress')
      .select('project_id, status, started_at, completed_at')
      .eq('user_id', user.id);

    // Fetch concept names for display
    const conceptIds = [...new Set((projectConcepts || []).map((pc) => pc.concept_id))];
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id, name')
      .in('id', conceptIds.length > 0 ? conceptIds : ['__none__']);

    const conceptNameMap = (concepts || []).reduce(
      (acc, c) => {
        acc[c.id] = c.name;
        return acc;
      },
      {} as Record<string, string>
    );

    const progressMap = (progress || []).reduce(
      (acc, p) => {
        acc[p.project_id] = p;
        return acc;
      },
      {} as Record<string, { project_id: string; status: string; started_at: string | null; completed_at: string | null }>
    );

    const conceptsMap = (projectConcepts || []).reduce(
      (acc, pc) => {
        if (!acc[pc.project_id]) acc[pc.project_id] = [];
        acc[pc.project_id].push({
          id: pc.concept_id,
          name: conceptNameMap[pc.concept_id] || pc.concept_id,
        });
        return acc;
      },
      {} as Record<string, Array<{ id: string; name: string }>>
    );

    const result = (projects || []).map((project) => ({
      id: project.id,
      title: project.title,
      phase: project.phase,
      description: project.description,
      deliverables: project.deliverables,
      status: progressMap[project.id]?.status || 'not_started',
      startedAt: progressMap[project.id]?.started_at || null,
      completedAt: progressMap[project.id]?.completed_at || null,
      concepts: conceptsMap[project.id] || [],
    }));

    return NextResponse.json({ projects: result });
  } catch (error) {
    console.error('[Projects] Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
