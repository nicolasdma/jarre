import type { ParsedCommand } from '../resp/types.js';
import type { CommandContext } from './router.js';
import * as resp from '../resp/serializer.js';

/**
 * Debug/introspection commands: INSPECT, DEBUG BACKEND
 * These provide internal state access for learning and visualization.
 */
export async function handleDebugCommand(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  switch (cmd.name) {
    case 'INSPECT':
      return handleInspect(ctx);
    case 'DEBUG':
      return handleDebug(cmd, ctx);
    default:
      return resp.error(`debug command '${cmd.name}' not implemented`);
  }
}

/** INSPECT — return full backend state as JSON bulk string */
async function handleInspect(ctx: CommandContext): Promise<string> {
  const state = await ctx.getBackend().inspect();
  return resp.bulkString(JSON.stringify(state, null, 2));
}

/**
 * DEBUG subcommand [args]
 * - DEBUG BACKEND [name]   — show or switch backend
 * - DEBUG SLEEP ms         — simulate slow operation
 */
async function handleDebug(
  cmd: ParsedCommand,
  ctx: CommandContext,
): Promise<string> {
  const sub = cmd.args[0]?.toUpperCase();

  if (!sub) {
    return resp.error('DEBUG requires a subcommand: BACKEND, SLEEP');
  }

  switch (sub) {
    case 'BACKEND': {
      if (cmd.args.length < 2) {
        // Show current backend
        return resp.bulkString(ctx.getBackend().name);
      }
      const newBackend = ctx.setBackend(cmd.args[1]);
      if (!newBackend) {
        return resp.error(`unknown backend '${cmd.args[1]}'`);
      }
      return resp.ok();
    }

    case 'SLEEP': {
      const ms = parseInt(cmd.args[1] ?? '1000', 10);
      await new Promise(resolve => setTimeout(resolve, ms));
      return resp.ok();
    }

    default:
      return resp.error(`unknown DEBUG subcommand '${sub}'`);
  }
}
