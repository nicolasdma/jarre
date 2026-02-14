'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Review] Runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-j-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-j-border p-8 space-y-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-j-muted">
          Error en revision
        </p>
        <h1 className="text-xl text-j-text font-light">
          Algo salio mal durante la sesion de repaso.
        </h1>
        <p className="text-sm text-j-muted leading-relaxed">
          No se pudo cargar o procesar la sesion de repaso. Tu progreso
          anterior esta guardado.
        </p>
        <div className="flex gap-4 pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-j-accent text-j-bg text-xs font-mono tracking-[0.15em] uppercase hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
          <Link
            href="/library"
            className="px-4 py-2 border border-j-border text-j-text text-xs font-mono tracking-[0.15em] uppercase hover:bg-j-surface transition-colors"
          >
            Ir a biblioteca
          </Link>
        </div>
      </div>
    </div>
  );
}
