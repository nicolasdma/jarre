'use client';

import { forwardRef } from 'react';

interface StickyVideoPlayerProps {
  youtubeVideoId: string;
}

/**
 * Single YouTube player rendered inline at the top of the learn step.
 * Uses enablejsapi=1 so seekTo commands can be sent via postMessage.
 */
export const StickyVideoPlayer = forwardRef<HTMLIFrameElement, StickyVideoPlayerProps>(
  function StickyVideoPlayer({ youtubeVideoId }, ref) {
    const src = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?enablejsapi=1&rel=0&hd=1&vq=hd1080`;

    return (
      <div className="mb-8 rounded-lg overflow-hidden border border-j-border bg-black">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            ref={ref}
            src={src}
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    );
  }
);
