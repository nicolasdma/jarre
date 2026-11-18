import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildFeedGraph } from '@/lib/feed/feed-graph';
import { lessonFileGraphInput } from '@/lib/feed/lesson-file-graph';
import { Feed } from '@/components/feed/feed';
import { lessonVideos } from '@/lib/feed/lesson-videos';
import { isDevelopment, loadPreviewLesson, previewAudioFile, previewSegments, PREVIEW_ENV } from './preview-lesson';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feed preview (dev) — Jarre',
  robots: { index: false, follow: false },
};

/**
 * DEV ONLY: the feed over a lesson JSON on disk, no auth and no database, to
 * look at the cards while building them. 404 unless `next dev`
 * (NODE_ENV === 'development'). Run:
 *
 *   FEED_PREVIEW_LESSON=/path/to/lesson.json npm run dev
 *   open http://localhost:3000/dev/feed-preview
 *
 * `?day=YYYY-MM-DD` picks another day's feed (the generator's seed).
 */
export default async function FeedPreviewPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  if (!isDevelopment()) notFound();

  const loaded = loadPreviewLesson();
  if ('error' in loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-j-bg px-6">
        <p className="max-w-md font-mono text-sm text-j-text-secondary">
          {loaded.error}
          <br />
          <br />
          {PREVIEW_ENV}=/path/to/lesson.json npm run dev
        </p>
      </div>
    );
  }

  const input = lessonFileGraphInput(loaded.lesson, (drillId, textEn) =>
    previewAudioFile(drillId)
      ? { url: `/dev/feed-preview/audio/${drillId}`, segments: previewSegments(drillId, textEn) }
      : { url: null, segments: null },
  );
  const { day } = await searchParams;
  const seedDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : new Date().toISOString().slice(0, 10);
  const graph = buildFeedGraph({ ...input, videos: lessonVideos(loaded.lesson.id, seedDay) });

  return <Feed graph={graph} day={seedDay} />;
}
