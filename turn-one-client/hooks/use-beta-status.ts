"use client"

import * as React from "react"
import { request } from "@/lib/simracing/api"

export type BetaStatus = "none" | "pending" | "accepted" | "declined" | "unknown"

/** Maps the `beta/me` payload to a status; the backend's casing is not guaranteed. */
export function parseBetaStatus(payload: { status?: string } | null | undefined): BetaStatus {
  const s = payload?.status?.toLowerCase()
  if (s === "pending" || s === "accepted" || s === "declined") return s
  return payload ? "unknown" : "none"
}

/** GET api/simracing/beta/me (closed-beta applications). 404 means "not applied yet"; null while loading. */
export function useBetaStatus(): BetaStatus | null {
  const [status, setStatus] = React.useState<BetaStatus | null>(null)
  React.useEffect(() => {
    let cancelled = false
    request<{ status?: string } | null>("/api/simracing/beta/me")
      .then((r) => !cancelled && setStatus(parseBetaStatus(r)))
      .catch((err: { status?: number }) => !cancelled && setStatus(err?.status === 404 ? "none" : "unknown"))
    return () => {
      cancelled = true
    }
  }, [])
  return status
}
