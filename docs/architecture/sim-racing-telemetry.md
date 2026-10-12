# Sim Racing Telemetry

> What this covers: the sim-racing feature — session/lap lifecycle, visibility & plan gating, lap analytics, InfluxDB tick storage, session comparison, overlay share tokens, and spectator mode. This is a *separate* real-time system from F1 live timing — see [`realtime-signalr.md`](./realtime-signalr.md) for how it's not the same thing.

## What it is

Users run a sim-racing title with a telemetry client that streams live physics/graphics data to Turn One. The backend records sessions and laps, computes coaching-style analytics, and lets other users spectate or compare.

## Session & lap lifecycle

Entities: `TelemetrySession` (one race/practice run) and `TelemetryLap` (one lap within it) — full field list in [`domain-model.md`](./domain-model.md).

`ITelemetrySessionService` drives the lifecycle:

1. `StartOrUpsertSessionAsync(sessionId, userId, plan, car, track, driver, sessionType, mode, startedAt)` — creates or resumes a session.
2. `TouchHeartbeatAsync(sessionId, clientVersion, at)` — called periodically by the client to update `LastSeenAt`; if a session stops heartbeating, `TelemetrySweeperWorker` (see [`backend-architecture.md`](./backend-architecture.md)) eventually closes it as stale.
3. `RecordLapAsync(lap)` — persists each completed `TelemetryLap`.
4. `EndSessionAsync(sessionId, endedAt, completedLaps, bestLapMs)` — clean session close.
5. `SetSessionStatusAsync(sessionId, status)` — explicit status transitions (`TelemetrySessionStatus`).

Protocol-v2 sessions (`SchemaVersion == 2`) use a different lifecycle for laps: instead of the client
telling us a lap completed, `TelemetryIngestionService` buffers ticks per session and cuts a lap itself
on the `lap` field incrementing (`Application/Telemetry/LapCutRule.cs`), then hands the buffer to
`ILapProcessor` via a background `LapProcessingWorker`. See
[`sim-telemetry-protocol-v2.md`](./sim-telemetry-protocol-v2.md) §6 for the full ingestion → processing
pipeline and how it reconciles with the late-arriving `lap_complete` frame.

## Visibility & plan gating

`TelemetryVisibility`: `Private` (default) or `Public`. Setting a session `Public` (`PATCH /api/telemetry/sessions/{id}/visibility`) requires PRO/ELITE. Public sessions are what shows up in:

- `GET /api/telemetry/sessions/public` — browsable list (PRO/ELITE)
- `GET /api/telemetry/live` — currently-live public sessions available to spectate (PRO/ELITE)

## Lap analytics

`ILapAnalyticsService.ComputeSessionMetricsAsync(plan, sessionId)` computes per-lap `BrakingScore`, `ThrottleScore`, `ConsistencyScore` (nullable columns on `TelemetryLap` — not always populated, computed on demand or in batch). Exposed via `GET /api/telemetry/sessions/{id}/metrics` (PRO/ELITE).

## Tick-level storage (InfluxDB)

High-frequency telemetry ticks (throttle/brake/speed/RPM samples, not just per-lap summaries) go to InfluxDB rather than PostgreSQL — this is a time-series workload, not a relational one.

- Ingestion: client → `TelemetryWebSocketMiddleware`/`WebSocketMiddleware` (custom middleware in the HTTP pipeline, see [`backend-architecture.md`](./backend-architecture.md)) → an unbounded `Channel<TickItem>` → `TelemetryPersistenceWorker` (hosted background service) drains the channel and writes to InfluxDB.
- Read side: `ITelemetryTickRepository` (implemented by `InfluxTickRepository`):
  - `GetSessionPhysicsChartAsync(plan, sessionId)` — chart-ready physics data.
  - `GetSessionChannelsAsync(plan, sessionId, channels, [start], [end])` — multi-channel telemetry over a time range.
  - `GetLapBoundsAsync(plan, sessionId, lapNumber)` — start/end timestamps for a given lap, used to slice channel data per-lap.
- Exposed via `GET /api/telemetry/sessions/{id}/chart`, `/channels`, `/laps/{lapNumber}/chart` — some channels are plan-gated (paid channels require PRO/ELITE, per `plan` param threaded through the repository calls).

