import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { TABLES } from '@/lib/db/tables';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Link2 } from 'lucide-react';
import { DiscussWithTutorButton } from '@/components/resources/DiscussWithTutorButton';
import { VoiceModeLauncher } from '@/components/voice/VoiceModeLauncher';
import { ResourceActions } from './resource-actions';
import type { Language } from '@/lib/translations';

export default async function UserResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user language
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();
  const lang = (profile?.language || 'es') as Language;
  const isEs = lang === 'es';

  // Fetch resource
  const { data: resource } = await supabase
    .from(TABLES.userResources)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!resource) {
    redirect('/library');
  }

  // Handle processing status
  if (resource.status === 'processing') {
    return (
      <div className="min-h-screen bg-j-bg">
        <Header currentPage="library" />
        <main className="mx-auto max-w-4xl px-8 py-12">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm text-j-text-tertiary hover:text-j-text transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            {isEs ? 'Volver a la biblioteca' : 'Back to library'}
          </Link>

          <SectionLabel>{isEs ? 'Recurso Externo' : 'External Resource'}</SectionLabel>
          <h1 className="text-3xl font-bold text-j-text mt-2 mb-8">{resource.title}</h1>

          <div className="flex flex-col items-center justify-center py-16 border border-j-border rounded-lg">
            <div className="w-8 h-8 border-2 border-j-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-j-text-secondary">
              {isEs ? 'Analizando recurso...' : 'Analyzing resource...'}
            </p>
            <p className="text-xs text-j-text-tertiary mt-2">
              {isEs ? 'Esto puede tomar unos segundos.' : 'This may take a few seconds.'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Fetch links with concept details
  const { data: links } = await supabase
    .from(TABLES.userResourceConcepts)
    .select('id, concept_id, relationship, relevance_score, extracted_concept_name, explanation, source')
    .eq('user_resource_id', id);

  // Fetch concept names and definitions
  const conceptIds = (links || []).map((l: any) => l.concept_id);
  let conceptMap: Record<string, { name: string; definition: string }> = {};
  let progressMap: Record<string, number> = {};

  if (conceptIds.length > 0) {
    const [{ data: concepts }, { data: progress }] = await Promise.all([
      supabase.from(TABLES.concepts).select('id, name, canonical_definition').in('id', conceptIds),
      supabase.from(TABLES.conceptProgress).select('concept_id, level').eq('user_id', user.id).in('concept_id', conceptIds),
    ]);

    conceptMap = (concepts || []).reduce((acc: any, c: any) => {
      acc[c.id] = { name: c.name, definition: c.canonical_definition };
      return acc;
    }, {});

    progressMap = (progress || []).reduce((acc: any, p: any) => {
      acc[p.concept_id] = parseInt(p.level);
      return acc;
    }, {});
  }

  // Find debate-eligible concepts (mastery >= 2)
  const debateConceptIds = conceptIds.filter((cid: string) => (progressMap[cid] || 0) >= 2);
  const hasDebateEligible = debateConceptIds.length > 0;
  const debateConceptName = hasDebateEligible ? (conceptMap[debateConceptIds[0]]?.name || '') : '';

  const RELATIONSHIP_LABELS: Record<string, { es: string; en: string }> = {
    extends: { es: 'Extiende', en: 'Extends' },
    applies: { es: 'Aplica', en: 'Applies' },
    contrasts: { es: 'Contrasta', en: 'Contrasts' },
    exemplifies: { es: 'Ejemplifica', en: 'Exemplifies' },
    relates: { es: 'Relaciona', en: 'Relates' },
  };

  const MASTERY_LABELS = ['Exposed', 'Understood', 'Applied', 'Criticized', 'Taught'];
  const TYPE_ICONS: Record<string, string> = {
    youtube: '\u25B6',
    article: '\uD83D\uDCC4',
    paper: '\uD83D\uDCD1',
    book: '\uD83D\uDCD6',
    podcast: '\uD83C\uDF99',
    other: '\uD83D\uDCCC',
  };

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="library" />

      <main className="mx-auto max-w-4xl px-8 py-12">
        {/* Back link */}
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-sm text-j-text-tertiary hover:text-j-text transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          {isEs ? 'Volver a la biblioteca' : 'Back to library'}
        </Link>

        {/* Resource header */}
        <div className="mb-8">
          <SectionLabel>
            {isEs ? 'Recurso Externo' : 'External Resource'}
          </SectionLabel>

          <div className="flex items-start gap-3 mt-2">
            <span className="text-2xl">{TYPE_ICONS[resource.type] || '\uD83D\uDCCC'}</span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-j-text">{resource.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-xs text-j-text-tertiary uppercase">{resource.type}</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded ${
                  resource.status === 'completed' ? 'text-j-accent bg-j-accent/10' :
                  resource.status === 'failed' ? 'text-j-error bg-j-error/10' :
                  'text-j-text-tertiary bg-j-border/20'
                }`}>
                  {resource.status}
                </span>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-j-accent hover:underline"
                  >
                    <ExternalLink size={12} />
                    {isEs ? 'Ver original' : 'View original'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Failed status message */}
        {resource.status === 'failed' && (
          <div className="mb-8 p-6 border border-j-error/30 rounded-lg bg-j-error/5">
            <p className="text-sm text-j-error mb-3">
              {isEs
                ? 'El análisis de este recurso falló. Podés reintentar el procesamiento.'
                : 'Analysis of this resource failed. You can retry processing.'}
            </p>
            <ResourceActions resourceId={id} language={lang} showRetry />
          </div>
        )}

        {/* Summary */}
        {resource.summary && (
          <div className="mb-8 p-6 border border-j-border rounded-lg">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              {isEs ? 'Resumen' : 'Summary'}
            </p>
            <p className="text-sm text-j-text-secondary leading-relaxed">{resource.summary}</p>
          </div>
        )}

        {/* User Notes */}
        {resource.user_notes && (
          <div className="mb-8 p-6 border border-j-border rounded-lg">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
              {isEs ? 'Tus Notas' : 'Your Notes'}
            </p>
            <p className="text-sm text-j-text-secondary leading-relaxed whitespace-pre-wrap">{resource.user_notes}</p>
          </div>
        )}

        {/* Curriculum Connections */}
        {(links || []).length > 0 && (
          <div className="mb-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
              {isEs ? 'Conexiones al Currículo' : 'Curriculum Connections'}
              <span className="ml-2 text-j-accent">{(links || []).length}</span>
            </p>
            <div className="space-y-3">
              {(links || []).map((link: any) => {
                const concept = conceptMap[link.concept_id];
                const mastery = progressMap[link.concept_id] || 0;

                return (
                  <div
                    key={link.id}
                    className="flex items-start gap-4 p-4 border border-j-border rounded-lg hover:border-j-accent/30 transition-colors"
                  >
                    <Link2 size={16} className="text-j-accent mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-j-text">
                          {concept?.name || link.concept_id}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-j-accent/10 text-j-accent border border-j-accent/20">
                          {RELATIONSHIP_LABELS[link.relationship]?.[lang] || link.relationship}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-j-border/30 text-j-text-tertiary">
                          L{mastery} &middot; {MASTERY_LABELS[mastery]}
                        </span>
                      </div>
                      {concept?.definition && (
                        <p className="text-xs text-j-text-tertiary mt-1 line-clamp-2">{concept.definition}</p>
                      )}
                      {link.explanation && (
                        <p className="text-xs text-j-text-secondary mt-1">
                          <span className="text-j-text-tertiary">{link.extracted_concept_name} &rarr;</span> {link.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Voice exploration section */}
        {resource.status === 'completed' && (
          <div className="mt-8 pt-8 border-t border-j-border">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
              {isEs ? 'Exploración por Voz' : 'Voice Exploration'}
            </p>
            <div className="space-y-3">
              <DiscussWithTutorButton
                userResourceId={id}
                resourceStatus={resource.status}
                language={lang}
              />
              <VoiceModeLauncher
                language={lang}
                showFreeform
                showDebate={hasDebateEligible}
                debateConceptIds={debateConceptIds}
                debateDefaultTopic={debateConceptName}
                debateDefaultPosition={`${debateConceptName} is overengineered for most use cases`}
                variant="compact"
              />
            </div>
          </div>
        )}

        {/* Metadata + Delete */}
        <div className="mt-8 pt-4 border-t border-j-border flex items-center justify-between">
          <p className="font-mono text-[10px] text-j-text-tertiary">
            {isEs ? 'Agregado' : 'Added'}: {new Date(resource.created_at).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <ResourceActions resourceId={id} language={lang} showDelete />
        </div>
      </main>
    </div>
  );
}
