import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/logout-button';

interface HeaderProps {
  currentPage?: 'home' | 'library' | 'dashboard';
}

export async function Header({ currentPage }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-stone-900">
            Jarre
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/library"
              className={`text-sm ${currentPage === 'library' ? 'font-medium text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
            >
              Library
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm ${currentPage === 'dashboard' ? 'font-medium text-stone-900' : 'text-stone-600 hover:text-stone-900'}`}
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
