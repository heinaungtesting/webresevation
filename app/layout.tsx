import type { Metadata } from "next";
import "./[locale]/globals.css";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "SportsMatch Tokyo - Find Sports Partners & Sessions",
  description: "Connect with sports enthusiasts in Tokyo. Find badminton, basketball, tennis, and more sessions at local sport centers.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // BUG-006 fix: <html lang> must reflect the active locale for a11y/SEO
  // /ja/* → <html lang="ja">, /en/* → <html lang="en">. Falls back to "en"
  // when accessed outside the [locale] segment (e.g. /api, /not-a-locale).
  const locale = await getLocale();
  const htmlLang = locale === "ja" ? "ja" : "en";

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
