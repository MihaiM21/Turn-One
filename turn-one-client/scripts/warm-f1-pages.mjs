// Requests every URL in a site's sitemap that is under /f1, one at a time, so
// the ISR pages (and the F1 API data behind them) are rendered and cached
// before real visitors and crawlers arrive. Run it after a deploy:
//
//   npm run warm:f1 -- https://turnonehub.com
//   npm run warm:f1 -- http://localhost:3001
//
// Sequential on purpose: a cold session can take the F1 API 20 s+ to compute,
// and the API is rate limited (60 requests/min on data endpoints).

const origin = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "")

const xml = await (await fetch(`${origin}/sitemap.xml`)).text()
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).filter((p) => p.startsWith("/f1"))
console.log(`Warming ${urls.length} pages on ${origin}`)

let bad = 0
for (const path of urls) {
  const t = Date.now()
  const res = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(120_000) }).catch(() => null)
  const ok = res?.status === 200
  if (!ok) bad++
  console.log(`${ok ? "ok " : "BAD"} ${res?.status ?? "ERR"} ${((Date.now() - t) / 1000).toFixed(1)}s ${path}`)
}
console.log(bad ? `${bad} page(s) did not return 200.` : "All pages warm.")
process.exit(bad ? 1 : 0)
