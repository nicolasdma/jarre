'use client';

import { TabbedSidebar } from '@/components/playground/tabbed-sidebar';

interface PlaygroundLayoutProps {
  accentColor: string;
  lessons: React.ReactNode;
  tutor?: React.ReactNode;
  hasNotification?: boolean;
  disableTutor?: boolean;
  children: React.ReactNode;
  /** Optional right panel (flex-[3]) */
  rightPanel?: React.ReactNode;
  /** Optional bottom panel with fixed height */
  bottomPanel?: React.ReactNode;
  /** Height class for bottom panel (default: "h-48") */
  bottomPanelHeight?: string;
  /** Flex ratio for the main content area (default: 5) */
  mainFlex?: number;
  /** Flex ratio for the center column when rightPanel is used (default: 4) */
  centerFlex?: number;
}

export function PlaygroundLayout({
  accentColor,
  lessons,
  tutor,
  hasNotification,
  disableTutor,
  children,
  rightPanel,
  bottomPanel,
  bottomPanelHeight = 'h-48',
  mainFlex = 5,
  centerFlex = 4,
}: PlaygroundLayoutProps) {
  const contentFlex = rightPanel ? centerFlex : mainFlex;

  const content = (
    <>
      {/* Left: TabbedSidebar */}
      <div className="flex-[2] shrink-0 border-r border-j-border overflow-hidden">
        <TabbedSidebar
          lessons={lessons}
          tutor={tutor}
          hasNotification={hasNotification}
          disableTutor={disableTutor}
          accentColor={accentColor}
        />
      </div>

      {/* Center/Main content */}
      <div className={`min-w-0`} style={{ flex: contentFlex }}>
        {children}
      </div>

      {/* Right panel */}
      {rightPanel && (
        <div className="flex-[3] min-w-0 overflow-y-auto">
          {rightPanel}
        </div>
      )}
    </>
  );

  if (bottomPanel) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 flex">
          {content}
        </div>
        <div className={`${bottomPanelHeight} shrink-0 border-t border-j-border`}>
          {bottomPanel}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {content}
    </div>
  );
}
