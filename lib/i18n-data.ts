/**
 * Locale-aware field selector for SportsMatch Tokyo.
 *
 * BUG-005 regression: previously the SessionCard read `sport_center.name_en`
 * and `sport_type.replace('-', ' ')` unconditionally, so the JA locale
 * showed English venue names and lowercase English sport names everywhere.
 *
 * After fix: when locale is 'ja', read name_ja / description_ja / etc.;
 * when locale is 'en' (or anything else), fall back to name_en.
 *
 * Source: /home/hermes/reports/sportsmatch-tokyo-beta-report.md (BUG-005)
 */

export type SupportedLocale = "en" | "ja";

/**
 * Returns the active locale as a normalized 2-letter code, defaulting to 'en'.
 * Use this when you need to switch between `name_en` and `name_ja` fields.
 */
export function normalizeLocale(locale: string | undefined | null): SupportedLocale {
  if (locale === "ja") return "ja";
  return "en";
}

/**
 * Pick the localized field from an object that has both `*_en` and `*_ja`
 * variants. Falls back to English if the JA field is missing.
 */
export function pickLocalized<T extends Record<string, any>>(
  obj: T | null | undefined,
  field: string,
  locale: string | undefined | null
): string | null {
  if (!obj) return null;
  const isJa = normalizeLocale(locale) === "ja";
  const jaKey = `${field}_ja`;
  const enKey = `${field}_en`;
  const value = isJa ? obj[jaKey] ?? obj[enKey] : obj[enKey] ?? obj[jaKey];
  return value ?? null;
}

/**
 * Sport name display: maps the enum (e.g. "table-tennis") to a human
 * string. Honors the active locale via next-intl's `t()` function.
 *
 * Usage:
 *   const t = useTranslations('sessions');
 *   <h3>{getSportName(session.sport_type, t)}</h3>
 */
export function getSportName(
  sportType: string,
  t: (key: string) => string
): string {
  // The i18n catalog uses camelCase keys (e.g. "tableTennis") while the
  // schema enum uses kebab-case (e.g. "table-tennis"). Normalize.
  const catalogKey = `sports.${sportType.replace(/-(\w)/g, (_, c) => c.toUpperCase())}`;
  const translated = t(catalogKey);
  if (translated && translated !== catalogKey) return translated;
  // Fallback: humanize the enum ("table-tennis" → "table tennis")
  return sportType.replace(/-/g, " ");
}
