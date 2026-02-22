'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Language } from '@/lib/translations';
import { useTutorContext } from '@/lib/tutor-context';
import { createLogger } from '@/lib/logger';
import { TutorDialog } from './tutor-entity/TutorDialog';
import { useUnifiedVoiceSession } from './voice/use-unified-voice-session';
import { VoiceSidebarControls } from './voice/VoiceSidebarControls';

const log = createLogger('AppShell');

const TutorEntity = dynamic(
  () => import('./tutor-entity/TutorEntity').then((m) => ({ default: m.TutorEntity })),
  { ssr: false },
);

const MiniTutorEntity = dynamic(
  () => import('./tutor-entity/MiniTutorEntity').then((m) => ({ default: m.MiniTutorEntity })),
  { ssr: false },
);

const MobileVoiceOverlay = dynamic(
  () => import('./voice/MobileVoiceOverlay').then((m) => ({ default: m.MobileVoiceOverlay })),
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

/** Routes where the tutor sidebar is shown (internal app pages) */
const TUTOR_SIDEBAR_ROUTES = [
  '/evaluate',
  '/evaluation',
  '/review',
  '/learn',
  '/journal',
  '/mi-sistema',
  '/playground',
];

function useShouldShowSidebar(): boolean {
  const pathname = usePathname();
  return TUTOR_SIDEBAR_ROUTES.some((route) => pathname.startsWith(route));
}

export function AppShell({ children, language }: AppShellProps) {
  const [voiceOpen, setVoiceOpen] = useState(false);
  const showSidebar = useShouldShowSidebar();
  const { override } = useTutorContext();

  const effectiveMode = override?.mode ?? 'freeform';

  useEffect(() => {
    log.info(`[TutorOverride] mode=${effectiveMode}, resourceId=${override?.resourceId ?? 'none'}, concepts=${override?.concepts?.length ?? 0}, title=${override?.resourceTitle ?? 'none'}`);
  }, [effectiveMode, override]);

  const session = useUnifiedVoiceSession({
    mode: effectiveMode,
    language,
    resourceId: override?.resourceId,
    concepts: override?.concepts,
    resourceTitle: override?.resourceTitle,
    sectionId: override?.sectionId,
    sectionContent: override?.sectionContent,
    sectionTitle: override?.sectionTitle,
  });

  const startVoice = useCallback(async () => {
    setVoiceOpen(true);
    await session.start();
  }, [session]);

  const stopVoice = useCallback(() => {
    session.stop();
  }, [session]);

  const closeVoice = useCallback(() => {
    if (session.state === 'active' || session.state === 'connecting') {
      session.stop();
    }
    setVoiceOpen(false);
  }, [session]);

  // Voice session is "live" when it's doing anything beyond idle
  const isSessionLive = voiceOpen && session.state !== 'idle';
  // Pass voiceState to TutorEntity only when session is active
  const tutorVoiceState = isSessionLive ? session.tutorState : undefined;
  const tutorAnalyser = isSessionLive ? session.playbackAnalyser : null;
  const tutorMicStream = isSessionLive ? session.stream : null;

  return (
    <>
      <div className="flex h-screen">
        {/* Main content — scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>

        {/* Right panel — tutor sidebar (desktop, internal pages only) */}
        {showSidebar && (
          <aside className="hidden lg:flex lg:flex-col w-[420px] shrink-0 h-screen border-l border-j-accent/30 bg-j-bg">
            {/* Torus entity — fills remaining space */}
            <div className="flex-1 min-h-0">
              <TutorEntity
                onStartVoice={startVoice}
                playbackAnalyser={tutorAnalyser}
                micStream={tutorMicStream}
                voiceState={tutorVoiceState}
              />
            </div>

            {/* Voice session controls — shown when session is active */}
            {isSessionLive && (
              <div className="shrink-0">
                <VoiceSidebarControls
                  state={session.state}
                  elapsed={session.elapsed}
                  error={session.error}
                  transcript={session.transcript}
                  language={language}
                  onStop={stopVoice}
                  onRetry={() => session.retryPostProcess()}
                  onClose={closeVoice}
                />
              </div>
            )}

            {/* Dialog box — pinned to bottom (hidden during voice session) */}
            <div className={`shrink-0 px-3 pb-3 transition-opacity duration-500 ${
              isSessionLive ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-100'
            }`}>
              <TutorDialog messages={
                override?.resourceTitle
                  ? [effectiveMode === 'learning'
                      ? `Estudiando ${override.resourceTitle}. Si tenés dudas, click para preguntar.`
                      : effectiveMode === 'eval'
                        ? `Evaluación de ${override.resourceTitle}. Click para empezar.`
                        : `Practicando ${override.resourceTitle}. Click para iniciar.`
                    ]
                  : TUTOR_GREETING
              } />
            </div>
          </aside>
        )}
      </div>

      {/* Mobile mini-entity — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <MiniTutorEntity onStartVoice={startVoice} />
      </div>

      {/* Mobile: minimal voice overlay (no sidebar on mobile) */}
      {voiceOpen && (
        <MobileVoiceOverlay
          state={session.state}
          elapsed={session.elapsed}
          error={session.error}
          language={language}
          onStop={stopVoice}
          onRetry={() => session.retryPostProcess()}
          onClose={closeVoice}
        />
      )}
    </>
  );
}
