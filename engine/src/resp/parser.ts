import type { RESPValue, ParsedCommand } from './types.js';

const CRLF = '\r\n';

/**
 * RESP Protocol Parser.
 *
 * Handles incremental parsing of RESP data from TCP stream.
 * Buffers incomplete data and emits complete values.
 *
 * Supports:
 * - Inline commands: "PING\r\n", "SET key value\r\n"
 * - RESP arrays: "*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$5\r\nvalue\r\n"
 * - All RESP2 types: simple strings, errors, integers, bulk strings, arrays
 */
export class RESPParser {
  private buffer: string = '';

  /** Feed raw data from the TCP socket into the parser */
  feed(data: string): RESPValue[] {
    this.buffer += data;
    const results: RESPValue[] = [];

    while (this.buffer.length > 0) {
      const result = this.tryParse();
      if (result === null) break;
      results.push(result);
    }

    return results;
  }

  /** Try to parse one complete RESP value from the buffer. Returns null if incomplete. */
  private tryParse(): RESPValue | null {
    if (this.buffer.length === 0) return null;

    const firstChar = this.buffer[0];

    switch (firstChar) {
      case '+': return this.parseSimpleString();
      case '-': return this.parseError();
      case ':': return this.parseInteger();
      case '$': return this.parseBulkString();
      case '*': return this.parseArray();
      default:  return this.parseInlineCommand();
    }
  }

  /** Parse "+OK\r\n" → { type: 'simple', value: 'OK' } */
  private parseSimpleString(): RESPValue | null {
    const idx = this.buffer.indexOf(CRLF);
    if (idx === -1) return null;

    const value = this.buffer.substring(1, idx);
    this.buffer = this.buffer.substring(idx + 2);
    return { type: 'simple', value };
  }

  /** Parse "-ERR message\r\n" → { type: 'error', value: 'ERR message' } */
  private parseError(): RESPValue | null {
    const idx = this.buffer.indexOf(CRLF);
    if (idx === -1) return null;

    const value = this.buffer.substring(1, idx);
    this.buffer = this.buffer.substring(idx + 2);
    return { type: 'error', value };
  }

  /** Parse ":1000\r\n" → { type: 'integer', value: 1000 } */
  private parseInteger(): RESPValue | null {
    const idx = this.buffer.indexOf(CRLF);
    if (idx === -1) return null;

    const value = parseInt(this.buffer.substring(1, idx), 10);
    this.buffer = this.buffer.substring(idx + 2);
    return { type: 'integer', value };
  }

  /** Parse "$6\r\nfoobar\r\n" → { type: 'bulk', value: 'foobar' } */
  private parseBulkString(): RESPValue | null {
    const lineEnd = this.buffer.indexOf(CRLF);
    if (lineEnd === -1) return null;

    const length = parseInt(this.buffer.substring(1, lineEnd), 10);

    // Null bulk string: "$-1\r\n"
    if (length === -1) {
      this.buffer = this.buffer.substring(lineEnd + 2);
      return { type: 'bulk', value: null };
    }

    // Check if we have the full data + trailing CRLF
    const dataStart = lineEnd + 2;
    const dataEnd = dataStart + length;
    if (this.buffer.length < dataEnd + 2) return null;

    const value = this.buffer.substring(dataStart, dataEnd);
    this.buffer = this.buffer.substring(dataEnd + 2);
    return { type: 'bulk', value };
  }

  /** Parse "*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n" → { type: 'array', value: [...] } */
  private parseArray(): RESPValue | null {
    const lineEnd = this.buffer.indexOf(CRLF);
    if (lineEnd === -1) return null;

    const count = parseInt(this.buffer.substring(1, lineEnd), 10);

    // Null array: "*-1\r\n"
    if (count === -1) {
      this.buffer = this.buffer.substring(lineEnd + 2);
      return { type: 'array', value: null };
    }

    // Save buffer state in case we need to rollback (incomplete data)
    const savedBuffer = this.buffer;
    this.buffer = this.buffer.substring(lineEnd + 2);

    const elements: RESPValue[] = [];
    for (let i = 0; i < count; i++) {
      const element = this.tryParse();
      if (element === null) {
        // Incomplete — rollback
        this.buffer = savedBuffer;
        return null;
      }
      elements.push(element);
    }

    return { type: 'array', value: elements };
  }

  /**
   * Parse inline command: "PING\r\n" or "SET key value\r\n"
   * redis-cli sends inline for simple commands.
   * Converts to RESP array of bulk strings.
   */
  private parseInlineCommand(): RESPValue | null {
    const idx = this.buffer.indexOf(CRLF);
    if (idx === -1) return null;

    const line = this.buffer.substring(0, idx).trim();
    this.buffer = this.buffer.substring(idx + 2);

    if (line.length === 0) return null;

    const parts = splitRespectingQuotes(line);
    return {
      type: 'array',
      value: parts.map(p => ({ type: 'bulk' as const, value: p })),
    };
  }

  /** Reset parser state (e.g., on connection close) */
  reset(): void {
    this.buffer = '';
  }
}

/**
 * Extract a ParsedCommand from a RESP value.
 * Expects an array of bulk strings (standard Redis command format).
 */
export function extractCommand(value: RESPValue): ParsedCommand | null {
  if (value.type !== 'array' || value.value === null || value.value.length === 0) {
    return null;
  }

  const parts: string[] = [];
  for (const element of value.value) {
    if (element.type === 'bulk' && element.value !== null) {
      parts.push(element.value);
    } else if (element.type === 'simple') {
      parts.push(element.value);
    } else {
      return null;
    }
  }

  return {
    name: parts[0].toUpperCase(),
    args: parts.slice(1),
  };
}

/**
 * Split a string by whitespace, but respect double-quoted segments.
 * "SET key \"hello world\"" → ["SET", "key", "hello world"]
 */
function splitRespectingQuotes(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === '"' && (i === 0 || input[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ' ' && !inQuotes) {
      if (current.length > 0) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) {
    parts.push(current);
  }

  return parts;
}
