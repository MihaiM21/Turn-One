"use client"

import * as React from "react"
import Link from "next/link"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { listDevices, type LinkDevice } from "@/lib/simracing/devices"
import { cn } from "@/lib/utils"

/** A device counts as online if Link reported in within this window. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000

export type LinkStatus =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "online"; device: LinkDevice }
  | { kind: "offline"; device: LinkDevice | null }

export function summariseDevices(devices: LinkDevice[], now = Date.now()): LinkStatus {
  if (devices.length === 0) return { kind: "none" }
  const seen = devices
    .filter((d) => d.lastSeenAt)
    .sort((a, b) => Date.parse(b.lastSeenAt!) - Date.parse(a.lastSeenAt!))
  const latest = seen[0] ?? null
  if (latest && now - Date.parse(latest.lastSeenAt!) < ONLINE_WINDOW_MS) return { kind: "online", device: latest }
  return { kind: "offline", device: latest }
}

export function formatLastSeen(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "never seen"
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60000))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

/** Paired Link devices, refreshed every minute while the tab is visible. */
export function useLinkStatus(): LinkStatus {
  const [status, setStatus] = React.useState<LinkStatus>({ kind: "loading" })

  React.useEffect(() => {
    let cancelled = false
    const load = () => {
      if (document.visibilityState === "hidden") return
      listDevices()
        .then((devices) => !cancelled && setStatus(summariseDevices(devices)))
        .catch(() => !cancelled && setStatus({ kind: "offline", device: null }))
    }
    load()
    const id = window.setInterval(load, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return status
}

export function LinkStatusPill() {
  const status = useLinkStatus()

  const label =
    status.kind === "loading"
      ? "Turn One Link"
      : status.kind === "none"
        ? "Link: not paired"
        : status.kind === "online"
          ? `Link: online · ${status.device.name}`
          : `Link: offline · ${formatLastSeen(status.device?.lastSeenAt)}`

  const href = status.kind === "none" ? "/simracing/download" : "/link"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="sm" tooltip={label} className="text-muted-foreground">
          <Link href={href}>
            <span
              aria-hidden
              className={cn(
                "ml-0.5 size-2 shrink-0 rounded-full",
                status.kind === "online" ? "bg-timing-pb" : status.kind === "none" ? "bg-primary" : "bg-muted-foreground/50",
              )}
            />
            <span className="truncate text-xs">{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
