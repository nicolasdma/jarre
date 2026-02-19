'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RefreshCw, Loader2 } from 'lucide-react';
import type { Language } from '@/lib/translations';

interface ResourceActionsProps {
  resourceId: string;
  language: Language;
  showDelete?: boolean;
  showRetry?: boolean;
}

export function ResourceActions({ resourceId, language, showDelete, showRetry }: ResourceActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const isEs = language === 'es';

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/library');
        router.refresh();
      }
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/retry`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      setRetrying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-j-accent text-j-accent rounded hover:bg-j-accent/10 transition-colors disabled:opacity-50"
        >
          {retrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {isEs ? 'Reintentar' : 'Retry'}
        </button>
      )}
      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border rounded transition-colors disabled:opacity-50 ${
            confirming
              ? 'border-j-error text-j-error hover:bg-j-error/10'
              : 'border-j-border text-j-text-tertiary hover:border-j-error hover:text-j-error'
          }`}
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          {confirming
            ? (isEs ? 'Confirmar' : 'Confirm')
            : (isEs ? 'Eliminar' : 'Delete')}
        </button>
      )}
      {confirming && !deleting && (
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-mono text-j-text-tertiary hover:text-j-text transition-colors"
        >
          {isEs ? 'Cancelar' : 'Cancel'}
        </button>
      )}
    </div>
  );
}
