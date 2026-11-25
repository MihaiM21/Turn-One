import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  ClipboardList,
  Download,
  Eye,
  Flag,
  Gift,
  History,
  House,
  LineChart,
  MonitorPlay,
  ListOrdered,
  Laptop,
  Library,
  Rocket,
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
  /** Dropped once the driver has been accepted into the closed beta. */
  hideWhenBetaAccepted?: boolean
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

/**
 * Four groups for the sim product, then one closed "More" group for the rest
 * (PBI-066). The old Overview item went away when /simracing merged into Home.
 */
export const DASHBOARD_NAV: NavGroup[] = [
  {
    id: "drive",
    label: "Drive",
    items: [
      { title: "Home", url: "/dashboard", icon: House },
      { title: "Live cockpit", url: "/simracing/live", icon: Activity },
      { title: "Sessions", url: "/simracing/sessions", icon: History },
    ],
  },
  {
    id: "improve",
    label: "Improve",
    items: [
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
      { title: "OBS overlays", url: "/simracing/streamer", icon: MonitorPlay, plan: "PRO" },
    ],
  },
  {
    id: "link",
    label: "Turn One Link",
    items: [
      { title: "Download and setup", url: "/simracing/download", icon: Download },
      { title: "Devices", url: "/link", icon: Laptop },
      { title: "Closed beta", url: "/simracing/beta", icon: Rocket, hideWhenBetaAccepted: true },
    ],
  },
  {
    id: "more",
    label: "More",
    collapsible: true,
    items: [
      { title: "Rewards", url: "/rewards", icon: Gift },
      { title: "Coin store", url: "/store", icon: Store },
      { title: "F1 Archive", url: "/f1", icon: Flag },
      { title: "Plot generator", url: "/generator", icon: ChartNoAxesCombined },
      { title: "Docs", url: "/docs", icon: BookOpen },
    ],
  },
]

export const ADMIN_NAV_GROUP: NavGroup = {
  id: "admin",
  label: "Admin",
  items: [
    {
      title: "Admin panel",
      url: "/admin",
      icon: Shield,
      // The two pages below have their own items.
      exclude: ["/admin/beta", "/admin/catalog"],
    },
    { title: "Beta applications", url: "/admin/beta", icon: ClipboardList },
    { title: "Catalog review", url: "/admin/catalog", icon: Library },
  ],
}

/** Fills `{username}`; drops items that need a username when there is none, and the beta item once accepted. */
export function resolveNavItems(
  groups: NavGroup[],
  username: string | null | undefined,
  options: { betaAccepted?: boolean } = {},
): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.flatMap((item) => {
      if (item.hideWhenBetaAccepted && options.betaAccepted) return []
      if (!item.url.includes("{username}")) return [item]
      if (!username) return []
      return [{ ...item, url: item.url.replace("{username}", encodeURIComponent(username)) }]
    }),
  }))
}

/** One plan badge per group stays visible (the first); the rest show on hover. */
export function alwaysVisibleBadges(group: NavGroup): Set<string> {
  const first = group.items.find((item) => item.plan)
  return new Set(first ? [first.url] : [])
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
