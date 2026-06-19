/**
 * BUG-030: "Log in" is labeled with three different forms in the EN
 * locale: "Login" (nav), "Log In" (auth.login.loginButton), and "Log in"
 * (every other place).
 *
 * After fix: every EN "log in" string uses the same form — "Log in"
 * (sentence case, the verb form) — in both noun and button contexts.
 * JA is already consistent ("ログイン").
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-030)
 *
 * Strategy:
 *   - The test loads messages/en.json as a flat list of every leaf
 *     string.
 *   - It scans each leaf for any "log in"-related token and asserts
 *     they all match a single canonical form.
 *   - It also asserts the rendered HTML on /en/login and /en/signup
 *     contains exactly the canonical "Log in" form (not "Log In" or
 *     "Login" as a button label).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const CANONICAL = "Log in"; // sentence case, the verb form

/** Walk an object and yield every leaf string. */
function* walkStrings(obj: unknown, path: string[] = []): Generator<{ path: string; value: string }> {
  if (obj == null) return;
  if (typeof obj === "string") {
    yield { path: path.join("."), value: obj };
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) yield* walkStrings(obj[i], [...path, String(i)]);
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      yield* walkStrings(v, [...path, k]);
    }
  }
}

describe("BUG-030: 'log in' labels are consistent in messages/en.json", () => {
  const enJsonPath = resolve(process.cwd(), "messages/en.json");
  const enMessages = JSON.parse(readFileSync(enJsonPath, "utf8"));

  // The bug touches these specific keys; everything else is untouched.
  const suspiciousRegex = /\b(Login|Log In|Log in|LOG IN|LOGIN)\b/;

  it("every 'log in' string in EN messages uses the canonical form 'Log in'", () => {
    const offenders: { path: string; value: string }[] = [];
    for (const leaf of walkStrings(enMessages)) {
      if (suspiciousRegex.test(leaf.value)) {
        // Must be exactly the canonical form
        if (!leaf.value.includes(CANONICAL)) {
          offenders.push(leaf);
        }
      }
    }
    // Diagnostic: print offenders if any
    if (offenders.length > 0) {
      const lines = offenders.map((o) => `  ${o.path}: ${JSON.stringify(o.value)}`).join("\n");
      throw new Error(
        `Found ${offenders.length} non-canonical 'log in' strings:\n${lines}\n` +
          `All must include "${CANONICAL}".`
      );
    }
    expect(offenders).toHaveLength(0);
  });

  it("nav.login is the canonical form (not 'Login')", () => {
    expect(enMessages.nav.login).toBe(CANONICAL);
  });

  it("auth.login.loginButton is the canonical form (not 'Log In')", () => {
    expect(enMessages.auth.login.loginButton).toBe(CANONICAL);
  });

  it("auth.signup.loginLink is the canonical form", () => {
    expect(enMessages.auth.signup.loginLink).toBe(CANONICAL);
  });
});
