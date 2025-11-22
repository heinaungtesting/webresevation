import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

  // Session Replay for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Set environment
  environment: process.env.NODE_ENV,

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Network errors
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // User cancelled
    'AbortError',
    'cancelled',
  ],

  // Don't send PII
  beforeSend(event) {
    // Remove sensitive data from request body
    if (event.request?.data) {
      const data = event.request.data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.password) parsed.password = '[REDACTED]';
          if (parsed.email) parsed.email = '[REDACTED]';
          event.request.data = JSON.stringify(parsed);
        } catch {
          // Not JSON, leave as is
        }
      }
    }
    return event;
  },
});
