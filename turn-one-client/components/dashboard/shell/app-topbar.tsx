"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Coins } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBalance } from "@/components/providers/balance-provider"
import { useNotificationStats } from "@/hooks/use-notification-stats"
import { DASHBOARD_NAV, findActiveNav, pathMatches } from "@/lib/navigation/dashboard-nav"
import { useSimFilter } from "@/lib/simracing/sim-filter"
import { SIM_FILTERS, type SimFilter } from "@/lib/simracing/sims"

/** Pages where the sim filter changes what you see. */
const SIM_FILTERED_ROUTES = ["/dashboard", "/simracing"]

/** Fallback titles for routes that aren't in the sidebar. */
const ROUTE_TITLES: [string, string][] = [
  ["/account", "Account"],
  ["/notifications", "Notifications"],
  ["/settings", "Settings"],
  ["/admin", "Admin"],
  ["/hub", "Race-week hub"],
  ["/games", "Games"],
  ["/live", "Live timing"],
]

function useCrumbs(path: string): { group?: string; page: string } {
  return React.useMemo(() => {
    const hit = findActiveNav(DASHBOARD_NAV, path)
    if (hit) return { group: hit.group.label, page: hit.item.title }
    if (pathMatches(path, "/simracing/drivers")) return { group: "Compete", page: "Driver" }
    const route = ROUTE_TITLES.find(([prefix]) => pathMatches(path, prefix))
    return { page: route?.[1] ?? "Turn One" }
  }, [path])
}

export function SimFilterSelect() {
  const { filter, setFilter } = useSimFilter()
  return (
    <Select value={filter} onValueChange={(v) => setFilter(v as SimFilter)}>
      <SelectTrigger size="sm" aria-label="Filter by sim" className="h-8 w-[8.5rem] border-border bg-card text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SIM_FILTERS.map((f) => (
          <SelectItem key={f.value} value={f.value} className="text-xs">
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function AppTopbar() {
  const path = usePathname() ?? ""
  const crumbs = useCrumbs(path)
  const { coins } = useBalance()
  const { stats } = useNotificationStats()
  const showSimFilter = SIM_FILTERED_ROUTES.some((p) => pathMatches(path, p))

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.group ? (
            <>
              <BreadcrumbItem className="eyebrow hidden text-[11px] sm:inline-flex">{crumbs.group}</BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
            </>
          ) : null}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="font-display truncate text-base">{crumbs.page}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-1.5">
        {showSimFilter ? <SimFilterSelect /> : null}
        <Link
          href="/rewards"
          className="hidden h-8 items-center gap-1 rounded-md px-2 font-mono text-xs tabular-nums text-instrument hover:bg-accent sm:flex"
          aria-label={`${coins} coins, open rewards`}
        >
          <Coins className="size-3.5" aria-hidden />
          {coins.toLocaleString()}
        </Link>
        <Link
          href="/notifications"
          className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={stats.unreadCount > 0 ? `Notifications, ${stats.unreadCount} unread` : "Notifications"}
        >
          <Bell className="size-4" />
          {stats.unreadCount > 0 ? (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" aria-hidden />
          ) : null}
        </Link>
      </div>
    </header>
  )
}
