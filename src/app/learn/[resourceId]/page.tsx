import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DDIAChapter1 } from './ddia-ch1';

export async function generateMetadata({ params }: { params: Promise<{ resourceId: string }> }): Promise<Metadata> {
  const { resourceId } = await params;
  return {
    title: `Learn ${resourceId} — Jarre`,
    description: 'Interactive learning content with sections and exercises',
  };
}
import { DDIAChapter2 } from './ddia-ch2';
import { DDIAChapter3 } from './ddia-ch3';
import { DDIAChapter5 } from './ddia-ch5';
import { DDIAChapter6 } from './ddia-ch6';
import { DDIAChapter4 } from './ddia-ch4';
import { DDIAChapter7 } from './ddia-ch7';
import { DDIAChapter8 } from './ddia-ch8';
import { DDIAChapter9 } from './ddia-ch9';
import { DDIAChapter11 } from './ddia-ch11';
import { TailAtScale } from './tail-scale';
import { AttentionPaper } from './attention-paper';
import { ScalingLawsPaper } from './scaling-laws';
import { AgentSandboxPatterns } from './agent-sandbox-patterns';
import { ClawvaultAgentMemory } from './clawvault-agent-memory';
import { OpenClawCaseStudy } from './openclaw-casestudy';
import { P0LinearAlgebra } from './p0-linear-algebra';
import { P0CalculusOptimization } from './p0-calculus-optimization';
import { P0Probability } from './p0-probability';
import { P0CS229Probability } from './p0-cs229-probability';
import { LilianWengDistributed } from './lilian-weng-distributed';
import { HoraceHeGpu } from './horace-he-gpu';
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
  'ddia-ch2': { label: 'Evaluar', href: '/learn/ddia-ch2' },
  'ddia-ch3': { label: 'Playground', href: '/playground/storage-engine' },
  'ddia-ch4': { label: 'Playground', href: '/playground/encoding' },
  'ddia-ch5': { label: 'Playground', href: '/playground/replication-lab' },
  'ddia-ch6': { label: 'Playground', href: '/playground/partitioning' },
  'ddia-ch7': { label: 'Playground', href: '/playground/transactions' },
  'ddia-ch8': { label: 'Playground', href: '/playground/consensus' },
  'ddia-ch9': { label: 'Playground', href: '/playground/consensus' },
  'ddia-ch11': { label: 'Playground', href: '/playground/stream-processing' },
  'tail-at-scale-paper': { label: 'Playground', href: '/playground/tail-latency' },
  'attention-paper': { label: 'Playground', href: '/playground/attention' },
  'scaling-laws-paper': { label: 'Playground', href: '/playground/scaling-laws' },
  'agent-sandbox-patterns': { label: 'Playground', href: '/playground/agent-sandbox' },
  'clawvault-agent-memory': { label: 'Playground', href: '/playground/clawvault-memory' },
  'openclaw-casestudy': { label: 'Playground', href: '/playground/openclaw-architecture' },
  'p0-linear-algebra': { label: 'Playground', href: '/playground/linear-algebra' },
  'p0-calculus-optimization': { label: 'Playground', href: '/playground/gradient-descent' },
  'p0-probability': { label: 'Playground', href: '/playground/probability' },
  'p0-cs229-probability': { label: 'Playground', href: '/playground/bayesian-inference' },
  'p2-lilian-weng-distributed': { label: 'Playground', href: '/playground/distributed-training' },
  'p2-horace-he-gpu': { label: 'Playground', href: '/playground/gpu-performance' },
};

