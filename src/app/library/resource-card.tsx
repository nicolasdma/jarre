'use client';

import { useRouter } from 'next/navigation';
import { t, type Language } from '@/lib/translations';

// Resource type badge colors
const typeColors: Record<string, string> = {
  book: 'bg-amber-100 text-amber-700 border-amber-200',
  paper: 'bg-blue-100 text-blue-700 border-blue-200',
  video: 'bg-red-100 text-red-700 border-red-200',
  course: 'bg-green-100 text-green-700 border-green-200',
  article: 'bg-purple-100 text-purple-700 border-purple-200',
};

// Type icons (simple unicode)
const typeIcons: Record<string, string> = {
  book: '📖',
  paper: '📄',
  video: '🎬',
  course: '🎓',
  article: '📝',
};

interface EvalStats {
  resourceId: string;
  bestScore: number;
  lastEvaluatedAt: string;
  evalCount: number;
}

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    type: string;
    author?: string;
    description?: string;
    url?: string;
    estimated_hours?: number;
    isUnlocked: boolean;
    missingPrerequisites: string[];
    evalStats: EvalStats | null;
  };
  isLoggedIn: boolean;
  language: Language;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function getScoreRingColor(score: number): string {
  if (score >= 70) return 'stroke-green-500';
  if (score >= 50) return 'stroke-amber-500';
  return 'stroke-red-500';
}

function formatRelativeDate(dateString: string, lang: Language): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return lang === 'es' ? 'Hoy' : 'Today';
  if (diffDays === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
  if (diffDays < 7) return lang === 'es' ? `Hace ${diffDays} días` : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return lang === 'es' ? `Hace ${weeks} sem.` : `${weeks}w ago`;
  }
  const months = Math.floor(diffDays / 30);
  return lang === 'es' ? `Hace ${months} mes${months > 1 ? 'es' : ''}` : `${months}mo ago`;
}

// SVG Progress Ring
function ProgressRing({ score, size = 44 }: { score: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-stone-200"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className={getScoreRingColor(score)}
      />
    </svg>
  );
}

export function ResourceCard({ resource, isLoggedIn, language }: ResourceCardProps) {
  const router = useRouter();
  const isLocked = isLoggedIn && !resource.isUnlocked;
  const hasEvaluation = resource.evalStats !== null;

  const handleCardClick = () => {
    if (!isLocked) {
      router.push(`/resource/${resource.id}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={isLocked ? -1 : 0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`group relative block rounded-xl border bg-white transition-all duration-200 ${
        isLocked
          ? 'cursor-not-allowed border-stone-200 opacity-60'
          : 'cursor-pointer border-stone-200 hover:border-stone-300 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Card Content */}
      <div className="p-5">
        {/* Header: Type badge + Status indicator */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              typeColors[resource.type] || 'bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            <span>{typeIcons[resource.type] || '📚'}</span>
            {resource.type}
          </span>

          {/* Status: Locked, Unlocked, or Score */}
          {isLoggedIn && (
            <>
              {isLocked ? (
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('library.locked', language)}
                </span>
              ) : hasEvaluation ? (
                <div className="relative flex items-center justify-center">
                  <ProgressRing score={resource.evalStats!.bestScore} />
                  <span className="absolute text-xs font-bold text-stone-700">
                    {resource.evalStats!.bestScore}
                  </span>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('library.unlocked', language)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Title */}
        <h3 className={`mb-1 font-semibold leading-tight ${
          isLocked ? 'text-stone-500' : 'text-stone-900 group-hover:text-stone-700'
        }`}>
          {resource.title}
        </h3>

        {/* Author */}
        {resource.author && (
          <p className="mb-2 text-sm text-stone-500">{resource.author}</p>
        )}

        {/* Description */}
        {resource.description && (
          <p className="mb-3 text-sm text-stone-600 line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* Evaluation Stats (if has evaluations) */}
        {hasEvaluation && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2 text-xs">
            <span className={`font-medium ${
              resource.evalStats!.bestScore >= 70 ? 'text-green-600' :
              resource.evalStats!.bestScore >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {t('library.bestScore', language)}: {resource.evalStats!.bestScore}%
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500">
              {resource.evalStats!.evalCount} {resource.evalStats!.evalCount === 1
                ? t('library.attempt', language)
                : t('library.attempts', language)}
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500">
              {formatRelativeDate(resource.evalStats!.lastEvaluatedAt, language)}
            </span>
          </div>
        )}

        {/* Missing Prerequisites (if locked) */}
        {isLocked && resource.missingPrerequisites.length > 0 && (
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <span className="font-medium">{t('library.requires', language)}:</span>{' '}
            {resource.missingPrerequisites.slice(0, 2).join(', ')}
            {resource.missingPrerequisites.length > 2 && (
              <span> +{resource.missingPrerequisites.length - 2} {t('common.more', language)}</span>
            )}
          </div>
        )}

        {/* Footer: Time estimate + Actions */}
        <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-3">
          <div className="flex items-center gap-3 text-xs text-stone-500">
            {resource.estimated_hours && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {resource.estimated_hours}h
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!isLocked && (
            <div className="flex items-center gap-2">
              {resource.url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(resource.url, '_blank');
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  {t('common.open', language)}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/evaluate/${resource.id}`);
                }}
                className="rounded-md bg-stone-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-stone-800"
              >
                {t('common.evaluate', language)}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hover arrow indicator */}
      {!isLocked && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
