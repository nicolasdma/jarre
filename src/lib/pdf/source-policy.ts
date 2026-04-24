import { normalizePdfLikeUrl } from '@/lib/utils/resource-url';

/**
 * Allowed PDF source domains.
 * Keep this list narrow to reduce SSRF risk — the pipeline issues server-side
 * `fetch()` calls against these hosts, so every entry must be a reputable host
 * whose content we are willing to ingest unattended.
 * See BACKLOG.md for the long-term plan to replace this allowlist with
 * behavior-based SSRF guards (private-IP blocking, redirect inspection).
 */
export const ALLOWED_PDF_DOMAINS = [
  // AI/ML curriculum (track: ai)
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
  // Humanities / policy / medical / operational curriculum (tracks: aventura, travel)
  'archive.org',
  'kar.kent.ac.uk',
  'faolex.fao.org',
  'hrw.org',
  'paho.org',
  'migracion.gob.pa',
  'ins.gov.co',
  'repositorio.una.ac.cr',
  'crisisgroup.org',
  'globalinitiative.net',
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

