/**
 * Jarre - Structured Logger
 *
 * Creates context-tagged loggers for consistent logging across the codebase.
 * Format: [Context] message
 */

interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const LOG_IDENTIFIER = 'TEST';

export function createLogger(context: string): Logger {
  const contextTag = `[${context}]`;
  const tag = LOG_IDENTIFIER ? `[${LOG_IDENTIFIER}]${contextTag}` : contextTag;
  return {
    info: (...args: unknown[]) => console.log(tag, ...args),
    warn: (...args: unknown[]) => console.warn(tag, ...args),
    error: (...args: unknown[]) => console.error(tag, ...args),
  };
}
