# Sim Telemetry Protocol v2 (Link → backend)

> The sim-neutral wire format Turn One Link uses to stream telemetry to `wss://backend.t1f1.com/api/ws/telemetry`. Replaces the ACC-shaped `physics` / `graphics` / `static` frames of v1 (which remain accepted). This is the contract the Link adapters (ACC, AC, iRacing, F1 25/26), the backend ingestion (`TelemetryIngestionService`), the lap processor and the client mirror (`lib/simracing/protocol.ts`) all implement. Change it here first.

Source of truth for channel keys/units/plan gating: `turn-one-backend/Domain/Telemetry/ChannelRegistry.cs`.

## 1. Envelope

Every frame is a JSON text message:

```json
{ "v": 2, "type": "tick", "sessionId": "9f4a2c1e7b3d4f80a1c2e5d8f9a0b1c2", "timestamp": 1758100000123, "data": { } }
```

| field | notes |
|---|---|
| `v` | `2`. Absent → treated as v1. A session never mixes versions; the backend stores `SchemaVersion` on the session and warns on mismatched frames. |
| `type` | `session_start`, `tick`, `lap_complete`, `session_pause`, `session_resume`, `session_end`, `client_heartbeat` |
| `sessionId` | 32-char lowercase hex (`Guid.NewGuid().ToString("N")`). May be `null` only for `client_heartbeat` before a session exists. |
| `timestamp` | client wall clock, Unix ms |

Connection rules are unchanged from v1 (Bearer JWT on the upgrade request, auto-reconnect with backoff, same `sessionId` may span reconnects, order guaranteed within a connection only, client drops oldest frames beyond a 1000-frame buffer). New in v2: the server closes with **1008** on auth failure and **1001** on shutdown.

### Session identity rule

The Link **must open a new `sessionId`** whenever the sim's own session changes — F1 `m_sessionUID`, ACC session type / status change back through `AC_OFF`, iRacing `SessionNum`, or any track/car change. Lap numbers restart with the sim, and the backend keys laps by `(sessionId, lap)`.

## 2. `session_start`

```json
{
  "source": "acc",                 // acc | ac | iracing | f1_25 | f1_26
  "simVersion": "1.10.2",          // optional
  "trackId": "spa",                // sim-native, stable — see table
  "trackName": "Spa-Francorchamps",
  "trackLengthM": 7004.0,
  "sectorCount": 3,
  "sectorBoundariesM": [2431.5, 5012.0],   // optional (iRacing has them natively); backend derives otherwise
  "car": { "id": "ferrari_296_gt3", "name": "Ferrari 296 GT3", "class": "GT3" },
  "sessionType": "practice",       // practice | qualifying | race | hotlap | hotstint | timeattack | other
  "sessionTypeRaw": "AC_PRACTICE", // optional, sim string
  "driver": "Mihai Marinescu",
  "tickRateHz": 20,
  "startedAt": 1758100000000
}
```

`trackId` per sim: ACC `graphics.track`; AC `static.track` + `"/"` + `trackConfiguration`; iRacing `WeekendInfo.TrackID` + `":"` + `TrackConfigName`; F1 `m_trackId` as a string (`"12"`). ACC's shared memory has **no track length** — the Link ships a static `acc-tracks.json`; when the entry is missing send `trackLengthM: 0` and the backend self-calibrates from the first full lap.

Re-sending `session_start` for the same `sessionId` is an upsert (late static data).

## 3. `tick`

Sent at a fixed rate per source (ACC/AC/iRacing 20 Hz, F1 20–30 Hz; hard max 60 Hz). Flat, camelCase, **fixed units — the adapters convert**. Omit a field when the sim does not provide it; never send `null` for numbers.

| key | type | unit / convention | required |
|---|---|---|---|
| `lap` | int | current lap, 1-based | ✔ |
| `lapTimeMs` | int | current lap time | ✔ |
| `lapDistM` | float | metres from S/F on this lap (F1 may be slightly negative before the line — send raw) | ✔ |
| `sector` | int | 0-based | ✔ |
| `speed` | float | km/h | ✔ |
| `rpm` | int | | ✔ |
| `gear` | int | **−1 = R, 0 = N, 1..n** | ✔ |
| `throttle`, `brake` | float | 0..1 | ✔ |
| `clutch` | float | 0..1, 1 = pedal fully pressed | |
| `steer` | float | −1..1, + = right | ✔ |
| `steerDeg` | float | degrees at the wheel | |
| `gLat` | float | g, + = right-hand corner | ✔ |
| `gLong` | float | g, + = accelerating | ✔ |
| `gVert` | float | g | |
| `posX`, `posY`, `posZ` | float | metres, ground plane X/Y, Z up (adapters swap sim axes) | recommended |
| `heading` | float | radians | |
| `valid` | bool | current lap still valid. **Omit for sims that don't know** (iRacing) | |
| `pit` | int | 0 track, 1 pit lane, 2 pit box / garage | ✔ |
| `driverStatus` | int | 0 flying, 1 out-lap, 2 in-lap, 3 garage | |
| `fuel` | float | litres | |
| `tc`, `abs` | int | active/level | |
| `brakeBias` | float | % front | |
| `drs` | int | 0/1 (F1) | |
| `ers` | float | J stored (F1) | |
| `ersMode` | int | (F1) | |
| `tyreCompound` | int | sim compound id (F1) | |
| `tyreAgeLaps` | int | (F1) | |
| `tyreTemp` | float[4] | °C, **[FL, FR, RL, RR]** | |
| `tyrePress` | float[4] | psi | |
| `tyreWear` | float[4] | 0..1 | |
| `brakeTemp` | float[4] | °C | |
| `slip` | float[4] | slip ratio | |
| `surface` | int[4] | surface type id (F1) | |
| `frame` | long | sim frame counter — used to detect F1 flashbacks | |

