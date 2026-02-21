'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { t, type Language } from '@/lib/translations';
import { QuickQuiz } from '@/components/quick-quiz';
import { CornerBrackets } from '@/components/ui/corner-brackets';

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  youtube: '▶',
  article: '📄',
  paper: '📑',
  book: '📖',
  lecture: '🎓',
  podcast: '🎙',
  other: '📌',
};

interface RelatedUserResource {
  id: string;
  title: string;
  type: string;
  url: string | null;
}

// Resources that skip learn and go directly to evaluate (e.g., no content yet)
const EVALUATE_ONLY_RESOURCES: string[] = [];

function shouldSkipLearn(resourceId: string): boolean {
  return EVALUATE_ONLY_RESOURCES.includes(resourceId);
}

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
    conceptsTaught: string[];
    evalStats: EvalStats | null;
    relatedUserResources: RelatedUserResource[];
  };
  isLoggedIn: boolean;
  language: Language;
}

function formatRelativeDate(dateString: string, lang: Language): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return lang === 'es' ? 'Hoy' : 'Today';
  if (diffDays === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
  if (diffDays < 7) return lang === 'es' ? `Hace ${diffDays} días` : `${diffDays}d ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return lang === 'es' ? `Hace ${weeks} sem.` : `${weeks}w ago`;
  }
  const months = Math.floor(diffDays / 30);
  return lang === 'es' ? `Hace ${months} mes${months > 1 ? 'es' : ''}` : `${months}mo ago`;
}

export function ResourceCard({ resource, isLoggedIn, language }: ResourceCardProps) {
  const router = useRouter();
  const [showQuiz, setShowQuiz] = useState(false);
  const isLocked = isLoggedIn && !resource.isUnlocked;
  const hasEvaluation = resource.evalStats !== null;

  const handleCardClick = () => {
    if (!isLocked) {
      if (shouldSkipLearn(resource.id)) {
        router.push(`/learn/${resource.id}`);
      } else {
        router.push(`/learn/${resource.id}`);
      }
    }
  };

  const getScoreDisplay = () => {
    if (!hasEvaluation) return null;
    const score = resource.evalStats!.bestScore;
    if (score >= 70) return { color: 'text-j-accent', label: 'MASTERED' };
    if (score >= 50) return { color: 'text-j-warm-dark', label: 'PROGRESS' };
    return { color: 'text-j-error', label: 'LEARNING' };
  };

  const scoreDisplay = getScoreDisplay();

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
      className={`group relative p-4 sm:p-6 transition-all duration-300 j-card-glow ${
        isLocked
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-j-bg-hover'
      }`}
    >
      {/* Left accent line for evaluated resources with corner caps */}
      {hasEvaluation && (() => {
        const colorClass = resource.evalStats!.bestScore >= 70
          ? 'bg-j-accent/40 group-hover:bg-j-accent'
          : resource.evalStats!.bestScore >= 50
            ? 'bg-j-warm-dark/40 group-hover:bg-j-warm-dark'
            : 'bg-j-error/40 group-hover:bg-j-error';
        return (
          <>
            <div className={`absolute left-0 top-0 bottom-0 w-[2px] transition-colors duration-300 ${colorClass}`} />
            <div className={`absolute left-[2px] top-0 h-[2px] w-[10px] transition-colors duration-300 ${colorClass}`} />
            <div className={`absolute left-[2px] bottom-0 h-[2px] w-[10px] transition-colors duration-300 ${colorClass}`} />
          </>
        );
      })()}

      {/* Corner brackets — hide left corners when line is present */}
      <CornerBrackets
        size="sm"
        hideLeft={hasEvaluation}
        className={`transition-colors duration-300 ${
          hasEvaluation
            ? 'border-j-accent/30 group-hover:border-j-accent'
            : `border-j-border-input ${!isLocked ? 'group-hover:border-j-accent' : ''}`
        }`}
      />

      {/* Type badge */}
      <div className="mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-j-accent uppercase px-2 py-0.5 rounded-full bg-j-accent/10 border border-j-accent/20">
          {resource.type}
        </span>
      </div>

      {/* Title */}
      <h3 className={`text-lg font-medium leading-tight mb-1 ${
        isLocked ? 'text-j-text-tertiary' : 'text-j-text'
      }`}>
        {resource.title}
      </h3>

      {/* Author */}
      {resource.author && (
        <p className="text-sm text-j-text-secondary mb-3">{resource.author}</p>
      )}

      {/* Description */}
      {resource.description && (
        <p className="text-sm text-j-text-secondary leading-relaxed line-clamp-2 mb-4">
          {resource.description}
        </p>
      )}

      {/* Evaluation Stats */}
      {hasEvaluation && scoreDisplay && (
        <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-j-border bg-j-bg-alt/50 -mx-2 px-2 rounded">
          <div>
            <span className={`text-2xl font-light ${scoreDisplay.color}`}>
              {resource.evalStats!.bestScore}
            </span>
            <span className="text-j-text-tertiary text-sm">%</span>
          </div>
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              {scoreDisplay.label}
            </p>
            <p className="text-xs text-j-text-secondary">
              {resource.evalStats!.evalCount} {resource.evalStats!.evalCount === 1
                ? t('library.attempt', language)
                : t('library.attempts', language)} · {formatRelativeDate(resource.evalStats!.lastEvaluatedAt, language)}
            </p>
          </div>
        </div>
      )}

      {/* Locked message */}
      {isLocked && resource.missingPrerequisites.length > 0 && (
        <div className="mb-4 py-2">
          <p className="font-mono text-[10px] tracking-[0.15em] text-j-warm-muted uppercase">
            {t('library.requires', language)}
          </p>
          <p className="text-xs text-j-warm-dark mt-1">
            {resource.missingPrerequisites.slice(0, 2).join(', ')}
            {resource.missingPrerequisites.length > 2 && (
              <span> +{resource.missingPrerequisites.length - 2} {t('common.more', language)}</span>
            )}
          </p>
        </div>
      )}

      {/* Related user resources */}
      {resource.relatedUserResources.length > 0 && (
        <div className="mb-4 py-2 border-t border-dashed border-j-border">
          <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
            {language === 'es' ? 'Tus recursos' : 'Your resources'}
          </p>
          <div className="space-y-1">
            {resource.relatedUserResources.slice(0, 2).map((ur) => (
              <Link
                key={ur.id}
                href={`/resources/${ur.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-sm text-j-text-secondary hover:text-j-accent transition-colors group/ur"
              >
                <span className="text-xs flex-shrink-0">{RESOURCE_TYPE_ICONS[ur.type] || '📌'}</span>
                <span className="truncate group-hover/ur:underline">{ur.title}</span>
              </Link>
            ))}
            {resource.relatedUserResources.length > 2 && (
              <p className="font-mono text-[10px] text-j-text-tertiary pl-5">
                +{resource.relatedUserResources.length - 2} {language === 'es' ? 'más' : 'more'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
          {resource.estimated_hours && (
            <span className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase">
              {resource.estimated_hours}h
            </span>
          )}
          {isLoggedIn && (
            <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
              isLocked
                ? 'text-j-warm-muted'
                : hasEvaluation
                  ? 'text-j-accent'
                  : 'text-j-accent-muted'
            }`}>
              {isLocked ? t('library.locked', language) : hasEvaluation ? t('library.evaluated', language) : t('library.unlocked', language)}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isLocked && (
          <div className="flex items-center gap-3">
            {resource.url && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(resource.url, '_blank');
                }}
                className="font-mono text-[10px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-accent transition-colors min-h-[44px] flex items-center"
              >
                {t('common.open', language)}
              </button>
            )}
            {resource.conceptsTaught.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowQuiz(true);
                }}
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-2 sm:py-1.5 uppercase hover:border-j-accent hover:text-j-accent transition-colors min-h-[44px] flex items-center"
              >
                {t('quiz.review', language)}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/learn/${resource.id}`);
              }}
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-3 py-2 sm:py-1.5 uppercase hover:bg-j-accent-hover transition-colors min-h-[44px] flex items-center"
            >
              {t('common.evaluate', language)}
            </button>
          </div>
        )}
      </div>

      {/* Quiz panel */}
      {showQuiz && (
        <QuickQuiz
          language={language}
          conceptIds={resource.conceptsTaught}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  );
}
