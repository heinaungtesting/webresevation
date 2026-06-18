/**
 * BUG-007: Sentry initialization must be resilient to a missing DSN.
 *
 * Before fix: the client config contained a HARDCODED DSN string pointing
 * to a paused/deleted Sentry project, causing 403 responses on every page.
 * The team had zero production error visibility.
 *
 * After fix: NEXT_PUBLIC_SENTRY_DSN is required. When missing, Sentry.init
 * is not called and a console.warn surfaces the situation. The 403 spam
 * is filtered in `ignoreErrors`.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-007)
 *
 * NOTE: this is a code-level test only. The actual fix for a paused
 * Sentry project requires reactivating it in the Sentry dashboard.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("BUG-007: Sentry init is env-var driven and resilient to 403s", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("the instrumentation-client file does NOT contain a hardcoded DSN", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("instrumentation-client.ts", "utf8");
    // The original had a hardcoded DSN like
    // "2e34c0282f04440cdc35189688a9aec1@o4510412573835264..."
    // Verify it was removed.
    expect(content).not.toMatch(/[a-f0-9]{32}@o\d+\.ingest\.us\.sentry\.io/);
  });

  it("the instrumentation-client file uses NEXT_PUBLIC_SENTRY_DSN env var", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("instrumentation-client.ts", "utf8");
    expect(content).toContain("NEXT_PUBLIC_SENTRY_DSN");
  });

  it("the instrumentation-client file filters Sentry 403 errors", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("instrumentation-client.ts", "utf8");
    expect(content).toMatch(/ignoreErrors[\s\S]*403/i);
  });
});
