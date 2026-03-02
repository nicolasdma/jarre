/**
 * Pipeline Stage 6: Link Concepts
 *
 * Extracts concepts from the generated content and links them to the curriculum.
 * Wraps existing extractConcepts() and linkToCurriculum().
 * Creates new concepts for auto-generated courses that don't match curriculum.
 */

import { createLogger } from '@/lib/logger';
import { extractConcepts } from '@/lib/ingest/extract-concepts';
import { linkToCurriculum } from '@/lib/ingest/link-to-curriculum';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TABLES } from '@/lib/db/tables';
import type { ContentOutput, ConceptOutput } from '../types';

const log = createLogger('Pipeline:Concepts');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function choosePhaseByFrequency(phases: string[]): string | null {
  const frequencies = new Map<string, number>();
  for (const phase of phases) {
    if (!phase || phase === '0') continue;
    frequencies.set(phase, (frequencies.get(phase) ?? 0) + 1);
  }

  if (frequencies.size === 0) return null;

  return [...frequencies.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return Number(a[0]) - Number(b[0]);
    })[0][0];
}

async function inferTargetPhase(params: {
  linkedConceptIds: string[];
  userId: string;
  supabase: SupabaseClient;
}): Promise<string> {
  const { linkedConceptIds, userId, supabase } = params;

  if (linkedConceptIds.length > 0) {
    const { data: conceptRows } = await supabase
      .from(TABLES.concepts)
      .select('phase')
      .in('id', linkedConceptIds);

    if (conceptRows?.length) {
      const inferred = choosePhaseByFrequency(conceptRows.map((row) => String(row.phase)));
      if (inferred) return inferred;
    }
  }

  const { data: profile } = await supabase
    .from(TABLES.userProfiles)
    .select('current_phase')
    .eq('id', userId)
    .maybeSingle();

  return profile?.current_phase ? String(profile.current_phase) : '0';
}

/**
 * Stage 6: Extract and link concepts.
 */
export async function linkConceptsStage(params: {
  contentOutput: ContentOutput;
  videoTitle: string;
  userId: string;
  language: string;
  supabase: SupabaseClient;
}): Promise<{ output: ConceptOutput; tokensUsed: number }> {
  const { contentOutput, videoTitle, userId, language, supabase } = params;

  // Combine all section content for concept extraction
  const fullContent = contentOutput.sections
    .map((s) => `## ${s.title}\n\n${s.contentMarkdown}`)
    .join('\n\n');

  // Step 1: Extract concepts using existing utility
  const extraction = await extractConcepts({
    title: videoTitle,
    content: fullContent,
    type: 'lecture',
    userId,
    language,
  });

  let totalTokens = extraction.tokensUsed;

  // Step 2: Link to curriculum using existing utility
  const linking = await linkToCurriculum({
    extractedConcepts: extraction.concepts,
    resourceTitle: videoTitle,
    resourceSummary: extraction.summary,
    supabase,
    userId,
    language,
  });

  totalTokens += linking.tokensUsed;

  // Step 3: Build concept output
  // Linked concepts come from curriculum
  const linkedConceptIds = new Set(linking.links.map((l) => l.curriculumConceptId));
  const targetPhase = await inferTargetPhase({
    linkedConceptIds: [...linkedConceptIds],
    userId,
    supabase,
  });

  const concepts: ConceptOutput['concepts'] = [];
  const resourceConcepts: ConceptOutput['resourceConcepts'] = [];

  // Add curriculum-linked concepts
  for (const link of linking.links) {
    if (!concepts.some((c) => c.id === link.curriculumConceptId)) {
      concepts.push({
        id: link.curriculumConceptId,
        name: link.curriculumConceptName,
        slug: slugify(link.curriculumConceptName),
        isNew: false,
      });
      resourceConcepts.push({
        conceptId: link.curriculumConceptId,
        isPrerequisite: false,
      });
    }
  }

  // For extracted concepts that didn't match curriculum, create new ones
  for (const extracted of extraction.concepts) {
    const isLinked = linking.links.some(
      (l) => l.extractedConceptName === extracted.name,
    );
    if (!isLinked && extracted.relevance >= 0.6) {
      const slug = slugify(extracted.name);
      const newId = `auto-${slug}`;

      // Check if concept already exists (from a previous pipeline run)
      const { data: existing } = await supabase
        .from(TABLES.concepts)
        .select('id')
        .eq('id', newId)
        .single();

      if (!existing) {
        // New concepts inherit the inferred curriculum phase when possible.
        const { error } = await supabase.from(TABLES.concepts).insert({
          id: newId,
          name: extracted.name,
          canonical_definition: extracted.description,
          phase: targetPhase,
        });

        if (error) {
          log.warn(`Failed to create concept "${newId}": ${error.message}`);
          continue;
        }
      }

      concepts.push({
        id: newId,
        name: extracted.name,
        slug,
        isNew: !existing,
      });
      resourceConcepts.push({
        conceptId: newId,
        isPrerequisite: false,
      });
    }
  }

  log.info(
    `Linked ${concepts.length} concepts (${concepts.filter((c) => !c.isNew).length} existing, ${concepts.filter((c) => c.isNew).length} new) in phase ${targetPhase} — ${totalTokens} tokens`,
  );

  return {
    output: { concepts, resourceConcepts },
    tokensUsed: totalTokens,
  };
}
