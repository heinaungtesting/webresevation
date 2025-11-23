/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js and runs during server startup.
 * It's the ideal place for:
 * - Initializing monitoring (Sentry, etc.)
 * - Setting up graceful shutdown handlers
 * - Warming up caches
 * - Pre-loading critical data
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on Node.js runtime (not Edge)
  // Use dynamic import to avoid Edge Runtime analyzing Node.js-specific code
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing Node.js server...');

    // Dynamic import of shutdown handlers to avoid Edge Runtime issues
    // The shutdown module uses process.on which is only available in Node.js
    const { registerShutdownHandlers } = await import('@/lib/shutdown');
    registerShutdownHandlers();

    console.log('[Instrumentation] Server initialized successfully');
  }
}
