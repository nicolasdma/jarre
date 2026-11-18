import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/tables';
import { fetchPracticeDrills } from '@/lib/lessons/drills';
import { buildFeedGraph, type GraphCardRow, type GraphConceptRow, type GraphQuizRow } from '@/lib/feed/feed-graph';
import { Feed } from '@/components/feed/feed';
import { lessonVideos } from '@/lib/feed/lesson-videos';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

export const metadata: Metadata = {
  title: 'Feed — Jarre',
  description: 'Un feed con lo de la lección.',
  robots: { index: false, follow: false },
};

/**
 * Feed mode: a presentation layer over the lesson's existing content. Loads
 * the same tables as the learn page (src/app/learn/[resourceId]/page.tsx),
 * signs the drills' audio once (fetchPracticeDrills), builds the feed graph,
 * and hands it to the client scroller. No new content, no writes.
 */
export default async function FeedPage({ params }: PageProps) {
  const { resourceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/learn/${resourceId}/feed`);

  const [resourceResult, conceptsResult, sectionsResult, drills] = await Promise.all([
    supabase.from(TABLES.resources).select('*').eq('id', resourceId).single(),
    supabase
      .from(TABLES.resourceConcepts)
      .select('concept_id, is_prerequisite, concepts (id, name, canonical_definition)')
      .eq('resource_id', resourceId),
    supabase
      .from(TABLES.resourceSections)
      .select('id, concept_id, section_title, content_markdown, sort_order')
      .eq('resource_id', resourceId)
      .order('sort_order', { ascending: true }),
    fetchPracticeDrills(supabase, resourceId),
  ]);

  const resource = resourceResult.data;
  if (!resource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg">
        <p className="text-j-warm">Recurso no encontrado</p>
      </div>
    );
  }

  const taught = (conceptsResult.data || [])
    .filter((rc: { is_prerequisite: boolean }) => !rc.is_prerequisite)
    .map((rc: { concepts: { id: string; name: string; canonical_definition: string }[] | { id: string; name: string; canonical_definition: string } }) =>
      Array.isArray(rc.concepts) ? rc.concepts[0] : rc.concepts,
    )
    .filter(Boolean) as { id: string; name: string; canonical_definition: string }[];

  const sections = sectionsResult.data || [];
  const sectionByConcept = new Map<string, { markdown: string; sortOrder: number }>();
  const conceptBySection = new Map<string, string>();
  sections.forEach((s, i) => {
    if (s.concept_id) {
      sectionByConcept.set(s.concept_id, { markdown: s.content_markdown, sortOrder: s.sort_order ?? i });
      conceptBySection.set(s.id, s.concept_id);
    }
  });

  const conceptIds = taught.map((c) => c.id);
  const concepts: GraphConceptRow[] = taught.map((c, i) => ({
    id: c.id,
    name: c.name,
    definition: c.canonical_definition,
    sortOrder: sectionByConcept.get(c.id)?.sortOrder ?? i,
    sectionMarkdown: sectionByConcept.get(c.id)?.markdown ?? null,
  }));

  // Inline quizzes (tap-quiz) and recall cards (predict), both already loaded
  // by other views; here mapped to concept via the section.
  const sectionIds = sections.map((s) => s.id);
  const [quizzesRaw, cardsRaw] = await Promise.all([
    sectionIds.length
      ? supabase.from(TABLES.inlineQuizzes).select('*').in('section_id', sectionIds).eq('is_active', true).order('sort_order')
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    conceptIds.length
      ? supabase
          .from(TABLES.conceptCards)
          .select('id, concept_id, card_type, front_content, back_content, is_active')
          .in('concept_id', conceptIds)
          .eq('card_type', 'recall')
          .eq('is_active', true)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const quizzes: GraphQuizRow[] = (quizzesRaw.data || []).map((q: Record<string, unknown>) => ({
    id: String(q.id),
    conceptId: conceptBySection.get(String(q.section_id)) ?? null,
    format: (q.format === 'tf' ? 'tf' : 'mc') as 'mc' | 'tf',
    question: String(q.question_text ?? ''),
    options: Array.isArray(q.options) ? (q.options as { label: string; text: string }[]) : null,
    correctAnswer: String(q.correct_answer ?? ''),
    explanation: String(q.explanation ?? ''),
  }));

  const cards: GraphCardRow[] = (cardsRaw.data || [])
    .map((c: Record<string, unknown>) => {
      const front = (c.front_content ?? {}) as { prompt?: unknown };
      const back = (c.back_content ?? {}) as { definition?: unknown };
      const prompt = typeof front.prompt === 'string' ? front.prompt : '';
      const answer = typeof back.definition === 'string' ? back.definition : '';
      return { id: String(c.id), conceptId: String(c.concept_id), prompt, answer };
    })
    .filter((c) => c.prompt && c.answer);

  const day = new Date().toISOString().slice(0, 10);
  const graph = buildFeedGraph({
    resourceId,
    concepts,
    quizzes,
    cards,
    drills,
    interview: (resource as Record<string, unknown>).interview ?? null,
    videos: lessonVideos(resourceId, day),
  });

  if (graph.concepts.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg px-6 text-center">
        <p className="text-j-text-secondary">Esta lección todavía no tiene contenido para el feed.</p>
      </div>
    );
  }

  return <Feed graph={graph} day={day} resignAudio />;
}
