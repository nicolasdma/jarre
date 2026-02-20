import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNav } from '@/components/mobile-nav';
import { REVIEW_SESSION_CAP, todayStart } from '@/lib/review-scoring';
import { t, type Language } from '@/lib/translations';

interface HeaderProps {
  currentPage?: 'home' | 'library' | 'review' | 'mi-sistema' | 'journal';
}

export async function Header({ currentPage }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lang: Language = 'es';
  let dueCount = 0;
  let streakDays = 0;
  let totalXp = 0;
  let xpLevel = 1;

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language, streak_days, total_xp, xp_level')
      .eq('id', user.id)
      .single();
    lang = (profile?.language || 'es') as Language;
    streakDays = profile?.streak_days ?? 0;
    totalXp = profile?.total_xp ?? 0;
    xpLevel = profile?.xp_level ?? 1;

    // Count cards reviewed today
    const { count: reviewedToday } = await supabase
      .from('review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('last_reviewed_at', todayStart());

    const dailyRemaining = Math.max(0, REVIEW_SESSION_CAP - (reviewedToday || 0));

    if (dailyRemaining > 0) {
      // Count actually due cards, capped by daily remaining
      const { count } = await supabase
        .from('review_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString());
      dueCount = Math.min(count || 0, dailyRemaining);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-j-border bg-j-bg/90 backdrop-blur-md j-header-line">
      <div className="mx-auto max-w-6xl px-8 py-5">
        <div className="flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-sm border border-j-accent flex items-center justify-center j-glow-accent">
              <span className="text-j-accent font-mono text-xs">J</span>
            </div>
            <span className="font-mono text-sm tracking-[0.1em] text-j-text uppercase group-hover:text-j-accent transition-colors">
              Jarre
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/library"
              aria-current={currentPage === 'library' ? 'page' : undefined}
              className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                currentPage === 'library'
                  ? 'text-j-accent'
                  : 'text-j-text-secondary hover:text-j-text'
              }`}
            >
              <span className="text-j-accent">01</span><span className="mx-1 text-j-text-tertiary">.</span>
              {t('nav.library', lang)}
            </Link>

            {user ? (
              <>
                <Link
                  href="/review"
                  aria-current={currentPage === 'review' ? 'page' : undefined}
                  className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors flex items-center gap-2 ${
                    currentPage === 'review'
                      ? 'text-j-accent'
                      : 'text-j-text-secondary hover:text-j-text'
                  }`}
                >
                  <span className="text-j-accent">02</span><span className="mx-1 text-j-text-tertiary">.</span>
                  {t('nav.review', lang)}
                  {dueCount > 0 && (
                    <span className="bg-j-accent text-j-text-on-accent text-[9px] font-mono px-1.5 py-0.5 min-w-[18px] text-center">
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/mi-sistema"
                  aria-current={currentPage === 'mi-sistema' ? 'page' : undefined}
                  className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                    currentPage === 'mi-sistema'
                      ? 'text-j-accent'
                      : 'text-j-text-secondary hover:text-j-text'
                  }`}
                >
                  <span className="text-j-accent">03</span><span className="mx-1 text-j-text-tertiary">.</span>
                  {lang === 'es' ? 'Mi Sistema' : 'My System'}
                </Link>
                <Link
                  href="/journal"
                  aria-current={currentPage === 'journal' ? 'page' : undefined}
                  className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                    currentPage === 'journal'
                      ? 'text-j-accent'
                      : 'text-j-text-secondary hover:text-j-text'
                  }`}
                >
                  <span className="text-j-accent">04</span><span className="mx-1 text-j-text-tertiary">.</span>
                  {lang === 'es' ? 'Bitácora' : 'Journal'}
                </Link>
                {/* Engagement badges */}
                <Link href="/profile" className="flex items-center gap-3 pl-2 border-l border-j-border hover:opacity-80 transition-opacity">
                  {streakDays > 0 && (
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-j-warm">
                        <path d="M12 2C12 2 4 8 4 14C4 18.4 7.6 22 12 22C16.4 22 20 18.4 20 14C20 8 12 2 12 2Z" fill="currentColor" opacity="0.9"/>
                      </svg>
                      <span className="font-mono text-[10px] text-j-text">{streakDays}</span>
                    </div>
                  )}
                  <span className="font-mono text-[10px] text-j-text-secondary">
                    {totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}k` : totalXp} XP · Nv {xpLevel}
                  </span>
                </Link>
                <ThemeToggle />
                <LogoutButton label={t('nav.logout', lang)} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-mono text-[11px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-text transition-colors"
                >
                  {t('common.login', lang)}
                </Link>
                <Link
                  href="/signup"
                  className="font-mono text-[11px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors"
                >
                  {t('common.signup', lang)}
                </Link>
                <ThemeToggle />
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          {user ? (
            <MobileNav
              links={[
                { href: '/library', label: `01. ${t('nav.library', lang)}`, active: currentPage === 'library' },
                { href: '/review', label: `02. ${t('nav.review', lang)}`, active: currentPage === 'review', badge: dueCount },
                { href: '/mi-sistema', label: `03. ${lang === 'es' ? 'Mi Sistema' : 'My System'}`, active: currentPage === 'mi-sistema' },
                { href: '/journal', label: `04. ${lang === 'es' ? 'Bitácora' : 'Journal'}`, active: currentPage === 'journal' },
                { href: '/profile', label: `05. ${lang === 'es' ? 'Perfil' : 'Profile'}`, active: false },
              ]}
              streakDays={streakDays}
              totalXp={totalXp}
              xpLevel={xpLevel}
              isAuthenticated={!!user}
              logoutLabel={t('nav.logout', lang)}
            />
          ) : (
            <MobileNav
              links={[
                { href: '/library', label: `01. ${t('nav.library', lang)}`, active: currentPage === 'library' },
                { href: '/login', label: t('common.login', lang), active: false },
                { href: '/signup', label: t('common.signup', lang), active: false },
              ]}
              streakDays={0}
              totalXp={0}
              xpLevel={1}
              isAuthenticated={false}
              logoutLabel=""
            />
          )}
        </div>
      </div>
    </header>
  );
}
