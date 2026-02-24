/**
 * Pipeline Stage 7: Write to Database
 *
 * Persists all pipeline outputs to Supabase:
 * - resources (with activate_data, created_by)
 * - resource_concepts
 * - resource_sections
 * - inline_quizzes
 * - video_segments
 *
 * Uses admin client to bypass RLS for public tables.
 */

import { createLogger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/tables';
import type {
  ContentOutput,
  QuizOutput,
  VideoMapOutput,
  ConceptOutput,
  ResolveOutput,
  WriteOutput,
  ActivateData,
} from '../types';

const log = createLogger('Pipeline:WriteDB');

function generateResourceId(videoId: string): string {
  return `yt-${videoId}`;
}

/**
 * Stage: Write all pipeline outputs to the database.
 * Quizzes are optional — they may be generated later in background.
 */
export async function writeToDb(params: {
  resolve: ResolveOutput;
  content: ContentOutput;
  quizzes?: QuizOutput;
  videoMap: VideoMapOutput;
  concepts: ConceptOutput;
  userId: string;
  title?: string;
}): Promise<WriteOutput> {
  const { resolve, content, quizzes, videoMap, concepts, userId, title } = params;
  const supabase = createAdminClient();
  const resourceId = generateResourceId(resolve.videoId);

  log.info(`Writing resource ${resourceId} to database...`);

  // Step 1: Check if resource already exists (idempotent)
  const { data: existing } = await supabase
    .from(TABLES.resources)
    .select('id')
    .eq('id', resourceId)
    .single();

  if (existing) {
    // Clean up existing dependent data for re-generation
    log.info(`Resource ${resourceId} already exists — cleaning dependents`);

    // Get existing section IDs to clean quizzes and video segments
    const { data: existingSections } = await supabase
      .from(TABLES.resourceSections)
      .select('id')
      .eq('resource_id', resourceId);

    if (existingSections && existingSections.length > 0) {
      const sectionIds = existingSections.map((s) => s.id);

      // Delete quizzes first (FK to resource_sections)
      await supabase
        .from(TABLES.inlineQuizzes)
        .delete()
        .in('section_id', sectionIds);

      // Delete video segments (FK to resource_sections)
      await supabase
        .from(TABLES.videoSegments)
        .delete()
        .in('section_id', sectionIds);
    }

    // Delete sections
    await supabase
      .from(TABLES.resourceSections)
      .delete()
      .eq('resource_id', resourceId);

    // Delete resource_concepts
    await supabase
      .from(TABLES.resourceConcepts)
      .delete()
      .eq('resource_id', resourceId);

    // Update resource
    const { error } = await supabase
      .from(TABLES.resources)
      .update({
        title: title || resolve.title,
        activate_data: content.activateData as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resourceId);

    if (error) throw new Error(`Failed to update resource: ${error.message}`);
  } else {
    // Create new resource (phase '0' = auto-generated, hidden from curriculum phases)
    const { error } = await supabase.from(TABLES.resources).insert({
      id: resourceId,
      title: title || resolve.title,
      type: 'lecture',
      phase: '0',
      author: null,
      url: `https://www.youtube.com/watch?v=${resolve.videoId}`,
      is_archived: false,
      activate_data: content.activateData as unknown as Record<string, unknown>,
      created_by: userId,
    });

    if (error) throw new Error(`Failed to create resource: ${error.message}`);
  }

  // Step 2: Create resource_concepts
  if (concepts.resourceConcepts.length > 0) {
    const rcRows = concepts.resourceConcepts.map((rc) => ({
      resource_id: resourceId,
      concept_id: rc.conceptId,
      is_prerequisite: rc.isPrerequisite,
    }));

    const { error } = await supabase
      .from(TABLES.resourceConcepts)
      .insert(rcRows);

    if (error) {
      log.warn(`Failed to insert resource_concepts: ${error.message}`);
    }
  }

  // Step 3: Create resource_sections
  // Every section MUST have a concept_id — without it, evaluation/mastery/voice tutor can't function.
  // If no curriculum concept matched, create a new one for this section.
  const sectionIdMap = new Map<string, string>(); // sectionTitle → section UUID

  for (let i = 0; i < content.sections.length; i++) {
    const section = content.sections[i];

    // Try to find a matching concept from the linking stage
    let conceptId = concepts.concepts.find(
      (c) =>
        c.name.toLowerCase() === section.conceptName.toLowerCase() ||
        c.slug === section.conceptSlug,
    )?.id;

    // No match — create a dedicated concept for this section
    if (!conceptId) {
      const slug = section.conceptSlug || section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
      const newConceptId = `auto-${slug}`;

      // Check if it already exists (idempotent)
      const { data: existing } = await supabase
        .from(TABLES.concepts)
        .select('id')
        .eq('id', newConceptId)
        .single();

      if (!existing) {
        const { error: conceptErr } = await supabase.from(TABLES.concepts).insert({
          id: newConceptId,
          name: section.conceptName || section.title,
          canonical_definition: `Key topic from "${resolve.title}": ${section.title}`,
          phase: '0',
        });

        if (conceptErr) {
          log.warn(`Failed to create concept "${newConceptId}": ${conceptErr.message}`);
        }
      }

      conceptId = newConceptId;

      // Also link this concept to the resource
      const { error: linkErr } = await supabase.from(TABLES.resourceConcepts).insert({
        resource_id: resourceId,
        concept_id: conceptId,
        is_prerequisite: false,
      });
      if (linkErr) {
        log.warn(`Failed to link concept "${conceptId}" to resource: ${linkErr.message}`);
      }

      log.info(`Created concept "${newConceptId}" for section "${section.title}"`);
    }

    const { data: inserted, error } = await supabase
      .from(TABLES.resourceSections)
      .insert({
        resource_id: resourceId,
        concept_id: conceptId,
        section_title: section.title,
        content_markdown: section.contentMarkdown,
        sort_order: i + 1,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create section "${section.title}": ${error.message}`);
    }

    sectionIdMap.set(section.title, inserted.id);
  }

  // Step 4: Create inline_quizzes (only if quizzes were provided)
  let quizzesCreated = 0;
  if (quizzes) {
    for (const sectionQuizzes of quizzes.quizzesBySection) {
      const sectionId = sectionIdMap.get(sectionQuizzes.sectionTitle);
      if (!sectionId) {
        log.warn(`No section ID for quizzes: "${sectionQuizzes.sectionTitle}"`);
        continue;
      }

      for (const quiz of sectionQuizzes.quizzes) {
        const { error } = await supabase.from(TABLES.inlineQuizzes).insert({
          section_id: sectionId,
          position_after_heading: quiz.positionAfterHeading,
          sort_order: quiz.sortOrder,
          format: quiz.format,
          question_text: quiz.questionText,
          options: quiz.options,
          correct_answer: quiz.correctAnswer,
          explanation: quiz.explanation,
          justification_hint: quiz.justificationHint || null,
        });

        if (error) {
          log.warn(`Failed to insert quiz: ${error.message}`);
        } else {
          quizzesCreated++;
        }
      }
    }
  }

  // Step 5: Create video_segments
  let videoSegmentsCreated = 0;
  for (const sectionSegments of videoMap.segmentsBySection) {
    const sectionId = sectionIdMap.get(sectionSegments.sectionTitle);
    if (!sectionId) {
      log.warn(`No section ID for video segments: "${sectionSegments.sectionTitle}"`);
      continue;
    }

    for (const segment of sectionSegments.segments) {
      const { error } = await supabase.from(TABLES.videoSegments).insert({
        section_id: sectionId,
        position_after_heading: segment.positionAfterHeading,
        sort_order: segment.sortOrder,
        youtube_video_id: segment.youtubeVideoId,
        start_seconds: segment.startSeconds,
        end_seconds: segment.endSeconds,
        label: segment.label,
      });

      if (error) {
        log.warn(`Failed to insert video segment: ${error.message}`);
      } else {
        videoSegmentsCreated++;
      }
    }
  }

  log.info(
    `Written: resource=${resourceId}, sections=${content.sections.length}, quizzes=${quizzesCreated}, videoSegments=${videoSegmentsCreated}, concepts=${concepts.concepts.length}`,
  );

  return {
    resourceId,
    sectionsCreated: content.sections.length,
    quizzesCreated,
    videoSegmentsCreated,
    conceptsLinked: concepts.concepts.length,
  };
}
