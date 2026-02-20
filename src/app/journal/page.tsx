import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { TABLES } from '@/lib/db/tables';
import Link from 'next/link';
import type { Language } from '@/lib/translations';
import { InsightBar } from '@/components/insights/InsightBar';

export default async function JournalPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();
  const lang = (profile?.language || 'es') as Language;
  const isEs = lang === 'es';

  // Fetch consumption log entries (last 50)
  const { data: entries } = await supabase
    .from(TABLES.consumptionLog)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch resource names for entries that reference resources
  const resourceIds = (entries || [])
    .filter((e: any) => e.resource_id)
    .map((e: any) => e.resource_id);
  const userResourceIds = (entries || [])
    .filter((e: any) => e.user_resource_id)
    .map((e: any) => e.user_resource_id);

  let resourceNames: Record<string, string> = {};
  let userResourceNames: Record<string, { title: string; type: string }> = {};

  if (resourceIds.length > 0) {
    const { data: resources } = await supabase
      .from(TABLES.resources)
      .select('id, title')
      .in('id', resourceIds);
    resourceNames = (resources || []).reduce((acc: any, r: any) => {
      acc[r.id] = r.title;
      return acc;
    }, {});
  }

  if (userResourceIds.length > 0) {
    const { data: userResources } = await supabase
      .from(TABLES.userResources)
      .select('id, title, type')
      .in('id', userResourceIds);
    userResourceNames = (userResources || []).reduce((acc: any, r: any) => {
      acc[r.id] = { title: r.title, type: r.type };
      return acc;
    }, {});
  }

  const EVENT_ICONS: Record<string, string> = {
    started: '\uD83D\uDCD6',
    completed: '\u2705',
    evaluated: '\uD83D\uDCDD',
    discussed: '\uD83C\uDF99',
    added: '\u2795',
    reviewed: '\uD83D\uDD04',
  };

  const EVENT_LABELS: Record<string, { es: string; en: string }> = {
    started: { es: 'Empezado', en: 'Started' },
    completed: { es: 'Completado', en: 'Completed' },
    evaluated: { es: 'Evaluado', en: 'Evaluated' },
    discussed: { es: 'Discutido', en: 'Discussed' },
    added: { es: 'Agregado', en: 'Added' },
    reviewed: { es: 'Revisado', en: 'Reviewed' },
  };

  // Group entries by date
  const byDate: Record<string, any[]> = {};
  for (const entry of (entries || [])) {
    const date = new Date(entry.created_at).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(entry);
  }

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="journal" />

      <main className="mx-auto max-w-3xl px-8 py-12">
        <SectionLabel>
          {isEs ? 'Bit\u00E1cora de Aprendizaje' : 'Learning Journal'}
        </SectionLabel>

        <h1 className="text-5xl font-extrabold tracking-tight text-j-text mb-2 font-[family-name:var(--j-font-display)]">
          {isEs ? 'Bit\u00E1cora' : 'Journal'}
        </h1>
        <p className="text-j-text-secondary mb-10">
          {isEs
            ? 'Timeline de tu actividad de aprendizaje.'
            : 'Timeline of your learning activity.'}
        </p>

        <InsightBar language={lang} />

        {Object.keys(byDate).length === 0 ? (
          <p className="text-sm text-j-text-tertiary italic">
            {isEs ? 'No hay actividad registrada todav\u00EDa.' : 'No activity recorded yet.'}
          </p>
        ) : (
          <div className="space-y-8">
            {Object.entries(byDate).map(([date, dayEntries]) => (
              <div key={date}>
                <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4 sticky top-0 bg-j-bg py-2">
                  {date}
                </p>
                <div className="space-y-2 border-l-2 border-j-border pl-6 ml-2">
                  {dayEntries.map((entry: any) => {
                    const icon = EVENT_ICONS[entry.event_type] || '\uD83D\uDCCC';
                    const label = EVENT_LABELS[entry.event_type]?.[lang] || entry.event_type;
                    const resourceTitle = entry.resource_id
                      ? resourceNames[entry.resource_id]
                      : entry.user_resource_id
                        ? userResourceNames[entry.user_resource_id]?.title
                        : null;
                    const isExternal = !!entry.user_resource_id;
                    const time = new Date(entry.created_at).toLocaleTimeString(lang === 'es' ? 'es-AR' : 'en-US', {
                      hour: '2-digit', minute: '2-digit',
                    });

                    return (
                      <div
                        key={entry.id}
                        className="relative flex items-start gap-3 p-3 rounded hover:bg-j-accent/5 transition-colors"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full bg-j-border border-2 border-j-bg" />

                        <span className="text-lg shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-j-text">{label}</span>
                            {isExternal && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-j-accent/10 text-j-accent">
                                {isEs ? 'externo' : 'external'}
                              </span>
                            )}
                            <span className="text-xs text-j-text-tertiary ml-auto">{time}</span>
                          </div>
                          {resourceTitle && (
                            <p className="text-sm text-j-text-secondary mt-0.5">
                              {isExternal && entry.user_resource_id ? (
                                <Link
                                  href={`/resources/${entry.user_resource_id}`}
                                  className="hover:text-j-accent transition-colors"
                                >
                                  {resourceTitle}
                                </Link>
                              ) : (
                                resourceTitle
                              )}
                            </p>
                          )}
                          {entry.notes && (
                            <p className="text-xs text-j-text-tertiary mt-1">{entry.notes}</p>
                          )}
                          {entry.metadata?.score != null && (
                            <p className="text-xs text-j-accent mt-1">
                              Score: {entry.metadata.score}%
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
