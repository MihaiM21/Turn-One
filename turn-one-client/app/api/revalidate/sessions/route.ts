import { timingSafeEqual } from "node:crypto"
import { publishIfReady, sweep, type SessionKey } from "@/lib/f1/publish"
import { SEO_SESSIONS } from "@/lib/f1/session-manifest"

/**
 * POST /api/revalidate/sessions — publish finished F1 sessions to the SEO pages.
 *
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *
 *   (no body)                                   sweep every Qualifying/Race that ended in the last 72 h
 *   { "year": "2026", "event": "italian-gp",    publish that one session now, if the F1 API has it
 *     "session": "race" }
 *
 * The .NET API calls the sweep on a timer (SessionPublishSweepService); the F1
 * data service can call the single-session form when its ingestion finishes.
 * See lib/f1/publish.ts for what "publish" does.
 */

export const dynamic = "force-dynamic"

function authorized(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

function parseKey(body: unknown): SessionKey | null {
  if (!body || typeof body !== "object") return null
  const { year, event, session } = body as Record<string, unknown>
  if (typeof year !== "string" || !/^\d{4}$/.test(year)) return null
  if (typeof event !== "string" || !/^[a-z0-9-]{1,80}$/.test(event)) return null
  if (!SEO_SESSIONS.some((s) => s.slug === session)) return null
  return { year, event, session: session as SessionKey["session"] }
}

export async function POST(req: Request) {
  if (!process.env.REVALIDATE_SECRET) {
    return Response.json({ error: "REVALIDATE_SECRET is not configured" }, { status: 503 })
  }
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 })

  const origin = new URL(req.url).origin
  const text = await req.text()

  if (!text.trim()) {
    const results = await sweep(origin)
    return Response.json({ swept: results.length, results })
  }

  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return Response.json({ error: "body must be JSON" }, { status: 400 })
  }
  const key = parseKey(body)
  if (!key) {
    return Response.json({ error: "expected { year: 'YYYY', event: '<slug>', session: 'qualifying' | 'race' }" }, { status: 400 })
  }
  const outcome = await publishIfReady(key, origin)
  const status = outcome === "unknown-session" ? 404 : outcome === "pending" ? 409 : outcome === "error" ? 502 : 200
  return Response.json({ ...key, outcome }, { status })
}
