import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { TABLES } from '@/lib/db/tables';

export const metadata: Metadata = {
  title: 'Profile — Jarre',
  description: 'View your learning profile and token usage statistics',
};

const CATEGORY_LABELS: Record<string, string> = {
  evaluation: 'Evaluaciones',
  evaluation_generate: 'Generación de preguntas',
  voice_score: 'Voice eval scoring',
  voice_teach_score: 'Voice teach scoring',
  voice_practice_score: 'Voice practice scoring',
  review: 'Review (micro-tests)',
  quiz: 'Quiz justificaciones',
  notes_polish: 'Polish de notas',
  voice_memory: 'Voice memory',
  self_explanation: 'Self-explanation',
};

function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch token usage
  const { data: rows } = await supabase
    .from(TABLES.tokenUsage)
    .select('category, tokens, created_at')
    .eq('user_id', user.id);

  const usage = rows || [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let total = 0;
  let last30Days = 0;
  const byCategory: Record<string, number> = {};

  for (const row of usage) {
    total += row.tokens;
    byCategory[row.category] = (byCategory[row.category] || 0) + row.tokens;
    if (new Date(row.created_at) >= thirtyDaysAgo) {
      last30Days += row.tokens;
    }
  }

  // Sort categories by usage (descending)
  const sortedCategories = Object.entries(byCategory).sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Perfil</h1>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Token Usage (DeepSeek)
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">{formatNumber(total)}</div>
              <div className="text-sm text-muted-foreground">Tokens totales</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-2xl font-bold">{formatNumber(last30Days)}</div>
              <div className="text-sm text-muted-foreground">Últimos 30 días</div>
            </div>
          </div>

          {sortedCategories.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium">Categoría</th>
                    <th className="text-right px-4 py-2 font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map(([category, tokens]) => (
                    <tr key={category} className="border-b last:border-b-0">
                      <td className="px-4 py-2">
                        {CATEGORY_LABELS[category] || category}
                      </td>
                      <td className="text-right px-4 py-2 tabular-nums">
                        {formatNumber(tokens)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay datos de consumo de tokens aún.
            </p>
          )}
        </section>

        <section className="text-sm text-muted-foreground">
          <p>{user.email}</p>
          <p className="mt-1">ID: {user.id.slice(0, 8)}...</p>
        </section>
      </main>
    </div>
  );
}
