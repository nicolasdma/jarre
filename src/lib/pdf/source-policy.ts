import { normalizePdfLikeUrl } from '@/lib/utils/resource-url';

/**
 * Allowed PDF source domains.
 * Keep this list narrow to reduce SSRF risk.
 */
export const ALLOWED_PDF_DOMAINS = [
  'arxiv.org',
  'dl.acm.org',
  'papers.nips.cc',
  'proceedings.neurips.cc',
  'openreview.net',
  'aclanthology.org',
  'proceedings.mlr.press',
  'jmlr.org',
  'raw.githubusercontent.com',
  'github.com',
  'huggingface.co',
] as const;

export function normalizePdfSourceUrl(url: string): string {
  return normalizePdfLikeUrl(url).trim();
}

export function isAllowedPdfDomain(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    return ALLOWED_PDF_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

