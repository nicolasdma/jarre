import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoutButton } from '@/components/logout-button';
import { LanguageSelector } from '@/components/language-selector';
import { t, getPhaseNames, getMasteryLevels, type Language } from '@/lib/translations';

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

  const lang = (profile?.language || 'es') as Language;
  const phaseNames = getPhaseNames(lang);
  const masteryLevels = getMasteryLevels(lang);

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
                {t('nav.library', lang)}
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-stone-900">
                {t('nav.dashboard', lang)}
              </Link>
              <LogoutButton label={t('nav.logout', lang)} />
            </nav>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">
            {t('dashboard.welcome', lang)}, {profile?.display_name || user.email}
          </h1>
          <p className="mt-2 text-stone-600">
            {t('dashboard.currentPhase', lang)}: <strong>{phaseNames[currentPhase]}</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.totalConcepts', lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{totalConcepts || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.conceptsStarted', lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {Object.values(levelCounts).reduce((a, b) => a + b, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.evaluations', lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{evaluationCount || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('dashboard.streak', lang)}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">
                {profile?.streak_days || 0} {t('dashboard.days', lang)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mastery Levels */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('dashboard.masteryProgress', lang)}</CardTitle>
            <CardDescription>{t('dashboard.masteryDescription', lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {masteryLevels.map((item) => (
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions', lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link
                href="/library"
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-50"
              >
                {t('dashboard.browseLibrary', lang)}
              </Link>
              <Link
                href={`/library?phase=${currentPhase}`}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                {t('dashboard.continuePhase', lang)} {currentPhase}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.settings', lang)}</CardTitle>
            <CardDescription>{t('dashboard.settingsDescription', lang)}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector currentLanguage={lang} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
