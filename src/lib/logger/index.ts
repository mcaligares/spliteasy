import { loggerConfig } from '@/config/logger.config';

type LogLevel = 'error' | 'info' | 'debug' | 'verbose';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  info: 1,
  debug: 2,
  verbose: 3,
};

const CURRENT_LEVEL: LogLevel = loggerConfig.level;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_VALUES[level] <= LOG_LEVEL_VALUES[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, layer: string, method: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] [${layer}] ${method} — ${message}`;
  return data !== undefined ? `${base} | ${JSON.stringify(data)}` : base;
}

function createLayerLogger(layer: string, level: LogLevel) {
  return (method: string, message: string, data?: unknown) => {
    if (!shouldLog(level)) return;
    const formatted = formatMessage(level, layer, method, message, data);
    if (level === 'error') {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  };
}

export const logger = {
  action: createLayerLogger('ACTION', 'info'),
  service: createLayerLogger('SERVICE', 'debug'),
  repo: createLayerLogger('REPOSITORY', 'verbose'),
  error: createLayerLogger('ERROR', 'error'),
};
