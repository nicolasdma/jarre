/**
 * YouTube URL validation and ID extraction utilities.
 */

const YOUTUBE_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/;

export function extractYoutubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_REGEX);
  return match?.[1] ?? null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}
