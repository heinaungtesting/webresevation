import type { Metadata } from "next";
import "./globals.css";
import Navigation from "./components/layout/Navigation";
import { AuthProvider } from "./contexts/AuthContext";

export const metadata: Metadata = {
  title: "SportsMatch Tokyo - Find Sports Partners & Sessions",
  description: "Connect with sports enthusiasts in Tokyo. Find badminton, basketball, tennis, and more sessions at local sport centers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
