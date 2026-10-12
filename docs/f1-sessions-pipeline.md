# F1 session pages (`/f1`) — how they work

Public, no-account pages with results and telemetry for finished sessions:

```
/f1                                  index
/f1/{year}                           season hub
/f1/{year}/{event}                   event hub (all published sessions of a Grand Prix)
/f1/{year}/{event}/{session}         session page   session = qualifying | race | sprint-qualifying | sprint
/f1/og/{year}/{event}/{session}      social card image (PNG)
```

## Data flow

Everything is driven by `lib/f1/catalog.ts`, which reads the external F1 API (`F1_API_URL`, `F1_API_KEY`):

| What | Endpoint | Cache |
|---|---|---|
| Events of a season | `GET /v2/seasons/{year}/events` | 6 h, tag `f1-catalog:{year}` |
| Sessions of an event (Q/R/Sprint/SQ + times) | `GET /v2/seasons/{year}/events/{key}/sessions` | 6 h, same tag |
| Results (also the "is there data?" probe) | `GET /v2/qualifying-results-data?year&gp={key}&session={Q/R/SQ/S}` | by session age, tag `f1-session:{year}:{key}:{code}` |
| Top speeds / throttle | `top-speed-telemetry-data`, `throttle-comparison-data` | same |

- Events are addressed by their numeric **key**, not their name: the API's name lookup is brittle (`Barcelona Grand Prix` 404s, `Monza Grand Prix` 404s) while keys resolve every event.
- The event list only contains weekends the API already knows about; later rounds are shown on `/f1` from `lib/constants/f1_races.ts` as plain "Coming up" text.
- Nothing is prerendered at build (`generateStaticParams` returns `[]`); pages render on first request and are ISR-cached. A build never needs the F1 API. The `/f1` index, the landing page and the sitemap fall back to request-time rendering if the API is unreachable *during* a build — give the build `F1_API_URL`/`F1_API_KEY` to make them fully static.

### Session status

| Status | Meaning | Page |
|---|---|---|
| `final` | results present and not a copy of an earlier event's | 200, indexed, in sitemap |
| `upcoming` | cannot have started yet in any timezone | 404 |
| `pending` | started/ended but the API has no results yet | 404, heals on publish |
| `suspect` | results duplicate an earlier event's (see below) | 404, heals when the API is fixed |
| `error` | API unreachable for this probe | the page **throws**, so ISR keeps the last good page instead of caching a 404 |

### Cache policy (`lib/f1/cache-policy.ts`)

The API marks even an empty `[]` as `immutable, max-age=86400`, and Next caches any 200, so a "no data yet" answer would otherwise stick for a day. TTL therefore depends on session age: under 3 days 5 min, under 30 days 1 h, older 24 h. Session times from the API are track-local with no offset, so "definitely in the future" allows a 14 h margin.

### Publishing

`POST /api/revalidate/sessions` (Bearer `REVALIDATE_SECRET`) — called every 10 min by the .NET `SessionPublishSweepService`, or per session by the F1 data service. It probes sessions that are `pending` or finished in the last 72 h; when results appear it expires the session tag and the catalog, revalidates the session page, event hub, year hub, `/f1` and `/`, then warms them. See `lib/f1/publish.ts`.

### Integrity guard (`lib/f1/integrity.ts`)

For one session type across a season's events, if ≥ 50 % (and ≥ 5) of `(driver, lap time)` pairs of a later event also appear in an earlier event, the later one is a copy and is marked `suspect`. Comparison is order-insensitive (the API re-sorts copied laps per event).

`npm run audit:f1 [-- 2025 2026]` runs the same check against the live API and lists every session's status.

## Known API defects (verified 2026-10-12)

1. **`qualifying-results-data` for the Japanese Grand Prix (key 1281), Q and R, returns the Australian Grand Prix's laps.** All 20 `(Driver, LapTime)` pairs equal Australia's (Q byte-identical; R the same pairs re-sorted for the requested event). Same result for event name, key, official name and round. `top-speed-telemetry-data` for Japan Q is also an exact copy of Australia Q; Japan R top speed and throttle differ and look right.
2. **The same endpoint for "Bahrain Grand Prix" 2026 (the Sepang round, key 1308), Q and R, returns the Chinese Grand Prix's laps** (22/22 and 18/18 pairs equal). Top speed and throttle for Sepang differ from China's.
   - Both look like the lap/session data being loaded for the wrong event (a cache key or session lookup that collides) while the driver ordering is recomputed per request. The sessions endpoint lists the right sessions (Japan Q key 11249, Sepang Q key 11730).
3. **More copies in 2025** (`npm run audit:f1 -- 2025`; the later event is reported as the copy): Chinese GP Q and R = Australian GP; Monaco Q = Emilia Romagna; Emilia Romagna R = Miami; Singapore R = Azerbaijan; Las Vegas Q and R = São Paulo. The United States GP (key 1271) has no results at all (`200 []` / `404 Round/Key 1271 not found`) for Q, R, SQ and S.
4. Minor: team colour is `#FFFFFF` for Audi and Haas F1 Team; empty results for a not-yet-run session carry `Cache-Control: immutable, max-age=86400`; `code` values in `/seasons/2026/events` aren't unique (Miami and Monaco are both `F1202606`); 2024 isn't covered; the top-speed field is named `Top Speed (km/h)` in older sessions and `Speed` in newer ones (e.g. Singapore 2026).

While 1 and 2 stand, those sessions are `suspect` and get no page. They publish by themselves on the next sweep after the API is fixed.
