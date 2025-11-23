/**
 * Sentry Client-Side Configuration
 *
 * This file configures Sentry for the browser/client-side.
 * It runs in the browser and captures client-side errors.
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize if DSN is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (only in production, sampled)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // Filter out noisy errors
    ignoreErrors: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      // Network errors (often user's connection)
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // User aborted
      'AbortError',
      'The operation was aborted',
      // Cancelled navigation
      'cancelled',
    ],

    // Don't send PII
    beforeSend(event) {
      // Remove user IP
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });
}

export {};
