'use client';

import { useRouter } from 'next/navigation';
import { t, type Language } from '@/lib/translations';

// Resources that have learn pages (deep explanations or playgrounds)
const RESOURCES_WITH_LEARN_PAGES = ['ddia-ch1', 'ddia-ch2', 'ddia-ch3', 'ddia-ch5', 'ddia-ch6', 'ddia-ch8', 'ddia-ch9'];

function hasLearnPage(resourceId: string): boolean {
  return RESOURCES_WITH_LEARN_PAGES.includes(resourceId);
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
  const isLocked = isLoggedIn && !resource.isUnlocked;
  const hasEvaluation = resource.evalStats !== null;

  const handleCardClick = () => {
    if (!isLocked) {
      if (hasLearnPage(resource.id)) {
        router.push(`/learn/${resource.id}`);
      } else {
        router.push(`/evaluate/${resource.id}`);
      }
    }
  };

  const getScoreDisplay = () => {
    if (!hasEvaluation) return null;
    const score = resource.evalStats!.bestScore;
    if (score >= 70) return { color: 'text-[#4a5d4a]', label: 'MASTERED' };
    if (score >= 50) return { color: 'text-[#8b7355]', label: 'PROGRESS' };
    return { color: 'text-[#7d6b6b]', label: 'LEARNING' };
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
          : 'cursor-pointer hover:bg-[#f8f7f4]'
      }`}
    >
      {/* Corner brackets */}
      <CornerBrackets className={`border-[#d4d0c8] transition-colors duration-300 ${!isLocked ? 'group-hover:border-[#4a5d4a]' : ''}`} />

      {/* Type label */}
      <div className="mb-4">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
          {resource.type}
        </span>
      </div>

      {/* Title */}
      <h3 className={`text-lg font-medium leading-tight mb-1 ${
        isLocked ? 'text-[#9c9a8e]' : 'text-[#2c2c2c]'
      }`}>
        {resource.title}
      </h3>

      {/* Author */}
      {resource.author && (
        <p className="text-sm text-[#7a7a6e] mb-3">{resource.author}</p>
      )}

      {/* Description */}
      {resource.description && (
        <p className="text-sm text-[#7a7a6e] leading-relaxed line-clamp-2 mb-4">
          {resource.description}
        </p>
      )}

      {/* Evaluation Stats */}
      {hasEvaluation && scoreDisplay && (
        <div className="flex items-center gap-4 mb-4 py-3 border-t border-b border-[#e8e6e0]">
          <div>
            <span className={`text-2xl font-light ${scoreDisplay.color}`}>
              {resource.evalStats!.bestScore}
            </span>
            <span className="text-[#9c9a8e] text-sm">%</span>
          </div>
          <div className="flex-1">
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              {scoreDisplay.label}
            </p>
            <p className="text-xs text-[#7a7a6e]">
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
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#b5a48b] uppercase">
            {t('library.requires', language)}
          </p>
          <p className="text-xs text-[#8b7355] mt-1">
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
            <span className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase">
              {resource.estimated_hours}h
            </span>
          )}
          {isLoggedIn && (
            <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${
              isLocked
                ? 'text-[#b5a48b]'
                : hasEvaluation
                  ? 'text-[#4a5d4a]'
                  : 'text-[#6b7c6b]'
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
                className="font-mono text-[10px] tracking-[0.15em] text-[#7a7a6e] uppercase hover:text-[#4a5d4a] transition-colors"
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
              className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-3 py-1.5 uppercase hover:bg-[#3d4d3d] transition-colors"
            >
              {t('common.evaluate', language)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
