import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { t, type Language } from '@/lib/translations';
import { REVIEW_SESSION_CAP, todayStart } from '@/lib/spaced-repetition';
import { ReviewSession } from './review-session';

export const metadata: Metadata = {
  title: 'Review — Jarre',
  description: 'Spaced repetition review session for knowledge retention',
};

export default async function ReviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user language
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();

  const lang = (profile?.language || 'es') as Language;

  const now = new Date().toISOString();

  // Count cards reviewed today (daily cap)
  const { count: reviewedToday } = await supabase
    .from('review_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('last_reviewed_at', todayStart());

  const dailyRemaining = Math.max(0, REVIEW_SESSION_CAP - (reviewedToday || 0));

  // Count actually due cards, capped by daily remaining
  let dueCount = 0;
  if (dailyRemaining > 0) {
    const { count } = await supabase
      .from('review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_at', now);
    dueCount = Math.min(count || 0, dailyRemaining);
  }

  // Get total cards in the system
  const { count: totalCards } = await supabase
    .from('review_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="review" />

      <main className="mx-auto max-w-3xl px-8 py-12">
        <div className="mb-8">
          <SectionLabel>SM-2</SectionLabel>
          <h1 className="text-4xl font-bold text-j-text mb-2">
            {t('review.title', lang)}
          </h1>
          <p className="text-j-text-secondary">
            {t('review.subtitle', lang)}
          </p>
        </div>

        <ReviewSession
          dueCount={dueCount}
          totalCards={totalCards || 0}
          language={lang}
          reviewedToday={reviewedToday || 0}
        />
      </main>
    </div>
  );
}
