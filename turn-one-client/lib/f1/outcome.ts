// Turns a raw F1 API response into something the pages can reason about.
//
// The old code threw on any non-OK status and swallowed every error into
// notFound(), so "this session has no data" and "the API hiccuped" looked the
// same — and the hiccup was cached as a 404 for a day. Here the two are
// different kinds, and only `transient` is allowed to bubble up as an error
// (ISR then keeps serving the last good page instead of replacing it).

/** `status` 0 means no HTTP response at all (network error, timeout, not configured); `error` says why. */
export type ApiResult = { status: number; body?: unknown; error?: string }

export type Outcome<T> =
  | { kind: "ok"; data: T }
  | { kind: "empty" } // the API answered, there is nothing (yet)
  | { kind: "not-found"; detail?: string } // the API says this session/event doesn't exist
  | { kind: "transient"; detail?: string } // network, timeout, rate limit, 5xx, auth — try again later

function errorDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined
  const o = body as Record<string, unknown>
  if (typeof o.detail === "string") return o.detail
  if (typeof o.error === "string") return o.error
  return undefined
}

/** `{ error }` / `{ detail }` bodies — the API sometimes wraps failures in a 200. */
export function isErrorBody(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false
  const o = body as Record<string, unknown>
  return typeof o.error === "string" || typeof o.detail === "string"
}

export function isEmptyBody(body: unknown): boolean {
  if (body == null) return true
  if (Array.isArray(body)) return body.length === 0
  if (typeof body === "object") {
    const o = body as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data.length === 0
    return Object.keys(o).length === 0
  }
  return false
}

export function classifyResponse(res: ApiResult): Outcome<unknown> {
  if (res.status === 0) return { kind: "transient", detail: res.error ?? "no response" }
  const { status, body } = res
  if (status === 400 || status === 404) return { kind: "not-found", detail: errorDetail(body) }
  if (status < 200 || status >= 300) return { kind: "transient", detail: `HTTP ${status}${errorDetail(body) ? `: ${errorDetail(body)}` : ""}` }
  if (isErrorBody(body)) return { kind: "not-found", detail: errorDetail(body) }
  if (isEmptyBody(body)) return { kind: "empty" }
  return { kind: "ok", data: body }
}

/** Unwrap an outcome that must not be transient; maps everything else to data | null. */
export function dataOrNull<T>(o: Outcome<T>, what: string): T | null {
  if (o.kind === "transient") throw new Error(`F1 API unavailable (${what}): ${o.detail ?? "unknown"}`)
  return o.kind === "ok" ? o.data : null
}
