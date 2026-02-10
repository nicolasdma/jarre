import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DDIAChapter1 } from './ddia-ch1';
import { DDIAChapter2 } from './ddia-ch2';
import { DDIAChapter3 } from './ddia-ch3';
import { DDIAChapter5 } from './ddia-ch5';
import { DDIAChapter6 } from './ddia-ch6';
import { DDIAChapter8 } from './ddia-ch8';
import { DDIAChapter9 } from './ddia-ch9';
import { READING_QUESTIONS } from './reading-questions';
import { LearnFlow } from '@/components/learn-flow';
import { FIGURE_REGISTRY } from '@/lib/figure-registry';
import type { Language } from '@/lib/translations';
import type { LearnProgress } from '@/lib/learn-progress';
import type { InlineQuiz } from '@/types';

interface PageProps {
  params: Promise<{ resourceId: string }>;
}

/** Where does the "practical" step go for each resource */
const PRACTICAL_ROUTES: Record<string, { label: string; href: string }> = {
  'ddia-ch1': { label: 'Playground', href: '/playground/latency-simulator' },
  'ddia-ch2': { label: 'Evaluar', href: '/evaluate/ddia-ch2' },
  'ddia-ch3': { label: 'Playground', href: '/playground/storage-engine' },
  'ddia-ch5': { label: 'Playground', href: '/playground/replication-lab' },
  'ddia-ch6': { label: 'Playground', href: '/playground/partitioning' },
  'ddia-ch8': { label: 'Playground', href: '/playground/consensus' },
  'ddia-ch9': { label: 'Playground', href: '/playground/consensus' },
};

/** Resources with advance organizer components (Step 1: ACTIVATE) */
const EXPLANATION_COMPONENTS: Record<string, () => React.JSX.Element> = {
  'ddia-ch1': () => <DDIAChapter1 />,
  'ddia-ch2': () => <DDIAChapter2 />,
  'ddia-ch3': () => <DDIAChapter3 />,
  'ddia-ch5': () => <DDIAChapter5 />,
  'ddia-ch6': () => <DDIAChapter6 />,
  'ddia-ch8': () => <DDIAChapter8 />,
  'ddia-ch9': () => <DDIAChapter9 />,
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

  // Get resource + user language + resource sections + learn progress in parallel
  const [resourceResult, profileResult, sectionsResult, progressResult] = await Promise.all([
    supabase.from('resources').select('*').eq('id', resourceId).single(),
    supabase.from('user_profiles').select('language').eq('id', user.id).single(),
    supabase
      .from('resource_sections')
      .select('id, resource_id, concept_id, section_title, content_markdown, sort_order')
      .eq('resource_id', resourceId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('learn_progress')
      .select('current_step, active_section, completed_sections, section_state, review_state')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single(),
  ]);

  const resource = resourceResult.data;
  const language = (profileResult.data?.language || 'es') as Language;
  const sections = sectionsResult.data || [];

  const initialProgress: LearnProgress | undefined = progressResult.data
    ? {
        currentStep: progressResult.data.current_step as LearnProgress['currentStep'],
        activeSection: progressResult.data.active_section,
        completedSections: progressResult.data.completed_sections ?? [],
        sectionState: (progressResult.data.section_state as LearnProgress['sectionState']) ?? {},
        reviewState: (progressResult.data.review_state as LearnProgress['reviewState']) ?? undefined,
      }
    : undefined;

  if (!resource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg">
        <p className="text-j-warm">Recurso no encontrado</p>
      </div>
    );
  }

  if (!AVAILABLE_RESOURCES.has(resourceId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-j-bg p-8">
        <p className="mb-4 text-j-text-secondary">Explicacion no disponible aun para este recurso.</p>
        <Link href="/library" className="text-j-accent hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  const renderContent = EXPLANATION_COMPONENTS[resourceId];
  const practical = PRACTICAL_ROUTES[resourceId];
  const guidedQuestions = READING_QUESTIONS[resourceId];

  // NEW FLOW: If resource has sections, use the ACTIVATE → LEARN → APPLY → EVALUATE sequence
  if (sections.length > 0) {
    const sectionIds = sections.map((s) => s.id);

    // Fetch inline quizzes for all sections in this resource
    const { data: quizzesRaw } = await supabase
      .from('inline_quizzes')
      .select('*')
      .in('section_id', sectionIds)
      .eq('is_active', true)
      .order('sort_order');

    // Group quizzes by section_id
    const quizzesBySectionId: Record<string, InlineQuiz[]> = {};
    if (quizzesRaw) {
      for (const q of quizzesRaw) {
        const quiz: InlineQuiz = {
          id: q.id,
          sectionId: q.section_id,
          positionAfterHeading: q.position_after_heading,
          sortOrder: q.sort_order,
          format: q.format,
          questionText: q.question_text,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
        };
        const arr = quizzesBySectionId[q.section_id] ?? [];
        arr.push(quiz);
        quizzesBySectionId[q.section_id] = arr;
      }
    }

    const flowSections = sections.map((s) => ({
      id: s.id,
      conceptId: s.concept_id,
      sectionTitle: s.section_title,
      contentMarkdown: s.content_markdown,
      sortOrder: s.sort_order,
    }));

    return (
      <LearnFlow
        language={language}
        resourceId={resourceId}
        resourceTitle={resource.title}
        sections={flowSections}
        activateComponent={renderContent?.()}
        playgroundHref={practical?.href}
        playgroundLabel={practical?.label}
        evaluateHref={`/evaluate/${resourceId}`}
        guidedQuestions={guidedQuestions}
        initialProgress={initialProgress}
        figureRegistry={FIGURE_REGISTRY}
        quizzesBySectionId={quizzesBySectionId}
      />
    );
  }

  // FALLBACK: Original flow for resources without sections
  const hasQuestions = !!guidedQuestions;

  return (
    <div className="min-h-screen bg-j-bg">
      {/* Sticky header with step navigation */}
      <div className="sticky top-0 z-50 border-b border-j-border bg-j-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-4">
          <Link
            href="/library"
            className="text-sm text-j-text-tertiary hover:text-j-text transition-colors"
          >
            ← Biblioteca
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text uppercase font-medium">
              Resumen
            </span>
            {hasQuestions && (
              <>
                <span className="text-j-border-dot">·</span>
                <Link
                  href={`/learn/${resourceId}/questions`}
                  className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase hover:text-j-text transition-colors"
                >
                  Preguntas
                </Link>
              </>
            )}
            {practical && (
              <>
                <span className="text-j-border-dot">·</span>
                <Link
                  href={practical.href}
                  className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase hover:text-j-text transition-colors"
                >
                  {practical.label}
                </Link>
              </>
            )}
          </div>

          {hasQuestions ? (
            <Link
              href={`/learn/${resourceId}/questions`}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-3 py-1.5 uppercase hover:bg-j-accent-hover transition-colors"
            >
              Preguntas →
            </Link>
          ) : practical ? (
            <Link
              href={practical.href}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-3 py-1.5 uppercase hover:bg-j-accent-hover transition-colors"
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
          <div className="border-t border-j-border pt-12 text-center">
            <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-4">
              Siguiente paso
            </p>
            <Link
              href={`/learn/${resourceId}/questions`}
              className="inline-block font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-2.5 uppercase hover:bg-j-accent-hover transition-colors"
            >
              Preguntas Guía →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
