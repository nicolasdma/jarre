'use client';

/**
 * The quiet side rail on wide screens (where a feed puts "suggested for
 * you"): the lesson, real progress numbers, what you saved, and the way to the
 * serious practice modes. Nothing here scrolls with the feed or asks for
 * anything.
 */

import Link from 'next/link';
import type { FeedStats } from './posts/milestone';

export function FeedRail({
  resourceId,
  lessonTitle,
  stats,
  savedCount,
}: {
  resourceId: string;
  lessonTitle: string | null;
  stats: FeedStats;
  savedCount: number;
}) {
  const base = `/learn/${encodeURIComponent(resourceId)}`;
  const modes = [
    { label: 'Escuchar', href: `${base}?step=practice&mode=listen` },
    { label: 'Repetir', href: `${base}?step=practice&mode=repeat` },
    { label: 'Pregunta → respuesta', href: `${base}?step=practice&mode=recall` },
    { label: 'Entrevista', href: `${base}?step=interview` },
  ];
  return (
    <div className="space-y-6 text-[13px] text-neutral-600 dark:text-neutral-400">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Repasando</p>
        <p className="mt-1 text-[15px] font-semibold leading-snug text-neutral-900 dark:text-neutral-100">{lessonTitle ?? 'Esta lección'}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <div>
          <dt className="text-[11px] text-neutral-500">vistos</dt>
          <dd className="font-mono text-[20px] font-bold text-neutral-900 dark:text-neutral-100">
            {stats.covered}
            <span className="text-[13px] font-normal text-neutral-500">/{stats.total}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-neutral-500">a repasar</dt>
          <dd className="font-mono text-[20px] font-bold text-neutral-900 dark:text-neutral-100">{stats.due}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-neutral-500">guardados</dt>
          <dd className="font-mono text-[20px] font-bold text-neutral-900 dark:text-neutral-100">{savedCount}</dd>
        </div>
      </dl>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">Practicar en serio</p>
        <ul className="space-y-1.5">
          {modes.map((m) => (
            <li key={m.label}>
              <Link href={m.href} className="text-neutral-800 hover:underline dark:text-neutral-200">
                {m.label} →
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[11px] leading-relaxed text-neutral-500">
        ↑ ↓ (o j / k): post siguiente o anterior · espacio: reproducir o pausar el audio del post · el parlante de arriba activa el sonido. Sin rachas, sin me-gusta: solo tu material, que vuelve espaciado.
      </p>
    </div>
  );
}
