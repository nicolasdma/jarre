import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DDIAChapter1 } from './ddia-ch1';
import { DDIAChapter2 } from './ddia-ch2';
import { DDIAChapter3 } from './ddia-ch3';
import { READING_QUESTIONS } from './reading-questions';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

/** Where does the "practical" step go for each resource */
const PRACTICAL_ROUTES: Record<string, { label: string; href: string }> = {
  'ddia-ch1': { label: 'Evaluar', href: '/evaluate/ddia-ch1' },
  'ddia-ch2': { label: 'Evaluar', href: '/evaluate/ddia-ch2' },
  'ddia-ch3': { label: 'Playground', href: '/playground/storage-engine' },
};

/** Resources with deep explanation components */
const EXPLANATION_COMPONENTS: Record<string, () => React.JSX.Element> = {
  'ddia-ch1': () => <DDIAChapter1 />,
  'ddia-ch2': () => <DDIAChapter2 />,
  'ddia-ch3': () => <DDIAChapter3 />,
};

const AVAILABLE_RESOURCES = new Set(Object.keys(EXPLANATION_COMPONENTS));

export default async function LearnPage({ params }: PageProps) {
  const { resourceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/learn/${resourceId}`);
  }

  // Get resource
  const { data: resource } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (!resource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-[#c4a07a]">Recurso no encontrado</p>
      </div>
    );
  }

  if (!AVAILABLE_RESOURCES.has(resourceId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f6] p-8">
        <p className="mb-4 text-[#7a7a6e]">Explicacion no disponible aun para este recurso.</p>
        <Link href="/library" className="text-[#4a5d4a] hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const renderContent = EXPLANATION_COMPONENTS[resourceId];
  const hasQuestions = !!READING_QUESTIONS[resourceId];
  const practical = PRACTICAL_ROUTES[resourceId];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Sticky header with step navigation */}
      <div className="sticky top-0 z-50 border-b border-[#e8e6e0] bg-[#faf9f6]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
          <Link
            href="/library"
            className="text-sm text-[#9c9a8e] hover:text-[#2c2c2c] transition-colors"
          >
            ← Biblioteca
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#2c2c2c] uppercase font-medium">
              Resumen
            </span>
            {hasQuestions && (
              <>
                <span className="text-[#d4d2cc]">·</span>
                <Link
                  href={`/learn/${resourceId}/questions`}
                  className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase hover:text-[#2c2c2c] transition-colors"
                >
                  Preguntas
                </Link>
              </>
            )}
            {practical && (
              <>
                <span className="text-[#d4d2cc]">·</span>
                <Link
                  href={practical.href}
                  className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase hover:text-[#2c2c2c] transition-colors"
                >
                  {practical.label}
                </Link>
              </>
            )}
          </div>

          {hasQuestions ? (
            <Link
              href={`/learn/${resourceId}/questions`}
              className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-3 py-1.5 uppercase hover:bg-[#3d4d3d] transition-colors"
            >
              Preguntas →
            </Link>
          ) : practical ? (
            <Link
              href={practical.href}
              className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-3 py-1.5 uppercase hover:bg-[#3d4d3d] transition-colors"
            >
              {practical.label} →
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Content */}
      {renderContent?.()}

      {/* Bottom CTA: go to questions */}
      {hasQuestions && (
        <div className="mx-auto max-w-3xl px-8 pb-16">
          <div className="border-t border-[#e8e6e0] pt-12 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase mb-4">
              Siguiente paso
            </p>
            <Link
              href={`/learn/${resourceId}/questions`}
              className="inline-block font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-6 py-2.5 uppercase hover:bg-[#3d4d3d] transition-colors"
            >
              Preguntas Guía →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