/** Resources with advance organizer components (Step 1: ACTIVATE) */
const EXPLANATION_COMPONENTS: Record<string, () => React.JSX.Element> = {
  'ddia-ch1': () => <DDIAChapter1 />,
  'ddia-ch2': () => <DDIAChapter2 />,
  'ddia-ch3': () => <DDIAChapter3 />,
  'ddia-ch4': () => <DDIAChapter4 />,
  'ddia-ch5': () => <DDIAChapter5 />,
  'ddia-ch6': () => <DDIAChapter6 />,
  'ddia-ch7': () => <DDIAChapter7 />,
  'ddia-ch8': () => <DDIAChapter8 />,
  'ddia-ch9': () => <DDIAChapter9 />,
  'ddia-ch11': () => <DDIAChapter11 />,
  'tail-at-scale-paper': () => <TailAtScale />,
  'attention-paper': () => <AttentionPaper />,
  'scaling-laws-paper': () => <ScalingLawsPaper />,
  'agent-sandbox-patterns': () => <AgentSandboxPatterns />,
  'clawvault-agent-memory': () => <ClawvaultAgentMemory />,
  'openclaw-casestudy': () => <OpenClawCaseStudy />,
  'p0-linear-algebra': () => <P0LinearAlgebra />,
  'p0-calculus-optimization': () => <P0CalculusOptimization />,
  'p0-probability': () => <P0Probability />,
  'p0-cs229-probability': () => <P0CS229Probability />,
  'p2-lilian-weng-distributed': () => <LilianWengDistributed />,
  'p2-horace-he-gpu': () => <HoraceHeGpu />,
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

  // Get resource + user language + resource sections + learn progress + concepts in parallel
  const [resourceResult, profileResult, sectionsResult, progressResult, conceptsResult] = await Promise.all([
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
    supabase
      .from('resource_concepts')
      .select('concept_id, is_prerequisite, concepts (id, name, canonical_definition)')
      .eq('resource_id', resourceId),
  ]);

  const resource = resourceResult.data;
  const language = (profileResult.data?.language || 'es') as Language;
  const sections = sectionsResult.data || [];

  // Extract concepts taught (not prerequisites) for evaluation
  // Supabase returns `concepts` as an array from the join; we take the first element
  const conceptsTaught = (conceptsResult.data || [])
    .filter((rc: { is_prerequisite: boolean }) => !rc.is_prerequisite)
    .map((rc: { concepts: { id: string; name: string; canonical_definition: string }[] }) =>
      Array.isArray(rc.concepts) ? rc.concepts[0] : rc.concepts
    )
    .filter(Boolean) as { id: string; name: string; canonical_definition: string }[];

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

  const renderContent = EXPLANATION_COMPONENTS[resourceId];
  const practical = PRACTICAL_ROUTES[resourceId];
  const guidedQuestions = READING_QUESTIONS[resourceId];

  // NEW FLOW: If resource has sections in DB, use the ACTIVATE → LEARN → APPLY → EVALUATE sequence
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
          justificationHint: q.justification_hint ?? undefined,
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
        resourceType={resource.type}
        sections={flowSections}
        activateComponent={renderContent?.()}
        playgroundHref={practical?.href}
        playgroundLabel={practical?.label}
        concepts={conceptsTaught}
        userId={user.id}
        guidedQuestions={guidedQuestions}
        initialProgress={initialProgress}
        figureRegistry={FIGURE_REGISTRY}
        quizzesBySectionId={quizzesBySectionId}
      />
    );
  }

  // If no sections and no explanation component, show message
  if (!AVAILABLE_RESOURCES.has(resourceId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-j-bg p-8">
        <p className="mb-4 text-j-text-secondary">Contenido no disponible aún para este recurso.</p>
        <Link href="/library" className="text-j-accent hover:underline">
          ← Volver a la biblioteca
        </Link>
      </div>
    );
  }

  // FALLBACK: Original flow for resources with explanation component but no sections
  const hasQuestions = !!guidedQuestions;

  return (
    <div className="min-h-screen bg-j-bg">
      {/* Sticky header with step navigation */}
      <div className="sticky top-0 z-50 border-b border-j-border bg-j-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 sm:px-8 py-4">
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
        <div className="mx-auto max-w-3xl px-4 sm:px-8 pb-16">
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
