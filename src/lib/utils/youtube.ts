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

export function getYoutubeThumbnailUrl(
  url: string | null | undefined,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'mqdefault'
): string | null {
  const videoId = extractYoutubeId(url ?? null);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