Arrays are flattened by the backend to `_fl/_fr/_rl/_rr` fields.

### Per-sim mapping cheatsheet

| key | ACC / AC shared memory | iRacing | F1 25/26 |
|---|---|---|---|
| `lap` | `graphics.completedLaps + 1` | `Lap` | `LapData.m_currentLapNum` |
| `lapTimeMs` | `iCurrentTime` | `LapCurrentLapTime × 1000` | `m_currentLapTimeInMS` |
| `lapDistM` | `normalizedCarPosition × trackLengthM` | `LapDist` | `m_lapDistance` |
| `sector` | `currentSectorIndex` | from `LapDistPct` vs `SplitTimeInfo.Sectors` | `m_sector` |
| `gear` | `gear − 1` | `Gear` | `m_gear` |
| `clutch` | `1 − clutch` (ACC 0 = pressed) | `1 − Clutch` | `m_clutch / 100` |
| `steer` | `steerAngle` (ACC) / `steerAngle / lock` (AC, degrees) | `SteeringWheelAngle / SteeringWheelAngleMax` | `m_steer` |
| `gLat`, `gLong`, `gVert` | `accG[0]`, `accG[2]`, `accG[1]` | `LatAccel/9.81`, `LongAccel/9.81`, `VertAccel/9.81` | `m_gForceLateral`, `m_gForceLongitudinal`, `m_gForceVertical` |
| `posX/Y/Z` | `carCoordinates[playerCarID]` (x, z → ground; y up) | local ENU metres from `Lat/Lon/Alt`, origin = first sample | `m_worldPositionX`, `m_worldPositionZ`, `m_worldPositionY` |
| `heading` | `physics.heading` | `Yaw` | `m_yaw` |
| `valid` | `isValidLap` | *(omit)* | `!m_currentLapInvalid` |
| `pit` | `isInPitLane`→1, `isInPit`→2 | `OnPitRoad`→1, `PlayerCarInPitStall`→2 | `m_pitStatus` |
| `frame` | `packetId` | `SessionTick` | `m_overallFrameIdentifier` |

Sign conventions (`gLat` +right, `steer` +right) must be verified per sim on a known right-hander (Spa La Source) before a source is released.

## 4. `lap_complete`

Sent once per S/F crossing with the sim's authoritative timing, **after** the first tick of the new lap:

```json
{ "lap": 7, "lapTimeMs": 138421, "sectorsMs": [45210, 52111, 41100],
  "valid": true, "pit": false, "lapDistM": 7004.1, "fuelUsedL": 3.21, "tyreCompound": 16 }
```

- ACC: `iLastTime` + accumulated `lastSectorTime`. iRacing: wait for `LapLastLapTime` to update (≈2 ticks). F1: previous lap's `m_lastLapTimeInMS` + `m_sector1TimeMSPart/MinutesPart`, `m_sector2…`.
- `valid` is omitted for iRacing.
- The backend cuts laps itself on the `lap` increment in `tick`; `lap_complete` enriches the pending lap (3 s grace) or patches the persisted row if it arrives late. A lost `lap_complete` therefore degrades timing precision, not correctness.

## 5. `session_pause` / `session_resume` / `session_end` / `client_heartbeat`

Same shapes as v1 (`docs/architecture/sim-racing-telemetry.md`). `session_end.data` adds `lapsCompleted` and `bestLapMs`. While paused the client stops `tick`s; the backend marks the session `Paused` and the sweeper still applies (90 s without a heartbeat closes the session).

## 6. Backend behaviour summary

- Every v2 tick is written to InfluxDB (`msgType = "tick"`, single bucket `telemetry`) — no decimation.
- Ticks are also buffered per session; on `lap` increment the buffer becomes a `LapJob` → `LapProcessor` → Postgres `TelemetryLap` + `LapTelemetry` (2 m distance grid, float32 + Brotli) + `LapCorner` rows, and the per-`(source, trackId)` `TrackProfile` is updated.
- Live fan-out over SignalR `SimTelemetryHub.ReceiveTelemetry("tick", payload, ts)` is unchanged in shape.

## 7. Versioning

Additive changes (new optional tick keys) don't bump `v`. Renames, unit changes or removed keys bump to `v: 3` and require a registry entry + alias, as v1 → v2 did (`ChannelRegistry.V1ToV2`).
