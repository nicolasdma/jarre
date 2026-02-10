import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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
      <div className="min-h-screen bg-j-bg">
        <div className="sticky top-0 z-50 border-b border-j-border bg-j-bg/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <Link href="/library" className="text-sm text-j-text-tertiary hover:text-j-text">
              ← {lang === 'es' ? 'Volver a la Biblioteca' : 'Back to Library'}
            </Link>
          </div>
        </div>
        <main className="mx-auto max-w-3xl px-8 py-16">
          <p className="text-j-error">
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
    <div className="min-h-screen bg-j-bg">
      {/* Top bar — matches learn flow */}
      <div className="sticky top-0 z-50 border-b border-j-border bg-j-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
          <Link href={`/learn/${resourceId}`} className="text-sm text-j-text-tertiary hover:text-j-text">
            ← {lang === 'es' ? 'Volver al capítulo' : 'Back to chapter'}
          </Link>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-j-text-tertiary truncate max-w-[300px]">
              {resource.title}
            </span>
            <span className="text-j-border">·</span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              {lang === 'es' ? 'Evaluar' : 'Evaluate'}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-8 py-16">
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
