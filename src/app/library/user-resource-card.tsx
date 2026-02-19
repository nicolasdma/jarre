'use client';

import Link from 'next/link';
import { CornerBrackets } from '@/components/ui/corner-brackets';
import type { Language } from '@/lib/translations';

interface UserResource {
  id: string;
  title: string;
  type: string;
  status: string;
  summary: string | null;
  coverage_score: number | null;
  created_at: string;
  url: string | null;
}

interface UserResourceCardProps {
  resource: UserResource;
  language: Language;
}

const TYPE_ICONS: Record<string, string> = {
  youtube: '▶',
  article: '📄',
  paper: '📑',
  book: '📖',
  podcast: '🎙',
  other: '📌',
};

function formatDate(dateString: string, lang: Language): string {
  return new Date(dateString).toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function UserResourceCard({ resource, language }: UserResourceCardProps) {
  const isEs = language === 'es';
  const icon = TYPE_ICONS[resource.type] || '📌';
  const coveragePct = resource.coverage_score != null ? Math.round(resource.coverage_score * 100) : null;

  return (
    <Link
      href={`/resources/${resource.id}`}
      className="group relative block p-6 transition-all duration-300 cursor-pointer hover:bg-j-bg-hover border border-dashed border-j-border hover:border-j-accent"
    >
      <CornerBrackets
        size="sm"
        className="border-j-border transition-colors duration-300 group-hover:border-j-accent"
      />

      {/* Type + External badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
          {resource.type}
        </span>
        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-j-accent/10 text-j-accent border border-j-accent/20">
          {isEs ? 'externo' : 'external'}
        </span>
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-2 mb-3">
        <span className="text-lg shrink-0">{icon}</span>
        <h3 className="text-base font-medium leading-tight text-j-text group-hover:text-j-accent transition-colors line-clamp-2">
          {resource.title}
        </h3>
      </div>

      {/* Summary */}
      {resource.summary && (
        <p className="text-xs text-j-text-secondary leading-relaxed line-clamp-2 mb-4">
          {resource.summary}
        </p>
      )}

      {/* Coverage bar */}
      {coveragePct != null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] text-j-text-tertiary uppercase">
              {isEs ? 'Cobertura' : 'Coverage'}
            </span>
            <span className="font-mono text-[10px] text-j-accent">{coveragePct}%</span>
          </div>
          <div className="h-1 bg-j-border rounded-full overflow-hidden">
            <div
              className="h-full bg-j-accent rounded-full transition-all"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="font-mono text-[10px] text-j-text-tertiary">
          {formatDate(resource.created_at, language)}
        </span>
        <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
          resource.status === 'completed' ? 'text-j-accent' :
          resource.status === 'failed' ? 'text-j-error' :
          'text-j-text-tertiary'
        }`}>
          {resource.status === 'completed' ? (isEs ? 'analizado' : 'analyzed') :
           resource.status === 'failed' ? (isEs ? 'error' : 'failed') :
           (isEs ? 'procesando' : 'processing')}
        </span>
      </div>
    </Link>
  );
}
