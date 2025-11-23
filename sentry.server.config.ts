/**
 * Sentry Server-Side Configuration
 *
 * This file configures Sentry for the Node.js server.
 * It runs on the server and captures server-side errors.
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

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profile sampling (for performance)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Integrations
    integrations: [
      // Prisma integration for database query tracking
      Sentry.prismaIntegration(),
    ],

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-csrf-token'];
      }

      // Remove user IP for privacy
      if (event.user) {
        delete event.user.ip_address;
      }

      return event;
    },

    // Filter sensitive breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Don't log fetch requests to external services with auth
      if (breadcrumb.category === 'fetch' && breadcrumb.data?.url) {
        const url = breadcrumb.data.url as string;
        if (url.includes('supabase') || url.includes('resend') || url.includes('upstash')) {
          return null;
        }
      }
      return breadcrumb;
    },

    // Debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });
}

export {};
