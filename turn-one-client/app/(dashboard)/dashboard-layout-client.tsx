'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/dashboard/shell/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/auth/protected-route";
import { MainFooter } from "@/components/footer/main-footer";
import { BalanceProvider } from "@/components/providers/balance-provider";
import { SimFilterProvider } from "@/lib/simracing/sim-filter";

/**
 * The one dashboard shell: sidebar + a shared top bar on every page, so the
 * sidebar can always be opened on mobile. Pages render only their content.
 */
export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <BalanceProvider>
        <SimFilterProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <AppTopbar />
              <div className="flex min-h-[calc(100svh-3.5rem)] flex-col">
                <div className="flex-grow">{children}</div>
                <div className="mt-auto">
                  <MainFooter />
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </SimFilterProvider>
      </BalanceProvider>
    </ProtectedRoute>
  );
}
