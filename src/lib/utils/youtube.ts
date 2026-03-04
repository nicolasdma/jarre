/**
 * YouTube URL validation and ID extraction utilities.
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYoutubeId(url: string | null): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (YOUTUBE_ID_REGEX.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    if (hostname.endsWith('youtube.com')) {
      const byQuery = parsed.searchParams.get('v');
      if (byQuery && YOUTUBE_ID_REGEX.test(byQuery)) return byQuery;

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const [prefix, id] = parts;
        if (['shorts', 'embed', 'live', 'v'].includes(prefix) && YOUTUBE_ID_REGEX.test(id)) {
          return id;
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null;
}

export function getYoutubeThumbnailUrl(
  url: string | null | undefined,
  quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'mqdefault'
): string | null {
  const videoId = extractYoutubeId(url ?? null);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
