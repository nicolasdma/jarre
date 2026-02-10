'use client';

import { useState } from 'react';

interface TabbedSidebarProps {
  lessons: React.ReactNode;
  tutor?: React.ReactNode;
  hasNotification?: boolean;
  accentColor: string;
  /** Hide the tutor tab entirely */
  disableTutor?: boolean;
}

type Tab = 'lessons' | 'tutor';

export function TabbedSidebar({
  lessons,
  tutor,
  hasNotification,
  accentColor,
  disableTutor,
}: TabbedSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('lessons');
  const showTutor = !disableTutor && tutor;

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-j-border">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-4 py-2.5 text-xs font-medium tracking-wide uppercase font-mono ${
            activeTab === 'lessons' || !showTutor ? '' : 'text-j-text-tertiary hover:text-j-text'
          }`}
          style={
            activeTab === 'lessons' || !showTutor
              ? { color: accentColor, borderBottom: `2px solid ${accentColor}` }
              : undefined
          }
        >
          Lecciones
        </button>
        {showTutor && (
          <button
            onClick={() => setActiveTab('tutor')}
            className={`px-4 py-2.5 text-xs font-medium tracking-wide uppercase font-mono flex items-center ${
              activeTab === 'tutor' ? '' : 'text-j-text-tertiary hover:text-j-text'
            }`}
            style={
              activeTab === 'tutor'
                ? { color: accentColor, borderBottom: `2px solid ${accentColor}` }
                : undefined
            }
          >
            Tutor IA
            {hasNotification && activeTab !== 'tutor' && (
              <span
                className="w-1.5 h-1.5 rounded-full ml-1.5"
                style={{ backgroundColor: accentColor }}
              />
            )}
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'lessons' || !showTutor ? lessons : tutor}
      </div>
    </div>
  );
}
