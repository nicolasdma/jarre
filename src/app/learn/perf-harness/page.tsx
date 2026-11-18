import { notFound } from 'next/navigation';
import { LearnFlow } from '@/components/learn-flow';
import { FIGURE_REGISTRY } from '@/lib/figure-registry';
import { perfLessonPath, perfLessonProps } from '@/lib/perf/lesson-fixture';

/**
 * The learn view of a lesson read from disk, with no session: the same
 * LearnFlow tree /learn/<id> mounts (inside the same AppShell, sidebar
 * included), to measure CPU, frames, heap and renders locally.
 *
 * Off unless JARRE_PERF_LESSON points at a lesson JSON; never set in
 * Vercel, so this is a 404 there. Audio comes from the lesson's own
 * `audios/` folder through /api/perf-harness/audio/<drill>.
 */
export const dynamic = 'force-dynamic';

export default function PerfHarnessPage() {
  const path = perfLessonPath();
  if (!path) notFound();
  const lesson = perfLessonProps(path, (drillId) => `/api/perf-harness/audio/${encodeURIComponent(drillId)}`);
  return (
    <LearnFlow
      language="es"
      resourceId={lesson.resourceId}
      resourceTitle={lesson.resourceTitle}
      resourceType="article"
      resourceUrl={null}
      sections={lesson.sections}
      activateComponent={undefined}
      activateSummary={lesson.activateSummary}
      practice={{ drills: lesson.drills, interviewConfig: lesson.interviewConfig }}
      concepts={lesson.concepts}
      userId="perf-harness"
      figureRegistry={FIGURE_REGISTRY}
      quizzesBySectionId={lesson.quizzesBySectionId}
      videoSegmentsBySectionId={{}}
    />
  );
}
