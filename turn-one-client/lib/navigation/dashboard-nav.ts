import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  Download,
  Eye,
  Flag,
  Gauge,
  Gift,
  History,
  House,
  LineChart,
  MonitorPlay,
  ListOrdered,
  Laptop,
  Shield,
  Sparkles,
  Store,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import type { PlanType } from "@/lib/plan-features"

/**
 * The dashboard sidebar, grouped by job (grill 2026-11-08, decision G4).
 * One source of truth: the sidebar renders it, the top bar derives its
 * breadcrumb from it, and tests check the active-route matching.
 */

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  /** Lowest plan that unlocks the page's main feature; shown as a badge. */
  plan?: Exclude<PlanType, "BASIC">
  /** Extra path prefixes that should also mark this item active. */
  match?: string[]
  /** Prefixes that must NOT mark this item active even though they share its prefix. */
  exclude?: string[]
}

export interface NavGroup {
  id: string
  /** Omitted for the untitled top group. */
  label?: string
  items: NavItem[]
  /** Collapsible groups start closed unless one of their items is active. */
  collapsible?: boolean
}

/** `{username}` is replaced with the signed-in user's name. */
export const DRIVER_PAGE_URL = "/simracing/drivers/{username}"

export const DASHBOARD_NAV: NavGroup[] = [
  {
    id: "home",
    items: [{ title: "Home", url: "/dashboard", icon: House }],
  },
  {
    id: "drive",
    label: "Drive",
    items: [
      {
        title: "Overview",
        url: "/simracing",
        icon: Gauge,
        // Every other /simracing/* page has its own item below.
        exclude: [
          "/simracing/live",
          "/simracing/sessions",
          "/simracing/analysis",
          "/simracing/coach",
          "/simracing/leaderboards",
          "/simracing/drivers",
          "/simracing/spectate",
          "/simracing/streamer",
          "/simracing/download",
          "/simracing/beta",
        ],
      },
      { title: "Live cockpit", url: "/simracing/live", icon: Activity },
      { title: "Sessions", url: "/simracing/sessions", icon: History },
      { title: "Analysis", url: "/simracing/analysis", icon: LineChart },
      { title: "Coach", url: "/simracing/coach", icon: Sparkles, plan: "PRO" },
    ],
  },
  {
    id: "compete",
    label: "Compete",
    items: [
      { title: "Leaderboards", url: "/simracing/leaderboards", icon: ListOrdered },
      { title: "My driver page", url: DRIVER_PAGE_URL, icon: UserRound, match: ["/simracing/drivers"] },
      { title: "Spectate", url: "/simracing/spectate", icon: Eye, plan: "PRO" },
    ],
  },
  {
    id: "broadcast",
    label: "Broadcast",
    items: [{ title: "OBS overlays", url: "/simracing/streamer", icon: MonitorPlay, plan: "PRO" }],
  },
  {
    id: "link",
    label: "Turn One Link",
    items: [
      { title: "Download and setup", url: "/simracing/download", icon: Download },
      { title: "Devices", url: "/link", icon: Laptop },
    ],
  },
  {
    id: "community",
    label: "Community",
    collapsible: true,
    items: [
      { title: "Rewards", url: "/rewards", icon: Gift },
      { title: "Coin store", url: "/store", icon: Store },
    ],
  },
  {
    id: "archive",
    label: "F1 Archive",
    collapsible: true,
    items: [
      { title: "Past sessions", url: "/f1", icon: Flag },
      { title: "Plot generator", url: "/generator", icon: ChartNoAxesCombined },
      { title: "Docs", url: "/docs", icon: BookOpen },
    ],
  },
]

export const ADMIN_NAV_GROUP: NavGroup = {
  id: "admin",
  label: "Admin",
  items: [{ title: "Admin panel", url: "/admin", icon: Shield }],
}

/** Fills `{username}`; items that need a username are dropped when there is none. */
export function resolveNavItems(groups: NavGroup[], username: string | null | undefined): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.flatMap((item) => {
      if (!item.url.includes("{username}")) return [item]
      if (!username) return []
      return [{ ...item, url: item.url.replace("{username}", encodeURIComponent(username)) }]
    }),
  }))
}

/** Exact match or a `/`-bounded prefix, so `/live2` never lights up `/live`. */
export function pathMatches(path: string, prefix: string): boolean {
  if (prefix === "/") return path === "/"
  return path === prefix || path.startsWith(prefix + "/")
}

export function isNavItemActive(item: NavItem, path: string): boolean {
  if (item.exclude?.some((p) => pathMatches(path, p))) return false
  return pathMatches(path, item.url) || (item.match?.some((p) => pathMatches(path, p)) ?? false)
}

/** The group and item for the current route, for the top-bar breadcrumb. */
export function findActiveNav(groups: NavGroup[], path: string): { group: NavGroup; item: NavItem } | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (isNavItemActive(item, path)) return { group, item }
    }
  }
  return null
}
