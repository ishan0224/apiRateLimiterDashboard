import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "API Rate Limiter Dashboard",
  description: "Live API rate-limiting analytics and pipeline health dashboard.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
