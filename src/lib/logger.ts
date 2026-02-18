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

export function createLogger(context: string): Logger {
  const tag = `[${context}]`;
  return {
    info: (...args: unknown[]) => console.log(tag, ...args),
    warn: (...args: unknown[]) => console.warn(tag, ...args),
    error: (...args: unknown[]) => console.error(tag, ...args),
  };
}
