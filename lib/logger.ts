/**
 * Structured Logging with Pino
 *
 * Production-ready logging with:
 * - JSON output for log aggregation (production)
 * - Pretty printing for development
 * - Request ID tracking
 * - Log levels (trace, debug, info, warn, error, fatal)
 * - Context enrichment
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Create the base logger instance
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Disable logging in test environment
  enabled: !isTest,

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'sportsmatch-tokyo',
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      'email',
      '*.password',
      '*.token',
      '*.email',
    ],
    censor: '[REDACTED]',
  },

  // Pretty print in development
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },

  // Format error objects properly
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
    }),
  },
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Create a request-scoped logger with request ID
 */
export function createRequestLogger(requestId: string, path?: string, method?: string) {
  return logger.child({
    requestId,
    path,
    method,
  });
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log an API request
 */
export function logRequest(
  requestId: string,
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string
) {
  const log = createRequestLogger(requestId, path, method);

  const logData = {
    statusCode,
    durationMs,
    userId,
  };

  if (statusCode >= 500) {
    log.error(logData, `${method} ${path} - ${statusCode}`);
  } else if (statusCode >= 400) {
    log.warn(logData, `${method} ${path} - ${statusCode}`);
  } else {
    log.info(logData, `${method} ${path} - ${statusCode}`);
  }
}

/**
 * Log an error with context
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
) {
  logger.error(
    {
      err: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      ...context,
    },
    error.message
  );
}

/**
 * Log a database query (for debugging)
 */
export function logQuery(
  query: string,
  durationMs: number,
  context?: Record<string, unknown>
) {
  logger.debug(
    {
      query: query.substring(0, 200), // Truncate long queries
      durationMs,
      ...context,
    },
    'Database query'
  );
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  event: string,
  context: Record<string, unknown>
) {
  logger.warn(
    {
      securityEvent: event,
      ...context,
    },
    `Security: ${event}`
  );
}

/**
 * Log application startup
 */
export function logStartup(config: Record<string, unknown>) {
  logger.info(
    {
      startup: true,
      ...config,
    },
    'Application starting'
  );
}

/**
 * Log application shutdown
 */
export function logShutdown(reason: string) {
  logger.info(
    {
      shutdown: true,
      reason,
    },
    'Application shutting down'
  );
}

// Export types
export type Logger = typeof logger;
export type ChildLogger = ReturnType<typeof createLogger>;
