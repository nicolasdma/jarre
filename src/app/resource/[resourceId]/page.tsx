import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { NotesEditor } from './notes-editor';
import { EvaluationHistory } from './evaluation-history';
import { t, type Language } from '@/lib/translations';
import type { NoteSection } from '@/types/notes';

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

  // Get resource with concepts
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select(
      `
      *,
      resource_concepts(
        concept:concepts(id, name)
      )
    `
    )
    .eq('id', resourceId)
    .single();

  if (resourceError || !resource) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <p className="mb-4 text-red-600">{t('resource.notFound', lang)}</p>
          <Link href="/library" className="text-blue-600 hover:underline">
            {t('resource.backToLibrary', lang)}
          </Link>
        </main>
      </div>
    );
  }

  // Get user's notes for this resource
  const { data: notesData } = await supabase
    .from('resource_notes')
    .select('sections')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .single();

  const sections = (notesData?.sections as NoteSection[]) || [];

  // Extract concepts taught by this resource
  const conceptsTaught = resource.resource_concepts
    ?.filter((rc: { concept: { id: string; name: string } | null }) => rc.concept)
    .map((rc: { concept: { id: string; name: string } }) => rc.concept) || [];

  return (
    <div className="min-h-screen bg-stone-50">
      <Header currentPage="library" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Resource Header */}
        <div className="mb-8 rounded-lg border border-stone-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{resource.title}</h1>
              <p className="mt-1 text-sm text-stone-500">
                <span className="capitalize">{resource.type}</span>
                {resource.author && <span> · {resource.author}</span>}
                {resource.estimated_hours && (
                  <span>
                    {' '}
                    · {resource.estimated_hours} {t('resource.hours', lang)}
                  </span>
                )}
                <span>
                  {' '}
                  · {t('resource.phase', lang)} {resource.phase}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  {t('resource.openResource', lang)} →
                </a>
              )}
              <Link
                href={`/evaluate/${resourceId}`}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                {t('resource.evaluate', lang)} →
              </Link>
            </div>
          </div>

          {resource.description && (
            <p className="mb-4 text-stone-600">{resource.description}</p>
          )}

          {conceptsTaught.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">
                {t('resource.concepts', lang)}:
              </p>
              <div className="flex flex-wrap gap-2">
                {conceptsTaught.map((concept: { id: string; name: string }) => (
                  <span
                    key={concept.id}
                    className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600"
                  >
                    {concept.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Evaluation History */}
        <EvaluationHistory
          resourceId={resourceId}
          language={lang}
        />

        {/* Notes Editor */}
        <NotesEditor
          resourceId={resourceId}
          initialSections={sections}
          language={lang}
        />
      </main>
    </div>
  );
}
