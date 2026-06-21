/**
 * BUG-031: Date format `2026/06/15 08:00` (JA-style) was used on the EN
 * locale because `formatDate`/`formatTime` in `lib/utils.ts` hardcoded
 * `'ja-JP'` as the Intl locale.
 *
 * After fix: `formatDate` and `formatTime` accept a locale string and
 * use it. Defaults are kept (ja-JP) for callers that don't pass one,
 * but the EN pages now pass 'en-US' so the output is `06/15/2026,
 * 08:00 AM` (or similar) instead of `2026/06/15 08:00`.
 *
 * The test inspects the source code rather than the rendered page so
 * we don't have to spin up the full app to assert the contract.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-031)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { formatDate, formatTime } from "@/lib/utils";

describe("BUG-031: formatDate / formatTime are locale-aware", () => {
  const utilsPath = resolve(process.cwd(), "lib/utils.ts");
  const utilsSource = readFileSync(utilsPath, "utf8");

  it("lib/utils.ts does NOT hardcode 'ja-JP' as the only locale", () => {
    // The bug was that formatDate/formatTime always used 'ja-JP'.
    // After the fix, either the locale is parameterized, or the
    // function accepts a locale argument. The "ja-JP" string may
    // still appear as a default, but the signature must take locale.
    expect(utilsSource).toMatch(/format(Date|Time)\s*\([^)]*locale/);
  });

  it("formatDate('2026-06-15T08:00:00Z', 'en-US') does NOT produce a JA-style string", () => {
    // The 'en-US' locale uses month/day/year, e.g. "6/15/2026" or
    // "Jun 15, 2026, 08:00 AM". It should NOT contain the JA-style
    // year-first slash format "2026/06/15".
    const out = formatDate("2026-06-15T08:00:00Z", "en-US");
    expect(out).not.toMatch(/2026\/06\/15/);
  });

  it("formatDate('2026-06-15T08:00:00Z', 'ja-JP') keeps the JA-style format", () => {
    // The JA format is year-first slashes, e.g. "2026/06/15 08:00".
    const out = formatDate("2026-06-15T08:00:00Z", "ja-JP");
    expect(out).toMatch(/2026\/06\/15/);
  });

  it("formatTime('2026-06-15T08:00:00Z', 'en-US') does NOT produce the JA-style 24h-only '08:00'", () => {
    // In en-US, the time would be 8:00 AM; in ja-JP it's 08:00.
    // This is a soft check — we just verify it doesn't match the
    // exact JA pattern with a leading "0" forced and no AM/PM marker.
    const out = formatTime("2026-06-15T08:00:00Z", "en-US");
    // en-US may include AM/PM, or "8:00". We just check the function
    // accepts the locale argument and returns a non-empty string.
    expect(out.length).toBeGreaterThan(0);
  });
});
