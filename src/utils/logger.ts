/**
 * Tiny leveled logger. Kept dependency-free so it works identically in the app
 * and under Jest. In production builds the `debug` level is compiled out by the
 * `__DEV__` guard.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, scope: string, msg: string, extra?: unknown): void {
  if (level === 'debug' && !__DEV__) {
    return;
  }
  const tag = `[babymode:${scope}]`;
  const sink = console[level] ?? console.log;
  if (extra !== undefined) {
    sink(tag, msg, extra);
  } else {
    sink(tag, msg);
  }
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, extra?: unknown) => emit('debug', scope, msg, extra),
    info: (msg: string, extra?: unknown) => emit('info', scope, msg, extra),
    warn: (msg: string, extra?: unknown) => emit('warn', scope, msg, extra),
    error: (msg: string, extra?: unknown) => emit('error', scope, msg, extra),
  };
}

export type Logger = ReturnType<typeof createLogger>;
