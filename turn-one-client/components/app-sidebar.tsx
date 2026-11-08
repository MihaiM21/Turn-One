"use client"

import * as React from "react"
import Link from "next/link"
import { LifeBuoy } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { LinkStatusPill } from "@/components/dashboard/shell/link-status-pill"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-provider"
import { ADMIN_NAV_GROUP, DASHBOARD_NAV, resolveNavItems } from "@/lib/navigation/dashboard-nav"

const SECONDARY_NAV = [{ title: "Support", url: "/contact", icon: LifeBuoy }]

/** True when the stored JWT carries the ADMIN role. UI only; the backend enforces [Authorize(Roles = "Admin")]. */
function tokenIsAdmin(): boolean {
  if (typeof window === "undefined") return false
  const token = localStorage.getItem("token")
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return (
      payload.role === "ADMIN" ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] === "ADMIN"
    )
  } catch {
    return false
  }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const displayUser = React.useMemo(
    () => ({
      name: user?.username || "Driver",
      email: user?.email || "",
      avatar: user?.avatar || "/basic-avatar.webp",
    }),
    [user],
  )

  // Read after mount so the server render and the first client render match.
  const [isAdmin, setIsAdmin] = React.useState(false)
  React.useEffect(() => setIsAdmin(user?.role === "ADMIN" || tokenIsAdmin()), [user])

  const groups = React.useMemo(() => {
    const base = isAdmin ? [...DASHBOARD_NAV, ADMIN_NAV_GROUP] : DASHBOARD_NAV
    return resolveNavItems(base, user?.username)
  }, [isAdmin, user?.username])

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Turn One">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny static logo */}
                  <img src="/logo.png" alt="" className="size-8 object-contain" />
                </div>
                <div className="grid flex-1 text-left leading-none">
                  <span className="font-display truncate text-lg">
                    Turn <span className="text-primary">One</span>
                  </span>
                  <span className="eyebrow truncate text-[10px]">Sim racing telemetry</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <LinkStatusPill />
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
        <NavSecondary items={SECONDARY_NAV} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
