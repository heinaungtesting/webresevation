/**
 * BUG-006 regression test: <html lang> must reflect the active locale.
 *
 * Before fix: every page rendered <html lang="en"> regardless of locale.
 * After fix:  /ja/* → lang="ja", /en/* → lang="en".
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const getLocaleMock = vi.fn();

vi.mock("next-intl/server", () => ({
  getLocale: () => getLocaleMock(),
}));

vi.mock("next/font", () => ({}));

import RootLayout from "@/app/layout";

describe("BUG-006: <html lang> matches active locale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders <html lang="ja"> when locale is "ja"', async () => {
    getLocaleMock.mockResolvedValue("ja");
    const tree = await RootLayout({ children: <div data-testid="child">x</div> });
    expect(tree.props.lang).toBe("ja");
  });

  it('renders <html lang="en"> when locale is "en"', async () => {
    getLocaleMock.mockResolvedValue("en");
    const tree = await RootLayout({ children: <div data-testid="child">x</div> });
    expect(tree.props.lang).toBe("en");
  });

  it("falls back to en for unknown locales (e.g. /api, /_next)", async () => {
    getLocaleMock.mockResolvedValue("xx");
    const tree = await RootLayout({ children: <div data-testid="child">x</div> });
    expect(tree.props.lang).toBe("en");
  });
});
