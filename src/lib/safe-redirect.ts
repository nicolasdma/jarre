/**
 * A post-login destination that can only be a path on this site.
 *
 * `//evil.com`, `/\evil.com` and `/%2F%2Fevil.com`-style tricks resolve to
 * another host in the browser, so the check is the URL parser's own answer:
 * resolved against a placeholder origin, the result must stay on it.
 */
const PLACEHOLDER_ORIGIN = 'https://same-origin.invalid';

export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f\\]/.test(raw)) return fallback;
  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
