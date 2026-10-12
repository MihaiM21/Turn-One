// Audits the F1 API the way the /f1 pages see it: for each event and public
// session type, is there data, and is it a copy of another event's?
//
//   npm run audit:f1                 # current year
//   npm run audit:f1 -- 2025 2026    # specific years
//
// Reads F1_API_URL / F1_API_KEY from .env.local (via --env-file). Throttled to
// stay under the API's 60 requests/min. Exit code 1 if anything is suspect.
// The copy rule mirrors lib/f1/integrity.ts — keep them in sync.

const base = (process.env.F1_API_URL ?? "").replace(/\/$/, "")
const key = process.env.F1_API_KEY ?? ""
if (!base) {
  console.error("F1_API_URL is not set (run via `npm run audit:f1`, which loads .env.local)")
  process.exit(2)
}

const SESSIONS = { Qualifying: "Q", Race: "R", "Sprint Qualifying": "SQ", Sprint: "S" }
const MIN_SHARED = 5
const THRESHOLD = 0.5
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(path) {
  await sleep(1100)
  try {
    const res = await fetch(`${base}/v2/${path}`, { headers: { "X-API-Key": key }, signal: AbortSignal.timeout(15_000) })
    const body = await res.json().catch(() => null)
    return { status: res.status, body }
  } catch (e) {
    return { status: 0, body: null, error: String(e) }
  }
}

const fp = (rows) => new Set(rows.filter((r) => r?.Driver && r?.LapTime).map((r) => `${r.Driver}|${r.LapTime}`))
function copied(a, b) {
  const [s, l] = a.size <= b.size ? [a, b] : [b, a]
  let shared = 0
  for (const k of s) if (l.has(k)) shared++
  return s.size > 0 && shared >= MIN_SHARED && shared / s.size >= THRESHOLD ? shared : 0
}

const years = process.argv.slice(2).map(Number).filter(Boolean)
if (!years.length) years.push(new Date().getUTCFullYear())
let problems = 0

for (const year of years) {
  const ev = await get(`seasons/${year}/events`)
  const events = (ev.body?.events ?? []).filter((e) => !/testing/i.test(e.name))
  console.log(`\n=== ${year}: ${events.length} events (HTTP ${ev.status}) ===`)
  const byCode = {}
  for (const [i, e] of events.entries()) {
    const sess = await get(`seasons/${year}/events/${e.key}/sessions`)
    const list = (sess.body?.sessions ?? []).filter((s) => SESSIONS[s.name])
    for (const s of list) {
      const code = SESSIONS[s.name]
      const r = await get(`qualifying-results-data?year=${year}&gp=${e.key}&session=${code}`)
      const rows = Array.isArray(r.body) ? r.body : []
      let status = "final"
      if (r.status === 0 || r.status >= 500 || r.status === 429) status = `error(${r.status})`
      else if (!rows.length) status = "pending/upcoming"
      const entry = { name: e.name, round: i + 1, code, s: s.name, status, fp: fp(rows), rows: rows.length }
      ;(byCode[code] ??= []).push(entry)
    }
  }
  for (const entries of Object.values(byCode)) {
    entries.forEach((cur, i) => {
      if (cur.status !== "final") return
      for (const prev of entries.slice(0, i)) {
        const shared = prev.status === "final" ? copied(cur.fp, prev.fp) : 0
        if (shared) {
          cur.status = `SUSPECT: ${shared}/${cur.fp.size} rows identical to ${prev.name}`
          break
        }
      }
    })
  }
  for (const entries of Object.values(byCode)) {
    for (const e of entries) {
      if (e.status.startsWith("SUSPECT") || e.status.startsWith("error")) problems++
      console.log(`${String(e.round).padStart(2)}  ${e.name.padEnd(26)} ${e.s.padEnd(18)} ${String(e.rows).padStart(3)} rows  ${e.status}`)
    }
  }
}

console.log(problems ? `\n${problems} session(s) need attention.` : "\nAll sessions with data look clean.")
process.exit(problems ? 1 : 0)
