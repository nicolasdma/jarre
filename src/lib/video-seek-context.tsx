'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { VideoSegment } from '@/types';

interface VideoSeekContextValue {
  seekTo: (seconds: number) => void;
  videoSegments: VideoSegment[];
}

const VideoSeekContext = createContext<VideoSeekContextValue | null>(null);

export function useVideoSeek(): VideoSeekContextValue | null {
  return useContext(VideoSeekContext);
}

interface VideoSeekProviderProps {
  children: ReactNode;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  videoSegments: VideoSegment[];
}

export function VideoSeekProvider({ children, iframeRef, videoSegments }: VideoSeekProviderProps) {
  const seekTo = useCallback(
    (seconds: number) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
    },
    [iframeRef]
  );

  return (
    <VideoSeekContext.Provider value={{ seekTo, videoSegments }}>
      {children}
    </VideoSeekContext.Provider>
  );
}
