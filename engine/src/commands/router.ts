import type { ParsedCommand } from '../resp/types.js';
import type { StorageBackend } from '../storage/interface.js';
import { handleStringCommand } from './string-commands.js';
import { handleServerCommand } from './server-commands.js';
import { handleDebugCommand } from './debug-commands.js';
import * as resp from '../resp/serializer.js';

/** Result of command execution */
type CommandResult = string;

/** Context passed to all command handlers */
export interface CommandContext {
  backend: StorageBackend;
  getBackend: () => StorageBackend;
  setBackend: (name: string) => StorageBackend | null;
  startTimeMs: number;
}

/** String commands that operate on the storage backend */
const STRING_COMMANDS = new Set(['SET', 'GET', 'DEL', 'MGET', 'MSET', 'EXISTS', 'KEYS']);

/** Server-level commands */
const SERVER_COMMANDS = new Set(['PING', 'ECHO', 'DBSIZE', 'FLUSHDB', 'INFO', 'COMMAND', 'QUIT']);

/** Debug / introspection commands */
const DEBUG_COMMANDS = new Set(['DEBUG', 'INSPECT']);

/**
 * Route a parsed command to the appropriate handler.
 * Returns a RESP-encoded response string.
 */
export async function routeCommand(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<CommandResult> {
  const { name } = cmd;

  if (STRING_COMMANDS.has(name)) {
    return handleStringCommand(cmd, ctx);
  }

  if (SERVER_COMMANDS.has(name)) {
    return handleServerCommand(cmd, ctx);
  }

  if (DEBUG_COMMANDS.has(name)) {
    return handleDebugCommand(cmd, ctx);
  }

  return resp.error(`unknown command '${name.toLowerCase()}'`);
}
