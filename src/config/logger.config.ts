type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'verbose'];

function getLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel;
  if (env && validLevels.includes(env)) return env;
  return process.env.NODE_ENV === 'production' ? 'info' : 'verbose';
}

export const loggerConfig = {
  level: getLogLevel(),
} as const;
