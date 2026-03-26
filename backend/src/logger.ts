import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './config/env';

const prettyTransport =
  env.LOG_PRETTY
    ? {
        target: 'pino-pretty',
        options: {
          // Keep ANSI color output opt-in via LOG_PRETTY; users can disable pretty entirely.
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
    : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ...(prettyTransport ? { transport: prettyTransport } : {})
});

// Alias kept for readability; request logging uses the same logger instance.
export const appLogger = logger;

export const httpLogger = pinoHttp({
  logger: appLogger,
  autoLogging: true,
  genReqId: (req) => {
    // Simple request id: stable enough for local/dev logs.
    // If you later want tracing, plug in OpenTelemetry here.
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
});

