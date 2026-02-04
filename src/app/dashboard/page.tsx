import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/logout-button';

// Phase names
const phaseNames: Record<string, string> = {
  '1': 'Distributed Systems',
  '2': 'LLMs + Reasoning',
  '3': 'RAG + Memory',
  '4': 'Safety + Guardrails',
  '5': 'Inference + Economics',
  '6': 'Frameworks',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get concept progress counts by level
  const { data: progressCounts } = await supabase
    .from('concept_progress')
    .select('level')
    .eq('user_id', user.id);

  const levelCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };
  progressCounts?.forEach((p) => {
    levelCounts[p.level as keyof typeof levelCounts]++;
  });

  // Get total concepts
  const { count: totalConcepts } = await supabase
    .from('concepts')
    .select('*', { count: 'exact', head: true });

  // Get evaluation count
  const { count: evaluationCount } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const currentPhase = profile?.current_phase || '1';

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-stone-900">
              Jarre
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/library" className="text-sm text-stone-600 hover:text-stone-900">
                Library
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-stone-900">
                Dashboard
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">
            Welcome, {profile?.display_name || user.email}
          </h1>
          <p className="mt-2 text-stone-600">
            Current phase: <strong>{phaseNames[currentPhase]}</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{totalConcepts || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concepts Started</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {Object.values(levelCounts).reduce((a, b) => a + b, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{evaluationCount || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Streak</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{profile?.streak_days || 0} days</p>
            </CardContent>
          </Card>
        </div>

        {/* Mastery Levels */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Mastery Progress</CardTitle>
            <CardDescription>Your concept mastery distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {[
                { level: '0', name: 'Exposed', color: 'bg-stone-200' },
                { level: '1', name: 'Understood', color: 'bg-amber-200' },
                { level: '2', name: 'Applied', color: 'bg-blue-200' },
                { level: '3', name: 'Criticized', color: 'bg-green-200' },
                { level: '4', name: 'Taught', color: 'bg-purple-200' },
              ].map((item) => (
                <div key={item.level} className="text-center">
                  <div
                    className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full ${item.color}`}
                  >
                    <span className="text-2xl font-bold text-stone-900">
                      {levelCounts[item.level as keyof typeof levelCounts]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-stone-900">{item.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link
                href="/library"
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                Browse Library
              </Link>
              <Link
                href={`/library?phase=${currentPhase}`}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                Continue Phase {currentPhase}
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
