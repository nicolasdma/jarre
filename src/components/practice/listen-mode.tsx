'use client';

import { useEffect, useRef, useState } from 'react';
import { listenedThrough, newListenTrack, trackListen } from '@/lib/practice/drill-progress';
import { AudioBar, Chip } from './controls';
import type { DrillAudio } from './use-drill-audio';
import type { PracticeDrill } from './types';

export function ListenMode({
  drill,
  audio,
  onListened,
}: {
  drill: PracticeDrill;
  audio: DrillAudio;
  /** The audio was heard to its end here (lib/practice/drill-progress.ts): Escuchar is approved. */
  onListened?: () => void;
}) {
  const [showEs, setShowEs] = useState(false);

  // Follow the playhead while this mode is open; once it played through, report it once.
  const trackRef = useRef(newListenTrack());
  const reportedRef = useRef(false);
  const onListenedRef = useRef(onListened);
  useEffect(() => {
    onListenedRef.current = onListened;
  });
  // Subscribed to the clock directly: following the playhead never re-renders this mode.
  const { time, duration } = audio;
  useEffect(() => {
    const follow = () => {
      trackRef.current = trackListen(trackRef.current, time.get(), duration);
      if (!reportedRef.current && listenedThrough(trackRef.current)) {
        reportedRef.current = true;
        onListenedRef.current?.();
      }
    };
    follow();
    return time.subscribe(follow);
  }, [time, duration]);

  return (
    <div className="space-y-5" data-mode="listen">
      <AudioBar audio={audio} />
      <p className="text-lg leading-relaxed text-j-text-body sm:text-xl" lang="en">{drill.textEn}</p>
      {drill.textEs && (
        <div className="space-y-3">
          <Chip active={showEs} onClick={() => setShowEs((v) => !v)}>
            {showEs ? 'Ocultar traducción' : 'Ver traducción'}
          </Chip>
          {showEs && (
            <p className="border-l-2 border-j-warm pl-4 text-base leading-relaxed text-j-text-em" lang="es">
              {drill.textEs}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
