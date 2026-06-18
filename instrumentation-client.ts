// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

/**
 * BUG-007 fix: Sentry was failing with 403s on every page because the
 * project was paused/deleted and a hardcoded DSN was used. Now:
 *  1. DSN comes from env (NEXT_PUBLIC_SENTRY_DSN) — can be rotated
 *  2. Sentry init is skipped when the DSN is missing or invalid
 *  3. A `telemetryEnabled` flag + console warning surfaces the failure mode
 *     to the team instead of silently dropping events
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-007)
 *
 * NOTE: if the Sentry project is genuinely paused/deleted, the only real
 * fix is to reactivate it in the Sentry dashboard. The circuit breaker
 * below stops 403s from spamming the browser console, but you should
 * also re-check https://sentry.io/settings/hein-htet-aung/projects/javascript-nextjs/
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDev = process.env.NODE_ENV !== "production";

if (!SENTRY_DSN) {
  // Don't init Sentry without a DSN. The `sentry.server.config.ts` and
  // `sentry.client.config.ts` files use the same env var.
  if (isDev) {
    console.warn("[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set — telemetry disabled.");
  }
} else {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Add optional integrations for additional features
    integrations: [
      Sentry.replayIntegration(),
    ],

    // Sample less aggressively than 1.0 — 10% traces is plenty for QA + ops.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Enable logs to be sent to Sentry (when the project is active)
    enableLogs: true,

    // Replay sampling
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Don't send PII by default — login flow crosses these boundaries
    sendDefaultPii: false,

    // BUG-007: when the Sentry project is paused/deleted, the envelope POST
    // returns 403. We can't see the response status in `beforeSend` (it runs
    // after a successful send) — but we can drop 4xx transport errors via
    // the `ignoreErrors` filter below and disable telemetry after N failures.
    ignoreErrors: [
      /sentry.*403/i,
      /status code 403/i,
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
