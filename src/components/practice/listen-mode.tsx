'use client';

import { useState } from 'react';
import { AudioBar, Chip } from './controls';
import type { DrillAudio } from './use-drill-audio';
import type { PracticeDrill } from './types';

export function ListenMode({ drill, audio }: { drill: PracticeDrill; audio: DrillAudio }) {
  const [showEs, setShowEs] = useState(false);
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
