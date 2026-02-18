import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import type { Language } from '@/lib/translations';
import { QuickReviewSession } from './quick-review-session';

export const metadata: Metadata = {
  title: 'Quick Review — Jarre',
  description: 'Practice with random cards from unlocked concepts',
};

export default async function QuickReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();

  const lang = (profile?.language || 'es') as Language;

  return (
    <div className="min-h-screen bg-j-bg">
      <Header currentPage="review" />
      <main className="mx-auto max-w-3xl px-8 py-12">
        <div className="mb-8">
          <SectionLabel>REPASO</SectionLabel>
          <h1 className="text-4xl font-bold text-j-text mb-2">
            {lang === 'es' ? 'Repaso Rápido' : 'Quick Review'}
          </h1>
          <p className="text-j-text-secondary">
            {lang === 'es'
              ? 'Practica con tarjetas aleatorias de conceptos desbloqueados'
              : 'Practice with random cards from unlocked concepts'}
          </p>
        </div>
        <QuickReviewSession language={lang} />
      </main>
    </div>
  );
}
