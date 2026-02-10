import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { t, type Language } from '@/lib/translations';
import { REVIEW_SESSION_CAP } from '@/lib/spaced-repetition';
import { ReviewSession } from './review-session';

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

  // Get count of due cards
  const now = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from('review_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_at', now);

  // Get total cards
  const { count: totalCards } = await supabase
    .from('review_schedule')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="review" />

      <main className="mx-auto max-w-3xl px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-px bg-j-accent"></div>
            <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              SM-2
            </span>
          </div>
          <h1 className="text-4xl font-bold text-j-text mb-2">
            {t('review.title', lang)}
          </h1>
          <p className="text-j-text-secondary">
            {t('review.subtitle', lang)}
          </p>
        </div>

        <ReviewSession
          dueCount={Math.min(dueCount || 0, REVIEW_SESSION_CAP)}
          totalCards={totalCards || 0}
          language={lang}
        />
      </main>
    </div>
  );
}
