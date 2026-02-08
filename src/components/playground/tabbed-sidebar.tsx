'use client';

import { useState } from 'react';

interface TabbedSidebarProps {
  lessons: React.ReactNode;
  tutor: React.ReactNode;
  hasNotification: boolean;
  accentColor: string;
}

type Tab = 'lessons' | 'tutor';

export function TabbedSidebar({
  lessons,
  tutor,
  hasNotification,
  accentColor,
}: TabbedSidebarProps) {
  const [activeTab, setActiveTab] = useState<Tab>('lessons');

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-[#e8e6e0]">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`px-4 py-2.5 text-xs font-medium tracking-wide uppercase font-mono ${
            activeTab === 'lessons' ? '' : 'text-[#8a8780] hover:text-[#3a3935]'
          }`}
          style={
            activeTab === 'lessons'
              ? { color: accentColor, borderBottom: `2px solid ${accentColor}` }
              : undefined
          }
        >
          Lecciones
        </button>
        <button
          onClick={() => setActiveTab('tutor')}
          className={`px-4 py-2.5 text-xs font-medium tracking-wide uppercase font-mono flex items-center ${
            activeTab === 'tutor' ? '' : 'text-[#8a8780] hover:text-[#3a3935]'
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
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'lessons' ? lessons : tutor}
      </div>
    </div>
  );
}
