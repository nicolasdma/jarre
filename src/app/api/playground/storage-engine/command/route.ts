import { NextResponse } from 'next/server';
import * as net from 'node:net';

const ENGINE_HOST = '127.0.0.1';
const ENGINE_PORT = parseInt(process.env.ENGINE_PORT ?? '6380', 10);
const TIMEOUT_MS = 5000;

/**
 * POST /api/playground/storage-engine/command
 *
 * Bridge: receives a Redis command string from the browser,
 * sends it to the engine via TCP (RESP inline), returns the response.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Missing "command" field' },
        { status: 400 },
      );
    }

    const response = await sendToEngine(command);
    return NextResponse.json({ response });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Engine not running. Start it with: npm run engine' },
        { status: 503 },
      );
    }

    console.error('[api/storage-engine/command] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Send an inline command to the engine via TCP and collect the full response.
 */
function sendToEngine(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let data = '';

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Engine response timeout'));
    }, TIMEOUT_MS);

    socket.connect(ENGINE_PORT, ENGINE_HOST, () => {
      socket.write(command + '\r\n');
    });

    socket.on('data', (chunk: Buffer) => {
      data += chunk.toString('utf8');

      // Try to detect if we have a complete RESP response
      if (isCompleteResponse(data)) {
        clearTimeout(timer);
        socket.end();
        resolve(data);
      }
    });

    socket.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Check if the accumulated data contains a complete RESP response.
 * This is a simplified check — handles the common cases.
 */
function isCompleteResponse(data: string): boolean {
  if (data.length === 0) return false;

  const type = data[0];

  switch (type) {
    // Simple string, error, integer: complete when we see \r\n
    case '+':
    case '-':
    case ':':
      return data.includes('\r\n');

    // Bulk string: "$N\r\n...data...\r\n" or "$-1\r\n"
    case '$': {
      const lineEnd = data.indexOf('\r\n');
      if (lineEnd === -1) return false;
      const length = parseInt(data.substring(1, lineEnd), 10);
      if (length === -1) return true; // null bulk string
      const expected = lineEnd + 2 + length + 2;
      return data.length >= expected;
    }

    // Array: need to parse recursively, but for simplicity
    // we use a heuristic — count \r\n sequences
    case '*': {
      const lineEnd = data.indexOf('\r\n');
      if (lineEnd === -1) return false;
      const count = parseInt(data.substring(1, lineEnd), 10);
      if (count <= 0) return true;
      // For arrays, count complete RESP elements
      return countCompleteElements(data, lineEnd + 2) >= count;
    }

    default:
      // Inline response — complete when we see \r\n
      return data.includes('\r\n');
  }
}

/** Count how many complete RESP elements exist starting from offset */
function countCompleteElements(data: string, start: number): number {
  let count = 0;
  let pos = start;

  while (pos < data.length) {
    const type = data[pos];
    const lineEnd = data.indexOf('\r\n', pos);
    if (lineEnd === -1) break;

    if (type === '$') {
      const length = parseInt(data.substring(pos + 1, lineEnd), 10);
      if (length === -1) {
        pos = lineEnd + 2;
      } else {
        const end = lineEnd + 2 + length + 2;
        if (end > data.length) break;
        pos = end;
      }
    } else {
      pos = lineEnd + 2;
    }

    count++;
  }

  return count;
}
