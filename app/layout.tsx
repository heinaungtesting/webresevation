import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SportsMatch Tokyo - Find Sports Partners & Sessions",
  description: "Connect with sports enthusiasts in Tokyo. Find badminton, basketball, tennis, and more sessions at local sport centers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
