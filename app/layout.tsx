import type { Metadata } from "next";
import "./[locale]/globals.css";

export const metadata: Metadata = {
  title: "SportsMatch Tokyo - Find Sports Partners & Sessions",
  description: "Connect with sports enthusiasts in Tokyo. Find badminton, basketball, tennis, and more sessions at local sport centers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
