'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Library] Runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-j-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-j-border p-8 space-y-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-j-muted">
          Error en biblioteca
        </p>
        <h1 className="text-xl text-j-text font-light">
          No se pudo cargar la biblioteca.
        </h1>
        <p className="text-sm text-j-muted leading-relaxed">
          Hubo un problema al obtener tus recursos. Intenta de nuevo o vuelve
          al inicio.
        </p>
        <div className="flex gap-4 pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 bg-j-accent text-j-bg text-xs font-mono tracking-[0.15em] uppercase hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-j-border text-j-text text-xs font-mono tracking-[0.15em] uppercase hover:bg-j-surface transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
