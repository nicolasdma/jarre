'use client';

import type { VideoSegment as VideoSegmentType } from '@/types';

interface VideoSegmentProps {
  segment: VideoSegmentType;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Embeds a YouTube video clip for a specific time range.
 * Uses native iframe with start/end params — no external dependencies.
 */
export function VideoSegment({ segment }: VideoSegmentProps) {
  const { youtubeVideoId, startSeconds, endSeconds, label } = segment;

  const src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?start=${startSeconds}&end=${endSeconds}&rel=0&hd=1&vq=hd1080`;

  return (
    <div className="my-6 border border-j-border rounded-lg overflow-hidden bg-j-bg-alt">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={src}
          title={label || `Video ${formatTime(startSeconds)} – ${formatTime(endSeconds)}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full"
        />
      </div>
      <div className="px-3 py-2 flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.1em] text-j-text-tertiary uppercase">
          {formatTime(startSeconds)} – {formatTime(endSeconds)}
        </span>
        {label && (
          <>
            <span className="text-j-border">·</span>
            <span className="text-xs text-j-text-secondary">{label}</span>
          </>
        )}
      </div>
    </div>
  );
}
