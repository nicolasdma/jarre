import { readFileSync } from 'node:fs';
import { isDevelopment, previewAudioFile } from '../../preview-lesson';

/** Dev only: a preview drill's recording from disk. 404 outside `next dev`. */
export async function GET(_req: Request, { params }: { params: Promise<{ drill: string }> }) {
  if (!isDevelopment()) return new Response('Not found', { status: 404 });
  const { drill } = await params;
  const file = previewAudioFile(drill);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(readFileSync(file), {
    headers: { 'Content-Type': 'audio/mp4', 'Cache-Control': 'no-store' },
  });
}