Protocol v2 (`schemaVersion 2`, sim-neutral `tick` frames) writes **every** tick to the same `telemetry`
measurement (`msgType = "tick"`) — no decimation, unlike legacy `physics` frames. v2 ticks are also
buffered in memory per session (`API/Services/LapBuffer.cs`) so a completed lap can be resampled onto a
fixed distance grid and persisted to Postgres as `LapTelemetry`/`LapCorner` rows, independent of the raw
Influx archive. Full wire format and lap-cut rule: [`sim-telemetry-protocol-v2.md`](./sim-telemetry-protocol-v2.md).

## Session comparison

`GET /api/telemetry/sessions/{id}/compare?against={otherSessionId}&lap=N&againstLap=M&channels=...` (PRO/ELITE) — overlays two sessions' telemetry for a given lap pair, used by `app/(dashboard)/simracing/sessions/[id]/compare/`.

## Coaching

`ICoachingService` — either `HeuristicCoachingService` (rule-based lap feedback) or `StubLlmCoachingService` (placeholder for an LLM-based version), selected at DI-registration time. Exposed via `CoachingController` (`api/coaching`). Frontend: `app/(dashboard)/simracing/coach/`.

## Spectating

Real-time spectator mode uses `SimTelemetryHub` (see [`realtime-signalr.md`](./realtime-signalr.md)) — `SpectateSession(sessionId)` joins the `spectate_{sessionId}` group and receives live `ReceiveTelemetry` pushes plus `ViewerCountChanged` updates. Frontend: `app/(dashboard)/simracing/spectate/`.

## Overlay share tokens

`OverlayShareToken` (see [`domain-model.md`](./domain-model.md)) — a user generates a token scoped to one or more of `cockpit`, `lap`, `leaderboard`, which backs the public, no-auth `/overlay/[token]/{cockpit|lap|leaderboard}` routes (for OBS/streaming). Managed via `OverlayController` (`api/overlay`) and `IOverlayTokenService`. Frontend consumption: `hooks/use-overlay-telemetry.ts`.

## Aggregate stats

`SimUser` (1:1 with `User`) tracks lifetime totals — `TotalSessions`, `TotalLaps`, `TotalDistanceKm`, `TotalPlayTimeSeconds`, `HighestSpeedKmh`. Updated via `ITelemetrySessionService.UpdateSimUserStatsAsync`. Surfaced at `GET /api/telemetry/me/stats` and in the sim-racing leaderboards (`GET /api/telemetry/leaderboards`, anonymous-accessible).

## Lap processing & storage

Once a lap is cut (protocol v2), `LapProcessingWorker` delegates to `ILapProcessor` to build a `LapTelemetry` row (2 MB grid-float32 + Brotli compression per lap) from the in-memory tick buffer. Each completed lap also yields `LapCorner` rows (one per detected corner) with braking/throttle/G-force envelopes. The `TrackProfile` entity tracks across sessions using sim-authoritative track IDs and corner references; its status progresses `Provisional` → `Stable` → `Curated` as more laps ground-truth it. Reprocess and backfill endpoints (`POST /api/telemetry/sessions/{id}/reprocess`, `/laps/{lapNumber}/reprocess`) allow retroactive lap re-analysis when corner detection improves. See [`sim-telemetry-protocol-v2.md`](./sim-telemetry-protocol-v2.md) §7 for the full pipeline and [`api-reference.md`](./api-reference.md) for endpoint signatures.

## Analysis workspace

`/simracing/analysis` provides multi-lap overlays and corner comparison using the processed telemetry. The frontend (`lib/simracing/lap-telemetry.ts`, `lib/simracing/plot-catalog.ts`) resamples `LapTelemetry` channels onto a common distance grid, applies delta compensation, and renders with uPlot (`components/dashboard/simracing/charts/uplot/`). Users pick a reference lap and compare others' corners, lap times and tyre/brake traces. Lap list filtering and cursor sync across map/traces/corner table work via shared plot state. See [`api-reference.md`](./api-reference.md) for lap query endpoints and [`frontend-architecture.md`](./frontend-architecture.md) for client-side analysis orchestration.
