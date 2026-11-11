import { redirect } from 'next/navigation';
import { drillModeFromParam } from '@/components/practice/types';

/**
 * The practice page lives inside the lesson now: drills under each section, a
 * Practice step with every drill and mode, and the interview mock as the last
 * step, all at /learn/<id>. Old links keep working:
 * `/resource/<id>/practice?drill=<slug>&mode=<mode>` opens the same drill and
 * mode in the Practice step, and `?mode=interview` opens the interview.
 */

interface PageProps {
  params: Promise<{ resourceId: string }>;
  searchParams: Promise<{ drill?: string; mode?: string }>;
}

export default async function PracticePage({ params, searchParams }: PageProps) {
  const { resourceId } = await params;
  const { drill, mode } = await searchParams;
  const query = new URLSearchParams();
  if (mode === 'interview') {
    query.set('step', 'interview');
  } else {
    query.set('step', 'practice');
    if (drill) query.set('drill', drill);
    const drillMode = drillModeFromParam(mode);
    if (drillMode) query.set('mode', drillMode);
  }
  redirect(`/learn/${encodeURIComponent(resourceId)}?${query.toString()}`);
}
