import { NextResponse } from 'next/server';

const ENGINE_DEBUG_PORT = parseInt(process.env.ENGINE_DEBUG_PORT ?? '6381', 10);
const TIMEOUT_MS = 3000;

/**
 * GET /api/playground/storage-engine/state
 *
 * Bridge: proxies the engine's debug HTTP server to the browser.
 * Returns the engine's internal state as JSON.
 */
export async function GET() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(
      `http://127.0.0.1:${ENGINE_DEBUG_PORT}/state`,
      { signal: controller.signal },
    );

    clearTimeout(timer);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Engine debug server returned ${response.status}` },
        { status: 502 },
      );
    }

    const state = await response.json();
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Engine not running. Start it with: npm run engine' },
        { status: 503 },
      );
    }

    if (message.includes('aborted')) {
      return NextResponse.json(
        { error: 'Engine debug server timeout' },
        { status: 504 },
      );
    }

    console.error('[api/storage-engine/state] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
