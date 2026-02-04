'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton({ label = 'Logout' }: { label?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="font-mono text-[11px] tracking-[0.15em] text-[#7a7a6e] uppercase hover:text-[#7d6b6b] transition-colors"
    >
      {label}
    </button>
  );
}
