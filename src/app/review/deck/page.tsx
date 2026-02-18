import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import type { Language } from '@/lib/translations';
import { DeckOverview } from './deck-overview';

export const metadata: Metadata = {
  title: 'Deck — Jarre',
  description: 'View your review deck and concept progress',
};

export default async function DeckPage() {
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
      <main className="mx-auto max-w-5xl px-8 py-12">
        <div className="mb-8">
          <SectionLabel>DECK</SectionLabel>
          <h1 className="text-4xl font-bold text-j-text mb-2">
            {lang === 'es' ? 'Tu Deck de Repaso' : 'Your Review Deck'}
          </h1>
          <p className="text-j-text-secondary">
            {lang === 'es'
              ? 'Vista general de todos tus conceptos y tarjetas de repaso'
              : 'Overview of all your concepts and review cards'}
          </p>
        </div>
        <DeckOverview language={lang} />
      </main>
    </div>
  );
}
