import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { ForceGraphVisualization } from '@/components/system-viz/force-graph-visualization';
import { redirect } from 'next/navigation';
import type { Language } from '@/lib/translations';
import type { ConceptInput, ResourceInput, ResourceConceptLinkInput } from '@/components/system-viz/graph-types';

export const metadata: Metadata = {
  title: 'Mi Sistema — Jarre',
  description: 'Visualize your knowledge system and concept connections',
};

export default async function MiSistemaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Parallel queries: concepts + user resources
  const [profileRes, conceptsRes, prereqsRes, progressRes, resourcesRes, resourceLinksRes] =
    await Promise.all([
      supabase.from('user_profiles').select('language').eq('id', user.id).single(),
      supabase.from('concepts').select('id, name, phase, canonical_definition').order('phase'),
      supabase.from('concept_prerequisites').select('concept_id, prerequisite_id'),
      supabase.from('concept_progress').select('concept_id, level').eq('user_id', user.id),
      supabase
        .from('user_resources')
        .select('id, title, type, url')
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('user_resource_concepts')
        .select('user_resource_id, concept_id, relevance_score, relationship')
        .eq('source', 'ingestion'),
    ]);

  const lang = (profileRes.data?.language || 'es') as Language;

  // Build prerequisite map
  const prereqMap = new Map<string, string[]>();
  for (const row of prereqsRes.data ?? []) {
    const existing = prereqMap.get(row.concept_id) ?? [];
    existing.push(row.prerequisite_id);
    prereqMap.set(row.concept_id, existing);
  }

  // Build mastery map (column is 'level', stored as string enum '0'-'4')
  const masteryMap = new Map<string, number>();
  for (const row of progressRes.data ?? []) {
    masteryMap.set(row.concept_id, parseInt(row.level, 10) || 0);
  }

  // Build concept nodes
  const concepts: ConceptInput[] = (conceptsRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phase: typeof c.phase === 'string' ? parseInt(c.phase, 10) : c.phase,
    masteryLevel: masteryMap.get(c.id) ?? 0,
    prerequisites: prereqMap.get(c.id) ?? [],
  }));

  // Build definitions map
  const definitions: Record<string, string> = {};
  for (const c of conceptsRes.data ?? []) {
    definitions[c.id] = c.canonical_definition;
  }

  // Build resource data
  const resources: ResourceInput[] = (resourcesRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    url: r.url,
  }));

  const resourceLinks: ResourceConceptLinkInput[] = (resourceLinksRes.data ?? []).map((rl) => ({
    userResourceId: rl.user_resource_id,
    conceptId: rl.concept_id,
    relevanceScore: rl.relevance_score ?? 0.5,
    relationship: rl.relationship ?? 'relates',
  }));

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="mi-sistema" />

      <main className="mx-auto max-w-7xl px-8 py-12 j-grid-bg">
        <SectionLabel className="mb-8">
          {lang === 'es' ? 'Tu Sistema Distribuido' : 'Your Distributed System'}
        </SectionLabel>

        <h2 className="text-3xl font-bold text-j-text mb-2">
          {lang === 'es' ? 'Mi Sistema' : 'My System'}
        </h2>
        <p className="text-j-text-secondary mb-8 max-w-xl">
          {lang === 'es'
            ? 'Cada concepto que dominas hace crecer tu sistema. Los nodos fantasma se materializan conforme avanzas.'
            : 'Each concept you master grows your system. Ghost nodes materialize as you progress.'}
        </p>

        <ForceGraphVisualization
          concepts={concepts}
          definitions={definitions}
          resources={resources}
          resourceLinks={resourceLinks}
          language={lang}
        />
      </main>
    </div>
  );
}
