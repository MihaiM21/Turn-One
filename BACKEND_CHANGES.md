# TurnOne Backend Changes Required

The Turn One Link client now sends a richer, sessionised telemetry stream over the existing `wss://backend.t1f1.com/api/ws/telemetry` endpoint. This document lists everything the backend needs to handle.

The transport, URL, and auth header are unchanged:

```
WSS  wss://backend.t1f1.com/api/ws/telemetry
HDR  Authorization: Bearer <jwt>
FMT  text frames, one JSON object per frame
```

---

## 1. New top-level envelope field: `sessionId`

Every message now has a `sessionId` field on the envelope (alongside `type`, `timestamp`, `data`).

```json
{
  "type": "physics",
  "timestamp": 1776764355947,
  "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
  "data": { ... }
}
```

- Format: 32-char lowercase hex (`Guid.NewGuid().ToString("N")`).
- May be `null` for `client_heartbeat` sent before any session begins, or for `static` frames received before the first session.
- For all other types (`physics`, `graphics`, `static`, `session_*`), it will be populated whenever a session is active.
- Use `sessionId` as the grouping key for storage / fan-out.

> [!IMPORTANT]
> Existing `physics` / `graphics` / `static` schemas are otherwise unchanged. Any backend that already ignores unknown top-level fields will keep working — the only adjustment needed is to start *reading* `sessionId` and grouping by it.

---

## 2. New message types

The client now emits five new `type` values. They share the same envelope as everything else.

### 2.1 `session_start`

Emitted when a new session is detected (game enters `AC_LIVE` for the first time, or track / car / session-index changes mid-stream).

