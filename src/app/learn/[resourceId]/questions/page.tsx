import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  READING_QUESTIONS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPE_COLORS,
} from '../reading-questions';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

/** Where does the "next step" go for each resource */
const NEXT_STEP: Record<string, { label: string; href: string }> = {
  'ddia-ch1': { label: 'Playground', href: '/playground/latency-simulator' },
  'ddia-ch2': { label: 'Evaluar', href: '/evaluate/ddia-ch2' },
  'ddia-ch3': { label: 'Playground', href: '/playground/storage-engine' },
  'ddia-ch5': { label: 'Playground', href: '/playground/replication-lab' },
  'ddia-ch6': { label: 'Playground', href: '/playground/partitioning' },
  'ddia-ch8': { label: 'Playground', href: '/playground/consensus' },
  'ddia-ch9': { label: 'Playground', href: '/playground/consensus' },
};

export default async function QuestionsPage({ params }: PageProps) {
  const { resourceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/learn/${resourceId}/questions`);
  }

  const questions = READING_QUESTIONS[resourceId];

  if (!questions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-j-bg p-8">
        <p className="mb-4 text-j-text-secondary">
          Preguntas guía no disponibles para este recurso.
        </p>
        <Link href="/library" className="text-j-accent hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const nextStep = NEXT_STEP[resourceId];

  return (
    <div className="min-h-screen bg-j-bg">
      {/* Sticky header with step navigation */}
      <div className="sticky top-0 z-50 border-b border-j-border bg-j-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
          <Link
            href={`/learn/${resourceId}`}
            className="text-sm text-j-text-tertiary hover:text-j-text transition-colors"
          >
            ← Resumen
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            <Link
              href={`/learn/${resourceId}`}
              className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase hover:text-j-text transition-colors"
            >
              Resumen
            </Link>
            <span className="text-j-border-dot">·</span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text uppercase font-medium">
              Preguntas
            </span>
            <span className="text-j-border-dot">·</span>
            {nextStep && (
              <Link
                href={nextStep.href}
                className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase hover:text-j-text transition-colors"
              >
                {nextStep.label}
              </Link>
            )}
          </div>

          {nextStep && (
            <Link
              href={nextStep.href}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-3 py-1.5 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {nextStep.label} →
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-8 py-16">
        {/* Hero */}
        <header className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-px bg-j-accent" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
              Preguntas Guía
            </span>
          </div>

          <h1 className="text-3xl font-light text-j-text mb-4">
            Focos de Lectura
          </h1>

          <p className="text-j-text-secondary leading-relaxed max-w-xl">
            Estas preguntas no son un cuestionario. Son focos que orientan tu
            lectura. Tenlas presentes mientras lees el capítulo — te obligan a
            pensar en lo que importa, no solo a subrayar.
          </p>
        </header>

        {/* Questions list */}
        <div className="space-y-8">
          {questions.map((q, i) => (
            <section
              key={i}
              className="border-l-2 border-j-border pl-6 py-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-xs text-j-text-tertiary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded ${QUESTION_TYPE_COLORS[q.type]}`}
                >
                  {QUESTION_TYPE_LABELS[q.type]}
                </span>
              </div>

              <p className="text-j-text leading-relaxed mb-3">
                {q.question}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <span className="font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary uppercase">
                  Concepto: {q.concept}
                </span>
                {q.hint && (
                  <span className="text-xs text-[#b0a890] italic">
                    Pista: {q.hint}
                  </span>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        {nextStep && (
          <div className="mt-16 pt-12 border-t border-j-border text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
              Siguiente paso
            </p>
            <Link
              href={nextStep.href}
              className="inline-block font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
            >
              {nextStep.label} →
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
