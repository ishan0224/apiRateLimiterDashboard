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

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("api-rate-limiter-theme");
    const theme = stored === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
