/**
 * BUG-005 regression: locale-aware field selection for session data.
 *
 * Before fix:
 *  - /ja/sessions showed `sport_type.replace('-', ' ')` → "table tennis"
 *  - /ja/sessions/[id] showed `sport_center.name_en` → "Meguro Kumin Center"
 *  - Venue addresses, descriptions, station names — all English on JA
 *
 * After fix:
 *  - getSportName("table-tennis", t) → "卓球" on JA, "Table Tennis" on EN
 *  - pickLocalized(sc, "name", "ja") → name_ja ?? name_en
 *  - pickLocalized(sc, "name", "en") → name_en
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-005)
 */

import { describe, it, expect, vi } from "vitest";
import { normalizeLocale, pickLocalized, getSportName } from "@/lib/i18n-data";

describe("normalizeLocale", () => {
  it("returns 'ja' for 'ja'", () => {
    expect(normalizeLocale("ja")).toBe("ja");
  });
  it("returns 'en' for 'en'", () => {
    expect(normalizeLocale("en")).toBe("en");
  });
  it("returns 'en' for unknown locales", () => {
    expect(normalizeLocale("xx")).toBe("en");
    expect(normalizeLocale("")).toBe("en");
    expect(normalizeLocale(null)).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });
});

describe("pickLocalized", () => {
  it("reads name_ja when locale is 'ja'", () => {
    const sc = { name_en: "Meguro Kumin Center", name_ja: "目黒区民センター" };
    expect(pickLocalized(sc, "name", "ja")).toBe("目黒区民センター");
  });
  it("reads name_en when locale is 'en'", () => {
    const sc = { name_en: "Meguro Kumin Center", name_ja: "目黒区民センター" };
    expect(pickLocalized(sc, "name", "en")).toBe("Meguro Kumin Center");
  });
  it("falls back to name_en when name_ja is missing on JA locale", () => {
    const sc = { name_en: "Tokyo Sports Center" };
    expect(pickLocalized(sc, "name", "ja")).toBe("Tokyo Sports Center");
  });
  it("returns null for null input", () => {
    expect(pickLocalized(null, "name", "ja")).toBe(null);
  });
  it("returns null when neither key exists", () => {
    expect(pickLocalized({}, "name", "en")).toBe(null);
  });
  it("works for any field (address, description, station, etc.)", () => {
    const sc = {
      address_en: "2-4-36 Meguro",
      address_ja: "東京都目黒区目黒2-4-36",
      description_en: "Doubles practice",
      description_ja: "ダブルスの練習",
    };
    expect(pickLocalized(sc, "address", "ja")).toBe("東京都目黒区目黒2-4-36");
    expect(pickLocalized(sc, "description", "ja")).toBe("ダブルスの練習");
  });
});

describe("getSportName", () => {
  it("uses i18n catalog when key is present", () => {
    const t = vi.fn((k: string) => {
      if (k === "sports.tableTennis") return "卓球";
      if (k === "sports.badminton") return "バドミントン";
      return k; // t() returns the key for missing translations
    });
    expect(getSportName("table-tennis", t)).toBe("卓球");
    expect(getSportName("badminton", t)).toBe("バドミントン");
  });
  it("falls back to humanized enum when key is missing", () => {
    const t = vi.fn((k: string) => k);
    expect(getSportName("unknown-sport", t)).toBe("unknown sport");
  });
  it("maps kebab-case sport types to camelCase catalog keys", () => {
    const t = vi.fn((k: string) => {
      if (k === "sports.tableTennis") return "Table Tennis";
      return k;
    });
    // The critical BUG-005 case — `table-tennis` must look up `tableTennis`
    expect(getSportName("table-tennis", t)).toBe("Table Tennis");
    expect(t).toHaveBeenCalledWith("sports.tableTennis");
  });
});
