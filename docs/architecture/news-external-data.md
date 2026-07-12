# News Page & External F1 Stats Data

> What this covers: the public `/news` page, its REST-based data sources, the secure API proxy, and the free-vs-gated content split. This is a **different data path** from the live-timing WebSocket feed — see [`realtime-signalr.md`](./realtime-signalr.md) for that one.

## Why this is separate from live timing

The `/news` page shows post-session analysis (qualifying/race results, standings, lap-time distributions, tyre strategy) pulled from a **third-party F1 statistics REST API**, fetched on page load / on demand — not the official live-timing WebSocket feed used for the real-time dashboards. Two entirely different upstream data sources, two entirely different transport mechanisms. Don't assume `/news` is "powered by SignalR" — it isn't.

## The proxy: `app/api/[...endpoint]/route.ts`

Purpose: keep the F1 stats API key off the browser.

- Request shape: `GET /api/v2/dashboard?year=2025&gp=1&session=Qualifying` — the catch-all route reconstructs the target endpoint + query string.
- The handler adds an `X-API-Key` header server-side, sourced from the `F1_API_KEY` env var (never sent to the client).
- Forwards to `F1_API_URL` (the external stats API).
- Response passed through as-is with cache headers: 60s cache, 120s stale-while-revalidate.
- Error handling: tries to parse a JSON error body and preserve its shape (e.g. `{ error: "data_not_available", retry_after_seconds: 300 }`); falls back to returning raw text if the upstream response isn't JSON. Returns 5xx if required env vars are missing or the upstream call fails outright.

## `lib/newsService.ts` — client-side data functions

All of these call through the proxy above, not the ASP.NET Core backend:

| Function | Endpoint | Purpose |
|---|---|---|
| `getLatestSessionData()` | `v2/dashboard` | Latest qualifying/race results dashboard |
| `getSeasonStandings()` | (drivers + constructors, parallel) | Season standings; normalizes multiple upstream response shapes (plain JSON array vs. a pandas-style columnar dict) into one consistent type |
| `getLapTimeDistribution(year, round, session, drivers)` | `v2/laptimes-distribution-data` | Per-driver lap-time curves; fans out one request per driver in parallel |
| `getTyreStintData(year, round, session)` | `v2/tyre-stint-usage-data` | Tire stint/pit-stop strategy data |
| `getNewsPageData()` | (aggregator) | Combines the above via `Promise.allSettled`, so a single upstream failure doesn't blank the whole page — classifies each failure as transient ("not ready yet") vs. genuine error |

## Page behavior (`app/(site)/news/page.tsx`)

Two fetch-outcome states drive the UI:

- **Not ready** (`SessionFetchStatus.kind === "not_ready"`) — friendly "data on the way" message with a retry-after estimate, rather than an error.
- **Error** — error state with a manual refresh button.

### Free content (always visible, no login required)

- Season standings table (drivers & constructors, team colors).
- Qualifying results chart.
- Top speed comparison chart.

### Gated content (behind a signup teaser — see `components/site/GatedPreview`-style components)

- Throttle comparison chart.
- Lap-time distribution chart (lap-by-lap pace evolution).
- Tyre stint / pit strategy visualization.

Charts are built with Recharts, styled for dark mode. Relevant components: `components/news/qualifying-chart.tsx`, `top-speed-chart.tsx`, `throttle-chart.tsx`, `lap-distribution-chart.tsx`, `tyre-stint-chart.tsx`, `standings-table.tsx`.

## Types

Modeled in `types/news-types.ts` — these describe the shape of the *external stats API's* responses, not backend DTOs (contrast with `game-types.ts`, which does mirror backend DTOs — see [`domain-model.md`](./domain-model.md)). Key types: `SessionDashboardData`, `DriverStanding`, `LapTimeDistributionPoint`, `TyreStintEntry`.

## Related dashboard usage

`components/dashboard/latest-session-widget.tsx` also calls into `newsService.ts` to show session highlights on the authenticated dashboard — same data source, different surface.
