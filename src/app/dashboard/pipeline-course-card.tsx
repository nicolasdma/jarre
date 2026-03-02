import Link from 'next/link';
import Image from 'next/image';
import { Play, BookOpen } from 'lucide-react';
import type { Language } from '@/lib/translations';
import { extractYoutubeId } from '@/lib/utils/youtube';

export interface PipelineCourseData {
  id: string;
  title: string;
  type: string;
  url: string | null;
  summary: string | null;
  sectionCount: number;
  createdAt: string;
  isOwner: boolean;
  evalStats: {
    bestScore: number;
    evalCount: number;
  } | null;
  progress: {
    activeSection: number;
    completedSections: number[];
  } | null;
}

function relativeDate(dateStr: string, lang: Language): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return lang === 'es' ? 'Hoy' : 'Today';
  if (days === 1) return lang === 'es' ? 'Ayer' : 'Yesterday';
  if (days < 7) return lang === 'es' ? `Hace ${days} días` : `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return lang === 'es' ? `Hace ${weeks} sem` : `${weeks}w ago`;
  }
  const months = Math.floor(days / 30);
  return lang === 'es' ? `Hace ${months} mes${months > 1 ? 'es' : ''}` : `${months}mo ago`;
}

export function PipelineCourseCard({
  course,
  language,
}: {
  course: PipelineCourseData;
  language: Language;
}) {
  const videoId = extractYoutubeId(course.url);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  const completedCount = course.progress?.completedSections?.length ?? 0;
  const progressPercent = course.sectionCount > 0 ? (completedCount / course.sectionCount) * 100 : 0;
  const isVideo = course.type === 'video';

  return (
    <Link
      href={`/learn/${course.id}`}
      aria-label={`${course.title} — ${course.sectionCount} ${course.sectionCount === 1 ? (language === 'es' ? 'sección' : 'section') : (language === 'es' ? 'secciones' : 'sections')}`}
      className="group relative block overflow-hidden rounded-xl border bg-j-surface transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-j-border hover:border-j-accent/50 focus-visible:ring-2 focus-visible:ring-j-accent focus-visible:outline-none"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-j-border/30 overflow-hidden">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play size={32} className="text-j-text-tertiary" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-j-bg/85 backdrop-blur-sm px-2 py-0.5 rounded-full">
          {isVideo ? (
            <Play size={10} className="text-j-accent" />
          ) : (
            <BookOpen size={10} className="text-j-accent" />
          )}
          <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-j-text-secondary">
            {isVideo ? 'Video' : 'Lecture'}
          </span>
        </div>

        {/* Eval badge overlay */}
        {course.evalStats && (
          <div className="absolute top-2.5 right-2.5 bg-j-bg/85 backdrop-blur-sm px-2 py-0.5 rounded-full font-mono text-[10px] text-j-accent">
            {course.evalStats.bestScore}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-3">
        <h3 className="text-sm font-medium text-j-text group-hover:text-j-accent transition-colors line-clamp-2 leading-snug">
          {course.title}
        </h3>

        {course.summary && (
          <p className="text-xs text-j-text-tertiary mt-1.5 line-clamp-2 leading-relaxed">
            {course.summary}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-3">
          <span className="font-mono text-[10px] text-j-text-tertiary">
            {course.sectionCount} {course.sectionCount === 1
              ? (language === 'es' ? 'sección' : 'section')
              : (language === 'es' ? 'secciones' : 'sections')}
          </span>
          <span className="text-j-border">·</span>
          <span className="font-mono text-[10px] text-j-text-tertiary">
            {relativeDate(course.createdAt, language)}
          </span>
        </div>

        {/* Progress bar */}
        {course.progress && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-j-border/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-j-accent rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, 3)}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-j-accent shrink-0">
              {completedCount}/{course.sectionCount}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
