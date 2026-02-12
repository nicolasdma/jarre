import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/tables';
import { todayStart } from '@/lib/spaced-repetition';
import { REVIEW_SESSION_CAP } from '@/lib/constants';

interface SessionCTAProps {
  userId: string;
  language: 'es' | 'en';
}

export async function SessionCTA({ userId, language }: SessionCTAProps) {
  const supabase = await createClient();

  // Check review due count
  const { count: reviewedToday } = await supabase
    .from(TABLES.reviewSchedule)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('last_reviewed_at', todayStart());

  const dailyRemaining = Math.max(0, REVIEW_SESSION_CAP - (reviewedToday || 0));

  let dueCount = 0;
  if (dailyRemaining > 0) {
    const { count } = await supabase
      .from(TABLES.reviewSchedule)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString());
    dueCount = Math.min(count || 0, dailyRemaining);
  }

  // Check if there's learn progress in flight
  const { data: activeLearn } = await supabase
    .from(TABLES.learnProgress)
    .select('resource_id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  // Smart routing
  let href = '/library';
  let label = language === 'es' ? 'Explorar biblioteca' : 'Browse library';
  let subtitle = language === 'es' ? 'Elige tu siguiente recurso' : 'Choose your next resource';

  if (dueCount > 0) {
    href = '/review';
    label = language === 'es' ? 'Empezar sesion de hoy' : 'Start today\'s session';
    subtitle = language === 'es'
      ? `${dueCount} ${dueCount === 1 ? 'repaso pendiente' : 'repasos pendientes'}`
      : `${dueCount} review${dueCount === 1 ? '' : 's'} due`;
  } else if (activeLearn?.resource_id) {
    href = `/learn/${activeLearn.resource_id}`;
    label = language === 'es' ? 'Continuar aprendiendo' : 'Continue learning';
    subtitle = language === 'es' ? 'Retoma donde lo dejaste' : 'Pick up where you left off';
  }

  return (
    <Link
      href={href}
      className="block w-full border-2 border-j-accent bg-j-bg hover:bg-j-accent-light transition-colors p-6 group"
    >
      <p className="font-mono text-[12px] tracking-[0.15em] text-j-accent uppercase font-medium group-hover:text-j-accent-hover transition-colors">
        {label}
      </p>
      <p className="text-sm text-j-text-secondary mt-1">
        {subtitle}
      </p>
    </Link>
  );
}
