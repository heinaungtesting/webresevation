/**
 * BUG-027: Content-Security-Policy header must be present on auth pages.
 *
 * Before fix: next.config.ts had X-Frame-Options, X-Content-Type-Options,
 * Referrer-Policy, Permissions-Policy, and HSTS — but NO CSP. Auth pages
 * accept passwords, and missing CSP is a notable security gap.
 *
 * After fix: next.config.ts ships a baseline CSP that applies to all
 * routes (including /en/signup, /en/login, /ja/signup, /ja/login) with
 * reasonable defaults for a Next.js app: default-src 'self', script-src
 * with 'self' + 'unsafe-inline' (Next.js needs inline boot scripts in
 * dev), style-src 'self' 'unsafe-inline', img-src 'self' data: blob:
 * https:, connect-src 'self' (and the Sentry ingest host), frame-ancestors
 * 'none', base-uri 'self', form-action 'self'.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-027)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-027: Content-Security-Policy header is configured", () => {
  const configPath = resolve(process.cwd(), "next.config.ts");
  const configContent = readFileSync(configPath, "utf8");

  it("next.config.ts declares a Content-Security-Policy header", () => {
    expect(configContent).toMatch(/['"]?Content-Security-Policy['"]?/i);
  });

  it("the CSP restricts default-src to 'self'", () => {
    // The value must include default-src 'self' (baseline)
    expect(configContent).toMatch(/default-src\s+['"]self['"]/);
  });

  it("the CSP locks frame-ancestors to 'none' (defense in depth vs clickjacking)", () => {
    expect(configContent).toMatch(/frame-ancestors\s+['"]none['"]/);
  });

  it("the CSP applies to all routes (source: '/(.*)')", () => {
    // The headers() function must apply CSP to the catch-all route, not
    // only /api/*, so that /en/signup and /en/login are covered.
    expect(configContent).toMatch(/source:\s*['"]\/\(\.\*\)['"]/);
  });

  it("the CSP includes script-src (required for Next.js to boot)", () => {
    expect(configContent).toMatch(/script-src/);
  });
});
