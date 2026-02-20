'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertTriangle, Swords, X } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface InsightSuggestion {
  id: string;
  type: 'mastery_catalyst' | 'gap_detection' | 'debate_topic';
  title: string;
  description: string;
  action_type: string;
  action_payload: Record<string, any>;
  priority: number;
}

interface InsightBarProps {
  language: Language;
  onDebate?: (topic: string, position: string, conceptIds: string[]) => void;
  onFreeform?: () => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof Sparkles; color: string }> = {
  mastery_catalyst: { icon: Sparkles, color: 'text-j-accent' },
  gap_detection: { icon: AlertTriangle, color: 'text-j-warm-dark' },
  debate_topic: { icon: Swords, color: 'text-j-error' },
};

export function InsightBar({ language, onDebate, onFreeform }: InsightBarProps) {
  const router = useRouter();
  const [insights, setInsights] = useState<InsightSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const isEs = language === 'es';

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => r.ok ? r.json() : { suggestions: [] })
      .then((data) => setInsights((data.suggestions || []).slice(0, 3)))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, []);

  const dismiss = async (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
    await fetch('/api/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'dismissed' }),
    }).catch(() => {});
  };

  const handleAction = (insight: InsightSuggestion) => {
    const payload = insight.action_payload;
    switch (insight.action_type) {
      case 'explore':
        if (payload.userResourceId) {
          router.push(`/resources/${payload.userResourceId}`);
        }
        break;
      case 'freeform':
        onFreeform?.();
        break;
      case 'debate':
        onDebate?.(
          payload.topic || insight.title,
          payload.position || insight.title,
          payload.conceptIds || [],
        );
        break;
      case 'review':
        router.push('/review');
        break;
    }
    // Mark as accepted
    fetch('/api/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: insight.id, status: 'accepted' }),
    }).catch(() => {});
    setInsights((prev) => prev.filter((i) => i.id !== insight.id));
  };

  if (loading || insights.length === 0) return null;

  return (
    <div className="mb-10">
      <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-3">
        {isEs ? 'Sugerencias' : 'Suggestions'}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.mastery_catalyst;
          const Icon = config.icon;

          return (
            <div
              key={insight.id}
              className="relative p-4 border border-j-border rounded-lg hover:border-j-accent/30 transition-colors group"
            >
              <button
                onClick={() => dismiss(insight.id)}
                className="absolute top-1 right-1 p-2 text-j-text-tertiary hover:text-j-text sm:opacity-0 group-hover:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={14} />
              </button>

              <div className="flex items-start gap-3">
                <Icon size={16} className={`${config.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-j-text line-clamp-1">{insight.title}</p>
                  <p className="text-xs text-j-text-tertiary mt-1 line-clamp-2">{insight.description}</p>
                  <button
                    onClick={() => handleAction(insight)}
                    className="mt-2 font-mono text-[10px] tracking-[0.15em] text-j-accent uppercase hover:text-j-accent-hover transition-colors"
                  >
                    {insight.action_type === 'explore' ? (isEs ? 'Explorar →' : 'Explore →') :
                     insight.action_type === 'debate' ? (isEs ? 'Debatir →' : 'Debate →') :
                     insight.action_type === 'freeform' ? (isEs ? 'Charlar →' : 'Chat →') :
                     (isEs ? 'Revisar →' : 'Review →')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
