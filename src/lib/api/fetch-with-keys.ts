/**
 * Jarre - Fetch with BYOK Keys
 *
 * Drop-in replacement for fetch() that attaches BYOK API keys as headers
 * in managed mode. In self-hosted mode, this is a passthrough to fetch().
 */

import { IS_MANAGED } from '@/lib/config';
import { getStoredKeys } from '@/lib/byok/key-store';

export async function fetchWithKeys(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!IS_MANAGED) return fetch(input, init);

  const keys = getStoredKeys();
  const headers = new Headers(init?.headers);

  if (keys.deepseek) headers.set('X-DeepSeek-Key', keys.deepseek);
  if (keys.gemini) headers.set('X-Gemini-Key', keys.gemini);

  return fetch(input, { ...init, headers });
}
