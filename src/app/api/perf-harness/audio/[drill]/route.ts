import { readFileSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { localDrillAudio, perfLessonPath, readPerfLesson } from '@/lib/perf/lesson-fixture';

/**
 * A drill's local recording for /learn/perf-harness, with byte ranges (the
 * audio element seeks with them). 404 unless JARRE_PERF_LESSON is set.
 */
export async function GET(request: Request, { params }: { params: Promise<{ drill: string }> }) {
  const path = perfLessonPath();
  if (!path) return new NextResponse(null, { status: 404 });
  const { drill: drillId } = await params;
  const drill = readPerfLesson(path).drills.find((d) => d.id === drillId);
  const file = drill ? localDrillAudio(path, drill) : null;
  if (!file) return new NextResponse(null, { status: 404 });

  const body = readFileSync(file);
  const size = body.length;
  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  const headers = { 'Content-Type': 'audio/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  if (!range) return new NextResponse(body, { headers: { ...headers, 'Content-Length': String(size) } });

  const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
  const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
  if (start > end || start >= size) {
    return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  }
  return new NextResponse(body.subarray(start, end + 1), {
    status: 206,
    headers: { ...headers, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}` },
  });
}
