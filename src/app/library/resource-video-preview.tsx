import Image from 'next/image';
import { getYoutubeThumbnailUrl } from '@/lib/utils/youtube';

interface ResourceVideoPreviewProps {
  url?: string | null;
  title: string;
  className?: string;
  animateOnHover?: boolean;
}

export function ResourceVideoPreview({
  url,
  title,
  className = '',
  animateOnHover = true,
}: ResourceVideoPreviewProps) {
  const thumbnailUrl = getYoutubeThumbnailUrl(url);

  if (!thumbnailUrl) return null;

  return (
    <div
      className={`relative aspect-video overflow-hidden border border-j-border bg-j-bg-alt/50 ${className}`.trim()}
    >
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`object-cover transition-transform duration-300 ${
          animateOnHover ? 'group-hover:scale-105' : ''
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span className="absolute left-2 top-2 border border-white/20 bg-black/60 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] uppercase text-white">
        YouTube
      </span>
    </div>
  );
}
