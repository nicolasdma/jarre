import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { EvaluationFlow } from './evaluation-flow';

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
          <p className="text-red-600">Resource not found</p>
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
        />
      </main>
    </div>
  );
}
