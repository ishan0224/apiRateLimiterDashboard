import type { ReactNode } from "react";

import { MobileNav } from "@/components/dashboard/shell/mobile-nav";
import { SideNav } from "@/components/dashboard/shell/side-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[240px_1fr]">
      <div className="hidden md:block">
        <SideNav />
      </div>
      <main className="min-h-screen">
        <MobileNav />
        {children}
      </main>
    </div>
  );
}
