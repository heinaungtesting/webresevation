/**
 * Sentry Edge Runtime Configuration
 *
 * This file configures Sentry for edge functions (middleware, etc.)
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize if DSN is configured
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,
    release: process.env.APP_VERSION || '1.0.0',

    // Lower sample rate for edge (high volume)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });
}

export {};
