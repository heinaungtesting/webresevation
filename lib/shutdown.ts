/**
 * Graceful Shutdown Handler (Node.js only)
 *
 * This module handles graceful shutdown for the Node.js runtime.
 * It should only be imported in Node.js context, not Edge.
 *
 * Features:
 * - Listens for SIGTERM/SIGINT signals
 * - Closes database connections gracefully
 * - Handles uncaught exceptions and unhandled rejections
 * - Reports errors to Sentry if configured
 * - 30-second timeout to prevent hanging
 */

import { prisma } from '@/lib/prisma';

// Track server state to prevent duplicate shutdown
let isShuttingDown = false;

/**
 * Report error to Sentry (if configured)
 */
async function reportErrorToSentry(error: Error, context: string) {
  try {
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    if (Sentry) {
      Sentry.captureException(error, {
        tags: { context },
      });
    }
  } catch {
    // Sentry not available, ignore
  }
}

/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed before exit
 */
async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    console.log(`[Shutdown] Already shutting down, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n[Shutdown] Received ${signal}, starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    console.error('[Shutdown] Timeout exceeded, forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout

  try {
    // 1. Stop accepting new requests (handled by platform/container)
    console.log('[Shutdown] Stopping new request acceptance...');

    // 2. Wait for in-flight requests to complete (brief delay)
    console.log('[Shutdown] Waiting for in-flight requests...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. Close database connections
    console.log('[Shutdown] Closing database connections...');
    await prisma.$disconnect();
    console.log('[Shutdown] Database connections closed');

    // 4. Close other connections (Redis, etc.)
    // Redis connections are handled automatically by Upstash REST client

    clearTimeout(shutdownTimeout);
    console.log('[Shutdown] Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('[Shutdown] Error during graceful shutdown:', error);
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

/**
 * Register all shutdown handlers
 * This function sets up signal handlers and error handlers
 */
export function registerShutdownHandlers(): void {
  // Register shutdown handlers for signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    reportErrorToSentry(error, 'uncaughtException');
    // Don't exit - let the process manager handle restarts
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
      reportErrorToSentry(reason, 'unhandledRejection');
    }
  });

  console.log('[Shutdown] Handlers registered successfully');
}
