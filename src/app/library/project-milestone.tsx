'use client';

import { useState } from 'react';
import { t, type Language } from '@/lib/translations';

interface ProjectMilestoneProps {
  project: {
    id: string;
    title: string;
    phase: string;
    description: string;
    deliverables: string[];
    status: string;
    concepts: Array<{ id: string; name: string }>;
  };
  isLoggedIn: boolean;
  language: Language;
}

export function ProjectMilestone({ project, isLoggedIn, language }: ProjectMilestoneProps) {
  const [status, setStatus] = useState(project.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
      }
    } catch {
      // Silently fail - status will remain unchanged
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColor = {
    not_started: 'text-[#9c9a8e] border-[#e8e6e0]',
    in_progress: 'text-[#8b7355] border-[#8b7355]',
    completed: 'text-[#4a5d4a] border-[#4a5d4a]',
  }[status] || 'text-[#9c9a8e] border-[#e8e6e0]';

  const statusLabel = {
    not_started: t('project.notStarted', language),
    in_progress: t('project.inProgress', language),
    completed: t('project.completed', language),
  }[status] || status;

  return (
    <div className="my-12 relative">
      {/* Connector line */}
      <div className="absolute left-1/2 -top-6 w-px h-6 bg-[#e8e6e0]" />

      <div className={`border ${statusColor} p-6 bg-white/80`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#9c9a8e] uppercase">
            {t('project.milestone', language)} {project.phase}
          </span>
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-medium text-[#2c2c2c] mb-2">{project.title}</h3>
        <p className="text-sm text-[#7a7a6e] leading-relaxed mb-4">{project.description}</p>

        {/* Deliverables */}
        <div className="mb-4">
          <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-2">
            {t('project.deliverables', language)}
          </p>
          <ul className="space-y-1.5">
            {project.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#2c2c2c]">
                <span className={`mt-1 w-3 h-3 border ${
                  status === 'completed' ? 'bg-[#4a5d4a] border-[#4a5d4a]' : 'border-[#d4d0c8]'
                }`} />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Concepts mapped */}
        {project.concepts.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[10px] tracking-[0.15em] text-[#9c9a8e] uppercase mb-2">
              {t('project.concepts', language)}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.concepts.map((c) => (
                <span
                  key={c.id}
                  className="font-mono text-[10px] tracking-[0.1em] text-[#4a5d4a] border border-[#d4d0c8] px-2 py-0.5"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {isLoggedIn && status !== 'completed' && (
          <div className="flex gap-3 pt-2">
            {status === 'not_started' && (
              <button
                onClick={() => updateStatus('in_progress')}
                disabled={isUpdating}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
              >
                {t('project.start', language)}
              </button>
            )}
            {status === 'in_progress' && (
              <button
                onClick={() => updateStatus('completed')}
                disabled={isUpdating}
                className="font-mono text-[10px] tracking-[0.15em] bg-[#4a5d4a] text-[#f5f4f0] px-4 py-2 uppercase hover:bg-[#3d4d3d] transition-colors disabled:opacity-50"
              >
                {t('project.markComplete', language)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connector line bottom */}
      <div className="absolute left-1/2 -bottom-6 w-px h-6 bg-[#e8e6e0]" />
    </div>
  );
}
