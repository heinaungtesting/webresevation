/**
 * BUG-021: 404 page is English-only on every locale, including JA.
 *
 * Before fix: app/[locale]/not-found.tsx rendered hardcoded English
 * ("Page not found", "Return Home") with href="/" which dropped the
 * locale and 307-redirected a /ja/... user to /en.
 *
 * After fix: the 404 page uses next-intl to translate heading, body,
 * and CTA. The "Return Home" link goes to /{locale}/ so the user
 * stays in their locale.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-021)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("BUG-021: 404 page is localized", () => {
  const enJsonPath = resolve(process.cwd(), "messages/en.json");
  const jaJsonPath = resolve(process.cwd(), "messages/ja.json");
  const notFoundPath = resolve(process.cwd(), "app/[locale]/not-found.tsx");

  const enMessages = JSON.parse(readFileSync(enJsonPath, "utf8"));
  const jaMessages = JSON.parse(readFileSync(jaJsonPath, "utf8"));
  const notFoundSource = readFileSync(notFoundPath, "utf8");

  it("messages/en.json has a notFound namespace with title, description, and cta", () => {
    expect(enMessages.notFound).toBeDefined();
    expect(enMessages.notFound.title).toBeTruthy();
    expect(enMessages.notFound.description).toBeTruthy();
    expect(enMessages.notFound.cta).toBeTruthy();
  });

  it("messages/ja.json has a notFound namespace with a Japanese title and cta", () => {
    expect(jaMessages.notFound).toBeDefined();
    // Japanese cta should be different from English (proves it's translated, not hardcoded)
    expect(jaMessages.notFound.title).not.toBe(enMessages.notFound.title);
    expect(jaMessages.notFound.cta).not.toBe(enMessages.notFound.cta);
    // JA cta should contain a Japanese character (rough sanity check)
    expect(jaMessages.notFound.cta).toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
  });

  it("the localized not-found.tsx uses next-intl (useTranslations or getTranslations)", () => {
    expect(notFoundSource).toMatch(/useTranslations|getTranslations/);
  });

  it("the localized not-found.tsx no longer hardcodes 'Page not found' in English", () => {
    // The old file had the literal string "Page not found" hardcoded in JSX
    expect(notFoundSource).not.toMatch(/Page not found/);
  });

  it("the localized not-found.tsx links back to /{locale} (not the bare '/')", () => {
    // The CTA Link must be locale-aware so a /ja/... user lands on /ja
    expect(notFoundSource).toMatch(/href=\{[^}]*locale[^}]*\}/);
    // And the file must NOT use a bare href="/"
    expect(notFoundSource).not.toMatch(/href=["']\/["']/);
  });
});
