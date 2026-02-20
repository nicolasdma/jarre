import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Jarre — Deep Technical Learning',
  description: 'A learning system for deep technical knowledge validation through AI-generated evaluations',
};
import { Header } from '@/components/header';
import { SectionLabel } from '@/components/ui/section-label';
import { getMasteryLevels } from '@/lib/translations';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated — landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-j-bg j-bg-texture">
        <Header currentPage="home" />

        <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 j-hero-gradient">
          <div className="mb-16">
            <SectionLabel>Deep Learning System</SectionLabel>

            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-normal italic tracking-tight text-j-text mb-2 font-[family-name:var(--j-font-display)]">
              Master Complex
            </h2>
            <p className="text-xl sm:text-2xl md:text-3xl font-light text-j-text-tertiary">
              Technical Knowledge
            </p>
            <p className="mt-6 text-j-text-secondary max-w-xl leading-relaxed">
              Not flashcards. Not memorization. AI-powered validation of real understanding
              through deep evaluations, spaced repetition, and project-based mastery.
            </p>
            <div className="flex gap-4 mt-8">
              <Link
                href="/library"
                className="font-mono text-[11px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-3 uppercase hover:bg-j-accent-hover transition-colors"
              >
                Start Learning
              </Link>
              <Link
                href="/login"
                className="font-mono text-[11px] tracking-[0.15em] border border-j-border-input text-j-text px-6 py-3 uppercase hover:border-j-accent transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Mastery Levels Explanation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-center">
            {getMasteryLevels('en').map((item) => {
              const descriptions: Record<string, string> = {
                '0': 'Read/watched',
                '1': 'Can explain',
                '2': 'Used in project',
                '3': 'Know when NOT to use',
                '4': 'Can teach others',
              };
              return (
                <div key={item.level} className="border border-j-border p-3 sm:p-4">
                  <p className="text-2xl font-light text-j-text mb-1">{item.level}</p>
                  <p className="font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase mb-1">{item.name}</p>
                  <p className="text-xs text-j-text-tertiary">{descriptions[item.level]}</p>
                </div>
              );
            })}
          </div>
        </main>

        <footer className="border-t border-j-border py-8 mt-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-8">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase text-center">
              Jarre · Deep Knowledge · {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated — redirect to library
  redirect('/library');
}
