'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from "@/components/auth/protected-route";
import { MainFooter } from "@/components/footer/main-footer";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black">
            <div className="flex-grow">
              {children}
            </div>
            <div className="mt-auto">
              <MainFooter />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
