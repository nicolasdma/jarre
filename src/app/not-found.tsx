import Link from 'next/link';
import { Header } from '@/components/header';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-j-bg">
      <Header />

      <main className="mx-auto max-w-6xl px-8 py-16 text-center">
        <p className="text-8xl font-light text-j-text mb-4">404</p>
        <p className="font-mono text-[10px] tracking-[0.2em] text-j-text-tertiary uppercase mb-8">
          Página no encontrada
        </p>
        <Link
          href="/"
          className="font-mono text-[11px] tracking-[0.15em] bg-j-accent text-j-text-on-accent px-6 py-3 uppercase hover:bg-j-accent-hover transition-colors"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
