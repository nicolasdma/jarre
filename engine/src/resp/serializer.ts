import type { RESPValue } from './types.js';

const CRLF = '\r\n';

/**
 * RESP Protocol Serializer.
 *
 * Converts RESPValue objects into wire-format strings
 * for sending over TCP to Redis clients.
 */

/** Serialize any RESP value to its wire format */
export function serialize(value: RESPValue): string {
  switch (value.type) {
    case 'simple':
      return `+${value.value}${CRLF}`;
    case 'error':
      return `-${value.value}${CRLF}`;
    case 'integer':
      return `:${value.value}${CRLF}`;
    case 'bulk':
      if (value.value === null) return `$-1${CRLF}`;
      return `$${value.value.length}${CRLF}${value.value}${CRLF}`;
    case 'array':
      if (value.value === null) return `*-1${CRLF}`;
      return `*${value.value.length}${CRLF}${value.value.map(serialize).join('')}`;
  }
}

// ── Convenience builders ──────────────────────────────────────

export function ok(): string {
  return serialize({ type: 'simple', value: 'OK' });
}

export function pong(): string {
  return serialize({ type: 'simple', value: 'PONG' });
}

export function error(message: string): string {
  return serialize({ type: 'error', value: `ERR ${message}` });
}

export function wrongArgCount(command: string): string {
  return serialize({
    type: 'error',
    value: `ERR wrong number of arguments for '${command}' command`,
  });
}

export function bulkString(value: string | null): string {
  return serialize({ type: 'bulk', value });
}

export function nullBulk(): string {
  return serialize({ type: 'bulk', value: null });
}

export function integer(value: number): string {
  return serialize({ type: 'integer', value });
}

export function array(values: RESPValue[]): string {
  return serialize({ type: 'array', value: values });
}

export function stringArray(values: string[]): string {
  return array(values.map(v => ({ type: 'bulk' as const, value: v })));
}
