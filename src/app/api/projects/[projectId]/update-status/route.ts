import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { TABLES } from '@/lib/db/tables';
import { createLogger } from '@/lib/logger';
import { parseMasteryLevel, serializeMasteryLevel } from '@/lib/db/helpers';
import { computeNewLevelFromProject, buildMasteryHistoryRecord } from '@/lib/mastery';

const log = createLogger('Projects/UpdateStatus');

/**
 * POST /api/projects/[projectId]/update-status
 * Update project status. When completing, trigger mastery level 2 for mapped concepts.
 *
 * Body: { status: 'not_started' | 'in_progress' | 'completed' }
 */
export const POST = withAuth<{ projectId: string }>(async (request, { supabase, user, params }) => {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { status } = body;

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify project exists
    const { data: project, error: projError } = await supabase
      .from(TABLES.projects)
      .select('id, title')
      .eq('id', projectId)
      .single();

    if (projError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Upsert project progress
    const now = new Date().toISOString();
    const { error: upsertError } = await supabase
      .from(TABLES.projectProgress)
      .upsert(
        {
          user_id: user.id,
          project_id: projectId,
          status,
          started_at: status === 'in_progress' ? now : undefined,
          completed_at: status === 'completed' ? now : undefined,
        },
        { onConflict: 'user_id,project_id' }
      );

    if (upsertError) {
      log.error('Error upserting progress:', upsertError);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    // If completing, advance mapped concepts to level 2
    let advancedConcepts: string[] = [];

    if (status === 'completed') {
      const { data: mappedConcepts } = await supabase
        .from(TABLES.projectConcepts)
        .select('concept_id')
        .eq('project_id', projectId);

      if (mappedConcepts && mappedConcepts.length > 0) {
        for (const { concept_id } of mappedConcepts) {
          // Get current level
          const { data: progress } = await supabase
            .from(TABLES.conceptProgress)
            .select('level')
            .eq('user_id', user.id)
            .eq('concept_id', concept_id)
            .single();

          const currentLevel = parseMasteryLevel(progress?.level);
          const newLevel = computeNewLevelFromProject(currentLevel);

          if (newLevel > currentLevel) {
            // Update concept_progress
            await supabase.from(TABLES.conceptProgress).upsert(
              {
                user_id: user.id,
                concept_id,
                level: serializeMasteryLevel(newLevel),
                level_2_project_id: projectId,
              },
              { onConflict: 'user_id,concept_id' }
            );

            // Log mastery history
            await supabase.from(TABLES.masteryHistory).insert(
              buildMasteryHistoryRecord({
                userId: user.id,
                conceptId: concept_id,
                oldLevel: currentLevel,
                newLevel,
                triggerType: 'project',
                triggerId: projectId,
              })
            );

            advancedConcepts.push(concept_id);
          }
        }
      }
    }

    log.info(
      `Project ${projectId} → ${status}. Advanced concepts: [${advancedConcepts.join(', ')}]`
    );

    return NextResponse.json({
      status,
      advancedConcepts,
    });
  } catch (error) {
    log.error('Unexpected error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
});
