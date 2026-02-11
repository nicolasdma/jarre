import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';

const log = createLogger('Projects');

/**
 * GET /api/projects
 * Returns all projects with their concept mappings and user progress.
 */
export const GET = withAuth(async (_request, { supabase, user }) => {
  try {
    // Fetch all projects
    const { data: projects, error: projError } = await supabase
      .from(TABLES.projects)
      .select('*')
      .order('phase');

    if (projError) {
      log.error('Error fetching projects:', projError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Fetch project-concept mappings
    const { data: projectConcepts } = await supabase
      .from(TABLES.projectConcepts)
      .select('project_id, concept_id');

    // Fetch user's project progress
    const { data: progress } = await supabase
      .from(TABLES.projectProgress)
      .select('project_id, status, started_at, completed_at')
      .eq('user_id', user.id);

    // Fetch concept names for display
    const conceptIds = [...new Set((projectConcepts || []).map((pc) => pc.concept_id))];
    const { data: concepts } = await supabase
      .from(TABLES.concepts)
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
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
});
