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
    not_started: 'text-j-text-tertiary border-j-border',
    in_progress: 'text-j-warm-dark border-j-warm-dark',
    completed: 'text-j-accent border-j-accent',
  }[status] || 'text-j-text-tertiary border-j-border';

  const statusLabel = {
    not_started: t('project.notStarted', language),
    in_progress: t('project.inProgress', language),
    completed: t('project.completed', language),
  }[status] || status;

  return (
    <div className="my-12 relative">
      {/* Connector line */}
      <div className="absolute left-1/2 -top-6 w-px h-6 bg-j-border" />

      <div className={`border ${statusColor} p-6 bg-j-bg-alt`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase">
            {t('project.milestone', language)} {project.phase}
          </span>
          <span className={`font-mono text-[10px] tracking-[0.15em] uppercase ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-medium text-j-text mb-2">{project.title}</h3>
        <p className="text-sm text-j-text-secondary leading-relaxed mb-4">{project.description}</p>

        {/* Deliverables */}
        <div className="mb-4">
          <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
            {t('project.deliverables', language)}
          </p>
          <ul className="space-y-1.5">
            {project.deliverables.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-j-text">
                <span className={`mt-1 w-3 h-3 border ${
                  status === 'completed' ? 'bg-j-accent border-j-accent' : 'border-j-border-input'
                }`} />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Concepts mapped */}
        {project.concepts.length > 0 && (
          <div className="mb-4">
            <p className="font-mono text-[10px] tracking-[0.15em] text-j-text-tertiary uppercase mb-2">
              {t('project.concepts', language)}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.concepts.map((c) => (
                <span
                  key={c.id}
                  className="font-mono text-[10px] tracking-[0.1em] text-j-accent border border-j-border-input px-2 py-0.5"
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
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
              >
                {t('project.start', language)}
              </button>
            )}
            {status === 'in_progress' && (
              <button
                onClick={() => updateStatus('completed')}
                disabled={isUpdating}
                className="font-mono text-[10px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-4 py-2 uppercase hover:bg-j-accent-hover transition-colors disabled:opacity-50"
              >
                {t('project.markComplete', language)}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Connector line bottom */}
      <div className="absolute left-1/2 -bottom-6 w-px h-6 bg-j-border" />
    </div>
  );
}
