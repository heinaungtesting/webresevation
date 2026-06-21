import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * BUG-031 fix: formatDate accepts a `locale` argument and uses it.
 * Default is 'ja-JP' to preserve the prior behaviour for any caller
 * that doesn't pass one (e.g. server-rendered RSC without a request
 * context). Callers on EN pages pass 'en-US' explicitly.
 */
export function formatDate(
  date: Date | string,
  locale: string = "ja-JP"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * BUG-031 fix: formatTime accepts a `locale` argument and uses it.
 * Default is 'ja-JP' (24-hour) to preserve prior behaviour.
 */
export function formatTime(
  date: Date | string,
  locale: string = "ja-JP"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
