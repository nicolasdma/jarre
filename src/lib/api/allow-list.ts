/**
 * Jarre - Account allow-list
 *
 * Jarre runs on the owner's keys (Gemini, DeepSeek, DeepL) and on one Supabase
 * project shared by local and production. A valid Supabase session is not
 * enough to spend those keys or read study data: the account must be on this
 * list. `withAuth` answers 403 to anyone else, and the proxy sends them back to
 * /login.
 *
 * ALLOWED_USER_IDS: comma-separated auth.users ids. Unset or empty means the
 * default below (the owner and the guest he gave access to, the only two
 * accounts in auth.users on 2026-11-18). Set it to `*` to turn the list off,
 * which only makes sense on a local self-hosted copy with its own database.
 */

export const DEFAULT_ALLOWED_USER_IDS: readonly string[] = [
  // Owner.
  '6aa740cf-ada1-47a8-a30e-daa4612683fb',
  // Guest account the owner gave access to (Google sign-in, created 2026-11-17).
  '3cf95062-d369-490e-b55b-487090413089',
];

export function parseAllowedUserIds(raw: string | undefined | null): ReadonlySet<string> | 'any' {
  const value = (raw ?? '').trim();
  if (value === '*') return 'any';
  const ids = value
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);
  return new Set(ids.length > 0 ? ids : DEFAULT_ALLOWED_USER_IDS);
}

export function isAllowedUser(
  userId: string | null | undefined,
  raw: string | undefined | null = process.env.ALLOWED_USER_IDS,
): boolean {
  if (!userId) return false;
  const allowed = parseAllowedUserIds(raw);
  return allowed === 'any' || allowed.has(userId.toLowerCase());
}

/**
 * Sign-up is closed in production: the allow-list holds every account, and
 * new sign-ups are also off in Supabase Auth. JARRE_ALLOW_SIGNUP=1 reopens it.
 */
export function signupOpen(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  flag: string | undefined = process.env.JARRE_ALLOW_SIGNUP,
): boolean {
  return nodeEnv !== 'production' || flag === '1';
}
