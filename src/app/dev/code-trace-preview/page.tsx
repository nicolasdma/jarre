import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TracePreview } from './trace-preview';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Code trace preview (dev) — Jarre',
  robots: { index: false, follow: false },
};

/**
 * DEV ONLY: every registered "Ver paso a paso" trace, no auth and no database,
 * to look at them while writing generators. 404 unless `next dev`.
 *
 *   npm run dev
 *   open http://localhost:3000/dev/code-trace-preview?id=two-sum&ex=0&step=4
 *
 * `id` picks the problem, `ex` the example, `step` the starting step (0-based);
 * `block=1` shows the code block with its "Ver paso a paso" button, as a lesson does.
 */
export default async function CodeTracePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; ex?: string; step?: string; block?: string }>;
}) {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { id, ex, step, block } = await searchParams;
  return <TracePreview id={id ?? null} example={Number(ex ?? 0) || 0} step={Number(step ?? 0) || 0} block={block === '1'} />;
}
