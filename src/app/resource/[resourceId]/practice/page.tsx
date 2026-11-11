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

  const [{ data: resource }, drills] = await Promise.all([
    supabase.from(TABLES.resources).select('id, title').eq('id', resourceId).single(),
    fetchPracticeDrills(supabase, resourceId),
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
      initialSlug={drill}
      initialMode={isPracticeMode(mode) ? mode : 'listen'}
      embed={embed === '1'}
    />
  );
}
