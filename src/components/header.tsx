import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/logout-button';
import { t, type Language } from '@/lib/translations';

interface HeaderProps {
  currentPage?: 'home' | 'library' | 'dashboard';
}

export async function Header({ currentPage }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lang: Language = 'es';
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('language')
      .eq('id', user.id)
      .single();
    lang = (profile?.language || 'es') as Language;
  }

  return (
    <header className="border-b border-[#e8e6e0] bg-[#faf9f6]">
      <div className="mx-auto max-w-6xl px-8 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 border border-[#4a5d4a] flex items-center justify-center">
              <span className="text-[#4a5d4a] font-mono text-xs">J</span>
            </div>
            <span className="font-mono text-sm tracking-[0.1em] text-[#2c2c2c] uppercase group-hover:text-[#4a5d4a] transition-colors">
              Jarre
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <Link
              href="/library"
              className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                currentPage === 'library'
                  ? 'text-[#4a5d4a]'
                  : 'text-[#7a7a6e] hover:text-[#2c2c2c]'
              }`}
            >
              01. {t('nav.library', lang)}
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                    currentPage === 'dashboard'
                      ? 'text-[#4a5d4a]'
                      : 'text-[#7a7a6e] hover:text-[#2c2c2c]'
                  }`}
                >
                  02. {t('nav.dashboard', lang)}
                </Link>
                <LogoutButton label={t('nav.logout', lang)} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-mono text-[11px] tracking-[0.15em] text-[#7a7a6e] uppercase hover:text-[#2c2c2c] transition-colors"
                >
                  {t('common.login', lang)}
                </Link>
                <Link
                  href="/signup"
                  className="font-mono text-[11px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors"
                >
                  {t('common.signup', lang)}
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
