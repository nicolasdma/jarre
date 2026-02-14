import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { LanguageSelector } from '@/components/language-selector';
import { SessionCTA } from '@/components/dashboard/session-cta';
import { EngagementBar } from '@/components/dashboard/engagement-bar';
import { t, getPhaseNames, getMasteryLevels, type Language } from '@/lib/translations';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated — landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-j-bg">
        <Header currentPage="home" />

        <main className="mx-auto max-w-6xl px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-j-accent"></div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
                Deep Learning System
              </span>
            </div>

            <h2 className="text-5xl font-bold text-j-text mb-2">
              Master Complex
            </h2>
            <p className="text-3xl font-light text-j-text-tertiary">
              Technical Knowledge
            </p>
            <p className="mt-6 text-j-text-secondary max-w-xl leading-relaxed">
              Not flashcards. Not memorization. AI-powered validation of real understanding
              through deep evaluations, spaced repetition, and project-based mastery.
            </p>
            <div className="flex gap-4 mt-8">
              <Link
                href="/library"
                className="font-mono text-[11px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-3 uppercase hover:bg-j-accent-hover transition-colors"
              >
                Start Learning
              </Link>
              <Link
                href="/login"
                className="font-mono text-[11px] tracking-[0.15em] border border-j-border-input text-j-text px-6 py-3 uppercase hover:border-j-accent transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Mastery Levels Explanation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
            {getMasteryLevels('en').map((item) => {
              const descriptions: Record<string, string> = {
                '0': 'Read/watched',
                '1': 'Can explain',
                '2': 'Used in project',
                '3': 'Know when NOT to use',
                '4': 'Can teach others',
              };
              return (
                <div key={item.level} className="border border-j-border p-4">
                  <p className="text-2xl font-light text-j-text mb-1">{item.level}</p>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase mb-1">{item.name}</p>
                  <p className="text-xs text-j-text-tertiary">{descriptions[item.level]}</p>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="border-t border-j-border py-8 mt-8">
          <div className="mx-auto max-w-6xl px-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
              Jarre · Deep Knowledge · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated — dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase row type is dynamic
  let profile: Record<string, any> | null = null;
  let progressCounts: { level: string }[] | null = null;
  let totalConcepts: number | null = 0;
  let evaluationCount: number | null = 0;
  let dashboardError = false;

  try {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;

    const { data: progressData } = await supabase
      .from('concept_progress')
      .select('level')
      .eq('user_id', user.id);
    progressCounts = progressData;

    const { count: conceptCount } = await supabase
      .from('concepts')
      .select('*', { count: 'exact', head: true });
    totalConcepts = conceptCount;

    const { count: evalCount } = await supabase
      .from('evaluations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    evaluationCount = evalCount;
  } catch {
    dashboardError = true;
  }

  const lang = (profile?.language || 'es') as Language;
  const phaseNames = getPhaseNames(lang);
  const masteryLevels = getMasteryLevels(lang);

  const levelCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };
  progressCounts?.forEach((p) => {
    levelCounts[p.level as keyof typeof levelCounts]++;
  });

  const currentPhase = profile?.current_phase || '1';
  const conceptsStarted = Object.values(levelCounts).reduce((a, b) => a + b, 0);

  // Engagement data
  const isToday = profile?.daily_xp_date === new Date().toISOString().slice(0, 10);
  const dailyXp = isToday ? (profile?.daily_xp_earned ?? 0) : 0;
  const dailyTarget = profile?.daily_xp_target ?? 50;
  const streakDays = profile?.streak_days ?? 0;
  const totalXp = profile?.total_xp ?? 0;
  const xpLevel = profile?.xp_level ?? 1;
  const longestStreak = profile?.longest_streak ?? 0;
  const lastActive = profile?.last_active_at ? new Date(profile.last_active_at) : null;
  const streakAlive = lastActive
    ? (Date.now() - lastActive.getTime()) < 2 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="home" />

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Engagement bar */}
        <EngagementBar
          streakDays={streakDays}
          streakAlive={streakAlive}
          longestStreak={longestStreak}
          totalXp={totalXp}
          xpLevel={xpLevel}
          dailyXp={dailyXp}
          dailyTarget={dailyTarget}
        />

        {dashboardError && (
          <div className="bg-yellow-50 border border-yellow-300 p-4 mb-8">
            <p className="text-sm text-yellow-800">
              {lang === 'es'
                ? 'No pudimos cargar todos los datos. Algunos valores pueden estar incompletos.'
                : 'We could not load all data. Some values may be incomplete.'}
            </p>
            <div className="flex gap-4 mt-2">
              <Link href="/" className="font-mono text-[10px] tracking-[0.15em] text-yellow-800 underline uppercase">
                {lang === 'es' ? 'Reintentar' : 'Retry'}
              </Link>
              <Link href="/library" className="font-mono text-[10px] tracking-[0.15em] text-yellow-800 underline uppercase">
                {lang === 'es' ? 'Ir a Biblioteca' : 'Go to Library'}
              </Link>
            </div>
          </div>
        )}

        {/* Session CTA */}
        <div className="mb-12">
          <SessionCTA userId={user.id} language={lang} />
        </div>

        {/* Hero — personalized */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-j-accent"></div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              {lang === 'es' ? 'Sistema de Aprendizaje Profundo' : 'Deep Learning System'}
            </span>
          </div>

          <h2 className="text-4xl font-bold text-j-text mb-1">
            {t('dashboard.welcome', lang)},
          </h2>
          <p className="text-2xl font-light text-j-text-tertiary">
            {profile?.display_name || user.email}
          </p>

          <p className="mt-4 text-j-text-secondary max-w-xl leading-relaxed">
            {t('dashboard.currentPhase', lang)}: <strong className="text-j-text">{phaseNames[currentPhase]}</strong>
          </p>

          <div className="flex gap-4 mt-6">
            <Link
              href="/library"
              className="font-mono text-[11px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-3 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {t('dashboard.browseLibrary', lang)}
            </Link>
            <Link
              href="/mi-sistema"
              className="font-mono text-[11px] tracking-[0.15em] border border-j-border-input text-j-text px-6 py-3 uppercase hover:border-j-accent transition-colors"
            >
              {lang === 'es' ? 'Ver mi sistema' : 'View my system'}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <p className="text-4xl font-light text-j-text">{totalConcepts || 0}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('dashboard.totalConcepts', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-j-accent">{conceptsStarted}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('dashboard.conceptsStarted', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-j-accent">{evaluationCount || 0}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('dashboard.evaluations', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-j-warm-dark">{streakDays} {t('dashboard.days', lang)}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mt-2">
              {t('dashboard.streak', lang)}
            </p>
          </div>
        </div>

        {/* Mastery Levels */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              {t('dashboard.masteryProgress', lang)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
            {masteryLevels.map((item) => (
              <div key={item.level} className="border border-j-border p-4">
                <p className="text-2xl font-light text-j-text mb-1">
                  {levelCounts[item.level as keyof typeof levelCounts]}
                </p>
                <p className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase mb-1">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-j-border pt-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
            {t('dashboard.settings', lang)}
          </p>
          <LanguageSelector currentLanguage={lang} />
        </div>
      </main>

      <footer className="border-t border-j-border py-8 mt-8">
        <div className="mx-auto max-w-6xl px-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
            Jarre · {lang === 'es' ? 'Conocimiento Profundo' : 'Deep Knowledge'} · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
