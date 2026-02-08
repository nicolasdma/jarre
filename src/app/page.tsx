import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { LanguageSelector } from '@/components/language-selector';
import { t, getPhaseNames, getMasteryLevels, type Language } from '@/lib/translations';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated — landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6]">
        <Header currentPage="home" />

        <main className="mx-auto max-w-6xl px-8 py-16">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-px bg-[#4a5d4a]"></div>
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
                Deep Learning System
              </span>
            </div>

            <h2 className="text-5xl font-bold text-[#2c2c2c] mb-2">
              Master Complex
            </h2>
            <p className="text-3xl font-light text-[#9c9a8e]">
              Technical Knowledge
            </p>
            <p className="mt-6 text-[#7a7a6e] max-w-xl leading-relaxed">
              Not flashcards. Not memorization. AI-powered validation of real understanding
              through deep evaluations, spaced repetition, and project-based mastery.
            </p>
            <div className="flex gap-4 mt-8">
              <Link
                href="/library"
                className="font-mono text-[11px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-3 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                Start Learning
              </Link>
              <Link
                href="/login"
                className="font-mono text-[11px] tracking-[0.15em] border border-[#d4d0c8] text-[#2c2c2c] px-6 py-3 uppercase hover:border-[#4a5d4a] transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Mastery Levels Explanation */}
          <div className="grid grid-cols-5 gap-4 text-center">
            {[
              { level: 0, name: 'Exposed', desc: 'Read/watched' },
              { level: 1, name: 'Understood', desc: 'Can explain' },
              { level: 2, name: 'Applied', desc: 'Used in project' },
              { level: 3, name: 'Criticized', desc: 'Know when NOT to use' },
              { level: 4, name: 'Taught', desc: 'Can teach others' },
            ].map((item) => (
              <div key={item.level} className="border border-[#e8e6e0] p-4">
                <p className="text-2xl font-light text-[#2c2c2c] mb-1">{item.level}</p>
                <p className="font-mono text-[10px] tracking-[0.15em] text-[#4a5d4a] uppercase mb-1">{item.name}</p>
                <p className="text-xs text-[#9c9a8e]">{item.desc}</p>
              </div>
            ))}
          </div>
        </main>

        <footer className="border-t border-[#e8e6e0] py-8 mt-8">
          <div className="mx-auto max-w-6xl px-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase text-center">
              Jarre · Deep Knowledge · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated — dashboard
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const lang = (profile?.language || 'es') as Language;
  const phaseNames = getPhaseNames(lang);
  const masteryLevels = getMasteryLevels(lang);

  const { data: progressCounts } = await supabase
    .from('concept_progress')
    .select('level')
    .eq('user_id', user.id);

  const levelCounts = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 };
  progressCounts?.forEach((p) => {
    levelCounts[p.level as keyof typeof levelCounts]++;
  });

  const { count: totalConcepts } = await supabase
    .from('concepts')
    .select('*', { count: 'exact', head: true });

  const { count: evaluationCount } = await supabase
    .from('evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: reviewDueCount } = await supabase
    .from('review_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', new Date().toISOString());

  const currentPhase = profile?.current_phase || '1';
  const conceptsStarted = Object.values(levelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <Header currentPage="home" />

      <main className="mx-auto max-w-6xl px-8 py-12">
        {/* Hero — same as landing but personalized */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-[#4a5d4a]"></div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
              {lang === 'es' ? 'Sistema de Aprendizaje Profundo' : 'Deep Learning System'}
            </span>
          </div>

          <h2 className="text-5xl font-bold text-[#2c2c2c] mb-2">
            {t('dashboard.welcome', lang)},
          </h2>
          <p className="text-3xl font-light text-[#9c9a8e]">
            {profile?.display_name || user.email}
          </p>

          <p className="mt-6 text-[#7a7a6e] max-w-xl leading-relaxed">
            {t('dashboard.currentPhase', lang)}: <strong className="text-[#2c2c2c]">{phaseNames[currentPhase]}</strong>
          </p>

          <div className="flex gap-4 mt-8">
            <Link
              href="/library"
              className="font-mono text-[11px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-3 uppercase hover:bg-[#3d4d3d] transition-colors"
            >
              {t('dashboard.browseLibrary', lang)}
            </Link>
            <Link
              href={`/library?phase=${currentPhase}`}
              className="font-mono text-[11px] tracking-[0.15em] border border-[#d4d0c8] text-[#2c2c2c] px-6 py-3 uppercase hover:border-[#4a5d4a] transition-colors"
            >
              {t('dashboard.continuePhase', lang)} {currentPhase}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <p className="text-4xl font-light text-[#2c2c2c]">{totalConcepts || 0}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('dashboard.totalConcepts', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-[#4a5d4a]">{conceptsStarted}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('dashboard.conceptsStarted', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-[#4a5d4a]">{evaluationCount || 0}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('dashboard.evaluations', lang)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-light text-[#8b7355]">{profile?.streak_days || 0} {t('dashboard.days', lang)}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mt-2">
              {t('dashboard.streak', lang)}
            </p>
          </div>
        </div>

        {/* Mastery Levels */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
              {t('dashboard.masteryProgress', lang)}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-4 text-center">
            {masteryLevels.map((item) => (
              <div key={item.level} className="border border-[#e8e6e0] p-4">
                <p className="text-2xl font-light text-[#2c2c2c] mb-1">
                  {levelCounts[item.level as keyof typeof levelCounts]}
                </p>
                <p className="font-mono text-[10px] tracking-[0.15em] text-[#4a5d4a] uppercase mb-1">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Review Pending */}
        {(reviewDueCount || 0) > 0 && (
          <div className="mb-12 p-6 border border-[#4a5d4a] bg-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-3xl font-light text-[#4a5d4a]">{reviewDueCount}</p>
                <p className="text-sm text-[#7a7a6e]">{t('review.pendingCards', lang)}</p>
              </div>
              <Link
                href="/review"
                className="font-mono text-[11px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors"
              >
                {t('dashboard.startReview', lang)}
              </Link>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="border-t border-[#e8e6e0] pt-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
            {t('dashboard.settings', lang)}
          </p>
          <LanguageSelector currentLanguage={lang} />
        </div>
      </main>

      <footer className="border-t border-[#e8e6e0] py-8 mt-8">
        <div className="mx-auto max-w-6xl px-8">
          <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase text-center">
            Jarre · {lang === 'es' ? 'Conocimiento Profundo' : 'Deep Knowledge'} · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
