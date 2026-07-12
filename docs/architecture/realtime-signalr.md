# Real-Time Data: SignalR Hubs

> What this covers: both SignalR hubs end-to-end — server-side hub definitions, client-side services/hooks, and the full external-feed-to-UI trace for F1 live timing.

There are **two separate real-time systems** in this codebase. Don't conflate them — they have different data sources, different hubs, and different purposes.

## 1. F1 live timing — `F1LiveDataHub`

Route: `/hubs/f1livedata`.

### Data source and ingestion

The official F1 live-timing feed (`livetiming.formula1.com/signalrcore`) isn't reachable directly from the backend for CORS/protocol reasons, so it's fronted by a **Cloudflare Worker** (`docs/cloudflare-worker-f1-proxy.js` + `.toml`, deployed separately via Wrangler). The worker:

- Proxies the SignalR negotiate + WebSocket upgrade to the official feed.
- Strips hop-by-hop headers, adds permissive CORS.
- Optionally enforces an `ALLOWED_TOKEN` secret.

Backend side (`API/Services/F1LiveTimingService.cs`):

1. `StartAsync()` (called once at boot) → `NegotiateConnectionAsync()` — HTTP POST to `{F1_LIVETIMING_URL}/negotiate?negotiateVersion=1`, extracts a connection token + cookies.
2. Opens a `ClientWebSocket` to `wss://.../?id={connectionToken}`, sends the SignalR handshake frame, then subscribes to feeds.
3. `ReceiveMessagesAsync()` loops forever, splitting inbound frames on the SignalR record separator (`\x1e`) and parsing each as JSON.
4. Keeps a `ConcurrentDictionary<string, object>` of last-known state per feed, and persists it to `Data/F1LiveData/f1-state.json` on disk so a restart doesn't lose current state (`LoadPersistedData()` on startup).
5. Broadcasts every update to connected clients via `IHubContext<F1LiveDataHub>`.

`F1_LIVETIMING_URL` (env var) points at the Cloudflare Worker, not directly at F1's servers. This is **not** a `BackgroundService`/`HostedService` — it's a singleton started explicitly in `Program.cs`, and it's push-driven (reacts to inbound WS frames), not polled.

### Hub surface (`F1LiveDataHub`)

| Direction | Member | Purpose |
|---|---|---|
| Server → Client | `ReceiveFeedData(feedName, data, timestamp)` | Broadcasts an F1 feed update |
| Server → Client | `SessionStatus(status, sessionType)` | Current session info |
| Client → Server | `SubscribeToFeed(feedName)` | Joins group `F1_{feedName}` |
| Client → Server | `UnsubscribeFromFeed(feedName)` | Leaves that group |
| Client → Server | `RequestSessionStatus()` | Ask server for current session |
| Client → Server | `JoinF1DataGroup()` / `LeaveF1DataGroup()` | Manually join/leave the catch-all `F1LiveData` group |

Groups: `F1LiveData` (all clients) and `F1_{feedName}` (per-feed subscribers). Note: `[Authorize]` is currently commented out on this hub with the comment `// Temporarily disable authorization for debugging` (`API/Hubs/F1LiveDataHub.cs`) — as of this writing the hub is open to unauthenticated connections. Confirm this hasn't been re-enabled before relying on it.

### Frontend consumption

- `lib/f1SignalRLiveDataService.ts` — singleton connection manager. Connects to `${BACKEND_URL}/hubs/f1livedata`, auto-reconnects (exponential backoff, up to 5 retries × 5s), reconnects on window focus. Subscribes to `ReceiveRawData(rawData)` (mostly passthrough) and `ReceiveStateData(stateData)` (processed structured state: `CarData`, `Position`, `TimingData`, `SessionInfo`, `WeatherData`, `TrackStatus`, `DriverList`, `RaceControlMessages`, `Heartbeat`, etc.). Invokes hub methods `JoinF1DataGroup()`, `LeaveF1DataGroup()`, `GetViewerCount(sessionId)`, `SpectateSession(sessionId)`, `SubscribeToOwnTelemetry()`, `StopSpectating(sessionId)`. Persists last-received data to `localStorage` as an offline fallback.
- `hooks/use-f1-signalr-live-data.ts` — `useF1SignalRLiveData({ autoConnect? })` returns `{ data, isConnected, hasSession, status, connect(), disconnect(), lastUpdated }`. `status` is one of `'connected' | 'connecting' | 'disconnected' | 'error' | 'no-session'`.

Full pipeline: **F1 live-timing servers → Cloudflare Worker → `F1LiveTimingService` (backend) → `F1LiveDataHub` → `f1SignalRLiveDataService` (frontend) → `useF1SignalRLiveData` → React components** (e.g. `/live`, `/live2`, `components/dashboard/latest-session-widget.tsx` for highlights).

## 2. Sim racing telemetry — `SimTelemetryHub`

Route: `/api/hubs/simtelemetry`. `[Authorize]` required (unlike the F1 hub).

Data originates from a user's sim-racing client (not an external feed) and is ingested via `TelemetryWebSocketMiddleware`/`WebSocketMiddleware` in the HTTP pipeline, queued onto a `Channel<TickItem>`, drained by `TelemetryPersistenceWorker` into InfluxDB. See [`sim-racing-telemetry.md`](./sim-racing-telemetry.md) for the ingestion/storage side.

### Hub surface

| Direction | Member | Purpose |
|---|---|---|
| Server → Client | `ReceiveTelemetry(type, payload, timestamp)` | Live physics/graphics/static telemetry (`type` is one of `"physics"`, `"graphics"`, `"static"`) |
| Server → Client | `SessionEnded(sessionId)` | Session ended notification |
| Server → Client | `ViewerCountChanged(sessionId, count)` | Spectator count update |
| Client → Server | `SubscribeToOwnTelemetry()` | Joins `telemetry_{userId}` — receive your own session's live updates |
| Client → Server | `SpectateSession(sessionId)` | Joins `spectate_{sessionId}` — watch someone else's session |
| Client → Server | `StopSpectating(sessionId)` | Leaves that group |
| Client → Server | `GetViewerCount(sessionId) → int` | Query current viewer count |

Groups: `telemetry_{userId}` (own-session broadcasts) and `spectate_{sessionId}` (spectators). Server tracks spectators in a `ConcurrentDictionary<sessionId, connectionIds>` and cleans up on disconnect, broadcasting the final viewer count.

### Frontend consumption

- `lib/simTelemetryService.ts` — connects with the stored access token, wraps subscribe/spectate/stop calls.
- `hooks/use-overlay-telemetry.ts` — token-based (no user auth — used for streaming overlays), returns `{ graphics, status, error }`. Backs `/overlay/[token]/cockpit` etc.
- Coach/spectate views (`app/(dashboard)/simracing/coach/`, `.../spectate/`) drive the corresponding subscribe/spectate hub calls.

## Comparing the two hubs

| | F1LiveDataHub | SimTelemetryHub |
|---|---|---|
| Source of data | External F1 live-timing feed via Cloudflare Worker | User's own sim-racing client |
| Auth | Currently unauthenticated (verify before relying on this) | `[Authorize]` required |
| Grouping | By feed name / global | By user (own telemetry) or by session (spectate) |
| Persistence | JSON snapshot on disk (`f1-state.json`) | InfluxDB (durable time-series) |
