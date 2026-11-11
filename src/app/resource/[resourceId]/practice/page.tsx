import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/tables';
import { fetchPracticeDrills } from '@/lib/lessons/drills';
import { PracticeView } from '@/components/practice/practice-view';
import { isPracticeMode } from '@/components/practice/types';

export const metadata: Metadata = {
  title: 'Práctica — Jarre',
  description: 'Listen, copy, dictation, repeat and shadowing drills',
};

interface PageProps {
  params: Promise<{ resourceId: string }>;
  searchParams: Promise<{ drill?: string; mode?: string; embed?: string }>;
}

export default async function PracticePage({ params, searchParams }: PageProps) {
  const { resourceId } = await params;
  const { drill, mode, embed } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/resource/${resourceId}/practice`);
  }

  // `*` and not a column list: `interview` only exists once
  // supabase/migrations/20261111020000_resource_interview.sql is applied, and
  // without it the interview mock runs on the default personas.
  const [{ data: resource }, drills, { data: sections }] = await Promise.all([
    supabase.from(TABLES.resources).select('*').eq('id', resourceId).single(),
    fetchPracticeDrills(supabase, resourceId),
    supabase
      .from(TABLES.resourceSections)
      .select('section_title, content_markdown')
      .eq('resource_id', resourceId)
      .order('sort_order', { ascending: true }),
  ]);

  if (!resource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg">
        <p className="text-j-warm">Recurso no encontrado</p>
      </div>
    );
  }

  return (
    <PracticeView
      resourceId={resourceId}
      resourceTitle={resource.title}
      drills={drills}
      lessonSections={(sections ?? []).map((s: { section_title: string; content_markdown: string }) => ({
        title: s.section_title,
        content: s.content_markdown,
      }))}
      interviewConfig={(resource as Record<string, unknown>).interview ?? null}
      initialSlug={drill}
      initialMode={isPracticeMode(mode) ? mode : 'listen'}
      embed={embed === '1'}
    />
  );
}