```json
{
  "type": "session_start",
  "timestamp": 1776764350000,
  "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
  "data": {
    "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
    "sessionType": "AC_PRACTICE",
    "track": "monza",
    "carModel": "ferrari_488_gt3",
    "driver": "Mihai Marinescu",
    "startedAt": 1776764350000
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `sessionId` | string | Same as envelope `sessionId`. Duplicated in `data` for ergonomic consumers. |
| `sessionType` | string | One of `AC_UNKNOWN`, `AC_PRACTICE`, `AC_QUALIFY`, `AC_RACE`, `AC_HOTLAP`, `AC_TIME_ATTACK`, `AC_DRIFT`, `AC_DRAG`. |
| `track` | string | ACC track id (e.g. `"monza"`, `"spa"`). Empty string if static block hasn't been read yet — see §4. |
| `carModel` | string | ACC car id (e.g. `"ferrari_488_gt3"`). |
| `driver` | string | `"FirstName LastName"`. |
| `startedAt` | int64 | Unix epoch ms. May be very slightly later than first physics frame for that session. |

Backend should: create / upsert a session record keyed by `sessionId`, store metadata, mark as `active`.

### 2.2 `session_end`

Emitted when the game returns to `AC_OFF`, the sim disconnects, or the user starts a different session.

```json
{
  "type": "session_end",
  "timestamp": 1776764999000,
  "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
  "data": {
    "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
    "endedAt": 1776764999000,
    "completedLaps": 14,
    "bestLapMs": 105234
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `endedAt` | int64 | Unix epoch ms. |
| `completedLaps` | int | Highest `graphics.completedLaps` observed during the session. |
| `bestLapMs` | int | Best lap time in ms. `0` if no valid lap was completed. |

Backend should: mark the session record as `ended`, persist final stats, stop fan-out for that session.

### 2.3 `session_pause` / `session_resume`

Emitted on `AC_LIVE ↔ AC_PAUSE` transitions.

```json
{
  "type": "session_pause",
  "timestamp": 1776764500000,
  "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
  "data": {
    "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
    "at": 1776764500000
  }
}
```

While paused:
- The client **stops** sending `physics` frames.
- The client **continues** sending `graphics` frames so the backend can show "Paused" state.
- A `session_resume` event with an identical payload shape arrives when the game returns to `AC_LIVE`.

Backend should: surface pause state to subscribers; do not treat the pause as a session_end.

### 2.4 `client_heartbeat`

Sent every ~15 seconds whenever the WebSocket is connected, regardless of whether a session is active.

```json
{
  "type": "client_heartbeat",
  "timestamp": 1776764500000,
  "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
  "data": {
    "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2",
    "clientVersion": "0.0.1.0",
    "uptimeMs": 184302
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `sessionId` | string\|null | `null` if no session is active. |
| `clientVersion` | string | Assembly version of the desktop app. |
| `uptimeMs` | int64 | Time since the streaming service started. |

Backend should: update a `last_seen_at` timestamp per connection / user. Use this for "client online" indicators and to detect zombie sessions when the WebSocket is half-open.

---

## 3. Connection lifecycle the backend should expect

The client now reconnects automatically and persists across short outages. The backend should not assume one WebSocket = one session.

- **Auto-reconnect with exponential backoff** (1s → 2s → 4s → 8s → 16s → 30s cap). After a network blip, expect a fresh `ConnectAsync` upgrade with the same `Authorization` header.
- **Same `sessionId` may appear across multiple WebSocket connections.** If a 30-second network outage occurs mid-race, the client reconnects and keeps emitting frames tagged with the same `sessionId`. The backend must not start a new session record on reconnect — only `session_start` / `session_end` events open and close session records.
- **Multiple `session_start` events can arrive on a single WebSocket connection.** A user can finish Practice, return to menu, and start Race without disconnecting. Each new session has a fresh `sessionId`.
- **Order guarantee within a connection only.** Messages are sent in order on a single WebSocket. Across reconnects there are no ordering guarantees — rely on `timestamp` (and `packetId` inside `physics`/`graphics`) to order events.
- **Bounded backpressure.** The client buffers up to 1000 frames in memory; if the network is slow, *oldest* frames are dropped. This means a very slow backend will see gaps in `packetId` rather than infinite buildup. Don't assume monotonic packetIds.

### Recommended server-side close behaviour
- If JWT validation fails on upgrade, close with `1008` (Policy Violation) and a `Reason` string. The client logs it and stops trying with the current token until the user re-auths.
- If the server needs to drain / restart, close with `1001` (Going Away). The client will reconnect after the backoff window.
- Otherwise let the connection live indefinitely — the client never closes a healthy connection.

---

## 4. `static` ordering note

The client emits `session_start` as soon as a new session is detected. If the static shared-memory block has already been read, `track` / `carModel` / `driver` are populated immediately. Otherwise:

1. `session_start` arrives with **empty strings** for `track` / `carModel` / `driver`.
2. A `static` frame for that `sessionId` arrives within ~5–10ms.
3. The client then emits a *second* `session_start` for the same `sessionId` with the populated fields.

Backend should: treat the latest `session_start` (or the dedicated `static` frame) as authoritative for session metadata. Both have the same `sessionId`, so this is an upsert, not a duplicate.

---

## 5. Suggested DB schema additions

A minimal way to absorb these messages:

```sql
CREATE TABLE telemetry_sessions (
  session_id        CHAR(32) PRIMARY KEY,
  user_id           BIGINT NOT NULL,         -- from JWT subject
  session_type      VARCHAR(32),
  track             VARCHAR(64),
  car_model         VARCHAR(64),
  driver            VARCHAR(128),
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,
  completed_laps    INT,
  best_lap_ms       INT,
  client_version    VARCHAR(32),
  last_seen_at      TIMESTAMPTZ,            -- updated on heartbeat
  status            VARCHAR(16) DEFAULT 'active'  -- active | paused | ended
);

CREATE INDEX ix_sessions_user_started ON telemetry_sessions (user_id, started_at DESC);
CREATE INDEX ix_sessions_status      ON telemetry_sessions (status) WHERE status <> 'ended';
```

Frame storage strategy is up to you — physics/graphics frames are ~100 Hz each, so per-frame inserts are usually a bad idea. Common options:

- Write to time-series (Clickhouse, Timescale, Influx) keyed by `(session_id, timestamp)`.
- Buffer to object storage (S3) in chunks per session.
- Re-broadcast in real time via a Redis pub/sub channel keyed by `session_id` for live frontend subscribers without storing.

---

## 6. Live frontend re-broadcast (open question)

The current client→server stream is one-way. To let the website watch live telemetry, the backend will need a **read** WebSocket endpoint, e.g.:

```
GET wss://backend.t1f1.com/api/ws/telemetry/subscribe?sessionId=<id>
```

Suggested behaviour:
- Authenticate the same way (JWT bearer header).
- Authorise: only the session owner (or users they've shared with) can subscribe.
- On connect, send the most recent `session_start` + `static` so late joiners see metadata.
- Then forward every subsequent frame with that `sessionId` until `session_end` (or the subscriber disconnects).

This is a backend-only addition and does not require any client changes.

---

## 7. Migration checklist

- [ ] Accept `sessionId` on the envelope of all existing message types; ignore if old clients send without it.
- [ ] Implement handlers for `session_start`, `session_end`, `session_pause`, `session_resume`, `client_heartbeat`.
- [ ] Tolerate the late-static `session_start` upsert pattern (§4).
- [ ] Tolerate same `sessionId` reappearing on a different WebSocket connection after reconnect (§3).
- [ ] Update `last_seen_at` on each `client_heartbeat`.
- [ ] (Optional) Add `/api/ws/telemetry/subscribe` for the frontend (§6).
- [ ] (Optional) Use close code `1008` for auth failures so the client stops retrying with a dead token.
