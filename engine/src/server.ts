import * as net from 'node:net';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RESPParser, extractCommand } from './resp/parser.js';
import { routeCommand, type CommandContext } from './commands/router.js';
import * as resp from './resp/serializer.js';
import { AppendLog } from './storage/append-log.js';
import { HashIndex } from './storage/hash-index.js';
import type { StorageBackend } from './storage/interface.js';
import { startDebugServer } from './debug/server.js';

// ── Configuration ─────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESP_PORT = parseInt(process.env.ENGINE_PORT ?? '6380', 10);
const DEBUG_PORT = parseInt(process.env.ENGINE_DEBUG_PORT ?? '6381', 10);
const DATA_DIR = path.resolve(
  process.env.ENGINE_DATA_DIR ?? path.join(__dirname, '..', 'data'),
);
const DEFAULT_BACKEND = process.env.ENGINE_BACKEND ?? 'hash-index';

// ── Backend registry ──────────────────────────────────────────

/** Available backends. New backends are registered here as they're built. */
const BACKEND_FACTORIES: Record<string, () => StorageBackend> = {
  'append-log': () => new AppendLog(DATA_DIR),
  'hash-index': () => new HashIndex(DATA_DIR),
};

let currentBackend: StorageBackend = BACKEND_FACTORIES[DEFAULT_BACKEND]();
const startTimeMs = Date.now();

function getBackend(): StorageBackend {
  return currentBackend;
}

function setBackend(name: string): StorageBackend | null {
  const factory = BACKEND_FACTORIES[name];
  if (!factory) return null;

  // Close old backend, create new one
  currentBackend.close().catch(err => {
    console.error(`[engine] Error closing backend: ${err}`);
  });
  currentBackend = factory();
  console.log(`[engine] Switched to backend: ${name}`);
  return currentBackend;
}

// ── RESP TCP Server (port 6380) ───────────────────────────────

const server = net.createServer((socket) => {
  const remoteAddr = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[engine] Client connected: ${remoteAddr}`);

  const parser = new RESPParser();

  socket.on('data', (data: Buffer) => {
    const values = parser.feed(data.toString('utf8'));

    for (const value of values) {
      const cmd = extractCommand(value);

      if (!cmd) {
        socket.write(resp.error('invalid command format'));
        continue;
      }

      const ctx: CommandContext = {
        backend: currentBackend,
        getBackend,
        setBackend,
        startTimeMs,
      };

      routeCommand(cmd, ctx)
        .then((response) => {
          if (!socket.destroyed) {
            socket.write(response);
          }

          // Handle QUIT command
          if (cmd.name === 'QUIT') {
            socket.end();
          }
        })
        .catch((err) => {
          console.error(`[engine] Command error: ${err}`);
          if (!socket.destroyed) {
            socket.write(resp.error(`internal error: ${err.message}`));
          }
        });
    }
  });

  socket.on('close', () => {
    console.log(`[engine] Client disconnected: ${remoteAddr}`);
    parser.reset();
  });

  socket.on('error', (err) => {
    console.error(`[engine] Socket error (${remoteAddr}): ${err.message}`);
  });
});

// ── Startup ───────────────────────────────────────────────────

server.listen(RESP_PORT, () => {
  console.log(`[engine] Storage engine listening on port ${RESP_PORT} (RESP protocol)`);
  console.log(`[engine] Backend: ${currentBackend.name}`);
  console.log(`[engine] Data dir: ${DATA_DIR}`);
  console.log(`[engine] Connect with: redis-cli -p ${RESP_PORT}`);
});

startDebugServer(DEBUG_PORT, getBackend);

// ── Graceful shutdown ─────────────────────────────────────────

function shutdown(): void {
  console.log('\n[engine] Shutting down...');
  server.close();
  currentBackend.close()
    .then(() => {
      console.log('[engine] Backend closed. Bye.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[engine] Error during shutdown: ${err}`);
      process.exit(1);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
