import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { EvaluationFlow } from './evaluation-flow';
import { type Language } from '@/lib/translations';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

export default async function EvaluatePage({ params }: PageProps) {
  const { resourceId } = await params;
  const supabase = await createClient();

  // Check auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/evaluate/${resourceId}`);
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
    .select(`
      *,
      resource_concepts (
        concept_id,
        is_prerequisite,
        concepts (
          id,
          name,
          canonical_definition
        )
      )
    `)
    .eq('id', resourceId)
    .single();

  if (resourceError || !resource) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-red-600">
            {lang === 'es' ? 'Recurso no encontrado' : 'Resource not found'}
          </p>
        </main>
      </div>
    );
  }

  // Extract concepts this resource teaches (not prerequisites)
  const conceptsTaught = resource.resource_concepts
    .filter((rc: { is_prerequisite: boolean }) => !rc.is_prerequisite)
    .map((rc: { concepts: { id: string; name: string; canonical_definition: string } }) => rc.concepts);

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <EvaluationFlow
          resource={{
            id: resource.id,
            title: resource.title,
            type: resource.type,
          }}
          concepts={conceptsTaught}
          userId={user.id}
          language={lang}
        />
      </main>
    </div>
  );
}
