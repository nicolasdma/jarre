import type { ParsedCommand } from '../resp/types.js';
import type { CommandContext } from './router.js';
import * as resp from '../resp/serializer.js';

/**
 * String commands: SET, GET, DEL, EXISTS, KEYS
 * These operate on the current storage backend.
 */
export async function handleStringCommand(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  const backend = ctx.getBackend();

  switch (cmd.name) {
    case 'SET':
      return handleSet(cmd, backend);
    case 'GET':
      return handleGet(cmd, backend);
    case 'DEL':
      return handleDel(cmd, backend);
    case 'EXISTS':
      return handleExists(cmd, backend);
    default:
      return resp.error(`command '${cmd.name}' not implemented yet`);
  }
}

/** SET key value */
async function handleSet(
  cmd: ParsedCommand,
  backend: import('../storage/interface.js').StorageBackend,
): Promise<string> {
  if (cmd.args.length < 2) {
    return resp.wrongArgCount('set');
  }

  const [key, value] = cmd.args;
  await backend.set(key, value);
  return resp.ok();
}

/** GET key */
async function handleGet(
  cmd: ParsedCommand,
  backend: import('../storage/interface.js').StorageBackend,
): Promise<string> {
  if (cmd.args.length !== 1) {
    return resp.wrongArgCount('get');
  }

  const value = await backend.get(cmd.args[0]);
  return resp.bulkString(value);
}

/** DEL key [key ...] — returns count of deleted keys */
async function handleDel(
  cmd: ParsedCommand,
  backend: import('../storage/interface.js').StorageBackend,
): Promise<string> {
  if (cmd.args.length < 1) {
    return resp.wrongArgCount('del');
  }

  let deleted = 0;
  for (const key of cmd.args) {
    const wasDeleted = await backend.delete(key);
    if (wasDeleted) deleted++;
  }

  return resp.integer(deleted);
}

/** EXISTS key [key ...] — returns count of existing keys */
async function handleExists(
  cmd: ParsedCommand,
  backend: import('../storage/interface.js').StorageBackend,
): Promise<string> {
  if (cmd.args.length < 1) {
    return resp.wrongArgCount('exists');
  }

  let count = 0;
  for (const key of cmd.args) {
    const value = await backend.get(key);
    if (value !== null) count++;
  }

  return resp.integer(count);
}
