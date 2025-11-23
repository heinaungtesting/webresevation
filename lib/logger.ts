/**
 * Structured Logging with Pino
 *
 * This module provides structured logging for the application.
 * Features:
 * - JSON output in production (for log aggregation services)
 * - Pretty output in development (human-readable)
 * - Correlation IDs for request tracing
 * - Child loggers with context
 * - Automatic redaction of sensitive data
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * // Basic logging
 * logger.info('User logged in');
 * logger.error({ err }, 'Failed to process request');
 *
 * // With context
 * const log = logger.child({ userId: '123', requestId: 'abc' });
 * log.info('Processing order');
 *
 * // Request logger
 * const reqLog = createRequestLogger(request);
 * reqLog.info('Handling request');
 * ```
 */

import pino, { Logger, LoggerOptions } from 'pino';

// =============================================================================
// Configuration
// =============================================================================

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

/**
 * Fields to redact from logs (security)
 */
const redactPaths = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'secret',
  'apiKey',
  'api_key',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'UPSTASH_REDIS_REST_TOKEN',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

/**
 * Pino configuration
 */
const pinoConfig: LoggerOptions = {
  level: isTest ? 'silent' : logLevel,

  // Redact sensitive fields
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },

  // Add timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base context added to all logs
  base: {
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
  },

  // Format error objects properly
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
};

// =============================================================================
// Logger Instance
// =============================================================================

/**
 * Main application logger
 */
export const logger: Logger = pino(pinoConfig);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(
  request: Request,
  additionalContext: Record<string, unknown> = {}
): Logger {
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const url = new URL(request.url);

  return logger.child({
    requestId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent')?.slice(0, 100),
    ...additionalContext,
  });
}

/**
 * Create a child logger with user context
 */
export function createUserLogger(
  userId: string,
  additionalContext: Record<string, unknown> = {}
): Logger {
  return logger.child({
    userId,
    ...additionalContext,
  });
}

/**
 * Log API request/response (middleware helper)
 */
export function logApiRequest(
  log: Logger,
  request: Request,
  response: Response,
  durationMs: number
): void {
  const logData = {
    status: response.status,
    durationMs,
    contentLength: response.headers.get('content-length'),
  };

  if (response.status >= 500) {
    log.error(logData, 'API request failed');
  } else if (response.status >= 400) {
    log.warn(logData, 'API request client error');
  } else {
    log.info(logData, 'API request completed');
  }
}

/**
 * Log database query (for debugging)
 */
export function logDatabaseQuery(
  log: Logger,
  operation: string,
  model: string,
  durationMs: number,
  error?: Error
): void {
  const logData = {
    database: true,
    operation,
    model,
    durationMs,
  };

  if (error) {
    log.error({ ...logData, err: error }, 'Database query failed');
  } else if (durationMs > 1000) {
    log.warn(logData, 'Slow database query');
  } else {
    log.debug(logData, 'Database query completed');
  }
}

/**
 * Log external service call
 */
export function logExternalCall(
  log: Logger,
  service: string,
  operation: string,
  durationMs: number,
  success: boolean,
  error?: Error
): void {
  const logData = {
    external: true,
    service,
    operation,
    durationMs,
    success,
  };

  if (error) {
    log.error({ ...logData, err: error }, `${service} call failed`);
  } else if (durationMs > 5000) {
    log.warn(logData, `Slow ${service} call`);
  } else {
    log.debug(logData, `${service} call completed`);
  }
}

// =============================================================================
// Specialized Loggers
// =============================================================================

/**
 * Auth-related logging
 */
export const authLogger = logger.child({ module: 'auth' });

/**
 * Database-related logging
 */
export const dbLogger = logger.child({ module: 'database' });

/**
 * Email-related logging
 */
export const emailLogger = logger.child({ module: 'email' });

/**
 * Rate limiting logging
 */
export const rateLimitLogger = logger.child({ module: 'rateLimit' });

// =============================================================================
// Error Logging Utilities
// =============================================================================

/**
 * Serialize error for logging
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any).code && { code: (error as any).code },
      ...(error as any).statusCode && { statusCode: (error as any).statusCode },
    };
  }

  return { error: String(error) };
}

/**
 * Log and rethrow error (useful in catch blocks)
 */
export function logAndRethrow(log: Logger, message: string, error: unknown): never {
  log.error({ err: serializeError(error) }, message);
  throw error;
}

// =============================================================================
// Performance Logging
// =============================================================================

/**
 * Create a timer for performance logging
 */
export function createTimer(log: Logger, operation: string) {
  const start = performance.now();

  return {
    end: (additionalContext: Record<string, unknown> = {}) => {
      const durationMs = Math.round(performance.now() - start);
      log.info({ operation, durationMs, ...additionalContext }, `${operation} completed`);
      return durationMs;
    },
    endWithWarning: (thresholdMs: number, additionalContext: Record<string, unknown> = {}) => {
      const durationMs = Math.round(performance.now() - start);
      const logMethod = durationMs > thresholdMs ? 'warn' : 'info';
      log[logMethod](
        { operation, durationMs, slow: durationMs > thresholdMs, ...additionalContext },
        `${operation} completed`
      );
      return durationMs;
    },
  };
}

export default logger;
