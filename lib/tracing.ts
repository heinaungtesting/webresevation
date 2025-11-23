/**
 * Request Tracing with Correlation IDs
 *
 * This module provides request tracing capabilities for distributed logging.
 * Each request gets a unique correlation ID that's propagated through all logs.
 *
 * Features:
 * - Unique correlation ID per request (UUID v4 format)
 * - Header propagation (x-correlation-id, x-request-id)
 * - Response header injection
 * - Context storage using AsyncLocalStorage
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface RequestContext {
  /** Unique correlation ID for the request */
  correlationId: string;
  /** Request start timestamp */
  startTime: number;
  /** Request path */
  path?: string;
  /** Request method */
  method?: string;
  /** User ID if authenticated */
  userId?: string;
}

// ============================================================================
// AsyncLocalStorage for Request Context
// ============================================================================

// Store for request-scoped context (works in Node.js runtime)
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

// Fallback for edge runtime where AsyncLocalStorage may not work properly
let fallbackContext: RequestContext | null = null;

// ============================================================================
// Context Management
// ============================================================================

/**
 * Get the current request context
 */
export function getRequestContext(): RequestContext | undefined {
  // Try AsyncLocalStorage first
  const context = asyncLocalStorage.getStore();
  if (context) return context;

  // Fallback for edge runtime
  return fallbackContext ?? undefined;
}

/**
 * Get the current correlation ID
 */
export function getCorrelationId(): string | undefined {
  return getRequestContext()?.correlationId;
}

/**
 * Run a function within a request context
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  // Set fallback for edge runtime
  fallbackContext = context;

  try {
    return asyncLocalStorage.run(context, fn);
  } finally {
    fallbackContext = null;
  }
}

/**
 * Run an async function within a request context
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  fallbackContext = context;

  try {
    return await asyncLocalStorage.run(context, fn);
  } finally {
    fallbackContext = null;
  }
}

// ============================================================================
// Correlation ID Utilities
// ============================================================================

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Extract correlation ID from request headers
 * Checks multiple common header names
 */
export function extractCorrelationId(headers: Headers): string | null {
  // Check common correlation ID headers
  const headerNames = [
    'x-correlation-id',
    'x-request-id',
    'x-trace-id',
    'traceparent', // W3C Trace Context
  ];

  for (const name of headerNames) {
    const value = headers.get(name);
    if (value) {
      // For traceparent, extract the trace-id portion (format: version-traceid-parentid-flags)
      if (name === 'traceparent') {
        const parts = value.split('-');
        if (parts.length >= 2) return parts[1];
      }
      return value;
    }
  }

  return null;
}

/**
 * Get or create correlation ID for a request
 */
export function getOrCreateCorrelationId(headers: Headers): string {
  return extractCorrelationId(headers) ?? generateCorrelationId();
}

// ============================================================================
// Middleware Helpers
// ============================================================================

/**
 * Create request context from a Request object
 */
export function createContextFromRequest(request: Request): RequestContext {
  const url = new URL(request.url);

  return {
    correlationId: getOrCreateCorrelationId(request.headers),
    startTime: Date.now(),
    path: url.pathname,
    method: request.method,
  };
}

/**
 * Add tracing headers to a Response
 */
export function addTracingHeaders(
  response: Response,
  context: RequestContext
): Response {
  const headers = new Headers(response.headers);

  headers.set('x-correlation-id', context.correlationId);
  headers.set('x-response-time', `${Date.now() - context.startTime}ms`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create headers object with correlation ID for outgoing requests
 */
export function createTracingHeaders(): Record<string, string> {
  const correlationId = getCorrelationId();

  if (correlationId) {
    return {
      'x-correlation-id': correlationId,
    };
  }

  return {};
}

// ============================================================================
// Logging Integration
// ============================================================================

/**
 * Get context fields for logging
 * Returns an object suitable for structured logging
 */
export function getLoggingContext(): Record<string, unknown> {
  const context = getRequestContext();

  if (!context) return {};

  return {
    correlationId: context.correlationId,
    path: context.path,
    method: context.method,
    userId: context.userId,
  };
}

/**
 * Set user ID in the current context
 * Call this after authentication to add user info to logs
 */
export function setContextUserId(userId: string): void {
  const context = getRequestContext();
  if (context) {
    context.userId = userId;
  }
}

// ============================================================================
// Timing Utilities
// ============================================================================

/**
 * Get elapsed time since request start
 */
export function getElapsedTime(): number {
  const context = getRequestContext();
  return context ? Date.now() - context.startTime : 0;
}

/**
 * Create a timer for measuring operation duration
 */
export function createTimer(operation: string): () => void {
  const start = Date.now();
  const correlationId = getCorrelationId();

  return () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        level: 'debug',
        correlationId,
        operation,
        duration,
        message: `${operation} completed in ${duration}ms`,
      })
    );
  };
}
