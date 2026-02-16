'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { t, type Language } from '@/lib/translations';
import { QuickQuiz } from '@/components/quick-quiz';

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

// Corner bracket component for decorative framing
function CornerBrackets({ className = '' }: { className?: string }) {
  return (
    <>
      {/* Top left */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-l border-t ${className}`} />
      {/* Top right */}
      <div className={`absolute top-0 right-0 w-3 h-3 border-r border-t ${className}`} />
      {/* Bottom left */}
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-l border-b ${className}`} />
      {/* Bottom right */}
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-r border-b ${className}`} />
    </>
  );
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
      className={`group relative p-6 transition-all duration-300 ${
        isLocked
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:bg-j-bg-hover'
      }`}
    >
      {/* Corner brackets */}
      <CornerBrackets className={`border-j-border-input transition-colors duration-300 ${!isLocked ? 'group-hover:border-j-accent' : ''}`} />

      {/* Type label */}
      <div className="mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
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
        <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-j-border">
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
                className="font-mono text-[10px] tracking-[0.15em] text-j-text-secondary uppercase hover:text-j-accent transition-colors"
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
                className="font-mono text-[10px] tracking-[0.15em] border border-j-border-input text-j-text-secondary px-3 py-1.5 uppercase hover:border-j-accent hover:text-j-accent transition-colors"
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
              className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-3 py-1.5 uppercase hover:bg-j-accent-hover transition-colors"
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
