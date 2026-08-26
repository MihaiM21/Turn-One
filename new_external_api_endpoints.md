# New Data Endpoints Documentation (V2)

**Date:** July 2026  
**Status:** All endpoints leverage V2 livetiming API via `F1StaticClient`  
**Rate Limiting:** All `-data` endpoints use "data" tier (60 req/min)

---

## Table of Contents

1. [Race Analysis Endpoints](#race-analysis-endpoints)
2. [Seasonal Data Endpoints](#seasonal-data-endpoints)
3. [Telemetry Endpoints](#telemetry-endpoints)
4. [Response Structure Patterns](#response-structure-patterns)

---

## Race Analysis Endpoints

### 1. Position Changes (`/position-changes-data`)

**Description:** Lap-by-lap driver position throughout the race/sprint.

**Endpoint:** `GET /api/v2/position-changes-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Must be: `R`, `RACE`, `S`, `SPRINT` |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/position-changes-data?year=2025&gp=1&session=R&api_key=your_key
```

**Response Format:**
```json
[
  {
    "driver": "VER",
    "team": "Red Bull Racing",
    "color": "#1e3050",
    "start_pos": 1,
    "end_pos": 1,
    "positions": [
      {"lap": 0, "position": 1},
      {"lap": 1, "position": 1},
      {"lap": 2, "position": 1},
      ...
      {"lap": 58, "position": 1}
    ]
  },
  {
    "driver": "NOR",
    "team": "McLaren",
    "color": "#FF8700",
    "start_pos": 3,
    "end_pos": 2,
    "positions": [
      {"lap": 0, "position": 3},
      {"lap": 1, "position": 3},
      {"lap": 2, "position": 2},
      ...
    ]
  },
  ...
]
```

**Notes:**
- **Ordered by:** Finishing position (smallest `end_pos` first)
- **Lap 0:** Grid position
- **Lap 1+:** Position after completing that lap
- **Only for:** Race/Sprint sessions
- **Color format:** Hex string (e.g., `#FF8700`)

---

### 2. Race Gaps (`/race-gaps-data`)

**Description:** Per-driver gap to leader OR vs average race pace, lap-by-lap.

**Endpoint:** `GET /api/v2/race-gaps-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Must be: `R`, `RACE`, `S`, `SPRINT` |
| `reference` | str | 'leader' | No | Either `leader` or `average` |
| `drivers` | str | None | No | Comma-separated TLAs (e.g., "VER,NOR,LEC") |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Requests:**
```
# Gap to leader for all drivers
GET /api/v2/race-gaps-data?year=2025&gp=1&session=R&reference=leader

# Race trace (vs average pace) for specific drivers
GET /api/v2/race-gaps-data?year=2025&gp=1&session=R&reference=average&drivers=VER,NOR,LEC
```

**Response Format (reference=leader):**
```json
[
  {
    "driver": "VER",
    "team": "Red Bull Racing",
    "color": "#1e3050",
    "laps": [
      {"lap": 1, "gap_s": 0.0},
      {"lap": 2, "gap_s": 0.0},
      {"lap": 3, "gap_s": 0.213},
      ...
      {"lap": 58, "gap_s": null}  // null on red-flag laps
    ]
  },
  {
    "driver": "NOR",
    "team": "McLaren",
    "color": "#FF8700",
    "laps": [
      {"lap": 1, "gap_s": 0.847},
      {"lap": 2, "gap_s": 1.104},
      ...
    ]
  },
  ...
]
```

**Response Format (reference=average):**
- Same structure as above, but `gap_s` represents:
  - **Positive:** ahead of average reference pace
  - **Negative:** behind average reference pace
  - **Reference:** Winner's average lap time (cumulative time / laps completed)

**Notes:**
- **Ordered by:** Finishing order (smallest final cumulative time first)
- **Gap calculation:** Cumulative race time difference (seconds)
- **Red flags:** Laps with `gap_s: null` break the plotted line
- **Retirements:** Driver series ends at their last completed lap
- **Lapped cars:** Gap naturally grows beyond a lap time via cumulative math

---

### 3. Tyre Degradation (`/tyre-degradation-data`)

**Description:** Per-compound tyre performance with degradation rate, scatter points, and trendline R².

**Endpoint:** `GET /api/v2/tyre-degradation-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Must be: `R`, `RACE`, `S`, `SPRINT` |
| `driver` | str | None | No | Optional filter: single driver TLA (e.g., "VER") |
| `fuel_corrected` | bool | False | No | Apply fuel-burn correction to lap times |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Requests:**
```
# All drivers, all compounds
GET /api/v2/tyre-degradation-data?year=2025&gp=1&session=R

# Single driver with fuel correction
GET /api/v2/tyre-degradation-data?year=2025&gp=1&session=R&driver=VER&fuel_corrected=true
```

**Response Format:**
```json
{
  "compounds": [
    {
      "compound": "SOFT",
      "color": "#FF0000",
      "degradation_rate_s_per_lap": 0.287,
      "r_squared": 0.94,
      "points": [
        {"lap_age": 1, "lap_time_s": 95.421},
        {"lap_age": 2, "lap_time_s": 95.603},
        {"lap_age": 3, "lap_time_s": 95.891},
        ...
      ]
    },
    {
      "compound": "MEDIUM",
      "color": "#FFFF00",
      "degradation_rate_s_per_lap": 0.156,
      "r_squared": 0.91,
      "points": [
        {"lap_age": 1, "lap_time_s": 96.104},
        {"lap_age": 2, "lap_time_s": 96.187},
        ...
      ]
    },
    {
      "compound": "HARD",
      "color": "#FFFFFF",
      "degradation_rate_s_per_lap": 0.089,
      "r_squared": 0.88,
      "points": [
        {"lap_age": 1, "lap_time_s": 96.521},
        ...
      ]
    }
  ]
}
```

**Notes:**
- **Only for:** Race/Sprint sessions
- **Lap age:** Laps run on that particular stint (1-indexed)
- **Degradation rate:** Seconds per lap (slope of trendline)
- **R²:** Goodness-of-fit for the trendline
- **Fuel corrected:** Adjusts lap times to factor out fuel-weight effect if `true`
- **Per-compound:** One entry per compound used in the session

---

### 4. Pit Strategy (`/pit-strategy-data`)

**Description:** Pit stops, undercut gains/losses, and free tyre changes.

**Endpoint:** `GET /api/v2/pit-strategy-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Must be: `R`, `RACE`, `S`, `SPRINT` |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/pit-strategy-data?year=2025&gp=1&session=R
```

**Response Format:**
```json
{
  "stops": [
    {
      "driver": "VER",
      "stop_number": 1,
      "lap_in": 12,
      "lap_out": 13,
      "pit_time_s": 2.134,
      "compound_in": "SOFT",
      "compound_out": "MEDIUM",
      "under_sc": false,
      "under_vsc": false
    },
    {
      "driver": "VER",
      "stop_number": 2,
      "lap_in": 34,
      "lap_out": 35,
      "pit_time_s": 1.987,
      "compound_in": "MEDIUM",
      "compound_out": "HARD",
      "under_sc": false,
      "under_vsc": false
    },
    {
      "driver": "NOR",
      "stop_number": 1,
      "lap_in": 14,
      "lap_out": 15,
      "pit_time_s": 2.456,
      "compound_in": "SOFT",
      "compound_out": "MEDIUM",
      "under_sc": false,
      "under_vsc": false
    },
    ...
  ],
  "undercuts": [
    {
      "attacker": "VER",
      "attacked": "NOR",
      "attacker_stop_lap": 12,
      "attacked_stop_lap": 16,
      "gap_before_s": -0.523,
      "gap_after_s": -1.267,
      "gain_s": 0.744,
      "worked": true
    },
    {
      "attacker": "LEC",
      "attacked": "SAI",
      "attacker_stop_lap": 18,
      "attacked_stop_lap": 21,
      "gap_before_s": 0.412,
      "gap_after_s": 0.891,
      "gain_s": -0.479,
      "worked": false
    },
    ...
  ],
  "summary": {
    "fastest_stop_driver": "VER",
    "fastest_stop_time_s": 1.987,
    "team_avg_times": {
      "Red Bull Racing": 2.061,
      "McLaren": 2.187,
      "Ferrari": 2.245,
      ...
    }
  },
  "free_changes": [
    {
      "driver": "ALB",
      "lap": 41,
      "compound_in": "MEDIUM",
      "compound_out": "SOFT",
      "reason": "red_flag"
    },
    ...
  ]
}
```

**Notes:**
- **Ordered by:** `stops` by driver and stop number (chronologically)
- **Gap calculation:**
  - `gap_before_s` = A_cumtime(lap-1) - B_cumtime(lap-1) (positive = B ahead)
  - `gap_after_s` = A_cumtime(lap_after_b_out) - B_cumtime(lap_after_b_out)
  - `gain_s` = gap_before - gap_after (positive = attacker gained)
- **worked:** `true` if attacker ends ahead after both complete pit cycles
- **Excluded undercuts:** SC/VSC stops, red-flag-adjacent cycles
- **Only for:** Race/Sprint sessions

---

### 5. Session Weather (`/session-weather-data`)

**Description:** Weather timeline + track status periods + race control messages.

**Endpoint:** `GET /api/v2/session-weather-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Any session type: P1, P2, P3, Q, R, S |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/session-weather-data?year=2025&gp=1&session=R
```

**Response Format:**
```json
{
  "weather": [
    {
      "lap": 1,
      "timestamp_utc": "2025-03-30T14:00:15Z",
      "air_temp_c": 22.3,
      "track_temp_c": 48.7,
      "humidity_percent": 58,
      "wind_speed_kmh": 12.4,
      "wind_direction_deg": 245,
      "rainfall_mm": 0.0,
      "track_status_string": "1"
    },
    {
      "lap": 2,
      "timestamp_utc": "2025-03-30T14:02:30Z",
      "air_temp_c": 22.5,
      "track_temp_c": 49.1,
      "humidity_percent": 57,
      "wind_speed_kmh": 12.2,
      "wind_direction_deg": 246,
      "rainfall_mm": 0.0,
      "track_status_string": "1"
    },
    {
      "lap": 25,
      "timestamp_utc": "2025-03-30T14:52:10Z",
      "air_temp_c": 23.1,
      "track_temp_c": 51.2,
      "humidity_percent": 54,
      "wind_speed_kmh": 11.8,
      "wind_direction_deg": 248,
      "rainfall_mm": 0.1,
      "track_status_string": "2"
    },
    ...
  ],
  "track_status_periods": [
    {
      "status": "GREEN",
      "start_lap": 1,
      "end_lap": 24,
      "duration_laps": 24
    },
    {
      "status": "YELLOW",
      "start_lap": 25,
      "end_lap": 28,
      "duration_laps": 4
    },
    {
      "status": "GREEN",
      "start_lap": 29,
      "end_lap": 58,
      "duration_laps": 30
    },
    ...
  ],
  "messages": [
    {
      "lap": 25,
      "message": "VEHICLE 44 HIT WALL TURN 1"
    },
    {
      "lap": 25,
      "message": "SAFETY CAR DEPLOYED"
    },
    {
      "lap": 29,
      "message": "SAFETY CAR IN THIS LAP"
    },
    ...
  ]
}
```

**Notes:**
- **All session types:** P1, P2, P3, Q, R, S
- **Track status:** GREEN, YELLOW, RED strings
- **Rainfall:** Millimeters of rain detected
- **Wind direction:** 0-359 degrees (where 0 = North)
- **Messages:** Free text from FIA race control (e.g., incident callouts, SC/VSC deployment)

---

### 6. Race Pace Heatmap (`/race-pace-heatmap-data`)

**Description:** Driver × lap grid of delta to field median lap time.

**Endpoint:** `GET /api/v2/race-pace-heatmap-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Must be: `R`, `RACE`, `S`, `SPRINT` |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/race-pace-heatmap-data?year=2025&gp=1&session=R
```

**Response Format:**
```json
{
  "drivers": ["VER", "NOR", "LEC", "SAI", "ALB", ...],
  "laps": [1, 2, 3, 4, ..., 58],
  "grid": [
    {
      "driver": "VER",
      "lap_times": [-0.234, -0.156, -0.078, 0.0, 0.234, ..., null],
      "lap_statuses": ["green", "green", "green", "green", "green", ..., "pit"]
    },
    {
      "driver": "NOR",
      "lap_times": [0.412, 0.534, 0.487, 0.321, 0.156, ..., null],
      "lap_statuses": ["green", "green", "green", "green", "green", ..., "pit"]
    },
    {
      "driver": "LEC",
      "lap_times": [0.678, 0.723, 0.645, 0.521, 0.387, ..., null],
      "lap_statuses": ["green", "green", "green", "pit", "green", ..., "pit"]
    },
    ...
  ],
  "field_medians": [95.123, 95.234, 95.156, 95.287, 95.145, ..., 95.098]
}
```

**Notes:**
- **Ordered by:** Drivers in finishing position order
- **Delta:** Negative = faster than median, positive = slower
- **Lap statuses:** `green`, `pit`, `safety_car`, `red_flag`, `retired`
- **null values:** Pit laps or laps not completed
- **Only for:** Race/Sprint sessions

---

### 7. Track Evolution (`/track-evolution-data`)

**Description:** Per-driver running best lap time vs track temperature (Practice/Qualifying only).

**Endpoint:** `GET /api/v2/track-evolution-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'Q' | No | Must be: `P1`, `P2`, `P3`, `Q` |
| `drivers` | str | None | No | Comma-separated TLAs (e.g., "VER,NOR") |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/track-evolution-data?year=2025&gp=1&session=Q&drivers=VER,NOR,LEC
```

**Response Format:**
```json
{
  "session": "Q",
  "track_name": "Bahrain International Circuit",
  "overall_running_best": [
    {"lap": 1, "time_s": 96.234, "track_temp_c": 42.1},
    {"lap": 2, "time_s": 95.987, "track_temp_c": 43.2},
    {"lap": 3, "time_s": 95.654, "track_temp_c": 44.3},
    ...
    {"lap": 23, "time_s": 94.123, "track_temp_c": 52.1}
  ],
  "drivers": [
    {
      "driver": "VER",
      "team": "Red Bull Racing",
      "color": "#1e3050",
      "running_best": [
        {"lap": 1, "time_s": 96.234, "track_temp_c": 42.1},
        {"lap": 3, "time_s": 95.654, "track_temp_c": 44.3},
        {"lap": 8, "time_s": 95.123, "track_temp_c": 46.8},
        ...
        {"lap": 23, "time_s": 94.123, "track_temp_c": 52.1}
      ]
    },
    {
      "driver": "NOR",
      "team": "McLaren",
      "color": "#FF8700",
      "running_best": [
        {"lap": 1, "time_s": 96.521, "track_temp_c": 42.1},
        {"lap": 4, "time_s": 95.876, "track_temp_c": 44.7},
        ...
      ]
    },
    ...
  ],
  "track_temp_series": [
    {"lap": 1, "track_temp_c": 42.1},
    {"lap": 2, "track_temp_c": 43.2},
    ...
    {"lap": 23, "track_temp_c": 52.1}
  ]
}
```

**Notes:**
- **Only for:** Practice/Qualifying sessions
- **Running best:** Chronological, entries only when driver sets a new personal best
- **Overall running best:** Fastest time of any driver on any lap
- **Track evolution:** Shows how track conditions improve/change throughout session

---

### 8. Theoretical Best (`/theoretical-best-data`)

**Description:** Best sectors combined vs actual best lap (Qualifying only).

**Endpoint:** `GET /api/v2/theoretical-best-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'Q' | No | Must be: `Q`, `QUALIFYING` |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/theoretical-best-data?year=2025&gp=1&session=Q
```

**Response Format:**
```json
[
  {
    "driver": "VER",
    "team": "Red Bull Racing",
    "color": "#1e3050",
    "actual_s": 94.123,
    "theoretical_s": 93.654,
    "delta_s": 0.469,
    "sector_data": [
      {
        "sector": 1,
        "actual_s": 31.456,
        "best_s": 31.123,
        "delta_s": 0.333
      },
      {
        "sector": 2,
        "actual_s": 32.145,
        "best_s": 31.876,
        "delta_s": 0.269
      },
      {
        "sector": 3,
        "actual_s": 30.522,
        "best_s": 30.655,
        "delta_s": -0.133
      }
    ]
  },
  {
    "driver": "NOR",
    "team": "McLaren",
    "color": "#FF8700",
    "actual_s": 94.456,
    "theoretical_s": 93.987,
    "delta_s": 0.469,
    "sector_data": [...]
  },
  ...
]
```

**Notes:**
- **Ordered by:** Fastest theoretical lap first
- **Theoretical:** Best sector from any lap, stitched together
- **Delta:** Difference between theoretical and actual (always ≥ 0)
- **Only for:** Qualifying sessions
- **3 sectors:** Each track has 3 timing sectors

---

### 9. Race Story (`/race-story-data`)

**Description:** Per-driver gap-to-leader series + pit stops + annotated key moments.

**Endpoint:** `GET /api/v2/race-story-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Must be: `R`, `RACE`, `S`, `SPRINT` |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/race-story-data?year=2025&gp=1&session=R
```

**Response Format:**
```json
{
  "drivers": [
    {
      "driver": "VER",
      "team": "Red Bull Racing",
      "color": "#1e3050",
      "gap_to_leader": [
        {"lap": 1, "gap_s": 0.0},
        {"lap": 2, "gap_s": 0.0},
        {"lap": 3, "gap_s": 0.234},
        ...
        {"lap": 58, "gap_s": null}
      ],
      "pit_stops": [
        {"lap_in": 12, "lap_out": 13, "compound_in": "SOFT", "compound_out": "MEDIUM"}
      ]
    },
    {
      "driver": "NOR",
      "team": "McLaren",
      "color": "#FF8700",
      "gap_to_leader": [
        {"lap": 1, "gap_s": 0.847},
        {"lap": 2, "gap_s": 1.104},
        ...
      ],
      "pit_stops": [
        {"lap_in": 14, "lap_out": 15, "compound_in": "SOFT", "compound_out": "MEDIUM"}
      ]
    },
    ...
  ],
  "moments": [
    {
      "lap": 1,
      "timestamp_utc": "2025-03-30T14:00:15Z",
      "headline": "Light contact Turn 1",
      "impact": "minor",
      "drivers_involved": ["ALB", "ZHO"]
    },
    {
      "lap": 25,
      "timestamp_utc": "2025-03-30T14:52:10Z",
      "headline": "Safety Car deployed",
      "impact": "major",
      "drivers_involved": []
    },
    {
      "lap": 29,
      "timestamp_utc": "2025-03-30T14:58:40Z",
      "headline": "Safety Car in",
      "impact": "major",
      "drivers_involved": []
    },
    ...
  ]
}
```

**Notes:**
- **Gap to leader:** Built from cumulative lap times (same as position changes)
- **null gap:** Red-flag laps break the line
- **Moments:** Annotated key incidents/events from race control messages
- **Only for:** Race/Sprint sessions

---

## Seasonal Data Endpoints

### 10. Teammate Battle (`/seasons/{year}/teammate-battle-data`)

**Description:** Head-to-head quali/race records + average quali gap per team.

**Endpoint:** `GET /api/v2/seasons/{year}/teammate-battle-data`

**Path Parameters:**
| Parameter | Type | Notes |
|-----------|------|-------|
| `year` | int | Season year (e.g., 2025) |

**Query Parameters:**
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `api_key` | str | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/seasons/2025/teammate-battle-data?api_key=your_key
```

**Response Format:**
```json
{
  "year": 2025,
  "teams": [
    {
      "team": "Alpine",
      "driver_a": "OCO",
      "driver_b": "GAI",
      "quali_h2h": [5, 3],
      "race_h2h": [4, 2],
      "avg_quali_gap_s": -0.156,
      "rounds_counted": 8
    },
    {
      "team": "Ferrari",
      "driver_a": "SAI",
      "driver_b": "LEC",
      "quali_h2h": [9, 6],
      "race_h2h": [7, 3],
      "avg_quali_gap_s": 0.234,
      "rounds_counted": 15
    },
    {
      "team": "McLaren",
      "driver_a": "LAN",
      "driver_b": "NOR",
      "quali_h2h": [10, 5],
      "race_h2h": [8, 4],
      "avg_quali_gap_s": -0.089,
      "rounds_counted": 15
    },
    ...
  ]
}
```

**Notes:**
- **Ordered by:** Team name (alphabetically)
- **quali_h2h / race_h2h:** [wins_driver_a, wins_driver_b]
- **avg_quali_gap_s:** Mean per-round gap (driver_b - driver_a), positive = driver_a faster
- **rounds_counted:** Number of rounds where both drivers had valid data
- **Only counted:** Quali gaps from deepest common segment (Q3 > Q2 > Q1)
- **Race wins:** Only classified finishers (DNF excluded)

---

### 11. Season Form Guide (`/seasons/{year}/form-guide-data`)

**Description:** Rolling-average race/quali finish positions across the season.

**Endpoint:** `GET /api/v2/seasons/{year}/form-guide-data`

**Path Parameters:**
| Parameter | Type | Notes |
|-----------|------|-------|
| `year` | int | Season year |

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `window` | int | 3 | No | Rolling window size (2-10 races) |
| `drivers` | str | None | No | Comma-separated TLAs; default top 10 by mean finish |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/seasons/2025/form-guide-data?window=5&drivers=VER,NOR,LEC
```

**Response Format:**
```json
{
  "year": 2025,
  "window": 5,
  "drivers": [
    {
      "driver": "VER",
      "team": "Red Bull Racing",
      "color": "#1e3050",
      "rounds": [
        {"round": 1, "race_finish_avg": 1.0, "quali_finish_avg": 1.0},
        {"round": 2, "race_finish_avg": 1.0, "quali_finish_avg": 1.0},
        {"round": 3, "race_finish_avg": 1.0, "quali_finish_avg": 1.2},
        {"round": 4, "race_finish_avg": 1.2, "quali_finish_avg": 1.4},
        {"round": 5, "race_finish_avg": 1.4, "quali_finish_avg": 1.6},
        {"round": 6, "race_finish_avg": 1.4, "quali_finish_avg": 1.8},
        ...
        {"round": 24, "race_finish_avg": 2.1, "quali_finish_avg": 2.3}
      ]
    },
    {
      "driver": "NOR",
      "team": "McLaren",
      "color": "#FF8700",
      "rounds": [...]
    },
    ...
  ]
}
```

**Notes:**
- **Ordered by:** Drivers sorted by mean race finish position
- **Rolling avg:** Window of N races
- **First few rounds:** Have < window results (rolling window expands)
- **DNF:** Counted as a finish for averaging purposes
- **Not classified:** Excluded from average

---

### 12. Season Driver Radar (`/seasons/{year}/driver-radar-data`)

**Description:** Multi-dimension performance radar aggregated over a full season.

**Endpoint:** `GET /api/v2/seasons/{year}/driver-radar-data`

**Path Parameters:**
| Parameter | Type | Notes |
|-----------|------|-------|
| `year` | int | Season year |

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `drivers` | str | None | No | Comma-separated TLAs (max 3); default best 3 by race pace |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/seasons/2025/driver-radar-data?drivers=VER,NOR,LEC
```

**Response Format:**
```json
{
  "scope": "season",
  "year": 2025,
  "axes": [
    "race_pace",
    "qualifying",
    "consistency",
    "racecraft",
    "reliability",
    "peak"
  ],
  "drivers": [
    {
      "tla": "VER",
      "team": "Red Bull Racing",
      "color": "#1e3050",
      "values": [98.5, 97.2, 96.8, 95.3, 98.9, 99.1],
      "raw": {
        "race_pace": 96.234,
        "qualifying": 94.123,
        "consistency": 0.876,
        "racecraft": 8.9,
        "reliability": 0.95,
        "peak": 92.1
      }
    },
    {
      "tla": "NOR",
      "team": "McLaren",
      "color": "#FF8700",
      "values": [95.2, 94.8, 93.5, 92.1, 96.3, 94.7],
      "raw": {...}
    },
    {
      "tla": "LEC",
      "team": "Ferrari",
      "color": "#DC0000",
      "values": [94.1, 95.6, 92.3, 94.5, 92.8, 95.3],
      "raw": {...}
    }
  ]
}
```

**Notes:**
- **Axes (6 dimensions):**
  - `race_pace`: Average finishing position across races
  - `qualifying`: Average grid position
  - `consistency`: Lower variance in finishes
  - `racecraft`: Head-to-head record vs teammates
  - `reliability`: Percentage of race finishes
  - `peak`: Best single-race performance
- **Values:** 0-100 scale (percentile vs field)
- **Raw:** Actual metric values
- **Default:** Top 3 drivers by race pace
- **Population:** Full field percentiles even if only 2-3 drivers shown

---

### 13. Career Driver Radar (`/career/driver-radar-data`)

**Description:** Multi-season career performance radar (e.g., 2022-2025).

**Endpoint:** `GET /api/v2/career/driver-radar-data`

**Query Parameters:**
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `years` | str | Yes | Year span: `YYYY-YYYY` (e.g., "2022-2025") OR comma-list `YYYY,YYYY` (e.g., "2023,2024,2025") |
| `drivers` | str | No | Comma-separated TLAs (max 3); default best 3 by race pace |
| `api_key` | str | Yes | Via Depends(verify_api_key) |

**Example Requests:**
```
# Span format: 2022-2025
GET /api/v2/career/driver-radar-data?years=2022-2025&drivers=VER,LEC

# List format: specific years
GET /api/v2/career/driver-radar-data?years=2023,2024,2025
```

**Response Format:**
```json
{
  "scope": "career",
  "years": [2022, 2023, 2024, 2025],
  "axes": [
    "race_pace",
    "qualifying",
    "consistency",
    "racecraft",
    "reliability",
    "peak"
  ],
  "drivers": [
    {
      "tla": "VER",
      "team": "Red Bull Racing",
      "color": "#1e3050",
      "values": [99.2, 98.7, 97.4, 96.8, 99.1, 99.3],
      "raw": {
        "race_pace": 1.45,
        "qualifying": 0.987,
        "consistency": 0.921,
        "racecraft": 9.2,
        "reliability": 0.97,
        "peak": 0.876
      }
    },
    {
      "tla": "LEC",
      "team": "Ferrari",
      "color": "#DC0000",
      "values": [92.3, 93.8, 91.5, 89.2, 88.7, 90.5],
      "raw": {...}
    },
    ...
  ]
}
```

**Notes:**
- **Years:** Aggregated across all specified years
- **Same axes** as season radar, but computed from multi-year data
- **Population:** Field percentiles computed per year then averaged
- **Useful for:** Multi-year career comparison

---

## Telemetry Endpoints

### 14. Track Map (`/track-map-data`)

**Description:** Fastest-lap telemetry points with speed/gear overlay + braking zones.

**Endpoint:** `GET /api/v2/track-map-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'Q' | No | Any session: P1, P2, P3, Q, R, S |
| `driver` | str | - | **Yes** | Driver TLA (e.g., "VER") |
| `color_by` | str | 'speed' | No | Either `speed` or `gear` |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Requests:**
```
# Fastest lap colored by speed
GET /api/v2/track-map-data?year=2025&gp=1&session=Q&driver=VER&color_by=speed

# Fastest lap colored by gear
GET /api/v2/track-map-data?year=2025&gp=1&session=R&driver=NOR&color_by=gear
```

**Response Format:**
```json
{
  "driver": "VER",
  "lap_number": 15,
  "lap_time_s": 94.123,
  "color_by": "speed",
  "track": {
    "name": "Bahrain International Circuit",
    "corners": [
      {"corner_name": "Turn 1", "x": 123.45, "y": -98.76},
      {"corner_name": "Turn 2", "x": 234.56, "y": -87.65},
      ...
    ]
  },
  "points": [
    {
      "x": 100.0,
      "y": -100.0,
      "speed_kmh": 312.5,
      "gear": 8,
      "throttle_percent": 95,
      "brake_percent": 0
    },
    {
      "x": 105.3,
      "y": -98.2,
      "speed_kmh": 315.2,
      "gear": 8,
      "throttle_percent": 100,
      "brake_percent": 0
    },
    {
      "x": 125.4,
      "y": -92.1,
      "speed_kmh": 298.7,
      "gear": 7,
      "throttle_percent": 45,
      "brake_percent": 78
    },
    ...
  ],
  "braking_zones": [
    {
      "corner": "Turn 1",
      "x_start": 125.0,
      "y_start": -90.0,
      "x_end": 130.0,
      "y_end": -85.0,
      "max_brake_percent": 85,
      "avg_brake_percent": 72
    },
    ...
  ]
}
```

**Notes:**
- **Color by:**
  - `speed`: Speed range from cool (slow) to hot (fast)
  - `gear`: Gear numbers (1-8) with gradient coloring
- **Fastest lap:** The session's best lap for that driver
- **Coordinates:** X/Y are track map coordinates (from circuit data)
- **Throttle/Brake:** Percentage of maximum (0-100)

---

### 15. Corner Duel (`/corner-duel-data`)

**Description:** Corner-by-corner telemetry comparison between two drivers.

**Endpoint:** `GET /api/v2/corner-duel-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'Q' | No | Any session: P1, P2, P3, Q, R, S |
| `driver1` | str | - | **Yes** | First driver TLA (e.g., "VER") |
| `driver2` | str | - | **Yes** | Second driver TLA (e.g., "NOR") |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/corner-duel-data?year=2025&gp=1&session=Q&driver1=VER&driver2=NOR
```

**Response Format:**
```json
{
  "driver1": "VER",
  "driver2": "NOR",
  "lap_number_1": 15,
  "lap_number_2": 14,
  "lap_time_1_s": 94.123,
  "lap_time_2_s": 94.456,
  "delta_s": 0.333,
  "track": "Bahrain International Circuit",
  "corners": [
    {
      "corner_number": 1,
      "corner_name": "Turn 1",
      "apex_speed_driver1_kmh": 180.5,
      "apex_speed_driver2_kmh": 178.3,
      "apex_delta_kmh": 2.2,
      "apex_x": 130.0,
      "apex_y": -85.0,
      "braking_point_delta_m": 8.5,
      "notes": "VER brakes later"
    },
    {
      "corner_number": 2,
      "corner_name": "Turn 2",
      "apex_speed_driver1_kmh": 245.3,
      "apex_speed_driver2_kmh": 247.8,
      "apex_delta_kmh": -2.5,
      "apex_x": 200.5,
      "apex_y": -120.3,
      "braking_point_delta_m": -3.2,
      "notes": "NOR carries more speed"
    },
    ...
  ],
  "delta_series": [
    {"corner": 1, "delta_s": 0.012},
    {"corner": 2, "delta_s": -0.008},
    {"corner": 3, "delta_s": 0.003},
    ...
  ],
  "cumulative_delta": [
    {"corner": 1, "cumulative_delta_s": 0.012},
    {"corner": 2, "cumulative_delta_s": 0.004},
    {"corner": 3, "cumulative_delta_s": 0.007},
    ...
  ]
}
```

**Notes:**
- **Both drivers:** Fastest lap comparison
- **Apex speed delta:** Positive = driver1 faster
- **Braking point delta:** Distance (meters), positive = driver1 brakes later
- **Delta series:** Per-corner time delta
- **Cumulative delta:** Running total (shows which corners driver1 gains on driver2)

---

### 16. Session Driver Radar (`/driver-radar-data`)

**Description:** Single-session performance radar (telemetry + timing based).

**Endpoint:** `GET /api/v2/driver-radar-data`

**Query Parameters:**
| Parameter | Type | Default | Required | Notes |
|-----------|------|---------|----------|-------|
| `year` | int | 2025 | No | Range: 2018-2030 |
| `gp` | int\|str | 1 | No | Round number, Event Key, or Official Name |
| `session` | str | 'R' | No | Any session: P1, P2, P3, Q, R, S |
| `drivers` | str | None | No | Comma-separated TLAs (max 3); defaults to fastest 3 |
| `api_key` | str | - | Yes | Via Depends(verify_api_key) |

**Example Request:**
```
GET /api/v2/driver-radar-data?year=2025&gp=1&session=R&drivers=VER,NOR,LEC
```

**Response Format:**
```json
{
  "scope": "session",
  "year": 2025,
  "gp": 1,
  "session": "R",
  "track": "Bahrain International Circuit",
  "axes": [
    "top_speed",
    "cornering",
    "race_pace",
    "quali_pace",
    "consistency",
    "braveness"
  ],
  "drivers": [
    {
      "tla": "VER",
      "team": "Red Bull Racing",
      "color": "#1e3050",
      "values": [98.2, 96.5, 99.1, 97.8, 95.3, 94.6],
      "raw": {
        "top_speed": 329.5,
        "cornering": 0.892,
        "race_pace": 94.123,
        "quali_pace": 93.876,
        "consistency": 0.954,
        "braveness": 0.78
      }
    },
    {
      "tla": "NOR",
      "team": "McLaren",
      "color": "#FF8700",
      "values": [96.7, 94.2, 97.3, 96.1, 93.8, 92.3],
      "raw": {...}
    },
    {
      "tla": "LEC",
      "team": "Ferrari",
      "color": "#DC0000",
      "values": [95.3, 95.8, 96.2, 95.7, 91.5, 93.4],
      "raw": {...}
    }
  ]
}
```

**Notes:**
- **Axes (6 dimensions):**
  - `top_speed`: Highest speed in session
  - `cornering`: Telemetry ratio (lateral G / throttle)
  - `race_pace`: Average lap time (Race/Sprint)
  - `quali_pace`: Best lap time (Qualifying)
  - `consistency`: Variance across laps
  - `braveness`: Telemetry ratio (brake lockup / throttle snap)
- **Values:** 0-100 scale (percentile vs field in that session)
- **Raw:** Actual metric values
- **Any session type:** Works with all session types

---

## Response Structure Patterns

### Common Response Fields

All data endpoints return JSON with these common patterns:

```json
// Single driver, single metric
{
  "driver": "VER",
  "team": "Red Bull Racing",
  "color": "#1e3050",
  // ... endpoint-specific data
}

// Multiple drivers
[
  {
    "driver": "VER",
    "team": "Red Bull Racing",
    "color": "#1e3050",
    // ... endpoint-specific data
  },
  {
    "driver": "NOR",
    "team": "McLaren",
    "color": "#FF8700",
    // ... endpoint-specific data
  },
  ...
]

// Nested data (e.g., per-lap series)
{
  "driver": "VER",
  "team": "Red Bull Racing",
  "color": "#1e3050",
  "laps": [
    {"lap": 1, "value": 123.45},
    {"lap": 2, "value": 124.12},
    ...
  ]
}
```

### Error Responses

All endpoints return consistent HTTP status codes:

```
200 OK         - Request successful, data returned
400 Bad Request - Invalid query parameters
404 Not Found   - Session/data not available
429 Too Many Requests - Rate limit exceeded
500 Server Error - Unexpected error
```

### Rate Limiting

- **Plot endpoints:** "standard" tier (100 req/min)
- **Data endpoints:** "data" tier (60 req/min)
- **All endpoints:** Require valid `api_key`

---

## Quick Reference Table

| Endpoint | Session Types | Parameters | Key Data |
|----------|---------------|-----------|----------|
| position-changes-data | R, S | year, gp, session | Driver positions per lap |
| race-gaps-data | R, S | year, gp, session, reference, drivers | Gap to leader or vs pace |
| tyre-degradation-data | R, S | year, gp, session, driver, fuel_corrected | Tyre degradation rate |
| pit-strategy-data | R, S | year, gp, session | Stops, undercuts, pit times |
| session-weather-data | All | year, gp, session | Weather, track status, messages |
| race-pace-heatmap-data | R, S | year, gp, session | Driver x lap pace delta grid |
| track-evolution-data | P1,P2,P3,Q | year, gp, session, drivers | Running best vs track temp |
| theoretical-best-data | Q | year, gp, session | Theoretical vs actual lap |
| race-story-data | R, S | year, gp, session | Gap-to-leader + key moments |
| track-map-data | All | year, gp, session, driver, color_by | Telemetry points + braking |
| corner-duel-data | All | year, gp, session, driver1, driver2 | Corner-by-corner comparison |
| driver-radar-data | All | year, gp, session, drivers | Session performance radar |
| teammate-battle-data | Seasonal | year | H2H records per team |
| form-guide-data | Seasonal | year, window, drivers | Rolling avg race/quali form |
| season-radar-data | Seasonal | year, drivers | Season performance radar |
| career-radar-data | Career | years, drivers | Multi-year career radar |

---

## Usage Tips

1. **Filtering:** Most endpoints accept optional `drivers` parameter to filter output (saves payload size)
2. **Caching:** All data endpoints use cached-or-generate pattern (first request may take longer)
3. **Lap 0:** Represents grid position (pre-race)
4. **Red flags:** Represented as `null` in gap/time series (plots will break lines)
5. **Retirements:** Series ends at last completed lap
6. **Coordinates:** Track map uses normalized circuit coordinates

