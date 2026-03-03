/**
 * POST /api/byok/test
 *
 * Validates a user-provided API key by making a minimal request
 * to the respective provider.
 *
 * Body: { provider: 'deepseek' | 'gemini', apiKey: string }
 * Response: { valid: boolean, error?: string }
 */

import { withAuth } from '@/lib/api/middleware';
import { badRequest, jsonOk } from '@/lib/api/errors';
import { createLogger } from '@/lib/logger';

const log = createLogger('BYOK/Test');

export const POST = withAuth(async (request) => {
  const body = await request.json().catch(() => null);
  const provider = body?.provider;
  const apiKey = body?.apiKey;

  if (!provider || !apiKey || typeof apiKey !== 'string') {
    throw badRequest('provider and apiKey are required');
  }

  if (provider === 'deepseek') {
    return testDeepSeek(apiKey);
  }

  if (provider === 'gemini') {
    return testGemini(apiKey);
  }

  throw badRequest('Invalid provider. Use "deepseek" or "gemini".');
});

async function testDeepSeek(apiKey: string) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Say "ok"' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (response.ok) {
      return jsonOk({ valid: true });
    }

    const errorText = await response.text().catch(() => 'Unknown error');
    log.warn(`DeepSeek key test failed (${response.status}): ${errorText}`);
    return jsonOk({ valid: false, error: `API returned ${response.status}` });
  } catch (err) {
    log.warn('DeepSeek key test error:', err);
    return jsonOk({ valid: false, error: 'Connection failed' });
  }
}

async function testGemini(apiKey: string) {
  try {
    // Use the models.list endpoint as a lightweight auth check
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(15_000) },
    );

    if (response.ok) {
      return jsonOk({ valid: true });
    }

    const errorText = await response.text().catch(() => 'Unknown error');
    log.warn(`Gemini key test failed (${response.status}): ${errorText}`);
    return jsonOk({ valid: false, error: `API returned ${response.status}` });
  } catch (err) {
    log.warn('Gemini key test error:', err);
    return jsonOk({ valid: false, error: 'Connection failed' });
  }
}
