import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { t, type Language } from '@/lib/translations';
import type { EvaluationType } from '@/types';

interface PageProps {
  params: Promise<{ evaluationId: string }>;
}

interface EvaluationQuestion {
  id: string;
  type: EvaluationType;
  question: string;
  conceptId: string | null;
  conceptName: string | null;
  response: {
    userAnswer: string;
    score: number;
    feedback: string;
    isCorrect: boolean;
  } | null;
}

interface EvaluationDetail {
  id: string;
  overallScore: number;
  createdAt: string;
  completedAt: string;
  status: string;
  resource: {
    id: string;
    title: string;
    type: string;
    author: string | null;
  };
  questions: EvaluationQuestion[];
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatDate(dateString: string, lang: Language): string {
  const date = new Date(dateString);
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getQuestionTypeLabel(type: EvaluationType, lang: Language): string {
  const key = `questionType.${type}` as const;
  return t(key, lang);
}

export default async function EvaluationDetailPage({ params }: PageProps) {
  const { evaluationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/evaluation/${evaluationId}`);
  }

  // Get user's language preference
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('language')
    .eq('id', user.id)
    .single();

  const lang = (profile?.language || 'es') as Language;

  // Fetch evaluation via API route logic (inline for Server Component)
  const { data: evaluation, error: evalError } = await supabase
    .from('evaluations')
    .select(`
      id,
      user_id,
      overall_score,
      created_at,
      completed_at,
      status,
      resource:resources(id, title, type, author)
    `)
    .eq('id', evaluationId)
    .single();

  if (evalError || !evaluation || evaluation.user_id !== user.id) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <p className="mb-4 text-red-600">{t('evalDetail.notFound', lang)}</p>
          <Link href="/library" className="text-blue-600 hover:underline">
            {t('resource.backToLibrary', lang)}
          </Link>
        </main>
      </div>
    );
  }

  // Fetch questions
  const { data: questions } = await supabase
    .from('evaluation_questions')
    .select(`
      id,
      type,
      question,
      concept_id,
      concept:concepts(id, name)
    `)
    .eq('evaluation_id', evaluationId)
    .order('id', { ascending: true });

  // Fetch responses
  const questionIds = questions?.map(q => q.id) || [];
  let responsesMap: Record<string, {
    userAnswer: string;
    score: number;
    feedback: string;
    isCorrect: boolean;
  }> = {};

  if (questionIds.length > 0) {
    const { data: responses } = await supabase
      .from('evaluation_responses')
      .select('question_id, user_answer, score, feedback, is_correct')
      .in('question_id', questionIds);

    if (responses) {
      responsesMap = responses.reduce((acc, r) => {
        acc[r.question_id] = {
          userAnswer: r.user_answer,
          score: r.score,
          feedback: r.feedback,
          isCorrect: r.is_correct,
        };
        return acc;
      }, {} as typeof responsesMap);
    }
  }

  // Transform data
  const evalDetail: EvaluationDetail = {
    id: evaluation.id,
    overallScore: evaluation.overall_score,
    createdAt: evaluation.created_at,
    completedAt: evaluation.completed_at,
    status: evaluation.status,
    resource: evaluation.resource as unknown as EvaluationDetail['resource'],
    questions: (questions || []).map(q => {
      const concept = q.concept as unknown as { id: string; name: string } | null;
      return {
        id: q.id,
        type: q.type as EvaluationType,
        question: q.question,
        conceptId: q.concept_id,
        conceptName: concept?.name || null,
        response: responsesMap[q.id] || null,
      };
    }),
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Header currentPage="library" />

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Header Card */}
        <div className="mb-6 rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {evalDetail.resource.title}
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                <span className="capitalize">{evalDetail.resource.type}</span>
                {evalDetail.resource.author && (
                  <span> · {evalDetail.resource.author}</span>
                )}
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {t('evalDetail.completedAt', lang)}{' '}
                {formatDate(evalDetail.completedAt, lang)}
              </p>
            </div>

            {/* Overall Score */}
            <div className="text-center">
              <div
                className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold ${getScoreBgColor(evalDetail.overallScore)} text-white`}
              >
                {evalDetail.overallScore}%
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {t('history.score', lang)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <Link
              href={`/resource/${evalDetail.resource.id}`}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              ← {t('history.backToResource', lang)}
            </Link>
            <Link
              href={`/evaluate/${evalDetail.resource.id}`}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              {t('history.newEvaluation', lang)} →
            </Link>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {evalDetail.questions.map((q, index) => (
            <div
              key={q.id}
              className="rounded-lg border border-stone-200 bg-white p-6"
            >
              {/* Question Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-sm font-medium text-stone-600">
                    {index + 1}
                  </span>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600">
                    {getQuestionTypeLabel(q.type, lang)}
                  </span>
                  {q.conceptName && (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      {q.conceptName}
                    </span>
                  )}
                </div>
                {q.response && (
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${getScoreColor(q.response.score)}`}
                  >
                    {q.response.score}%
                  </span>
                )}
              </div>

              {/* Question Text */}
              <p className="mb-4 text-stone-900">{q.question}</p>

              {q.response && (
                <>
                  {/* User Answer */}
                  <div className="mb-4 rounded-lg bg-stone-50 p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                      {t('evalDetail.yourAnswer', lang)}
                    </p>
                    <p className="whitespace-pre-wrap text-stone-700">
                      {q.response.userAnswer}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div
                    className={`rounded-lg p-4 ${
                      q.response.score >= 70
                        ? 'bg-green-50 border border-green-100'
                        : q.response.score >= 50
                          ? 'bg-amber-50 border border-amber-100'
                          : 'bg-red-50 border border-red-100'
                    }`}
                  >
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                      {t('evalDetail.feedback', lang)}
                    </p>
                    <p className="whitespace-pre-wrap text-stone-700">
                      {q.response.feedback}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href={`/resource/${evalDetail.resource.id}`}
            className="rounded-lg border border-stone-200 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            ← {t('history.backToResource', lang)}
          </Link>
          <Link
            href={`/evaluate/${evalDetail.resource.id}`}
            className="rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
          >
            {t('history.newEvaluation', lang)} →
          </Link>
        </div>
      </main>
    </div>
  );
}
