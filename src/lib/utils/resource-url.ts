import { extractYoutubeId } from '@/lib/utils/youtube';

export type PipelineSourceType = 'youtube' | 'pdf' | 'unsupported';

/**
 * Detect direct/indirect arXiv abstract links and normalize to downloadable PDF.
 * Example: https://arxiv.org/abs/1706.03762 -> https://arxiv.org/pdf/1706.03762.pdf
 */
export function normalizePdfLikeUrl(url: string): string {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname;

    if (hostname === 'arxiv.org' && pathname.startsWith('/abs/')) {
      const paperId = pathname.slice('/abs/'.length);
      if (paperId) {
        return `https://arxiv.org/pdf/${paperId}.pdf`;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

export function isLikelyPdfUrl(url: string): boolean {
  const normalized = normalizePdfLikeUrl(url);

  try {
    const parsed = new URL(normalized);
    const pathname = parsed.pathname.toLowerCase();
    const search = parsed.search.toLowerCase();
    return pathname.endsWith('.pdf') || search.includes('.pdf');
  } catch {
    return /\.pdf($|[?#])/i.test(normalized);
  }
}

export function detectPipelineSourceType(url: string): PipelineSourceType {
  const trimmed = url.trim();
  if (!trimmed) return 'unsupported';

  if (extractYoutubeId(trimmed)) return 'youtube';
  if (isLikelyPdfUrl(trimmed)) return 'pdf';
  return 'unsupported';
}

