import type { ParsedCommand } from '../resp/types.js';
import type { CommandContext } from './router.js';
import * as resp from '../resp/serializer.js';

/**
 * Server commands: PING, ECHO, DBSIZE, FLUSHDB, INFO, COMMAND, QUIT
 */
export async function handleServerCommand(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  switch (cmd.name) {
    case 'PING':
      return handlePing(cmd);
    case 'ECHO':
      return handleEcho(cmd);
    case 'DBSIZE':
      return handleDbsize(ctx);
    case 'FLUSHDB':
      return handleFlushdb(ctx);
    case 'INFO':
      return handleInfo(ctx);
    case 'COMMAND':
      return handleCommand(cmd);
    case 'QUIT':
      return resp.ok();
    default:
      return resp.error(`command '${cmd.name}' not implemented`);
  }
}

/** PING [message] */
function handlePing(cmd: ParsedCommand): string {
  if (cmd.args.length === 0) return resp.pong();
  return resp.bulkString(cmd.args[0]);
}

/** ECHO message */
function handleEcho(cmd: ParsedCommand): string {
  if (cmd.args.length !== 1) return resp.wrongArgCount('echo');
  return resp.bulkString(cmd.args[0]);
}

/** DBSIZE — returns number of live keys */
async function handleDbsize(ctx: CommandContext): Promise<string> {
  const count = await ctx.getBackend().size();
  return resp.integer(count);
}

/** FLUSHDB — delete all data */
async function handleFlushdb(ctx: CommandContext): Promise<string> {
  const backend = ctx.getBackend();
  // AppendLog has a clear() method; for the interface, we close and re-init
  if ('clear' in backend && typeof backend.clear === 'function') {
    await backend.clear();
  }
  return resp.ok();
}

/** INFO [section] — return server info as bulk string */
async function handleInfo(ctx: CommandContext): Promise<string> {
  const backend = ctx.getBackend();
  const keyCount = await backend.size();
  const uptimeMs = Date.now() - ctx.startTimeMs;
  const uptimeSec = Math.floor(uptimeMs / 1000);

  const info = [
    '# Server',
    'jarre_version:0.1.0',
    `uptime_in_seconds:${uptimeSec}`,
    '',
    '# Storage',
    `backend:${backend.name}`,
    `db0_keys:${keyCount}`,
    '',
  ].join('\r\n');

  return resp.bulkString(info);
}

/**
 * COMMAND [DOCS|COUNT|...] — redis-cli sends "COMMAND DOCS" on connect.
 * We return minimal responses to keep redis-cli happy.
 */
function handleCommand(cmd: ParsedCommand): string {
  const sub = cmd.args[0]?.toUpperCase();

  if (sub === 'DOCS') {
    // redis-cli sends COMMAND DOCS to discover commands on connect.
    // Return empty map to signal "no docs" — redis-cli handles this fine.
    return resp.array([]);
  }

  if (sub === 'COUNT') {
    // We support ~10 commands
    return resp.integer(10);
  }

  // Default: return empty array for any other COMMAND subcommand
  return resp.array([]);
}
