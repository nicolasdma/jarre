import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { t, type Language } from '@/lib/translations';

interface EvaluationHistoryProps {
  resourceId: string;
  language: Language;
}

interface EvaluationItem {
  id: string;
  overall_score: number;
  completed_at: string;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function formatDate(dateString: string, lang: Language): string {
  const date = new Date(dateString);
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function EvaluationHistory({ resourceId, language }: EvaluationHistoryProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch last 5 evaluations for this resource
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, overall_score, completed_at')
    .eq('user_id', user.id)
    .eq('resource_id', resourceId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  const evalItems = (evaluations || []) as EvaluationItem[];

  return (
    <div className="mb-8 rounded-lg border border-stone-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">
          {t('history.title', language)}
        </h2>
        <Link
          href={`/evaluate/${resourceId}`}
          className="text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          {t('history.newEvaluation', language)} →
        </Link>
      </div>

      {evalItems.length === 0 ? (
        <p className="text-sm text-stone-500">
          {t('history.empty', language)}
        </p>
      ) : (
        <div className="space-y-3">
          {evalItems.map((evaluation) => (
            <div
              key={evaluation.id}
              className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 p-3"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${getScoreColor(evaluation.overall_score)}`}
                >
                  {evaluation.overall_score}%
                </span>
                <span className="text-sm text-stone-600">
                  {formatDate(evaluation.completed_at, language)}
                </span>
              </div>
              <Link
                href={`/evaluation/${evaluation.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {t('history.viewDetail', language)} →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
