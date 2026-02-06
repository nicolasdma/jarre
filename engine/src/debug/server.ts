import * as http from 'node:http';
import type { StorageBackend } from '../storage/interface.js';
import { buildSnapshot } from './introspection.js';

const startTimeMs = Date.now();

/**
 * Simple HTTP debug server that exposes engine state as JSON.
 *
 * Endpoints:
 * - GET /        → full engine snapshot (backend state, uptime, etc.)
 * - GET /health  → { status: 'ok' }
 *
 * Used by the Next.js web UI to visualize internal structures.
 */
export function startDebugServer(
  port: number,
  getBackend: () => StorageBackend,
): http.Server {
  const server = http.createServer(async (req, res) => {
    // CORS headers for browser access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const url = new URL(req.url ?? '/', `http://localhost:${port}`);

    try {
      switch (url.pathname) {
        case '/':
        case '/state': {
          const snapshot = await buildSnapshot(getBackend(), startTimeMs);
          res.writeHead(200);
          res.end(JSON.stringify(snapshot, null, 2));
          break;
        }
        case '/health': {
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'ok' }));
          break;
        }
        default: {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[debug] Error handling ${url.pathname}: ${message}`);
      res.writeHead(500);
      res.end(JSON.stringify({ error: message }));
    }
  });

  server.listen(port, () => {
    console.log(`[engine] Debug server listening on port ${port} (HTTP/JSON)`);
  });

  return server;
}
