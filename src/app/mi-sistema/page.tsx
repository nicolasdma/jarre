import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { SystemVisualization } from '@/components/system-viz/system-visualization';
import { redirect } from 'next/navigation';
import type { Language } from '@/lib/translations';
import type { ConceptNode } from '@/components/system-viz/layout-engine';

export default async function MiSistemaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Parallel queries
  const [profileRes, conceptsRes, prereqsRes, progressRes] = await Promise.all([
    supabase.from('user_profiles').select('language').eq('id', user.id).single(),
    supabase.from('concepts').select('id, name, phase, canonical_definition').order('phase'),
    supabase.from('concept_prerequisites').select('concept_id, prerequisite_id'),
    supabase.from('concept_progress').select('concept_id, level').eq('user_id', user.id),
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

  // Build concept nodes for visualization
  // phase comes as string enum from Supabase, coerce to number
  const concepts: ConceptNode[] = (conceptsRes.data ?? []).map((c) => ({
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

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="mi-sistema" />

      <main className="mx-auto max-w-7xl px-8 py-12">
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

        <SystemVisualization
          concepts={concepts}
          definitions={definitions}
          language={lang}
        />
      </main>
    </div>
  );
}
