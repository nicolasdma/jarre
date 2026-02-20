'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Language } from '@/lib/translations';
import { TutorDialog } from './tutor-entity/TutorDialog';

const TutorEntity = dynamic(
  () => import('./tutor-entity/TutorEntity').then((m) => ({ default: m.TutorEntity })),
  { ssr: false },
);

const MiniTutorEntity = dynamic(
  () => import('./tutor-entity/MiniTutorEntity').then((m) => ({ default: m.MiniTutorEntity })),
  { ssr: false },
);

const VoiceSessionOverlay = dynamic(
  () => import('./voice/VoiceSessionOverlay').then((m) => ({ default: m.VoiceSessionOverlay })),
  { ssr: false },
);

interface AppShellProps {
  children: React.ReactNode;
  language: Language;
}

// Placeholder messages — will be replaced with real tutor state
const TUTOR_GREETING = [
  'Ready when you are. Click me to start a session.',
];

export function AppShell({ children, language }: AppShellProps) {
  const [voiceOpen, setVoiceOpen] = useState(false);

  return (
    <>
      <div className="flex h-screen">
        {/* Left panel — scrollable app content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>

        {/* Right panel — persistent tutor entity (desktop only) */}
        <aside className="hidden lg:flex lg:flex-col w-[420px] shrink-0 h-screen border-l border-j-accent/30 bg-j-bg">
          {/* Torus entity — fills remaining space */}
          <div className="flex-1 min-h-0">
            <TutorEntity
              onStartVoice={() => setVoiceOpen(true)}
              hidden={voiceOpen}
            />
          </div>

          {/* Dialog box — pinned to bottom */}
          <div className={`shrink-0 px-3 pb-3 transition-opacity duration-500 ${
            voiceOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <TutorDialog messages={TUTOR_GREETING} />
          </div>
        </aside>
      </div>

      {/* Mobile mini-entity — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <MiniTutorEntity onStartVoice={() => setVoiceOpen(true)} />
      </div>

      {voiceOpen && (
        <VoiceSessionOverlay
          mode="freeform"
          onClose={() => setVoiceOpen(false)}
          language={language}
        />
      )}
    </>
  );
}
