import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StudyView } from './study-view';
import { t, type Language } from '@/lib/translations';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

export default async function ResourcePage({ params }: PageProps) {
  const { resourceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/resource/${resourceId}`);
  }

  // Get user's language preference
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();

  const lang = (profile?.language || 'es') as Language;

  // Get resource
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (resourceError || !resource) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-100">
        <div className="text-center">
          <p className="mb-4 text-red-600">{t('resource.notFound', lang)}</p>
          <Link href="/library" className="text-blue-600 hover:underline">
            {t('resource.backToLibrary', lang)}
          </Link>
        </div>
      </div>
    );
  }

  // Get user's notes for this resource (including canvas data and split position)
  const { data: notesData } = await supabase
    .from('resource_notes')
    .select('canvas_data, split_position')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .single();

  const canvasData = notesData?.canvas_data ?? null;
  const splitPosition = notesData?.split_position ?? 50;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Full-screen Study View */}
      <StudyView
        resourceId={resourceId}
        resourceUrl={resource.url}
        resourceTitle={resource.title}
        startPage={resource.start_page}
        endPage={resource.end_page}
        initialCanvasData={canvasData}
        initialSplitPosition={splitPosition}
        language={lang}
      />

      {/* Minimal floating nav - top left */}
      <div className="absolute left-3 top-3 z-50 flex items-center gap-2">
        <Link
          href="/library"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
          title={t('resource.backToLibrary', lang)}
        >
          ←
        </Link>
        <span className="rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
          {resource.title}
        </span>
      </div>

      {/* Action buttons - top right */}
      <div className="absolute right-3 top-3 z-50 flex items-center gap-2">
        <Link
          href={`/learn/${resourceId}`}
          className="rounded-full bg-amber-600/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-amber-600"
          title="Explicación profunda"
        >
          💡 Aprender
        </Link>
        <Link
          href={`/learn/${resourceId}`}
          className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80"
        >
          {t('resource.evaluate', lang)}
        </Link>
      </div>
    </div>
  );
}
