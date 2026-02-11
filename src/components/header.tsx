import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/logout-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { REVIEW_SESSION_CAP, todayStart } from '@/lib/spaced-repetition';
import { t, type Language } from '@/lib/translations';

interface HeaderProps {
  currentPage?: 'home' | 'library' | 'review';
}

export async function Header({ currentPage }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lang: Language = 'es';
  let dueCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .single();
    lang = (profile?.language || 'es') as Language;

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
    <header className="border-b border-j-border bg-j-bg">
      <div className="mx-auto max-w-6xl px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 border border-j-accent flex items-center justify-center">
              <span className="text-j-accent font-mono text-xs">J</span>
            </div>
            <span className="font-mono text-sm tracking-[0.1em] text-j-text uppercase group-hover:text-j-accent transition-colors">
              Jarre
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/library"
              className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                currentPage === 'library'
                  ? 'text-j-accent'
                  : 'text-j-text-secondary hover:text-j-text'
              }`}
            >
              01. {t('nav.library', lang)}
            </Link>

            {user ? (
              <>
                <Link
                  href="/review"
                  className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors flex items-center gap-2 ${
                    currentPage === 'review'
                      ? 'text-j-accent'
                      : 'text-j-text-secondary hover:text-j-text'
                  }`}
                >
                  02. {t('nav.review', lang)}
                  {dueCount > 0 && (
                    <span className="bg-j-accent text-j-text-on-accent text-[9px] font-mono px-1.5 py-0.5 min-w-[18px] text-center">
                      {dueCount > 99 ? '99+' : dueCount}
                    </span>
                  )}
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
        </div>
      </div>
    </header>
  );
}
