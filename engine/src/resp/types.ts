/**
 * RESP (Redis Serialization Protocol) type definitions.
 *
 * RESP2 defines these data types:
 * - Simple String: "+OK\r\n"
 * - Error: "-ERR message\r\n"
 * - Integer: ":1000\r\n"
 * - Bulk String: "$6\r\nfoobar\r\n"  (or "$-1\r\n" for null)
 * - Array: "*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n"  (or "*-1\r\n" for null)
 */

export type RESPSimpleString = { type: 'simple'; value: string };
export type RESPError = { type: 'error'; value: string };
export type RESPInteger = { type: 'integer'; value: number };
export type RESPBulkString = { type: 'bulk'; value: string | null };
export type RESPArray = { type: 'array'; value: RESPValue[] | null };

export type RESPValue =
  | RESPSimpleString
  | RESPError
  | RESPInteger
  | RESPBulkString
  | RESPArray;

/** A parsed Redis command: name (uppercase) + arguments */
export interface ParsedCommand {
  name: string;
  args: string[];
}
