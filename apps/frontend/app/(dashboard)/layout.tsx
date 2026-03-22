import type { ReactNode } from "react";
import { Suspense } from "react";

import { DashboardQueryProvider } from "@/components/dashboard/shell/dashboard-query-provider";
import { MobileNav } from "@/components/dashboard/shell/mobile-nav";
import { SideNav } from "@/components/dashboard/shell/side-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardQueryProvider>
      <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[240px_1fr]">
        <div className="hidden md:block">
          <Suspense fallback={null}>
            <SideNav />
          </Suspense>
        </div>
        <main className="min-h-screen">
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          {children}
        </main>
      </div>
    </DashboardQueryProvider>
  );
}
