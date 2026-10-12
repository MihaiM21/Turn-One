import { ImageResponse } from "next/og"
import { driverName } from "@/lib/f1/driver-names"
import { getSeasonCatalog } from "@/lib/f1/catalog"
import { isSupportedYear } from "@/lib/f1/session-manifest"

// Social card for one session page: event, session, and the top three of the
// classification. Built from the same catalog the page uses, so a session that
// isn't published gets no card (404) rather than a card with made-up content.

const SIZE = { width: 1200, height: 630 }
const HEADERS = { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }

export async function GET(_req: Request, { params }: { params: Promise<{ year: string; event: string; session: string }> }) {
  const { year, event, session: sessionSlug } = await params
  if (!isSupportedYear(year)) return new Response("Not found", { status: 404 })

  let found
  try {
    const cat = await getSeasonCatalog(Number(year))
    const entry = cat.events.find((e) => e.event.slug === event)
    found = entry && { ev: entry.event, session: entry.sessions.find((s) => s.slug === sessionSlug) }
  } catch {
    return new Response("Upstream unavailable", { status: 503 })
  }
  if (!found?.session || found.session.status !== "final" || !found.session.results) return new Response("Not found", { status: 404 })

  const { ev, session } = found
  const top = session.results!.slice(0, 3)

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#000", color: "#fff", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, letterSpacing: 6, color: "#a1a1aa" }}>
          <div style={{ width: 16, height: 40, background: "#e10600", display: "flex" }} />
          <div style={{ display: "flex" }}>TURN ONE · F1 TELEMETRY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
            {ev.location}, {ev.country} · Round {ev.round}
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            {ev.name} {year}
          </div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: "#e10600" }}>{session.name}</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {top.map((r, i) => (
            <div key={r.Driver} style={{ display: "flex", flexDirection: "column", flex: 1, borderTop: "4px solid #3f3f46", paddingTop: 12 }}>
              <div style={{ display: "flex", fontSize: 24, color: "#a1a1aa" }}>P{i + 1}</div>
              <div style={{ display: "flex", fontSize: 32, fontWeight: 700 }}>{driverName(r.Driver)}</div>
              <div style={{ display: "flex", fontSize: 30, color: "#d4d4d8" }}>{r.LapTime}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...SIZE, headers: HEADERS },
  )
}
