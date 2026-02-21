'use client';

import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Language } from '@/lib/translations';
import { TutorDialog } from './tutor-entity/TutorDialog';
import { useUnifiedVoiceSession } from './voice/use-unified-voice-session';
import { VoiceSidebarControls } from './voice/VoiceSidebarControls';

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

  const session = useUnifiedVoiceSession({
    mode: 'freeform',
    language,
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
              <TutorDialog messages={TUTOR_GREETING} />
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
